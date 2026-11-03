package com.sms.service;

import com.sms.dto.AttendanceRequest;
import com.sms.model.*;
import com.sms.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class AttendanceService {

    private final AttendanceRepository attendanceRepository;
    private final StudentRepository studentRepository;
    private final SchoolClassRepository schoolClassRepository;
    private final SubjectRepository subjectRepository;
    private final TeacherClassAssignmentRepository assignmentRepository;
    private final TeacherRepository teacherRepository;
    private final LeaveRequestRepository leaveRequestRepository;

    /**
     * Batch mark attendance for a class and optional subject on a specific date.
     * Case studies handled:
     * - Future date rejection (cannot mark attendance ahead of time)
     * - Null / empty entries rejection
     * - Class enrollment mismatch rejection
     * - Approved medical/official leave auto-conversion (ABSENT -> EXCUSED)
     * - Teacher authorization enforcement
     */
    @Transactional
    public List<Attendance> markAttendance(AttendanceRequest request, User markedBy) {
        if (request.getClassId() == null) {
            throw new IllegalArgumentException("Class ID is required.");
        }
        if (request.getDate() == null) {
            throw new IllegalArgumentException("Attendance date is required.");
        }
        if (request.getDate().isAfter(LocalDate.now())) {
            throw new IllegalArgumentException("Attendance cannot be marked for future date: " + request.getDate() + ". Only past or current dates are permitted.");
        }
        if (request.getDate().isBefore(LocalDate.now().minusYears(1))) {
            throw new IllegalArgumentException("Attendance cannot be marked for dates older than 1 year: " + request.getDate() + ". Outside permitted range.");
        }
        if (request.getEntries() == null || request.getEntries().isEmpty()) {
            throw new IllegalArgumentException("Attendance batch entries list cannot be empty.");
        }

        SchoolClass schoolClass = schoolClassRepository.findById(request.getClassId())
                .orElseThrow(() -> new IllegalArgumentException("Class not found with ID: " + request.getClassId()));

        Subject subject = null;
        if (request.getSubjectId() != null) {
            subject = subjectRepository.findById(request.getSubjectId()).orElse(null);
        }

        // Strict Domain Check: Verify teacher is authorized for this class/subject
        if (markedBy != null && markedBy.getRole() == User.Role.TEACHER) {
            Teacher teacher = teacherRepository.findByUserId(markedBy.getId())
                    .orElseThrow(() -> new org.springframework.security.access.AccessDeniedException("Teacher profile not found."));

            if (subject != null) {
                boolean isAssigned = assignmentRepository.existsByTeacherIdAndSchoolClassIdAndSubjectId(
                        teacher.getId(), schoolClass.getId(), subject.getId());
                if (!isAssigned) {
                    throw new org.springframework.security.access.AccessDeniedException(
                            "Access denied: You are not assigned to teach " + subject.getName() + " in " + schoolClass.getName() + " (" + schoolClass.getSection() + ").");
                }
            } else {
                boolean isClassTeacher = schoolClass.getClassTeacher() != null && schoolClass.getClassTeacher().getId().equals(teacher.getId());
                boolean isAssigned = assignmentRepository.existsByTeacherIdAndSchoolClassId(teacher.getId(), schoolClass.getId());
                if (!isClassTeacher && !isAssigned) {
                    throw new org.springframework.security.access.AccessDeniedException(
                            "Access denied: You are not assigned to class " + schoolClass.getName() + " (" + schoolClass.getSection() + ").");
                }
            }
        }

        List<Attendance> records = new ArrayList<>();

        for (AttendanceRequest.AttendanceEntry entry : request.getEntries()) {
            if (entry.getStudentId() == null) {
                throw new IllegalArgumentException("Student ID cannot be null in attendance entry.");
            }
            if (entry.getStatus() == null || entry.getStatus().trim().isEmpty()) {
                throw new IllegalArgumentException("Status cannot be empty for student ID: " + entry.getStudentId());
            }

            Student student = studentRepository.findById(entry.getStudentId())
                    .orElseThrow(() -> new IllegalArgumentException("Student not found with ID: " + entry.getStudentId()));

            // Domain validation: Ensure student is actually in this class
            if (student.getSchoolClass() == null || !student.getSchoolClass().getId().equals(schoolClass.getId())) {
                throw new IllegalArgumentException("Student " + student.getFullName() + " (ID: " + student.getId() +
                        ") is not enrolled in class " + schoolClass.getName() + " (" + schoolClass.getSection() + ").");
            }

            Attendance.AttendanceStatus status;
            try {
                status = Attendance.AttendanceStatus.valueOf(entry.getStatus().trim().toUpperCase());
            } catch (IllegalArgumentException ex) {
                throw new IllegalArgumentException("Invalid attendance status '" + entry.getStatus() +
                        "'. Allowed values: PRESENT, ABSENT, LATE, EXCUSED.");
            }

            String remarks = entry.getRemarks();

            // Case Study: Approved Leave Auto-Excusal
            // If student is marked ABSENT, check if they have an active APPROVED leave covering this date
            if (status == Attendance.AttendanceStatus.ABSENT) {
                List<LeaveRequest> approvedLeaves = leaveRequestRepository
                        .findApprovedLeavesForStudentOnDate(student.getId(), request.getDate());
                if (!approvedLeaves.isEmpty()) {
                    LeaveRequest leave = approvedLeaves.get(0);
                    status = Attendance.AttendanceStatus.EXCUSED;
                    remarks = "Excused Absence: Approved Leave (" + leave.getReason() + ")";
                    log.info("Student {} marked absent on {} auto-converted to EXCUSED due to approved leave ID: {}",
                            student.getFullName(), request.getDate(), leave.getId());
                }
            }

            // Upsert: check by student, date, and subject
            Optional<Attendance> existingOpt;
            if (subject != null) {
                existingOpt = attendanceRepository.findByStudentIdAndDateAndSubjectId(
                        entry.getStudentId(), request.getDate(), subject.getId());
            } else {
                existingOpt = attendanceRepository.findByStudentIdAndDate(
                        entry.getStudentId(), request.getDate());
            }

            final Subject finalSubject = subject;
            Attendance attendance = existingOpt.orElseGet(() -> Attendance.builder()
                    .student(student)
                    .schoolClass(schoolClass)
                    .subject(finalSubject)
                    .date(request.getDate())
                    .build());

            attendance.setSchoolClass(schoolClass);
            attendance.setSubject(subject);
            attendance.setStatus(status);
            attendance.setMarkedBy(markedBy);
            attendance.setRemarks(remarks);
            records.add(attendanceRepository.save(attendance));
        }

        log.info("Attendance marked for class {} (Subject: {}) on {}: {} entries recorded",
                schoolClass.getName(), subject != null ? subject.getName() : "General", request.getDate(), records.size());

        return records;
    }

    /**
     * Get attendance records for a class on a specific date (and optional subject).
     */
    public List<Map<String, Object>> getClassAttendance(Long classId, LocalDate date, Long subjectId) {
        List<Student> students = studentRepository.findBySchoolClassIdAndIsActiveTrue(classId);
        List<Attendance> records;

        if (subjectId != null) {
            records = attendanceRepository.findBySchoolClassIdAndDateAndSubjectId(classId, date, subjectId);
        } else {
            records = attendanceRepository.findBySchoolClassIdAndDate(classId, date);
        }

        Map<Long, Attendance> attendanceMap = records.stream()
                .collect(Collectors.toMap(a -> a.getStudent().getId(), a -> a, (first, second) -> first));

        List<Map<String, Object>> result = new ArrayList<>();
        for (Student student : students) {
            Map<String, Object> entry = new LinkedHashMap<>();
            entry.put("studentId", student.getId());
            entry.put("studentName", student.getFullName());
            entry.put("admissionNumber", student.getAdmissionNumber());

            Attendance att = attendanceMap.get(student.getId());
            entry.put("status", att != null ? att.getStatus().name() : "NOT_MARKED");
            entry.put("remarks", att != null ? att.getRemarks() : null);
            entry.put("attendanceId", att != null ? att.getId() : null);
            entry.put("subjectId", att != null && att.getSubject() != null ? att.getSubject().getId() : subjectId);
            entry.put("subjectName", att != null && att.getSubject() != null ? att.getSubject().getName() : null);

            result.add(entry);
        }

        return result;
    }

    /**
     * Get individual student attendance over a date range with percentage and categorization.
     * Case studies handled:
     * - Inverted date range rejection (from > to)
     * - Division by zero protection
     * - Granular metrics (present, absent, late, excused)
     */
    public Map<String, Object> getStudentAttendance(Long studentId, LocalDate from, LocalDate to) {
        if (from != null && to != null && from.isAfter(to)) {
            throw new IllegalArgumentException("Invalid date range: 'from' date (" + from + ") cannot be after 'to' date (" + to + ").");
        }

        Student student = studentRepository.findById(studentId)
                .orElseGet(() -> studentRepository.findByUserId(studentId).orElse(null));
        if (student == null) {
            throw new IllegalArgumentException("Student not found with ID: " + studentId);
        }
        Long actualStudentId = student.getId();

        LocalDate effectiveFrom = from != null ? from : LocalDate.now().minusMonths(6);
        LocalDate effectiveTo = to != null ? to : LocalDate.now();

        List<Attendance> records = attendanceRepository
                .findByStudentIdAndDateBetween(actualStudentId, effectiveFrom, effectiveTo);

        long totalDays = records.size();
        long presentDays = records.stream().filter(a -> a.getStatus() == Attendance.AttendanceStatus.PRESENT).count();
        long lateDays = records.stream().filter(a -> a.getStatus() == Attendance.AttendanceStatus.LATE).count();
        long excusedDays = records.stream().filter(a -> a.getStatus() == Attendance.AttendanceStatus.EXCUSED).count();
        long unexcusedAbsentDays = records.stream().filter(a -> a.getStatus() == Attendance.AttendanceStatus.ABSENT).count();

        // Standard academic formula: (Present + Late + Excused) / Total
        long effectivePresent = presentDays + lateDays + excusedDays;
        double percentage = totalDays > 0 ? (double) effectivePresent / totalDays * 100.0 : 100.0;

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("studentId", actualStudentId);
        result.put("studentName", student.getFullName());
        result.put("admissionNumber", student.getAdmissionNumber());
        result.put("from", effectiveFrom);
        result.put("to", effectiveTo);
        result.put("totalDays", totalDays);
        result.put("presentDays", presentDays);
        result.put("lateDays", lateDays);
        result.put("excusedDays", excusedDays);
        result.put("absentDays", unexcusedAbsentDays);
        result.put("percentage", Math.round(percentage * 100.0) / 100.0);
        result.put("records", records.stream().map(a -> {
            Map<String, Object> r = new LinkedHashMap<>();
            r.put("date", a.getDate());
            r.put("status", a.getStatus().name());
            r.put("remarks", a.getRemarks());
            r.put("subject", a.getSubject() != null ? a.getSubject().getName() : "General");
            return r;
        }).toList());

        return result;
    }

    /**
     * Get absent students for a class on a date (and optional subject) for alert triggers.
     */
    public List<Student> getAbsentStudents(Long classId, LocalDate date, Long subjectId) {
        List<Attendance> absentRecords;
        if (subjectId != null) {
            absentRecords = attendanceRepository.findBySchoolClassIdAndDateAndSubjectIdAndStatus(
                    classId, date, subjectId, Attendance.AttendanceStatus.ABSENT);
        } else {
            absentRecords = attendanceRepository.findBySchoolClassIdAndDateAndStatus(
                    classId, date, Attendance.AttendanceStatus.ABSENT);
        }
        return absentRecords.stream().map(Attendance::getStudent).toList();
    }

    /**
     * Verify teacher has access to this class.
     */
    public boolean teacherHasAccess(Long teacherId, Long classId, String academicYear) {
        return assignmentRepository.existsByTeacherIdAndSchoolClassIdAndAcademicYear(
                teacherId, classId, academicYear);
    }
}
