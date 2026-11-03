package com.sms.controller;

import com.sms.dto.*;
import com.sms.model.*;
import com.sms.service.AcademicService;
import com.sms.repository.SchoolClassRepository;
import com.sms.repository.SubjectRepository;
import com.sms.repository.TeacherRepository;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/academics")
@RequiredArgsConstructor
public class AcademicController {

    private final AcademicService academicService;
    private final TeacherRepository teacherRepository;
    private final SchoolClassRepository schoolClassRepository;
    private final SubjectRepository subjectRepository;

    /**
     * Create a dynamic assessment header (teacher-defined).
     */
    @PostMapping("/assessments")
    @PreAuthorize("hasRole('TEACHER')")
    public ResponseEntity<Map<String, Object>> createAssessment(
            @Valid @RequestBody AssessmentRequest request,
            @AuthenticationPrincipal User user) {

        Teacher teacher = teacherRepository.findByUserId(user.getId())
                .orElseThrow(() -> new RuntimeException("Teacher profile not found"));

        AssessmentHeader header = academicService.createAssessment(request, teacher.getId());

        return ResponseEntity.ok(Map.of(
                "message", "Assessment created successfully",
                "assessmentId", header.getId(),
                "name", header.getName()
        ));
    }

    /**
     * List assessments for a class and subject.
     */
    @GetMapping("/assessments")
    @PreAuthorize("hasAnyRole('TEACHER', 'MANAGEMENT')")
    public ResponseEntity<List<AssessmentHeader>> getAssessments(
            @RequestParam Long classId,
            @RequestParam Long subjectId,
            @RequestParam(defaultValue = "2025-2026") String academicYear) {
        return ResponseEntity.ok(academicService.getAssessments(classId, subjectId, academicYear));
    }

    /**
     * Get enrolled class students with existing grade marks for an assessment.
     */
    @GetMapping("/assessments/{assessmentId}/students")
    @PreAuthorize("hasAnyRole('TEACHER', 'MANAGEMENT')")
    public ResponseEntity<List<GradebookStudentResponse>> getAssessmentStudents(@PathVariable Long assessmentId) {
        return ResponseEntity.ok(academicService.getAssessmentStudents(assessmentId));
    }

    /**
     * Bulk enter grades for an assessment.
     */
    @PostMapping("/grades/bulk")
    @PreAuthorize("hasRole('TEACHER')")
    public ResponseEntity<Map<String, Object>> bulkEnterGrades(
            @Valid @RequestBody BulkGradeRequest request,
            @AuthenticationPrincipal User user) {
        List<StudentGrade> grades = academicService.bulkEnterGrades(request, user);
        return ResponseEntity.ok(Map.of(
                "message", "Grades entered successfully",
                "count", grades.size()
        ));
    }

    /**
     * Get student grades (line chart data).
     */
    @GetMapping("/grades/student/{studentId}")
    @PreAuthorize("hasAnyRole('TEACHER', 'MANAGEMENT', 'STUDENT')")
    public ResponseEntity<List<GradeResponse>> getStudentGrades(@PathVariable Long studentId) {
        return ResponseEntity.ok(academicService.getStudentGrades(studentId));
    }

    /**
     * Get teacher's assigned classes only (RBAC enforcement).
     */
    @GetMapping("/my-classes")
    @PreAuthorize("hasRole('TEACHER')")
    public ResponseEntity<List<TeacherClassAssignment>> getMyClasses(
            @AuthenticationPrincipal User user,
            @RequestParam(defaultValue = "2025-2026") String academicYear) {

        Teacher teacher = teacherRepository.findByUserId(user.getId())
                .orElseThrow(() -> new RuntimeException("Teacher profile not found"));

        return ResponseEntity.ok(academicService.getTeacherAssignments(teacher.getId(), academicYear));
    }

    @GetMapping("/classes")
    @PreAuthorize("hasAnyRole('TEACHER', 'MANAGEMENT')")
    public ResponseEntity<List<SchoolClass>> getClasses() {
        return ResponseEntity.ok(schoolClassRepository.findAll());
    }

    @GetMapping("/subjects")
    @PreAuthorize("hasAnyRole('TEACHER', 'MANAGEMENT')")
    public ResponseEntity<List<Subject>> getSubjects() {
        return ResponseEntity.ok(subjectRepository.findAll());
    }
}
