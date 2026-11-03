package com.sms.service;

import com.sms.model.*;
import com.sms.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.*;

@Service
@RequiredArgsConstructor
@Slf4j
public class PromotionService {

    private final StudentRepository studentRepository;
    private final SchoolClassRepository schoolClassRepository;
    private final StudentFeeRepository studentFeeRepository;
    private final AlumniRegistryRepository alumniRegistryRepository;
    private final ParentContactRepository parentContactRepository;
    private final FeeComponentRepository feeComponentRepository;
    private final AttendanceRepository attendanceRepository;
    private final StudentGradeRepository studentGradeRepository;

    /**
     * Preview what the promotion will do (dry run) including academic & attendance eligibility breakdown.
     */
    public Map<String, Object> previewPromotion(String currentYear) {
        List<SchoolClass> classes = schoolClassRepository
                .findByAcademicYearOrderBySortOrderAsc(currentYear);

        int maxSortOrder = classes.stream()
                .mapToInt(SchoolClass::getSortOrder).max().orElse(0);

        long totalStudents = 0;
        long graduatingStudents = 0;
        long promotingStudents = 0;
        long eligibleStudents = 0;
        long remedialStudents = 0;
        long deficientAttendanceStudents = 0;

        for (SchoolClass cls : classes) {
            List<Student> studentsInClass = studentRepository.findBySchoolClassIdAndIsActiveTrue(cls.getId());
            long count = studentsInClass.size();
            totalStudents += count;
            if (cls.getSortOrder() == maxSortOrder) {
                graduatingStudents += count;
            } else {
                promotingStudents += count;
            }

            for (Student s : studentsInClass) {
                Map<String, Object> elig = checkPromotionEligibility(s.getId(), currentYear);
                String status = (String) elig.get("eligibilityStatus");
                if ("ELIGIBLE".equals(status)) {
                    eligibleStudents++;
                } else if ("REMEDIAL_REQUIRED".equals(status)) {
                    remedialStudents++;
                } else {
                    deficientAttendanceStudents++;
                }
            }
        }

        Map<String, Object> preview = new LinkedHashMap<>();
        preview.put("currentYear", currentYear);
        preview.put("nextYear", getNextAcademicYear(currentYear));
        preview.put("totalStudents", totalStudents);
        preview.put("promotingStudents", promotingStudents);
        preview.put("graduatingStudents", graduatingStudents);
        preview.put("eligibleStudents", eligibleStudents);
        preview.put("remedialStudents", remedialStudents);
        preview.put("deficientAttendanceStudents", deficientAttendanceStudents);
        preview.put("classCount", classes.size());

        return preview;
    }

    /**
     * Case Study: Evaluate promotion eligibility based on attendance threshold (75%)
     * and academic passing threshold (50%).
     */
    public Map<String, Object> checkPromotionEligibility(Long studentId, String currentYear) {
        Student student = studentRepository.findById(studentId)
                .orElseThrow(() -> new IllegalArgumentException("Student not found with ID: " + studentId));

        // 1. Attendance percentage over academic year
        java.time.LocalDate from = java.time.LocalDate.now().minusMonths(9);
        java.time.LocalDate to = java.time.LocalDate.now();
        List<Attendance> attendanceRecords = attendanceRepository.findByStudentIdAndDateBetween(student.getId(), from, to);
        double attendancePercentage = 100.0;
        if (!attendanceRecords.isEmpty()) {
            long total = attendanceRecords.size();
            long attended = attendanceRecords.stream()
                    .filter(a -> a.getStatus() == Attendance.AttendanceStatus.PRESENT ||
                                 a.getStatus() == Attendance.AttendanceStatus.LATE ||
                                 a.getStatus() == Attendance.AttendanceStatus.EXCUSED)
                    .count();
            attendancePercentage = Math.round(((double) attended / total * 100.0) * 10.0) / 10.0;
        }

        // 2. Academic score average
        List<StudentGrade> grades = studentGradeRepository.findByStudentId(student.getId());
        Double academicAverage = null;
        if (!grades.isEmpty()) {
            double totalScore = 0;
            int count = 0;
            for (StudentGrade g : grades) {
                if (g.getMarksObtained() != null && g.getAssessmentHeader() != null &&
                    g.getAssessmentHeader().getMaxMarks().compareTo(BigDecimal.ZERO) > 0) {
                    double pct = g.getMarksObtained()
                            .divide(g.getAssessmentHeader().getMaxMarks(), 4, java.math.RoundingMode.HALF_UP)
                            .multiply(BigDecimal.valueOf(100)).doubleValue();
                    totalScore += pct;
                    count++;
                }
            }
            if (count > 0) {
                academicAverage = Math.round((totalScore / count) * 10.0) / 10.0;
            }
        }

        // 3. Fee status
        Optional<StudentFee> feeOpt = studentFeeRepository.findByStudentIdAndAcademicYear(student.getId(), currentYear);
        BigDecimal pendingFee = feeOpt.map(StudentFee::getBalanceDue).orElse(BigDecimal.ZERO);

        // 4. Decision matrix
        boolean attendanceOk = attendancePercentage >= 75.0;
        boolean academicOk = academicAverage == null || academicAverage >= 50.0;

        String status;
        String recommendation;
        if (attendanceOk && academicOk) {
            status = "ELIGIBLE";
            recommendation = "Student fulfills attendance (≥75%) and academic passing criteria (≥50%). Recommended for regular promotion.";
        } else if (attendanceOk && !academicOk) {
            status = "REMEDIAL_REQUIRED";
            recommendation = String.format("Academic average (%.1f%%) is below passing threshold (50%%). Remedial examination recommended prior to unconditional promotion.", academicAverage);
        } else if (!attendanceOk && academicOk) {
            status = "ATTENDANCE_CONDONATION_REQUIRED";
            recommendation = String.format("Attendance (%.1f%%) is below mandatory 75%% minimum. Requires formal attendance condonation approval.", attendancePercentage);
        } else {
            status = "RETAIN_IN_CURRENT_GRADE";
            recommendation = String.format("Both attendance (%.1f%%) and academic performance (%.1f%%) are deficient. Retention or special academic council review required.", attendancePercentage, academicAverage != null ? academicAverage : 0.0);
        }

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("studentId", student.getId());
        result.put("studentName", student.getFullName());
        result.put("admissionNumber", student.getAdmissionNumber());
        result.put("currentClass", student.getSchoolClass() != null ? student.getSchoolClass().getName() + " (" + student.getSchoolClass().getSection() + ")" : "N/A");
        result.put("attendancePercentage", attendancePercentage);
        result.put("academicAverage", academicAverage);
        result.put("pendingFee", pendingFee);
        result.put("eligibilityStatus", status);
        result.put("recommendation", recommendation);
        result.put("meetsCriteria", attendanceOk && academicOk);

        return result;
    }

    /**
     * Execute bulk promotion.
     *
     * 1. Grade 10 students → Alumni Registry, deactivated
     * 2. Other students → class incremented, fees rolled over
     * 3. New class records created for next academic year
     */
    @Transactional
    public Map<String, Object> promoteAll(String currentYear) {
        String nextYear = getNextAcademicYear(currentYear);

        List<SchoolClass> currentClasses = schoolClassRepository
                .findByAcademicYearOrderBySortOrderAsc(currentYear);

        int maxSortOrder = currentClasses.stream()
                .mapToInt(SchoolClass::getSortOrder).max().orElse(0);

        // Step 1: Create new class records for next academic year
        Map<Integer, SchoolClass> nextYearClasses = new HashMap<>();
        for (SchoolClass cls : currentClasses) {
            SchoolClass newClass = SchoolClass.builder()
                    .name(cls.getName())
                    .section(cls.getSection())
                    .academicYear(nextYear)
                    .sortOrder(cls.getSortOrder())
                    .build();
            nextYearClasses.put(cls.getSortOrder(), schoolClassRepository.save(newClass));
        }

        int promoted = 0;
        int graduated = 0;

        for (SchoolClass cls : currentClasses) {
            List<Student> students = studentRepository.findBySchoolClassIdAndIsActiveTrue(cls.getId());

            for (Student student : students) {
                if (isHighestGrade(cls) || cls.getSortOrder() == maxSortOrder) {
                    // === GRADUATION LOGIC: Highest Grade → Alumni ===
                    String parentPhone = parentContactRepository.findByStudentId(student.getId())
                            .stream().findFirst().map(p -> p.getWhatsappNumber() != null && !p.getWhatsappNumber().isEmpty() ? p.getWhatsappNumber() : p.getPhone()).orElse(null);

                    AlumniRegistry alumni = alumniRegistryRepository.findByStudentId(student.getId())
                            .orElseGet(() -> AlumniRegistry.builder().student(student).build());

                    alumni.setFullName(student.getFullName());
                    alumni.setAdmissionNumber(student.getAdmissionNumber());
                    alumni.setGraduationYear(currentYear);
                    alumni.setFinalClass(cls.getName() + " " + cls.getSection());
                    alumni.setDateOfBirth(student.getDateOfBirth());
                    alumni.setParentPhone(parentPhone);
                    alumniRegistryRepository.save(alumni);

                    student.setIsActive(false);
                    studentRepository.save(student);
                    graduated++;

                } else {
                    // === PROMOTION LOGIC: Move to next class ===
                    SchoolClass nextClass = nextYearClasses.get(cls.getSortOrder() + 1);
                    if (nextClass != null) {
                        student.setSchoolClass(nextClass);
                        student.setAcademicYear(nextYear);
                        studentRepository.save(student);

                        // Fee rollover: balance_due → previous_year_pending (NO implicit current year fee)
                        rolloverFees(student, currentYear, nextYear, nextClass);
                        promoted++;
                    }
                }
            }
        }

        log.info("Year-end promotion completed: {} promoted, {} graduated", promoted, graduated);

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("status", "SUCCESS");
        result.put("promoted", promoted);
        result.put("graduated", graduated);
        result.put("nextAcademicYear", nextYear);

        return result;
    }

    /**
     * Fee rollover: Convert remaining balance to previous_year_pending.
     * IMPORTANT: As requested, do NOT add current year fee implicitly.
     */
    private void rolloverFees(Student student, String currentYear,
                               String nextYear, SchoolClass nextClass) {
        // Get current year fee balance
        BigDecimal previousPending = BigDecimal.ZERO;
        Optional<StudentFee> currentFee = studentFeeRepository
                .findByStudentIdAndAcademicYear(student.getId(), currentYear);
        if (currentFee.isPresent()) {
            BigDecimal balance = currentFee.get().getBalanceDue() != null ?
                    currentFee.get().getBalanceDue() :
                    currentFee.get().getCurrentYearDue()
                            .add(currentFee.get().getPreviousYearPending())
                            .subtract(currentFee.get().getTotalPaid());
            if (balance.compareTo(BigDecimal.ZERO) > 0) {
                previousPending = balance;
            }
        }

        // Do NOT add current year fee implicitly!
        BigDecimal newYearDue = BigDecimal.ZERO;

        // Create new fee record
        StudentFee newFee = StudentFee.builder()
                .student(student)
                .academicYear(nextYear)
                .currentYearDue(newYearDue)
                .previousYearPending(previousPending)
                .totalPaid(BigDecimal.ZERO)
                .status(StudentFee.FeeStatus.UNPAID)
                .build();

        studentFeeRepository.save(newFee);
    }

    /**
     * Promote an individual student.
     * If the student is in the highest grade, they graduate to Alumni Registry according to class and academic year.
     * If not highest grade, rolls over remaining balance to previous_year_pending without adding implicit current fee.
     */
    @Transactional
    public Map<String, Object> promoteIndividualStudent(Long studentId, Long targetClassId, String targetAcademicYear, BigDecimal customNewClassFee, Boolean forceAlumni) {
        Student student = studentRepository.findById(studentId)
                .orElseThrow(() -> new RuntimeException("Student not found: " + studentId));

        SchoolClass previousClass = student.getSchoolClass();
        String currentYear = student.getAcademicYear() != null ? student.getAcademicYear() : "2025-2026";
        String nextYear = targetAcademicYear != null && !targetAcademicYear.trim().isEmpty() ?
                targetAcademicYear.trim() : getNextAcademicYear(currentYear);

        // 1. Calculate remaining unpaid balance from current fee record
        BigDecimal carriedOverPendingFee = BigDecimal.ZERO;
        Optional<StudentFee> currentFeeOpt = studentFeeRepository.findByStudentIdAndAcademicYear(student.getId(), currentYear);
        if (currentFeeOpt.isPresent()) {
            StudentFee cur = currentFeeOpt.get();
            BigDecimal grand = cur.getGrandTotal() != null ? cur.getGrandTotal() :
                    cur.getCurrentYearDue().add(cur.getPreviousYearPending());
            BigDecimal balance = grand.subtract(cur.getTotalPaid() != null ? cur.getTotalPaid() : BigDecimal.ZERO);
            if (balance.compareTo(BigDecimal.ZERO) > 0) {
                carriedOverPendingFee = balance;
            }
        }

        // Determine if student is graduating to alumni
        boolean isGraduating = Boolean.TRUE.equals(forceAlumni) ||
                (targetClassId != null && targetClassId == -1L) ||
                (targetClassId == null && isHighestGrade(previousClass)) ||
                isHighestGrade(previousClass);

        if (isGraduating) {
            // === HIGHEST GRADE PROMOTION -> ALUMNI REGISTRY ===
            String finalClassStr = previousClass != null ?
                    previousClass.getName() + " " + previousClass.getSection() : "Graduating Class";

            String parentPhone = parentContactRepository.findByStudentId(student.getId())
                    .stream().findFirst().map(p -> p.getWhatsappNumber() != null && !p.getWhatsappNumber().isEmpty() ? p.getWhatsappNumber() : p.getPhone()).orElse(null);

            AlumniRegistry alumni = alumniRegistryRepository.findByStudentId(student.getId())
                    .orElseGet(() -> AlumniRegistry.builder().student(student).build());

            alumni.setFullName(student.getFullName());
            alumni.setAdmissionNumber(student.getAdmissionNumber());
            alumni.setGraduationYear(currentYear);
            alumni.setFinalClass(finalClassStr);
            alumni.setDateOfBirth(student.getDateOfBirth());
            alumni.setParentPhone(parentPhone);
            alumniRegistryRepository.save(alumni);

            // Student becomes graduated / archived
            student.setIsActive(false);
            studentRepository.save(student);

            // Keep carried-over dues recorded in fee ledger, with ZERO current year due
            if (currentFeeOpt.isPresent()) {
                StudentFee cur = currentFeeOpt.get();
                cur.setPreviousYearPending(carriedOverPendingFee);
                cur.setCurrentYearDue(BigDecimal.ZERO);
                cur.setTotalPaid(BigDecimal.ZERO);
                cur.recalculateStatus();
                studentFeeRepository.save(cur);
            }

            log.info("Highest grade student promoted to Alumni: Student={}, FinalClass={}, Year={}, CarriedPending={}",
                    student.getFullName(), finalClassStr, currentYear, carriedOverPendingFee);

            Map<String, Object> resp = new LinkedHashMap<>();
            resp.put("status", "SUCCESS");
            resp.put("isAlumni", true);
            resp.put("studentId", student.getId());
            resp.put("studentName", student.getFullName());
            resp.put("finalClass", finalClassStr);
            resp.put("graduationYear", currentYear);
            resp.put("carriedOverPendingFee", carriedOverPendingFee);
            resp.put("message", String.format(
                    "Student %s from %s has graduated and their record has been archived into the Alumni Registry for academic year %s.",
                    student.getFullName(), finalClassStr, currentYear));

            return resp;
        }

        // === REGULAR PROMOTION TO NEXT CLASS ===
        if (targetClassId == null) {
            throw new RuntimeException("Target class must be specified to promote student to the next grade.");
        }

        SchoolClass targetClass = schoolClassRepository.findById(targetClassId)
                .orElseThrow(() -> new RuntimeException("Target class not found: " + targetClassId));

        // 2. Determine new class fee:
        if (customNewClassFee != null && (customNewClassFee.compareTo(BigDecimal.ZERO) < 0 || customNewClassFee.compareTo(new BigDecimal("5000000")) > 0)) {
            throw new IllegalArgumentException("New class fee must be in the permitted range [0, 5,000,000]. Provided: " + customNewClassFee);
        }
        // IMPORTANT: As requested, do NOT add current year fee implicitly.
        BigDecimal newClassFee = (customNewClassFee != null && customNewClassFee.compareTo(BigDecimal.ZERO) > 0)
                ? customNewClassFee
                : BigDecimal.ZERO;

        // 3. Update or create the StudentFee record for next academic year
        StudentFee newFee;
        if (currentYear.equals(nextYear) && currentFeeOpt.isPresent()) {
            newFee = currentFeeOpt.get();
            newFee.setPreviousYearPending(carriedOverPendingFee);
            newFee.setCurrentYearDue(newClassFee);
            newFee.setTotalPaid(BigDecimal.ZERO);
            newFee.recalculateStatus();
        } else {
            Optional<StudentFee> nextFeeOpt = studentFeeRepository.findByStudentIdAndAcademicYear(student.getId(), nextYear);
            if (nextFeeOpt.isPresent()) {
                newFee = nextFeeOpt.get();
                newFee.setPreviousYearPending(carriedOverPendingFee);
                newFee.setCurrentYearDue(newClassFee);
                newFee.setTotalPaid(BigDecimal.ZERO);
                newFee.recalculateStatus();
            } else {
                newFee = StudentFee.builder()
                        .student(student)
                        .academicYear(nextYear)
                        .currentYearDue(newClassFee)
                        .previousYearPending(carriedOverPendingFee)
                        .totalPaid(BigDecimal.ZERO)
                        .status(StudentFee.FeeStatus.UNPAID)
                        .build();
            }
        }
        studentFeeRepository.save(newFee);

        // 4. Update student's class and session
        student.setSchoolClass(targetClass);
        student.setAcademicYear(nextYear);
        studentRepository.save(student);

        log.info("Individual promotion executed: Student={}, FromClass={}, ToClass={}, CarriedPending={}, NewClassDue={}",
                student.getFullName(),
                previousClass != null ? previousClass.getName() : "None",
                targetClass.getName(), carriedOverPendingFee, newClassFee);

        Map<String, Object> resp = new LinkedHashMap<>();
        resp.put("status", "SUCCESS");
        resp.put("isAlumni", false);
        resp.put("studentId", student.getId());
        resp.put("studentName", student.getFullName());
        resp.put("fromClass", previousClass != null ? previousClass.getName() + " " + previousClass.getSection() : "None");
        resp.put("toClass", targetClass.getName() + " " + targetClass.getSection());
        resp.put("academicYear", nextYear);
        resp.put("carriedOverPendingFee", carriedOverPendingFee);
        resp.put("newClassFee", newClassFee);
        resp.put("totalApplicableFee", carriedOverPendingFee.add(newClassFee));
        resp.put("message", String.format(
                "Student %s successfully promoted to %s. Outstanding balance of ₹%s transformed into previous pending fee (no implicit current fee added).",
                student.getFullName(), targetClass.getName(), carriedOverPendingFee.toPlainString()));

        return resp;
    }

    public Map<String, Object> promoteIndividualStudent(Long studentId, Long targetClassId, String targetAcademicYear, BigDecimal customNewClassFee) {
        return promoteIndividualStudent(studentId, targetClassId, targetAcademicYear, customNewClassFee, false);
    }

    /**
     * Check if a class is the highest grade in the school.
     */
    public boolean isHighestGrade(SchoolClass cls) {
        if (cls == null) return false;
        List<SchoolClass> all = schoolClassRepository.findAll();
        int maxGradeNum = all.stream()
                .mapToInt(this::extractGradeNumber)
                .max().orElse(10);
        int currentGradeNum = extractGradeNumber(cls);
        if (currentGradeNum > 0 && currentGradeNum >= maxGradeNum) {
            return true;
        }
        int maxSortOrder = all.stream().mapToInt(c -> c.getSortOrder() != null ? c.getSortOrder() : 0).max().orElse(0);
        if (cls.getSortOrder() != null && cls.getSortOrder() > 1 && cls.getSortOrder() >= maxSortOrder) {
            return true;
        }
        String name = cls.getName().toLowerCase();
        return name.contains("10") || name.contains("12") || name.contains("xii") || name.contains("alumni") || name.contains("final");
    }

    private int extractGradeNumber(SchoolClass cls) {
        if (cls == null || cls.getName() == null) return 0;
        String digits = cls.getName().replaceAll("[^0-9]", "");
        try {
            return digits.isEmpty() ? 0 : Integer.parseInt(digits);
        } catch (Exception e) {
            return 0;
        }
    }

    private String getNextAcademicYear(String currentYear) {
        String[] parts = currentYear.split("-");
        int startYear = Integer.parseInt(parts[0]) + 1;
        int endYear = Integer.parseInt(parts[1]) + 1;
        return startYear + "-" + endYear;
    }
}
