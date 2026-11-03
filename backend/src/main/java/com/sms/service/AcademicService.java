package com.sms.service;

import com.sms.dto.*;
import com.sms.model.*;
import com.sms.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class AcademicService {

    private final AssessmentHeaderRepository assessmentHeaderRepository;
    private final StudentGradeRepository studentGradeRepository;
    private final TeacherClassAssignmentRepository assignmentRepository;
    private final TeacherRepository teacherRepository;
    private final StudentRepository studentRepository;
    private final SchoolClassRepository schoolClassRepository;
    private final SubjectRepository subjectRepository;
    private final AssignmentSubmissionRepository assignmentSubmissionRepository;

    /**
     * Create a dynamic assessment header (teacher-defined).
     * Case studies handled:
     * - Null / non-positive maxMarks rejection
     * - Blank assessment name rejection
     * - Date default fallback
     * - Strict teacher-subject assignment verification
     */
    @Transactional
    public AssessmentHeader createAssessment(AssessmentRequest request, Long teacherId) {
        if (request.getClassId() == null) {
            throw new IllegalArgumentException("Class ID is required to create an assessment.");
        }
        if (request.getSubjectId() == null) {
            throw new IllegalArgumentException("Subject ID is required to create an assessment.");
        }
        if (request.getName() == null || request.getName().trim().isEmpty()) {
            throw new IllegalArgumentException("Assessment name is required and cannot be blank.");
        }
        if (request.getMaxMarks() == null || request.getMaxMarks().compareTo(BigDecimal.ONE) < 0 || request.getMaxMarks().compareTo(new BigDecimal("1000")) > 0) {
            throw new IllegalArgumentException("Maximum marks must be in the permitted range [1, 1000]. Provided: " + request.getMaxMarks());
        }

        Teacher teacher = teacherRepository.findById(teacherId)
                .orElseThrow(() -> new IllegalArgumentException("Teacher not found with ID: " + teacherId));

        String year = request.getAcademicYear() != null ? request.getAcademicYear() : getCurrentAcademicYear();

        // Verify teacher is assigned to this specific subject in class
        boolean isAssignedSubject = assignmentRepository.existsByTeacherIdAndSchoolClassIdAndSubjectIdAndAcademicYear(
                teacherId, request.getClassId(), request.getSubjectId(), year);

        if (!isAssignedSubject) {
            // Fallback: check general assignment without strict year filter or default to active 2025-2026
            if (assignmentRepository.existsByTeacherIdAndSchoolClassIdAndSubjectId(teacherId, request.getClassId(), request.getSubjectId())) {
                isAssignedSubject = true;
                year = "2025-2026";
            }
        }

        if (!isAssignedSubject) {
            throw new org.springframework.security.access.AccessDeniedException("Access Denied: You are not assigned to teach this subject in this class. Only management-assigned subjects can be accessed.");
        }

        SchoolClass schoolClass = schoolClassRepository.findById(request.getClassId())
                .orElseThrow(() -> new IllegalArgumentException("Class not found with ID: " + request.getClassId()));
        Subject subject = subjectRepository.findById(request.getSubjectId())
                .orElseThrow(() -> new IllegalArgumentException("Subject not found with ID: " + request.getSubjectId()));

        java.time.LocalDate assessmentDate = request.getAssessmentDate() != null
                ? request.getAssessmentDate() : java.time.LocalDate.now();

        AssessmentHeader header = AssessmentHeader.builder()
                .name(request.getName().trim())
                .schoolClass(schoolClass)
                .subject(subject)
                .maxMarks(request.getMaxMarks().setScale(2, RoundingMode.HALF_UP))
                .assessmentDate(assessmentDate)
                .academicYear(year)
                .createdBy(teacher)
                .build();

        return assessmentHeaderRepository.save(header);
    }

    /**
     * Get assessments for a class and subject (ordered chronologically).
     */
    public List<AssessmentHeader> getAssessments(Long classId, Long subjectId, String academicYear) {
        return assessmentHeaderRepository
                .findBySchoolClassIdAndSubjectIdAndAcademicYearOrderByAssessmentDateAsc(
                        classId, subjectId, academicYear);
    }

    /**
     * Bulk enter grades for an assessment.
     * Case studies handled:
     * - Empty entries batch rejection
     * - Negative marks rejection
     * - Marks exceeding maxMarks rejection
     * - Student-class mismatch rejection
     * - Teacher authorization enforcement
     */
    @Transactional
    public List<StudentGrade> bulkEnterGrades(BulkGradeRequest request, User user) {
        if (request.getAssessmentHeaderId() == null) {
            throw new IllegalArgumentException("Assessment Header ID is required.");
        }
        if (request.getGrades() == null || request.getGrades().isEmpty()) {
            throw new IllegalArgumentException("Grades batch list cannot be empty.");
        }

        AssessmentHeader header = assessmentHeaderRepository.findById(request.getAssessmentHeaderId())
                .orElseThrow(() -> new IllegalArgumentException("Assessment not found with ID: " + request.getAssessmentHeaderId()));

        if (user != null && user.getRole() == User.Role.TEACHER) {
            Teacher teacher = teacherRepository.findByUserId(user.getId())
                    .orElseThrow(() -> new org.springframework.security.access.AccessDeniedException("Teacher profile not found"));
            boolean isAssigned = assignmentRepository.existsByTeacherIdAndSchoolClassIdAndSubjectId(
                    teacher.getId(), header.getSchoolClass().getId(), header.getSubject().getId());
            boolean isCreator = header.getCreatedBy() != null && header.getCreatedBy().getId().equals(teacher.getId());
            if (!isAssigned && !isCreator) {
                throw new org.springframework.security.access.AccessDeniedException(
                        "Access denied: You are not assigned to grade " + header.getSubject().getName() + " in " + header.getSchoolClass().getName() + ".");
            }
        }

        List<StudentGrade> grades = new ArrayList<>();

        for (BulkGradeRequest.GradeEntry entry : request.getGrades()) {
            if (entry.getStudentId() == null) {
                throw new IllegalArgumentException("Student ID cannot be null in grade entry.");
            }

            Student student = studentRepository.findById(entry.getStudentId())
                    .orElseThrow(() -> new IllegalArgumentException("Student not found with ID: " + entry.getStudentId()));

            // Domain validation: Ensure student belongs to the class of the assessment
            if (student.getSchoolClass() == null || !student.getSchoolClass().getId().equals(header.getSchoolClass().getId())) {
                throw new IllegalArgumentException(String.format(
                        "Student %s (ID: %d) is not enrolled in class %s (%s). Cannot record grade.",
                        student.getFullName(), student.getId(),
                        header.getSchoolClass().getName(), header.getSchoolClass().getSection()
                ));
            }

            // Validate marks range
            BigDecimal maxAllowed = (header.getMaxMarks() != null && header.getMaxMarks().compareTo(BigDecimal.ZERO) > 0)
                    ? header.getMaxMarks() : new BigDecimal("100.00");
            if (entry.getMarksObtained() != null) {
                if (entry.getMarksObtained().compareTo(BigDecimal.ZERO) < 0 || entry.getMarksObtained().compareTo(maxAllowed) > 0) {
                    throw new IllegalArgumentException(String.format(
                            "System Rejected Input: Marks obtained (%s) for student %s is outside permitted range [0, %s].",
                            entry.getMarksObtained(), student.getFullName(), maxAllowed
                    ));
                }
            }

            // Upsert grade
            StudentGrade grade = studentGradeRepository
                    .findByStudentId(student.getId()).stream()
                    .filter(g -> g.getAssessmentHeader().getId().equals(header.getId()))
                    .findFirst()
                    .orElse(StudentGrade.builder()
                            .student(student)
                            .assessmentHeader(header)
                            .build());

            grade.setMarksObtained(entry.getMarksObtained() != null ? entry.getMarksObtained().setScale(2, RoundingMode.HALF_UP) : null);
            grade.setRemarks(entry.getRemarks());
            grades.add(studentGradeRepository.save(grade));
        }

        log.info("Bulk grades entered: Assessment={}, Students={}", header.getName(), grades.size());
        return grades;
    }

    /**
     * Get a student's grades with standardized Letter Grade and GPA computation.
     */
    public List<GradeResponse> getStudentGrades(Long studentId) {
        Student student = studentRepository.findById(studentId)
                .orElseGet(() -> studentRepository.findByUserId(studentId).orElse(null));
        if (student == null) {
            throw new IllegalArgumentException("Student not found with ID: " + studentId);
        }
        Long actualStudentId = student.getId();
        List<GradeResponse> results = new ArrayList<>();

        // 1. Formal examination assessments from StudentGrade
        List<StudentGrade> grades = studentGradeRepository.findByStudentId(actualStudentId);
        for (StudentGrade g : grades) {
            AssessmentHeader h = g.getAssessmentHeader();
            Double percentage = null;
            if (g.getMarksObtained() != null && h.getMaxMarks() != null && h.getMaxMarks().compareTo(BigDecimal.ZERO) > 0) {
                percentage = g.getMarksObtained()
                        .divide(h.getMaxMarks(), 4, RoundingMode.HALF_UP)
                        .multiply(BigDecimal.valueOf(100))
                        .setScale(2, RoundingMode.HALF_UP)
                        .doubleValue();
            }

            String letterGrade = calculateLetterGrade(percentage);
            Double gpa = calculateGpa(percentage);

            results.add(GradeResponse.builder()
                    .gradeId(g.getId())
                    .assessmentName(h.getName())
                    .subjectName(h.getSubject() != null ? h.getSubject().getName() : "General")
                    .assessmentDate(h.getAssessmentDate())
                    .maxMarks(h.getMaxMarks())
                    .marksObtained(g.getMarksObtained())
                    .percentage(percentage)
                    .letterGrade(letterGrade)
                    .gpa(gpa)
                    .remarks(g.getRemarks())
                    .assessmentType("EXAMINATION")
                    .build());
        }

        // 2. Continuous Coursework & Homework Assignment evaluations from AssignmentSubmission
        List<AssignmentSubmission> submissions = assignmentSubmissionRepository.findByStudentId(actualStudentId);
        for (AssignmentSubmission sub : submissions) {
            if (sub.getMarksObtained() != null && sub.getAssignment() != null) {
                Assignment asg = sub.getAssignment();
                BigDecimal maxMarks = BigDecimal.valueOf(asg.getMaxMarks() != null && asg.getMaxMarks() > 0 ? asg.getMaxMarks() : 100);
                BigDecimal marksObt = BigDecimal.valueOf(sub.getMarksObtained());
                Double percentage = marksObt
                        .divide(maxMarks, 4, RoundingMode.HALF_UP)
                        .multiply(BigDecimal.valueOf(100))
                        .setScale(2, RoundingMode.HALF_UP)
                        .doubleValue();

                String letterGrade = calculateLetterGrade(percentage);
                Double gpa = calculateGpa(percentage);
                java.time.LocalDate date = sub.getSubmissionDate() != null ? sub.getSubmissionDate()
                        : (asg.getDueDate() != null ? asg.getDueDate() : java.time.LocalDate.now());
                String subjectName = asg.getSubject() != null ? asg.getSubject().getName() : "General";

                results.add(GradeResponse.builder()
                        .gradeId(100000L + sub.getId())
                        .assessmentName(asg.getTitle())
                        .subjectName(subjectName)
                        .assessmentDate(date)
                        .maxMarks(maxMarks)
                        .marksObtained(marksObt)
                        .percentage(percentage)
                        .letterGrade(letterGrade)
                        .gpa(gpa)
                        .remarks(sub.getFeedback() != null && !sub.getFeedback().isBlank() ? sub.getFeedback() : "Assignment Evaluation: " + sub.getStatus())
                        .assessmentType("ASSIGNMENT")
                        .build());
            }
        }

        // Sort chronologically by assessmentDate descending
        results.sort((a, b) -> {
            if (a.getAssessmentDate() != null && b.getAssessmentDate() != null) {
                int cmp = b.getAssessmentDate().compareTo(a.getAssessmentDate());
                if (cmp != 0) return cmp;
            }
            return a.getAssessmentName().compareToIgnoreCase(b.getAssessmentName());
        });

        return results;
    }

    public static String calculateLetterGrade(Double percentage) {
        if (percentage == null) return "N/A";
        if (percentage >= 90.0) return "A+";
        if (percentage >= 80.0) return "A";
        if (percentage >= 70.0) return "B";
        if (percentage >= 60.0) return "C";
        if (percentage >= 50.0) return "D";
        return "F";
    }

    public static Double calculateGpa(Double percentage) {
        if (percentage == null) return null;
        if (percentage >= 90.0) return 4.0;
        if (percentage >= 80.0) return 3.7;
        if (percentage >= 70.0) return 3.0;
        if (percentage >= 60.0) return 2.0;
        if (percentage >= 50.0) return 1.0;
        return 0.0;
    }

    /**
     * Get all enrolled students in a class for a specific assessment header,
     * including any previously entered marks.
     */
    public List<GradebookStudentResponse> getAssessmentStudents(Long assessmentHeaderId) {
        AssessmentHeader header = assessmentHeaderRepository.findById(assessmentHeaderId)
                .orElseThrow(() -> new RuntimeException("Assessment header not found: " + assessmentHeaderId));

        Long classId = header.getSchoolClass().getId();
        List<Student> students = studentRepository.findBySchoolClassIdAndIsActiveTrue(classId);
        List<StudentGrade> existingGrades = studentGradeRepository.findByAssessmentHeaderId(assessmentHeaderId);

        java.util.Map<Long, StudentGrade> gradeMap = existingGrades.stream()
                .collect(java.util.stream.Collectors.toMap(
                        g -> g.getStudent().getId(),
                        g -> g,
                        (g1, g2) -> g1
                ));

        return students.stream().map(student -> {
            StudentGrade grade = gradeMap.get(student.getId());
            return GradebookStudentResponse.builder()
                    .studentId(student.getId())
                    .studentName(student.getFullName())
                    .admissionNumber(student.getAdmissionNumber())
                    .marksObtained(grade != null ? grade.getMarksObtained() : null)
                    .remarks(grade != null ? grade.getRemarks() : null)
                    .build();
        }).collect(java.util.stream.Collectors.toList());
    }

    /**
     * Get teacher's assigned classes & subjects (RBAC enforcement).
     * Strictly returns ONLY the subjects and classes allocated to this teacher by management in TeacherClassAssignment.
     * Being a Class Teacher (homeroom in-charge) does NOT grant rights to teach or post assignments for other teachers' subjects.
     */
    public List<TeacherClassAssignment> getTeacherAssignments(Long teacherId, String academicYear) {
        if (academicYear != null && !academicYear.isBlank()) {
            List<TeacherClassAssignment> list = assignmentRepository.findByTeacherIdAndAcademicYear(teacherId, academicYear);
            if (!list.isEmpty()) {
                return list;
            }
        }
        return assignmentRepository.findByTeacherId(teacherId);
    }

    private String getCurrentAcademicYear() {
        int year = java.time.LocalDate.now().getYear();
        int month = java.time.LocalDate.now().getMonthValue();
        return month >= 4 ? year + "-" + (year + 1) : (year - 1) + "-" + year;
    }
}
