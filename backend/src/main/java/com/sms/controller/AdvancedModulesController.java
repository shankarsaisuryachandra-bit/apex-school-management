package com.sms.controller;

import com.sms.model.*;
import com.sms.repository.*;
import com.sms.service.AiStudyService;
import com.sms.service.ReportCardService;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class AdvancedModulesController {

    private final TeacherSalaryRepository teacherSalaryRepository;
    private final TransportRouteRepository transportRouteRepository;
    private final TransportGpsLogRepository transportGpsLogRepository;
    private final TransportBoardingLogRepository transportBoardingLogRepository;
    private final TransportNotificationRepository transportNotificationRepository;
    private final LibraryBookRepository libraryBookRepository;
    private final TeacherRepository teacherRepository;
    private final SchoolEventRepository schoolEventRepository;
    private final LeaveRequestRepository leaveRequestRepository;
    private final StudentRepository studentRepository;
    private final SchoolGalleryRepository schoolGalleryRepository;
    private final PtmAppointmentRepository ptmAppointmentRepository;
    private final SchoolAssetRepository schoolAssetRepository;
    private final StudentHealthRepository studentHealthRepository;
    private final SystemAuditLogRepository systemAuditLogRepository;
    private final AdmitCardRepository admitCardRepository;
    private final AssignmentRepository assignmentRepository;
    private final IdCardRepository idCardRepository;
    private final SchoolClassRepository schoolClassRepository;
    private final SubjectRepository subjectRepository;
    private final TeacherClassAssignmentRepository teacherClassAssignmentRepository;
    private final com.sms.repository.cms.SchoolInfoRepository schoolInfoRepository;
    private final AdmissionApplicationRepository admissionApplicationRepository;
    private final ParentContactRepository parentContactRepository;
    private final StudentGradeRepository studentGradeRepository;
    private final AttendanceRepository attendanceRepository;
    private final AssignmentSubmissionRepository assignmentSubmissionRepository;
    private final StudyMaterialRepository studyMaterialRepository;
    private final TeacherSubstitutionRepository teacherSubstitutionRepository;
    private final AiStudyService aiStudyService;
    private final ReportCardService reportCardService;

    // ================= ASSIGNMENTS MODULE =================
    @GetMapping("/assignments")
    public ResponseEntity<List<Assignment>> getAssignments(
            @RequestParam(required = false) Long classId,
            @RequestParam(required = false) Long studentId,
            @RequestParam(required = false) Long teacherId,
            @AuthenticationPrincipal User authUser) {
        
        // 1. If requester is a TEACHER: strictly restrict to only this teacher's own assignments
        if (authUser != null && authUser.getRole() == User.Role.TEACHER) {
            Teacher teacher = teacherRepository.findByUserId(authUser.getId()).orElse(null);
            if (teacher != null) {
                if (classId != null) {
                    List<Assignment> teacherClassAsgs = assignmentRepository.findByTeacherIdOrderByDueDateAsc(teacher.getId())
                            .stream()
                            .filter(a -> a.getSchoolClass() != null && a.getSchoolClass().getId().equals(classId))
                            .collect(Collectors.toList());
                    return ResponseEntity.ok(teacherClassAsgs);
                }
                return ResponseEntity.ok(assignmentRepository.findByTeacherIdOrderByDueDateAsc(teacher.getId()));
            }
        }

        // 2. If student queries or studentId provided: return assignments for student's class
        if (studentId != null) {
            Student student = studentRepository.findById(studentId)
                    .orElseGet(() -> studentRepository.findByUserId(studentId).orElse(null));
            if (student != null && student.getSchoolClass() != null) {
                return ResponseEntity.ok(assignmentRepository.findBySchoolClassIdOrderByDueDateAsc(student.getSchoolClass().getId()));
            }
        }
        if (authUser != null && authUser.getRole() == User.Role.STUDENT) {
            Student student = studentRepository.findByUserId(authUser.getId()).orElse(null);
            if (student != null && student.getSchoolClass() != null) {
                return ResponseEntity.ok(assignmentRepository.findBySchoolClassIdOrderByDueDateAsc(student.getSchoolClass().getId()));
            }
        }

        // 3. If explicit teacherId requested (e.g. by Management)
        if (teacherId != null) {
            Teacher teacher = teacherRepository.findById(teacherId)
                    .orElseGet(() -> teacherRepository.findByUserId(teacherId).orElse(null));
            if (teacher != null) {
                return ResponseEntity.ok(assignmentRepository.findByTeacherIdOrderByDueDateAsc(teacher.getId()));
            }
        }

        // 4. If classId specified (e.g. by Management)
        if (classId != null) {
            return ResponseEntity.ok(assignmentRepository.findBySchoolClassIdOrderByDueDateAsc(classId));
        }

        // 5. Management gets all assignments throughout the institute
        return ResponseEntity.ok(assignmentRepository.findAllByOrderByDueDateAsc());
    }

    @PostMapping("/assignments")
    @PreAuthorize("hasAnyRole('MANAGEMENT', 'TEACHER')")
    public ResponseEntity<Assignment> createAssignment(
            @RequestBody CreateAssignmentRequest req,
            @AuthenticationPrincipal User user) {
        SchoolClass schoolClass = schoolClassRepository.findById(req.getClassId())
                .orElseThrow(() -> new RuntimeException("Class not found: " + req.getClassId()));
        Subject subject = req.getSubjectId() != null ? subjectRepository.findById(req.getSubjectId()).orElse(null) : null;

        Teacher teacher = null;
        if (user != null && user.getRole() == User.Role.TEACHER) {
            teacher = teacherRepository.findByUserId(user.getId()).orElse(null);
            if (teacher == null) {
                throw new org.springframework.security.access.AccessDeniedException("Teacher profile not found.");
            }

            // Strict Validation: A teacher can only set assignments for classes and subjects assigned to them by management
            boolean isAssigned = false;
            if (subject != null) {
                isAssigned = teacherClassAssignmentRepository.existsByTeacherIdAndSchoolClassIdAndSubjectId(
                        teacher.getId(), schoolClass.getId(), subject.getId());
            } else {
                isAssigned = teacherClassAssignmentRepository.existsByTeacherIdAndSchoolClassId(
                        teacher.getId(), schoolClass.getId());
            }

            if (!isAssigned) {
                throw new org.springframework.security.access.AccessDeniedException(
                        "Access denied: You are not assigned to teach " 
                        + (subject != null ? subject.getName() : "this subject") 
                        + " in " + schoolClass.getName() + " (" + schoolClass.getSection() + "). Teachers can only post assignments to classes and subjects assigned by management.");
            }
        } else if (req.getTeacherId() != null) {
            teacher = teacherRepository.findById(req.getTeacherId())
                    .orElseGet(() -> teacherRepository.findByUserId(req.getTeacherId()).orElse(null));
        } else if (user != null) {
            teacher = teacherRepository.findByUserId(user.getId()).orElse(null);
        }

        if (req.getMaxMarks() != null && (req.getMaxMarks() < 1 || req.getMaxMarks() > 1000)) {
            throw new IllegalArgumentException("Assignment max marks must be in the permitted range [1, 1000]. Provided: " + req.getMaxMarks());
        }

        Assignment assignment = Assignment.builder()
                .schoolClass(schoolClass)
                .subject(subject)
                .teacher(teacher)
                .title(req.getTitle())
                .instructions(req.getInstructions())
                .fileUrl(req.getFileUrl())
                .dueDate(LocalDate.parse(req.getDueDate()))
                .maxMarks(req.getMaxMarks() != null ? req.getMaxMarks() : 100)
                .build();

        return ResponseEntity.ok(assignmentRepository.save(assignment));
    }

    @PostMapping("/assignments/{assignmentId}/submit")
    @PreAuthorize("hasRole('STUDENT')")
    public ResponseEntity<AssignmentSubmission> submitAssignment(
            @PathVariable Long assignmentId,
            @RequestBody SubmitAssignmentRequest req,
            @AuthenticationPrincipal User authUser) {
        
        Assignment assignment = assignmentRepository.findById(assignmentId)
                .orElseThrow(() -> new RuntimeException("Assignment not found"));
        
        Student student = null;
        if (authUser != null) {
            student = studentRepository.findByUserId(authUser.getId()).orElse(null);
        }
        if (student == null && req.getStudentId() != null) {
            student = studentRepository.findById(req.getStudentId())
                    .orElseGet(() -> studentRepository.findByUserId(req.getStudentId()).orElse(null));
        }
        
        if (student == null) {
            throw new RuntimeException("Student not found");
        }

        // Security check: Student must be enrolled in the assignment's class
        if (assignment.getSchoolClass() != null && student.getSchoolClass() != null
                && !assignment.getSchoolClass().getId().equals(student.getSchoolClass().getId())) {
            throw new org.springframework.security.access.AccessDeniedException("Access denied: You are not enrolled in the class for this assignment.");
        }

        AssignmentSubmission submission = assignmentSubmissionRepository
                .findByAssignmentIdAndStudentId(assignment.getId(), student.getId())
                .orElse(null);

        if (submission == null) {
            submission = AssignmentSubmission.builder()
                    .assignment(assignment)
                    .student(student)
                    .fileUrl(req.getFileUrl())
                    .status("SUBMITTED")
                    .submissionDate(LocalDate.now())
                    .build();
        } else {
            submission.setFileUrl(req.getFileUrl());
            submission.setStatus("SUBMITTED");
            submission.setSubmissionDate(LocalDate.now());
        }

        return ResponseEntity.ok(assignmentSubmissionRepository.save(submission));
    }

    @GetMapping("/assignments/{assignmentId}/submissions")
    @PreAuthorize("hasAnyRole('MANAGEMENT', 'TEACHER')")
    public ResponseEntity<List<AssignmentSubmission>> getSubmissions(
            @PathVariable Long assignmentId,
            @AuthenticationPrincipal User authUser) {
        Assignment assignment = assignmentRepository.findById(assignmentId)
                .orElseThrow(() -> new RuntimeException("Assignment not found: " + assignmentId));

        if (authUser != null && authUser.getRole() == User.Role.TEACHER) {
            Teacher teacher = teacherRepository.findByUserId(authUser.getId()).orElse(null);
            if (teacher != null && assignment.getTeacher() != null && !assignment.getTeacher().getId().equals(teacher.getId())) {
                throw new org.springframework.security.access.AccessDeniedException("Access denied: You can only view submissions for your own assignments.");
            }
        }

        return ResponseEntity.ok(assignmentSubmissionRepository.findByAssignmentId(assignmentId));
    }

    @GetMapping("/assignments/my-submissions")
    @PreAuthorize("hasRole('STUDENT')")
    public ResponseEntity<List<AssignmentSubmission>> getMySubmissions(
            @RequestParam(required = false) Long studentId,
            @AuthenticationPrincipal User authUser) {
        Student student = null;
        if (authUser != null) {
            student = studentRepository.findByUserId(authUser.getId()).orElse(null);
        }
        if (student == null && studentId != null) {
            student = studentRepository.findById(studentId)
                    .orElseGet(() -> studentRepository.findByUserId(studentId).orElse(null));
        }
        if (student == null) {
            throw new RuntimeException("Student not found");
        }
        return ResponseEntity.ok(assignmentSubmissionRepository.findByStudentId(student.getId()));
    }

    @PutMapping("/assignments/submissions/{submissionId}/grade")
    @PreAuthorize("hasAnyRole('MANAGEMENT', 'TEACHER')")
    public ResponseEntity<AssignmentSubmission> gradeSubmission(
            @PathVariable Long submissionId,
            @RequestBody GradeSubmissionRequest req,
            @AuthenticationPrincipal User authUser) {
        
        AssignmentSubmission submission = assignmentSubmissionRepository.findById(submissionId)
                .orElseThrow(() -> new RuntimeException("Submission not found"));

        if (authUser != null && authUser.getRole() == User.Role.TEACHER) {
            Teacher teacher = teacherRepository.findByUserId(authUser.getId()).orElse(null);
            if (teacher != null && submission.getAssignment() != null && submission.getAssignment().getTeacher() != null
                    && !submission.getAssignment().getTeacher().getId().equals(teacher.getId())) {
                throw new org.springframework.security.access.AccessDeniedException("Access denied: You can only evaluate submissions for your own assignments.");
            }
        }

        if (req.getMarksObtained() != null) {
            int maxAllowed = (submission.getAssignment() != null && submission.getAssignment().getMaxMarks() != null && submission.getAssignment().getMaxMarks() > 0)
                    ? submission.getAssignment().getMaxMarks() : 100;
            if (req.getMarksObtained() < 0 || req.getMarksObtained() > maxAllowed) {
                throw new IllegalArgumentException(String.format(
                        "Marks obtained (%d) is outside permitted range [0, %d] for assignment '%s'.",
                        req.getMarksObtained(), maxAllowed,
                        submission.getAssignment() != null ? submission.getAssignment().getTitle() : "Assignment"
                ));
            }
            submission.setMarksObtained(req.getMarksObtained());
        }
        if (req.getFeedback() != null) {
            submission.setFeedback(req.getFeedback());
        }
        if (req.getStatus() != null && !req.getStatus().isBlank()) {
            submission.setStatus(req.getStatus());
        } else {
            submission.setStatus("APPROVED");
        }

        return ResponseEntity.ok(assignmentSubmissionRepository.save(submission));
    }

    @DeleteMapping("/assignments/{assignmentId}")
    @PreAuthorize("hasAnyRole('MANAGEMENT', 'TEACHER')")
    @Transactional
    public ResponseEntity<Map<String, String>> deleteAssignment(
            @PathVariable Long assignmentId,
            @AuthenticationPrincipal User authUser) {
        Assignment assignment = assignmentRepository.findById(assignmentId)
                .orElseThrow(() -> new RuntimeException("Assignment not found: " + assignmentId));

        if (authUser != null && authUser.getRole() == User.Role.TEACHER) {
            Teacher teacher = teacherRepository.findByUserId(authUser.getId()).orElse(null);
            if (teacher != null && assignment.getTeacher() != null && !assignment.getTeacher().getId().equals(teacher.getId())) {
                throw new org.springframework.security.access.AccessDeniedException("Access denied: You can only delete assignments created by you.");
            }
        }

        List<AssignmentSubmission> submissions = assignmentSubmissionRepository.findByAssignmentId(assignmentId);
        if (!submissions.isEmpty()) {
            assignmentSubmissionRepository.deleteAll(submissions);
        }

        assignmentRepository.delete(assignment);
        return ResponseEntity.ok(Map.of("message", "Assignment deleted successfully"));
    }

    @GetMapping("/assignments/{assignmentId}/gradebook")
    @PreAuthorize("hasAnyRole('MANAGEMENT', 'TEACHER')")
    public ResponseEntity<Map<String, Object>> getAssignmentGradebook(
            @PathVariable Long assignmentId,
            @AuthenticationPrincipal User authUser) {
        Assignment assignment = assignmentRepository.findById(assignmentId)
                .orElseThrow(() -> new RuntimeException("Assignment not found: " + assignmentId));

        if (authUser != null && authUser.getRole() == User.Role.TEACHER) {
            Teacher teacher = teacherRepository.findByUserId(authUser.getId()).orElse(null);
            if (teacher != null && assignment.getTeacher() != null && !assignment.getTeacher().getId().equals(teacher.getId())) {
                throw new org.springframework.security.access.AccessDeniedException("Access denied: You can only access the gradebook for your own assignments.");
            }
        }

        Long classId = assignment.getSchoolClass() != null ? assignment.getSchoolClass().getId() : null;
        List<Student> classStudents = classId != null
                ? studentRepository.findBySchoolClassId(classId)
                : studentRepository.findAll();

        List<AssignmentSubmission> submissions = assignmentSubmissionRepository.findByAssignmentId(assignmentId);
        Map<Long, AssignmentSubmission> subMap = submissions.stream()
                .filter(s -> s.getStudent() != null)
                .collect(Collectors.toMap(s -> s.getStudent().getId(), s -> s, (s1, s2) -> s1));

        Set<Long> processedStudentIds = new HashSet<>();
        List<Map<String, Object>> rows = new ArrayList<>();

        for (Student st : classStudents) {
            processedStudentIds.add(st.getId());
            AssignmentSubmission sub = subMap.get(st.getId());
            Map<String, Object> row = new HashMap<>();
            row.put("studentId", st.getId());
            row.put("admissionNumber", st.getAdmissionNumber());
            row.put("fullName", st.getFullName());
            row.put("gender", st.getGender() != null ? st.getGender().name() : "OTHER");
            row.put("hasSubmitted", sub != null);
            row.put("submissionId", sub != null ? sub.getId() : null);
            row.put("submissionDate", sub != null ? sub.getSubmissionDate() : null);
            row.put("fileUrl", sub != null ? sub.getFileUrl() : null);
            row.put("status", sub != null ? sub.getStatus() : "PENDING");
            row.put("marksObtained", sub != null ? sub.getMarksObtained() : null);
            row.put("maxMarks", assignment.getMaxMarks());
            row.put("feedback", sub != null ? sub.getFeedback() : null);
            rows.add(row);
        }

        // Also ensure any student who submitted this assignment is always present in the gradebook
        for (AssignmentSubmission sub : submissions) {
            if (sub.getStudent() != null && !processedStudentIds.contains(sub.getStudent().getId())) {
                Student st = sub.getStudent();
                processedStudentIds.add(st.getId());
                Map<String, Object> row = new HashMap<>();
                row.put("studentId", st.getId());
                row.put("admissionNumber", st.getAdmissionNumber());
                row.put("fullName", st.getFullName());
                row.put("gender", st.getGender() != null ? st.getGender().name() : "OTHER");
                row.put("hasSubmitted", true);
                row.put("submissionId", sub.getId());
                row.put("submissionDate", sub.getSubmissionDate());
                row.put("fileUrl", sub.getFileUrl());
                row.put("status", sub.getStatus());
                row.put("marksObtained", sub.getMarksObtained());
                row.put("maxMarks", assignment.getMaxMarks());
                row.put("feedback", sub.getFeedback());
                rows.add(row);
            }
        }

        // Sort by admission number for clean spreadsheet presentation
        rows.sort((r1, r2) -> {
            String a1 = (String) r1.getOrDefault("admissionNumber", "");
            String a2 = (String) r2.getOrDefault("admissionNumber", "");
            return a1.compareToIgnoreCase(a2);
        });

        long submittedCount = rows.stream().filter(r -> Boolean.TRUE.equals(r.get("hasSubmitted"))).count();
        long evaluatedCount = rows.stream().filter(r -> r.get("marksObtained") != null).count();

        return ResponseEntity.ok(Map.of(
                "assignment", assignment,
                "totalStudents", rows.size(),
                "submittedCount", submittedCount,
                "evaluatedCount", evaluatedCount,
                "students", rows
        ));
    }

    // ================= ID CARDS MODULE =================
    @GetMapping("/id-cards/{studentId}")
    public ResponseEntity<IdCard> getIdCard(
            @PathVariable Long studentId,
            @AuthenticationPrincipal User authUser) {
        if (authUser != null && authUser.getRole() == User.Role.STUDENT) {
            Student s = studentRepository.findByUserId(authUser.getId()).orElse(null);
            if (s != null && !s.getId().equals(studentId) && !s.getUser().getId().equals(studentId)) {
                throw new org.springframework.security.access.AccessDeniedException("Access denied: You can only view your own ID card.");
            }
        }

        Student student = studentRepository.findById(studentId)
                .orElseGet(() -> studentRepository.findByUserId(studentId).orElse(null));
        if (student == null) {
            throw new RuntimeException("Student not found for ID Card");
        }

        IdCard card = idCardRepository.findByStudentId(student.getId())
                .orElseGet(() -> idCardRepository.save(
                        IdCard.builder()
                                .student(student)
                                .cardNumber("IDC-" + student.getAdmissionNumber())
                                .issueDate(LocalDate.now())
                                .expiryDate(LocalDate.now().plusYears(1))
                                .build()
                ));

        return ResponseEntity.ok(card);
    }

    @Data
    public static class CreateAssignmentRequest {
        private Long classId;
        private Long subjectId;
        private Long teacherId;
        private String title;
        private String instructions;
        private String dueDate;
        private Integer maxMarks;
        private String fileUrl;
    }

    @Data
    public static class SubmitAssignmentRequest {
        private Long studentId;
        private String fileUrl;
    }

    @Data
    public static class GradeSubmissionRequest {
        private Integer marksObtained;
        private String feedback;
        private String status;
    }

    // ================= ADMIT CARD MODULE =================
    @GetMapping("/admit-cards")
    public ResponseEntity<List<AdmitCard>> getAdmitCards(
            @RequestParam(required = false) Long studentId,
            @AuthenticationPrincipal User authUser) {
        if (authUser != null && authUser.getRole() == User.Role.STUDENT) {
            Student s = studentRepository.findByUserId(authUser.getId()).orElse(null);
            if (s != null) {
                return ResponseEntity.ok(admitCardRepository.findByStudentId(s.getId()));
            }
        }
        if (studentId != null) {
            return ResponseEntity.ok(admitCardRepository.findByStudentId(studentId));
        }
        return ResponseEntity.ok(admitCardRepository.findAll());
    }

    @PostMapping("/admit-cards")
    @PreAuthorize("hasAnyRole('MANAGEMENT', 'TEACHER')")
    public ResponseEntity<AdmitCard> generateAdmitCard(@RequestBody GenerateAdmitCardRequest req) {
        Student student = studentRepository.findById(req.getStudentId())
                .orElseGet(() -> studentRepository.findByUserId(req.getStudentId()).orElse(null));
        if (student == null) {
            throw new RuntimeException("Student not found for Admit Card generation");
        }

        AdmitCard card = AdmitCard.builder()
                .student(student)
                .examTitle(req.getExamTitle() != null ? req.getExamTitle() : "Annual Term Examination 2025-26")
                .rollNumber(req.getRollNumber() != null ? req.getRollNumber() : "RL-" + student.getAdmissionNumber())
                .examCenter(req.getExamCenter() != null ? req.getExamCenter() : "Main Campus Hall A")
                .generatedDate(LocalDate.now())
                .build();

        return ResponseEntity.ok(admitCardRepository.save(card));
    }

    @Data
    public static class GenerateAdmitCardRequest {
        private Long studentId;
        private String examTitle;
        private String rollNumber;
        private String examCenter;
    }

    // ================= AUDIT LOGS MODULE =================
    @GetMapping("/audit-logs")
    @PreAuthorize("hasRole('MANAGEMENT')")
    public ResponseEntity<List<SystemAuditLog>> getAuditLogs() {
        List<SystemAuditLog> logs = systemAuditLogRepository.findTop20ByOrderByTimestampDesc();
        if (logs.isEmpty()) {
            logs = List.of(
                SystemAuditLog.builder().performedBy("admin").action("Recorded fee payment RCP-1785983915942").module("FEES").build(),
                SystemAuditLog.builder().performedBy("teacher1").action("Marked attendance for Grade 10 A").module("ATTENDANCE").build(),
                SystemAuditLog.builder().performedBy("admin").action("Created new transport route KA-01-EQ-1001").module("TRANSPORT").build(),
                SystemAuditLog.builder().performedBy("admin").action("Added new library book Concepts of Physics").module("LIBRARY").build()
            );
        }
        return ResponseEntity.ok(logs);
    }

    // ================= ASSETS & INVENTORY MODULE =================
    @GetMapping("/inventory")
    @PreAuthorize("hasRole('MANAGEMENT')")
    public ResponseEntity<List<SchoolAsset>> getInventory() {
        return ResponseEntity.ok(schoolAssetRepository.findAll());
    }

    @PostMapping("/inventory")
    @PreAuthorize("hasRole('MANAGEMENT')")
    public ResponseEntity<SchoolAsset> createAsset(@RequestBody SchoolAsset asset) {
        if (asset.getQuantity() != null && (asset.getQuantity() < 0 || asset.getQuantity() > 100000)) {
            throw new IllegalArgumentException("Asset quantity must be in the permitted range [0, 100,000]. Provided: " + asset.getQuantity());
        }
        return ResponseEntity.ok(schoolAssetRepository.save(asset));
    }

    // ================= STUDENT HEALTH MODULE =================
    @GetMapping("/health/{studentId}")
    public ResponseEntity<StudentHealth> getHealthRecord(
            @PathVariable Long studentId,
            @AuthenticationPrincipal User authUser) {
        if (authUser != null && authUser.getRole() == User.Role.STUDENT) {
            Student s = studentRepository.findByUserId(authUser.getId()).orElse(null);
            if (s != null && !s.getId().equals(studentId) && !s.getUser().getId().equals(studentId)) {
                throw new org.springframework.security.access.AccessDeniedException("Access denied: You can only view your own health record.");
            }
        }
        StudentHealth health = studentHealthRepository.findByStudentId(studentId)
                .orElseGet(() -> {
                    Student student = studentRepository.findById(studentId)
                            .orElseGet(() -> studentRepository.findByUserId(studentId).orElse(null));
                    if (student == null) return null;
                    return StudentHealth.builder()
                            .student(student)
                            .bloodGroup("O+")
                            .allergies("None reported")
                            .heightCm(165.0)
                            .weightKg(55.0)
                            .medicalNotes("Annual physical checkup normal")
                            .build();
                });
        return ResponseEntity.ok(health);
    }

    @PostMapping("/health")
    @PreAuthorize("hasAnyRole('MANAGEMENT', 'TEACHER')")
    public ResponseEntity<StudentHealth> saveHealthRecord(@RequestBody SaveHealthRequest req) {
        Student student = studentRepository.findById(req.getStudentId())
                .orElseGet(() -> studentRepository.findByUserId(req.getStudentId()).orElse(null));
        if (student == null) {
            throw new RuntimeException("Student not found for health record");
        }

        if (req.getHeightCm() != null && (req.getHeightCm() < 30.0 || req.getHeightCm() > 250.0)) {
            throw new IllegalArgumentException("Student height must be in the permitted range [30.0 cm, 250.0 cm]. Provided: " + req.getHeightCm());
        }
        if (req.getWeightKg() != null && (req.getWeightKg() < 3.0 || req.getWeightKg() > 250.0)) {
            throw new IllegalArgumentException("Student weight must be in the permitted range [3.0 kg, 250.0 kg]. Provided: " + req.getWeightKg());
        }

        StudentHealth health = studentHealthRepository.findByStudentId(student.getId())
                .orElse(StudentHealth.builder().student(student).build());

        if (req.getBloodGroup() != null) health.setBloodGroup(req.getBloodGroup());
        if (req.getAllergies() != null) health.setAllergies(req.getAllergies());
        if (req.getHeightCm() != null) health.setHeightCm(req.getHeightCm());
        if (req.getWeightKg() != null) health.setWeightKg(req.getWeightKg());
        if (req.getMedicalNotes() != null) health.setMedicalNotes(req.getMedicalNotes());
        health.setLastCheckup(LocalDate.now());

        return ResponseEntity.ok(studentHealthRepository.save(health));
    }

    @Data
    public static class SaveHealthRequest {
        private Long studentId;
        private String bloodGroup;
        private String allergies;
        private Double heightCm;
        private Double weightKg;
        private String medicalNotes;
    }

    // ================= SCHOOL GALLERY MODULE =================
    @GetMapping("/gallery")
    public ResponseEntity<List<SchoolGallery>> getGallery() {
        return ResponseEntity.ok(schoolGalleryRepository.findAllByOrderByCreatedDateDesc());
    }

    @PostMapping("/gallery")
    @PreAuthorize("hasAnyRole('MANAGEMENT', 'TEACHER')")
    public ResponseEntity<SchoolGallery> createGalleryItem(@RequestBody SchoolGallery item) {
        return ResponseEntity.ok(schoolGalleryRepository.save(item));
    }

    // ================= PTM APPOINTMENTS MODULE =================
    @GetMapping("/ptm")
    public ResponseEntity<List<PtmAppointment>> getPtmAppointments(
            @RequestParam(required = false) Long studentId,
            @RequestParam(required = false) Long teacherId) {
        if (studentId != null) {
            Student s = studentRepository.findById(studentId)
                    .orElseGet(() -> studentRepository.findByUserId(studentId).orElse(null));
            Long resolvedStudentId = s != null ? s.getId() : studentId;
            return ResponseEntity.ok(ptmAppointmentRepository.findByStudentIdOrderByAppointmentDateDesc(resolvedStudentId));
        }
        if (teacherId != null) {
            Teacher t = teacherRepository.findById(teacherId)
                    .orElseGet(() -> teacherRepository.findByUserId(teacherId).orElse(null));
            Long resolvedTeacherId = t != null ? t.getId() : teacherId;
            return ResponseEntity.ok(ptmAppointmentRepository.findByTeacherIdOrderByAppointmentDateDesc(resolvedTeacherId));
        }
        return ResponseEntity.ok(ptmAppointmentRepository.findAllByOrderByAppointmentDateDesc());
    }

    @PostMapping("/ptm")
    public ResponseEntity<PtmAppointment> schedulePtm(
            @RequestBody SchedulePtmRequest req,
            @AuthenticationPrincipal User authUser) {
        Student student = null;
        if (authUser != null && authUser.getRole() == User.Role.STUDENT) {
            student = studentRepository.findByUserId(authUser.getId()).orElse(null);
        }
        if (student == null && req.getStudentId() != null) {
            student = studentRepository.findById(req.getStudentId())
                    .orElseGet(() -> studentRepository.findByUserId(req.getStudentId()).orElse(null));
        }
        if (req.getTeacherId() == null) {
            throw new IllegalArgumentException("Teacher ID is required to schedule a PTM appointment.");
        }
        Teacher teacher = teacherRepository.findById(req.getTeacherId()).orElse(null);

        if (student == null || teacher == null) {
            throw new IllegalArgumentException("Student or Teacher not found for PTM scheduling");
        }

        if (req.getAppointmentDate() == null || req.getAppointmentDate().isBlank()) {
            throw new IllegalArgumentException("Appointment date is required.");
        }
        if (req.getTimeSlot() == null || req.getTimeSlot().isBlank()) {
            throw new IllegalArgumentException("Time slot is required (e.g. '03:30 PM - 04:00 PM').");
        }

        LocalDate appointmentDate = LocalDate.parse(req.getAppointmentDate());
        if (appointmentDate.isBefore(LocalDate.now())) {
            throw new IllegalArgumentException("Cannot schedule a PTM appointment for a past date (" + appointmentDate + ").");
        }
        if (appointmentDate.isAfter(LocalDate.now().plusDays(180))) {
            throw new IllegalArgumentException("Cannot schedule a PTM appointment more than 180 days in advance.");
        }

        // Case Study: Double-Booking / Slot Clash Check
        boolean isTeacherBooked = ptmAppointmentRepository.existsByTeacherAndDateAndTimeSlotAndStatusIn(
                teacher.getId(), appointmentDate, req.getTimeSlot(),
                List.of(PtmAppointment.PtmStatus.SCHEDULED, PtmAppointment.PtmStatus.PENDING, PtmAppointment.PtmStatus.ACCEPTED)
        );
        if (isTeacherBooked) {
            throw new com.sms.exception.ScheduleConflictException(String.format(
                    "PTM Slot Conflict: Teacher %s already has a conference booked on %s at '%s'. Please select another time slot or teacher.",
                    teacher.getFullName(), appointmentDate, req.getTimeSlot()
            ));
        }

        PtmAppointment ptm = PtmAppointment.builder()
                .student(student)
                .teacher(teacher)
                .appointmentDate(appointmentDate)
                .timeSlot(req.getTimeSlot().trim())
                .notes(req.getNotes())
                .status(PtmAppointment.PtmStatus.SCHEDULED)
                .build();

        return ResponseEntity.ok(ptmAppointmentRepository.save(ptm));
    }

    @PutMapping("/ptm/{id}/status")
    @PreAuthorize("hasAnyRole('MANAGEMENT', 'TEACHER')")
    public ResponseEntity<PtmAppointment> updatePtmStatus(
            @PathVariable Long id,
            @RequestBody Map<String, String> body,
            @AuthenticationPrincipal User authUser) {
        PtmAppointment ptm = ptmAppointmentRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("PTM appointment not found"));

        if (authUser != null && authUser.getRole() == User.Role.TEACHER) {
            Teacher teacher = teacherRepository.findByUserId(authUser.getId()).orElse(null);
            if (teacher != null && ptm.getTeacher() != null && !ptm.getTeacher().getId().equals(teacher.getId())) {
                throw new org.springframework.security.access.AccessDeniedException("Access denied: You can only update your own PTM appointments.");
            }
        }

        String newStatus = body.get("status");
        if (newStatus != null) {
            ptm.setStatus(PtmAppointment.PtmStatus.valueOf(newStatus.toUpperCase()));
        }
        if (body.containsKey("adminRemarks")) {
            ptm.setAdminRemarks(body.get("adminRemarks"));
        }
        return ResponseEntity.ok(ptmAppointmentRepository.save(ptm));
    }

    @Data
    public static class SchedulePtmRequest {
        private Long studentId;
        private Long teacherId;
        private String appointmentDate;
        private String timeSlot;
        private String notes;
    }

    // ================= PTM TEACHERS DROPDOWN FOR STUDENTS =================
    @GetMapping("/ptm/teachers")
    public ResponseEntity<List<Map<String, Object>>> getPtmTeachers(
            @RequestParam(required = false) Long studentId,
            @org.springframework.security.core.annotation.AuthenticationPrincipal User user) {

        List<Map<String, Object>> resultList = new java.util.ArrayList<>();
        java.util.Set<Long> addedTeacherIds = new java.util.HashSet<>();

        // Resolve Principal first
        com.sms.model.cms.SchoolInfo info = schoolInfoRepository.findAll().stream().findFirst().orElse(null);
        String principalName = (info != null && info.getPrincipalName() != null && !info.getPrincipalName().isEmpty()) ?
                info.getPrincipalName() : "Dr. E. Vance";

        // Find or create synthetic Principal Teacher record if needed
        Teacher principalTeacher = teacherRepository.findAll().stream()
                .filter(t -> t.getFullName() != null && t.getFullName().toLowerCase().contains("principal"))
                .findFirst()
                .orElseGet(() -> teacherRepository.findAll().stream().findFirst().orElse(null));

        Long pId = principalTeacher != null ? principalTeacher.getId() : 1L;
        addedTeacherIds.add(pId);

        Map<String, Object> pMap = new java.util.HashMap<>();
        pMap.put("id", pId);
        pMap.put("fullName", principalName);
        pMap.put("subject", "Principal & Academic Director");
        pMap.put("roleLabel", "Principal");
        pMap.put("displayLabel", principalName + " - (Principal & Academic Director)");
        pMap.put("isPrincipal", true);
        pMap.put("isClassTeacher", false);
        resultList.add(pMap);

        // Resolve student
        Student student = null;
        if (studentId != null) {
            student = studentRepository.findById(studentId)
                    .orElseGet(() -> studentRepository.findByUserId(studentId).orElse(null));
        } else if (user != null) {
            student = studentRepository.findByUserId(user.getId()).orElse(null);
        }

        if (student != null && student.getSchoolClass() != null) {
            SchoolClass sClass = student.getSchoolClass();
            Teacher classTeacher = sClass.getClassTeacher();

            // Fetch subject teacher assignments for this student's class
            List<TeacherClassAssignment> assignments = teacherClassAssignmentRepository.findBySchoolClassId(sClass.getId());

            for (TeacherClassAssignment assign : assignments) {
                Teacher t = assign.getTeacher();
                if (t != null && !addedTeacherIds.contains(t.getId())) {
                    addedTeacherIds.add(t.getId());

                    boolean isCT = classTeacher != null && classTeacher.getId().equals(t.getId());
                    String subjName = assign.getSubject() != null ? assign.getSubject().getName() : "Subject Teacher";
                    String label = t.getFullName() + (isCT ? " - (Class Teacher - " + subjName + ")" : " - (" + subjName + ")");

                    Map<String, Object> tMap = new java.util.HashMap<>();
                    tMap.put("id", t.getId());
                    tMap.put("fullName", t.getFullName());
                    tMap.put("subject", subjName);
                    tMap.put("roleLabel", isCT ? "Class Teacher" : "Subject Teacher");
                    tMap.put("displayLabel", label);
                    tMap.put("isPrincipal", false);
                    tMap.put("isClassTeacher", isCT);

                    if (isCT) {
                        resultList.add(1, tMap);
                    } else {
                        resultList.add(tMap);
                    }
                }
            }

            // If Class Teacher was not in assignments list, add them explicitly
            if (classTeacher != null && !addedTeacherIds.contains(classTeacher.getId())) {
                addedTeacherIds.add(classTeacher.getId());
                Map<String, Object> ctMap = new java.util.HashMap<>();
                ctMap.put("id", classTeacher.getId());
                ctMap.put("fullName", classTeacher.getFullName());
                ctMap.put("subject", "Class Teacher");
                ctMap.put("roleLabel", "Class Teacher");
                ctMap.put("displayLabel", classTeacher.getFullName() + " - (Class Teacher)");
                ctMap.put("isPrincipal", false);
                ctMap.put("isClassTeacher", true);
                resultList.add(1, ctMap);
            }
        }

        // Fallback: If no class assignments exist yet, include all active teachers
        List<Teacher> allTeachers = teacherRepository.findAll();
        for (Teacher t : allTeachers) {
            if (!addedTeacherIds.contains(t.getId())) {
                addedTeacherIds.add(t.getId());
                Map<String, Object> tMap = new java.util.HashMap<>();
                tMap.put("id", t.getId());
                tMap.put("fullName", t.getFullName());
                tMap.put("subject", t.getQualification() != null ? t.getQualification() : "Faculty");
                tMap.put("roleLabel", "Subject Faculty");
                tMap.put("displayLabel", t.getFullName() + " — (" + (t.getQualification() != null ? t.getQualification() : "Faculty Teacher") + ")");
                tMap.put("isPrincipal", false);
                tMap.put("isClassTeacher", false);
                resultList.add(tMap);
            }
        }

        return ResponseEntity.ok(resultList);
    }

    // ================= SCHOOL EVENTS MODULE =================
    @GetMapping("/events")
    public ResponseEntity<List<SchoolEvent>> getEvents() {
        return ResponseEntity.ok(schoolEventRepository.findAllByOrderByEventDateAsc());
    }

    @PostMapping("/events")
    @PreAuthorize("hasAnyRole('MANAGEMENT', 'TEACHER')")
    public ResponseEntity<SchoolEvent> createEvent(@RequestBody SchoolEvent event) {
        return ResponseEntity.ok(schoolEventRepository.save(event));
    }

    // ================= LEAVE MANAGEMENT MODULE =================
    @GetMapping("/leaves")
    public ResponseEntity<List<LeaveRequest>> getLeaves(
            @RequestParam(required = false) Long studentId,
            @AuthenticationPrincipal User authUser) {
        if (authUser != null && authUser.getRole() == User.Role.STUDENT) {
            Student s = studentRepository.findByUserId(authUser.getId()).orElse(null);
            if (s != null) {
                return ResponseEntity.ok(leaveRequestRepository.findByStudentIdOrderByAppliedDateDesc(s.getId()));
            }
        }
        if (studentId != null) {
            return ResponseEntity.ok(leaveRequestRepository.findByStudentIdOrderByAppliedDateDesc(studentId));
        }
        return ResponseEntity.ok(leaveRequestRepository.findAllByOrderByAppliedDateDesc());
    }

    @PostMapping("/leaves")
    public ResponseEntity<LeaveRequest> applyLeave(
            @RequestBody ApplyLeaveRequest req,
            @AuthenticationPrincipal User authUser) {
        Student student = null;
        if (authUser != null && authUser.getRole() == User.Role.STUDENT) {
            student = studentRepository.findByUserId(authUser.getId()).orElse(null);
        }
        if (student == null && req.getStudentId() != null) {
            student = studentRepository.findById(req.getStudentId())
                    .orElseGet(() -> studentRepository.findByUserId(req.getStudentId()).orElse(null));
        }
        if (student == null) {
            throw new IllegalArgumentException("Student record not found for " + req.getStudentId());
        }

        if (req.getStartDate() == null || req.getStartDate().isBlank()) {
            throw new IllegalArgumentException("Leave start date is required.");
        }
        if (req.getEndDate() == null || req.getEndDate().isBlank()) {
            throw new IllegalArgumentException("Leave end date is required.");
        }
        if (req.getReason() == null || req.getReason().trim().isEmpty()) {
            throw new IllegalArgumentException("Reason is required for applying leave.");
        }

        LocalDate startDate = LocalDate.parse(req.getStartDate());
        LocalDate endDate = LocalDate.parse(req.getEndDate());

        // Case Study: Inverted Date Range Guard
        if (endDate.isBefore(startDate)) {
            throw new IllegalArgumentException(String.format(
                    "Invalid date range: End date (%s) cannot be earlier than start date (%s).", endDate, startDate
            ));
        }
        if (startDate.isBefore(LocalDate.now().minusDays(90))) {
            throw new IllegalArgumentException("Leave start date cannot be older than 90 days in the past. Outside permitted range.");
        }
        if (startDate.isAfter(LocalDate.now().plusYears(1))) {
            throw new IllegalArgumentException("Leave start date cannot be more than 1 year in the future. Outside permitted range.");
        }
        long daysBetween = java.time.temporal.ChronoUnit.DAYS.between(startDate, endDate) + 1;
        if (daysBetween > 90) {
            throw new IllegalArgumentException("Leave duration (" + daysBetween + " days) exceeds maximum permitted limit of 90 days.");
        }

        // Case Study: Overlapping Active Leave Requests
        boolean hasOverlap = leaveRequestRepository.existsOverlappingLeave(
                student.getId(), startDate, endDate,
                List.of(LeaveRequest.LeaveStatus.PENDING, LeaveRequest.LeaveStatus.APPROVED)
        );
        if (hasOverlap) {
            throw new IllegalArgumentException(String.format(
                    "Leave Conflict: An active or approved leave application already overlaps with %s to %s for %s.",
                    startDate, endDate, student.getFullName()
            ));
        }

        LeaveRequest leave = LeaveRequest.builder()
                .student(student)
                .startDate(startDate)
                .endDate(endDate)
                .reason(req.getReason().trim())
                .status(LeaveRequest.LeaveStatus.PENDING)
                .build();

        return ResponseEntity.ok(leaveRequestRepository.save(leave));
    }

    @PutMapping("/leaves/{id}/status")
    @PreAuthorize("hasAnyRole('MANAGEMENT', 'TEACHER')")
    public ResponseEntity<LeaveRequest> updateLeaveStatus(
            @PathVariable Long id,
            @RequestBody Map<String, String> body,
            @AuthenticationPrincipal User authUser) {
        LeaveRequest leave = leaveRequestRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Leave request not found"));

        if (authUser != null && authUser.getRole() == User.Role.TEACHER) {
            Teacher teacher = teacherRepository.findByUserId(authUser.getId()).orElse(null);
            if (teacher != null && leave.getStudent() != null && leave.getStudent().getSchoolClass() != null) {
                Long classId = leave.getStudent().getSchoolClass().getId();
                boolean isAssigned = teacherClassAssignmentRepository.existsByTeacherIdAndSchoolClassId(teacher.getId(), classId);
                boolean isClassTeacher = leave.getStudent().getSchoolClass().getClassTeacher() != null
                        && leave.getStudent().getSchoolClass().getClassTeacher().getId().equals(teacher.getId());
                if (!isAssigned && !isClassTeacher) {
                    throw new org.springframework.security.access.AccessDeniedException("Access denied: You can only approve/reject leaves for students in your assigned classes.");
                }
            }
        }

        String newStatus = body.get("status");
        if (newStatus != null) {
            leave.setStatus(LeaveRequest.LeaveStatus.valueOf(newStatus.toUpperCase()));
        }
        if (body.containsKey("adminRemarks")) {
            leave.setAdminRemarks(body.get("adminRemarks"));
        }
        return ResponseEntity.ok(leaveRequestRepository.save(leave));
    }

    // ================= PAYROLL MODULE =================
    @GetMapping("/payroll")
    @PreAuthorize("hasRole('MANAGEMENT')")
    public ResponseEntity<List<TeacherSalary>> getAllSalaries(@RequestParam(required = false) String monthYear) {
        if (monthYear != null && !monthYear.isEmpty()) {
            return ResponseEntity.ok(teacherSalaryRepository.findByMonthYear(monthYear));
        }
        return ResponseEntity.ok(teacherSalaryRepository.findAll());
    }

    @PostMapping("/payroll")
    @PreAuthorize("hasRole('MANAGEMENT')")
    public ResponseEntity<TeacherSalary> processSalary(@RequestBody CreateSalaryRequest req) {
        Teacher teacher = teacherRepository.findById(req.getTeacherId())
                .orElseThrow(() -> new RuntimeException("Teacher not found"));

        if (req.getBasicSalary() == null || req.getBasicSalary().compareTo(BigDecimal.ZERO) < 0 || req.getBasicSalary().compareTo(new BigDecimal("10000000")) > 0) {
            throw new IllegalArgumentException("Basic salary must be in the permitted range [0, 10,000,000]. Provided: " + req.getBasicSalary());
        }
        BigDecimal allowances = req.getAllowances() != null ? req.getAllowances() : BigDecimal.ZERO;
        BigDecimal deductions = req.getDeductions() != null ? req.getDeductions() : BigDecimal.ZERO;
        if (allowances.compareTo(BigDecimal.ZERO) < 0 || allowances.compareTo(new BigDecimal("10000000")) > 0) {
            throw new IllegalArgumentException("Allowances must be in the permitted range [0, 10,000,000]. Provided: " + allowances);
        }
        if (deductions.compareTo(BigDecimal.ZERO) < 0 || deductions.compareTo(req.getBasicSalary().add(allowances)) > 0) {
            throw new IllegalArgumentException("Deductions must be in the permitted range [0, Total Gross Salary]. Provided: " + deductions);
        }

        TeacherSalary salary = TeacherSalary.builder()
                .teacher(teacher)
                .monthYear(req.getMonthYear())
                .basicSalary(req.getBasicSalary())
                .allowances(allowances)
                .deductions(deductions)
                .status(req.getStatus() != null ? TeacherSalary.SalaryStatus.valueOf(req.getStatus().toUpperCase()) : TeacherSalary.SalaryStatus.PAID)
                .paymentDate(LocalDate.now())
                .build();

        return ResponseEntity.ok(teacherSalaryRepository.save(salary));
    }

    // ================= TRANSPORT MODULE (REAL-WORLD HARDWARE GPS & TRIP DISPATCH) =================
    @GetMapping("/transport")
    public ResponseEntity<List<Map<String, Object>>> getAllRoutes() {
        List<TransportRoute> routes = transportRouteRepository.findAll();
        List<Map<String, Object>> result = new ArrayList<>();
        for (TransportRoute r : routes) {
            Map<String, Object> map = new HashMap<>();
            map.put("id", r.getId());
            map.put("routeName", r.getRouteName());
            map.put("busNumber", r.getBusNumber());
            map.put("plateNumber", r.getPlateNumber());
            map.put("hardwareDeviceId", r.getHardwareDeviceId() != null ? r.getHardwareDeviceId() : "GPS-APEX-0" + r.getId());
            map.put("isIgnitionOn", Boolean.TRUE.equals(r.getIsIgnitionOn()));
            map.put("tripStatus", r.getTripStatus() != null ? r.getTripStatus() : "IDLE_AT_CAMPUS");
            map.put("tripStartTime", r.getTripStartTime());
            map.put("sourceName", r.getSourceName() != null ? r.getSourceName() : "Apex International Main Quadrangle");
            map.put("destinationName", r.getDestinationName() != null ? r.getDestinationName() : "Campus Depot");
            map.put("operatorUsername", r.getOperatorUsername());
            map.put("driverName", r.getDriverName());
            map.put("driverPhone", r.getDriverPhone());
            map.put("driverLicense", r.getDriverLicense());
            map.put("conductorName", r.getConductorName());
            map.put("conductorPhone", r.getConductorPhone());
            map.put("monthlyFee", r.getMonthlyFee());
            map.put("capacity", r.getCapacity());
            map.put("currentStatus", r.getCurrentStatus() != null ? r.getCurrentStatus() : "IN_TRANSIT");
            map.put("currentSpeedKmh", r.getCurrentSpeedKmh() != null ? r.getCurrentSpeedKmh() : 40);
            map.put("fuelLevelPercent", r.getFuelLevelPercent() != null ? r.getFuelLevelPercent() : 85);
            map.put("currentLat", r.getCurrentLat());
            map.put("currentLng", r.getCurrentLng());
            map.put("heading", r.getHeading() != null ? r.getHeading() : 0.0);
            map.put("gpsAccuracyMeters", r.getGpsAccuracyMeters() != null ? r.getGpsAccuracyMeters() : 5.0);
            map.put("isBroadcasting", Boolean.TRUE.equals(r.getIsBroadcasting()));
            map.put("lastGpsTimestamp", r.getLastGpsTimestamp());
            map.put("nextStop", r.getNextStop());
            map.put("nextStopEtaMinutes", r.getNextStopEtaMinutes());
            map.put("morningDepartureTime", r.getMorningDepartureTime());
            map.put("morningArrivalTime", r.getMorningArrivalTime());
            map.put("eveningDepartureTime", r.getEveningDepartureTime());
            map.put("eveningArrivalTime", r.getEveningArrivalTime());
            map.put("stopsJson", r.getStopsJson());
            map.put("emergencyStatus", r.getEmergencyStatus() != null ? r.getEmergencyStatus() : "NORMAL");
            map.put("sosAlertMessage", r.getSosAlertMessage());

            long assignedCount = studentRepository.countByTransportRouteId(r.getId());
            map.put("assignedStudentsCount", assignedCount);
            result.add(map);
        }
        return ResponseEntity.ok(result);
    }

    @GetMapping("/transport/{id}")
    public ResponseEntity<?> getRouteDetails(@PathVariable Long id) {
        TransportRoute route = transportRouteRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Transport route not found: " + id));
        List<Student> students = studentRepository.findByTransportRouteId(id);
        List<TransportBoardingLog> boardingLogs = transportBoardingLogRepository.findByRouteIdOrderByScannedAtDesc(id);
        List<TransportNotification> notifications = transportNotificationRepository.findTop50ByRouteIdOrderByCreatedAtDesc(id);

        Map<String, Object> resp = new HashMap<>();
        resp.put("route", route);
        resp.put("assignedStudentsCount", students.size());
        resp.put("students", students.stream().map(s -> {
            Map<String, Object> sm = new HashMap<>();
            sm.put("id", s.getId());
            sm.put("fullName", s.getFullName());
            sm.put("admissionNumber", s.getAdmissionNumber());
            sm.put("className", s.getSchoolClass() != null ? s.getSchoolClass().getName() + " " + s.getSchoolClass().getSection() : "N/A");
            sm.put("busStop", s.getBusStop());
            return sm;
        }).collect(Collectors.toList()));
        resp.put("recentBoardingLogs", boardingLogs.stream().limit(20).collect(Collectors.toList()));
        resp.put("notifications", notifications.stream().limit(15).collect(Collectors.toList()));
        return ResponseEntity.ok(resp);
    }

    @PostMapping("/transport")
    @PreAuthorize("hasRole('MANAGEMENT')")
    public ResponseEntity<TransportRoute> createRoute(@RequestBody TransportRoute route) {
        if (route.getCapacity() != null && (route.getCapacity() < 1 || route.getCapacity() > 150)) {
            throw new IllegalArgumentException("Vehicle seating capacity must be in the permitted range [1, 150]. Provided: " + route.getCapacity());
        }
        if (route.getMonthlyFee() != null && (route.getMonthlyFee().compareTo(BigDecimal.ZERO) < 0 || route.getMonthlyFee().compareTo(new BigDecimal("100000")) > 0)) {
            throw new IllegalArgumentException("Transport monthly fee must be in the permitted range [0, 100,000]. Provided: " + route.getMonthlyFee());
        }
        if (route.getCurrentStatus() == null) route.setCurrentStatus("IN_TRANSIT");
        if (route.getEmergencyStatus() == null) route.setEmergencyStatus("NORMAL");
        if (route.getCurrentSpeedKmh() == null) route.setCurrentSpeedKmh(40);
        if (route.getFuelLevelPercent() == null) route.setFuelLevelPercent(85);
        if (route.getHeading() == null) route.setHeading(0.0);
        if (route.getGpsAccuracyMeters() == null) route.setGpsAccuracyMeters(5.0);
        if (route.getIsBroadcasting() == null) route.setIsBroadcasting(false);
        if (route.getIsIgnitionOn() == null) route.setIsIgnitionOn(false);
        if (route.getTripStatus() == null) route.setTripStatus("IDLE_AT_CAMPUS");
        if (route.getHardwareDeviceId() == null) route.setHardwareDeviceId("GPS-APEX-" + (System.currentTimeMillis() % 1000));
        return ResponseEntity.ok(transportRouteRepository.save(route));
    }

    @PutMapping("/transport/{id}")
    @PreAuthorize("hasRole('MANAGEMENT')")
    public ResponseEntity<TransportRoute> updateRoute(@PathVariable Long id, @RequestBody TransportRoute req) {
        TransportRoute route = transportRouteRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Transport route not found: " + id));
        if (req.getRouteName() != null) route.setRouteName(req.getRouteName());
        if (req.getBusNumber() != null) route.setBusNumber(req.getBusNumber());
        if (req.getPlateNumber() != null) route.setPlateNumber(req.getPlateNumber());
        if (req.getHardwareDeviceId() != null) route.setHardwareDeviceId(req.getHardwareDeviceId());
        if (req.getDriverName() != null) route.setDriverName(req.getDriverName());
        if (req.getDriverPhone() != null) route.setDriverPhone(req.getDriverPhone());
        if (req.getDriverLicense() != null) route.setDriverLicense(req.getDriverLicense());
        if (req.getConductorName() != null) route.setConductorName(req.getConductorName());
        if (req.getConductorPhone() != null) route.setConductorPhone(req.getConductorPhone());
        if (req.getMonthlyFee() != null) {
            if (req.getMonthlyFee().compareTo(BigDecimal.ZERO) < 0 || req.getMonthlyFee().compareTo(new BigDecimal("100000")) > 0) {
                throw new IllegalArgumentException("Transport monthly fee must be in the permitted range [0, 100,000]. Provided: " + req.getMonthlyFee());
            }
            route.setMonthlyFee(req.getMonthlyFee());
        }
        if (req.getCapacity() != null) {
            if (req.getCapacity() < 1 || req.getCapacity() > 150) {
                throw new IllegalArgumentException("Vehicle seating capacity must be in the permitted range [1, 150]. Provided: " + req.getCapacity());
            }
            route.setCapacity(req.getCapacity());
        }
        if (req.getSourceName() != null) route.setSourceName(req.getSourceName());
        if (req.getDestinationName() != null) route.setDestinationName(req.getDestinationName());
        if (req.getStopsJson() != null) route.setStopsJson(req.getStopsJson());
        if (req.getCurrentLat() != null) route.setCurrentLat(req.getCurrentLat());
        if (req.getCurrentLng() != null) route.setCurrentLng(req.getCurrentLng());
        if (req.getMorningDepartureTime() != null) route.setMorningDepartureTime(req.getMorningDepartureTime());
        if (req.getMorningArrivalTime() != null) route.setMorningArrivalTime(req.getMorningArrivalTime());
        if (req.getEveningDepartureTime() != null) route.setEveningDepartureTime(req.getEveningDepartureTime());
        if (req.getEveningArrivalTime() != null) route.setEveningArrivalTime(req.getEveningArrivalTime());
        return ResponseEntity.ok(transportRouteRepository.save(route));
    }

    @DeleteMapping("/transport/{id}")
    @PreAuthorize("hasRole('MANAGEMENT')")
    @Transactional
    public ResponseEntity<?> deleteRoute(@PathVariable Long id) {
        TransportRoute route = transportRouteRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Transport route not found: " + id));
        List<Student> students = studentRepository.findByTransportRouteId(id);
        for (Student s : students) {
            s.setTransportRoute(null);
            s.setBusStop(null);
            studentRepository.save(s);
        }
        transportGpsLogRepository.deleteByRouteId(id);
        transportBoardingLogRepository.deleteByRouteId(id);
        transportNotificationRepository.deleteByRouteId(id);
        transportRouteRepository.delete(route);
        return ResponseEntity.ok(Map.of("success", true, "message", "Route deleted successfully"));
    }

    /**
     * Start Trip at School:
     * Turns on hardware GPS tracker, sets ignition ON, and automatically broadcasts
     * trip departure notification to all assigned students.
     */
    @PostMapping("/transport/{id}/trip/start")
    public ResponseEntity<?> startTripAtSchool(@PathVariable Long id, @RequestBody(required = false) Map<String, Object> req) {
        TransportRoute route = transportRouteRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Transport route not found: " + id));

        String timeNow = java.time.LocalDateTime.now().format(java.time.format.DateTimeFormatter.ofPattern("hh:mm a"));
        route.setIsIgnitionOn(true);
        route.setIsBroadcasting(true);
        route.setTripStatus("TRIP_STARTED");
        route.setCurrentStatus("IN_TRANSIT");
        route.setTripStartTime(timeNow);
        route.setLastGpsTimestamp(java.time.Instant.now().toString());

        TransportRoute saved = transportRouteRepository.save(route);

        // 1. Broadcast trip start notification to all assigned students
        List<Student> assignedStudents = studentRepository.findByTransportRouteId(id);
        List<TransportNotification> newNotifications = new ArrayList<>();

        for (Student s : assignedStudents) {
            TransportNotification notif = TransportNotification.builder()
                    .routeId(id)
                    .studentId(s.getId())
                    .notificationType("TRIP_STARTED_AT_SCHOOL")
                    .title("🚌 School Bus Started at Campus (" + route.getBusNumber() + ")")
                    .message("Bus " + route.getBusNumber() + " (" + route.getRouteName() + ") has started its trip at school (" + timeNow + "). Please get ready at your boarding stop: " + (s.getBusStop() != null ? s.getBusStop() : "Designated Stop") + ".")
                    .stopName(s.getBusStop())
                    .createdAt(java.time.LocalDateTime.now())
                    .build();
            newNotifications.add(notif);
        }

        // Also create a route-wide broadcast notification
        TransportNotification broadcastNotif = TransportNotification.builder()
                .routeId(id)
                .studentId(null)
                .notificationType("TRIP_STARTED_AT_SCHOOL")
                .title("🚌 Fleet Departure: " + route.getBusNumber() + " Started at School")
                .message("Bus " + route.getBusNumber() + " departed from Apex Academy Campus depot at " + timeNow + ".")
                .createdAt(java.time.LocalDateTime.now())
                .build();
        newNotifications.add(broadcastNotif);

        transportNotificationRepository.saveAll(newNotifications);

        return ResponseEntity.ok(Map.of(
                "success", true,
                "route", saved,
                "message", "Trip started at school. Notifications sent to " + assignedStudents.size() + " scholars.",
                "notificationsCount", newNotifications.size()
        ));
    }

    /**
     * Complete / End Trip
     */
    @PostMapping("/transport/{id}/trip/end")
    public ResponseEntity<?> endTrip(@PathVariable Long id) {
        TransportRoute route = transportRouteRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Transport route not found: " + id));

        route.setIsIgnitionOn(false);
        route.setIsBroadcasting(false);
        route.setTripStatus("TRIP_COMPLETED");
        route.setCurrentStatus("AT_CAMPUS");
        route.setCurrentSpeedKmh(0);
        route.setLastGpsTimestamp(java.time.Instant.now().toString());

        TransportRoute saved = transportRouteRepository.save(route);

        TransportNotification endNotif = TransportNotification.builder()
                .routeId(id)
                .studentId(null)
                .notificationType("TRIP_COMPLETED")
                .title("🏁 Trip Completed: " + route.getBusNumber())
                .message("Bus " + route.getBusNumber() + " has completed its scheduled route and parked safely at campus depot.")
                .createdAt(java.time.LocalDateTime.now())
                .build();
        transportNotificationRepository.save(endNotif);

        return ResponseEntity.ok(Map.of(
                "success", true,
                "route", saved,
                "message", "Trip completed successfully. On-bus GPS tracker set to standby."
        ));
    }

    /**
     * Real-World Hardware GPS Ingestion & Intelligent 10-Minute Proximity Notification Engine.
     * Receives continuous telemetry from on-bus hardware GPS trackers (OBD-II / IoT / Teltonika / Traccar).
     */
    @PostMapping("/transport/{id}/gps-stream")
    public ResponseEntity<?> streamGpsLocation(@PathVariable Long id, @RequestBody Map<String, Object> req) {
        TransportRoute route = transportRouteRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Transport route not found: " + id));

        Double lat = req.containsKey("latitude") ? ((Number) req.get("latitude")).doubleValue() : route.getCurrentLat();
        Double lng = req.containsKey("longitude") ? ((Number) req.get("longitude")).doubleValue() : route.getCurrentLng();
        Integer speed = req.containsKey("speedKmh") ? ((Number) req.get("speedKmh")).intValue() : (route.getCurrentSpeedKmh() != null ? route.getCurrentSpeedKmh() : 0);
        Double heading = req.containsKey("heading") && req.get("heading") != null ? ((Number) req.get("heading")).doubleValue() : 0.0;
        Double accuracy = req.containsKey("accuracyMeters") && req.get("accuracyMeters") != null ? ((Number) req.get("accuracyMeters")).doubleValue() : 5.0;
        Boolean ignition = req.containsKey("ignition") ? (Boolean) req.get("ignition") : true;
        Integer fuel = req.containsKey("fuelLevelPercent") ? ((Number) req.get("fuelLevelPercent")).intValue() : route.getFuelLevelPercent();
        String source = req.containsKey("source") ? (String) req.get("source") : "ON_BUS_HARDWARE_TRACKER";

        if (lat != null && (lat < -90.0 || lat > 90.0)) {
            throw new IllegalArgumentException("GPS Latitude must be in the permitted range [-90.0, +90.0]. Provided: " + lat);
        }
        if (lng != null && (lng < -180.0 || lng > 180.0)) {
            throw new IllegalArgumentException("GPS Longitude must be in the permitted range [-180.0, +180.0]. Provided: " + lng);
        }
        if (speed != null && (speed < 0 || speed > 180)) {
            throw new IllegalArgumentException("Vehicle speed must be in the permitted range [0, 180 km/h]. Provided: " + speed);
        }
        if (fuel != null && (fuel < 0 || fuel > 100)) {
            throw new IllegalArgumentException("Fuel percentage must be in the permitted range [0%, 100%]. Provided: " + fuel);
        }

        route.setCurrentLat(lat);
        route.setCurrentLng(lng);
        route.setCurrentSpeedKmh(speed);
        route.setHeading(heading);
        route.setGpsAccuracyMeters(accuracy);
        route.setFuelLevelPercent(fuel);
        route.setIsIgnitionOn(ignition);
        route.setIsBroadcasting(ignition);
        route.setLastGpsTimestamp(java.time.Instant.now().toString());

        if (Boolean.TRUE.equals(ignition) && "IDLE_AT_CAMPUS".equals(route.getTripStatus())) {
            route.setTripStatus("IN_TRANSIT");
            route.setCurrentStatus("IN_TRANSIT");
        } else if (Boolean.FALSE.equals(ignition)) {
            route.setCurrentSpeedKmh(0);
        }

        List<TransportNotification> triggeredAlerts = new ArrayList<>();

        // Intelligent Geofencing & 10-Minute Proximity Alert Detection
        try {
            if (route.getStopsJson() != null && !route.getStopsJson().isBlank() && lat != null && lng != null) {
                com.fasterxml.jackson.databind.ObjectMapper mapper = new com.fasterxml.jackson.databind.ObjectMapper();
                List<Map<String, Object>> stops = mapper.readValue(route.getStopsJson(), new com.fasterxml.jackson.core.type.TypeReference<List<Map<String, Object>>>() {});

                double minDistanceMeters = Double.MAX_VALUE;
                String closestStopName = null;
                String nextStopName = null;
                double nextStopDistMeters = Double.MAX_VALUE;

                // Map stop name to stop coordinates
                Map<String, double[]> stopCoords = new HashMap<>();

                for (Map<String, Object> stop : stops) {
                    if (stop.containsKey("lat") && stop.containsKey("lng") && stop.containsKey("name")) {
                        double sLat = ((Number) stop.get("lat")).doubleValue();
                        double sLng = ((Number) stop.get("lng")).doubleValue();
                        String name = (String) stop.get("name");
                        stopCoords.put(name.toLowerCase().trim(), new double[]{sLat, sLng});

                        double d = calculateHaversineMeters(lat, lng, sLat, sLng);
                        if (d < minDistanceMeters) {
                            minDistanceMeters = d;
                            closestStopName = name;
                        }
                        if (d > 80 && d < nextStopDistMeters) {
                            nextStopDistMeters = d;
                            nextStopName = name;
                        }
                    }
                }

                if (minDistanceMeters <= 100 && closestStopName != null) {
                    route.setCurrentStatus("AT_STOP: " + closestStopName);
                    route.setNextStop(nextStopName != null ? nextStopName : closestStopName);
                    route.setNextStopEtaMinutes(0);
                } else if (nextStopName != null) {
                    route.setCurrentStatus("IN_TRANSIT");
                    route.setNextStop(nextStopName);
                    int speedVal = speed > 5 ? speed : 25;
                    int etaMin = Math.max(1, (int) Math.round((nextStopDistMeters / 1000.0) / speedVal * 60.0));
                    route.setNextStopEtaMinutes(etaMin);
                }

                // Check 10-Minute Proximity for each student assigned to this route
                List<Student> assignedStudents = studentRepository.findByTransportRouteId(id);
                java.time.LocalDateTime twentyMinutesAgo = java.time.LocalDateTime.now().minusMinutes(20);

                for (Student student : assignedStudents) {
                    if (student.getBusStop() != null) {
                        String stopKey = student.getBusStop().toLowerCase().trim();
                        double[] coords = stopCoords.get(stopKey);
                        if (coords != null) {
                            double distToStudentStop = calculateHaversineMeters(lat, lng, coords[0], coords[1]);
                            int effectiveSpeed = speed > 5 ? speed : 25;
                            double etaToStudentStopMin = (distToStudentStop / 1000.0) / effectiveSpeed * 60.0;

                            // 10-Minute Proximity Trigger
                            if (etaToStudentStopMin <= 10.0 && distToStudentStop > 100.0) {
                                // Check if alert already sent recently to avoid spam
                                List<TransportNotification> recent = transportNotificationRepository.findByRouteIdAndNotificationTypeAndCreatedAtAfter(id, "PROXIMITY_10_MIN_AWAY", twentyMinutesAgo);
                                boolean alreadyAlerted = recent.stream().anyMatch(n -> student.getId().equals(n.getStudentId()));

                                if (!alreadyAlerted) {
                                    TransportNotification notif = TransportNotification.builder()
                                            .routeId(id)
                                            .studentId(student.getId())
                                            .notificationType("PROXIMITY_10_MIN_AWAY")
                                            .title("🔔 Bus 10 Mins Away: " + route.getBusNumber())
                                            .message("Your bus " + route.getBusNumber() + " is approx 10 minutes away (" + Math.round(distToStudentStop) + "m) from your boarding stop (" + student.getBusStop() + "). Please head to your boarding point!")
                                            .stopName(student.getBusStop())
                                            .etaMinutes((int) Math.round(etaToStudentStopMin))
                                            .createdAt(java.time.LocalDateTime.now())
                                            .build();
                                    triggeredAlerts.add(notif);
                                }
                            } else if (distToStudentStop <= 100.0) {
                                // Arrival at student's boarding point trigger
                                List<TransportNotification> recent = transportNotificationRepository.findByRouteIdAndNotificationTypeAndCreatedAtAfter(id, "AT_BOARDING_STOP", twentyMinutesAgo);
                                boolean alreadyAlerted = recent.stream().anyMatch(n -> student.getId().equals(n.getStudentId()));

                                if (!alreadyAlerted) {
                                    TransportNotification notif = TransportNotification.builder()
                                            .routeId(id)
                                            .studentId(student.getId())
                                            .notificationType("AT_BOARDING_STOP")
                                            .title("🛑 Bus Arrived at Your Stop: " + student.getBusStop())
                                            .message("Bus " + route.getBusNumber() + " has arrived at " + student.getBusStop() + ". Boarding in progress.")
                                            .stopName(student.getBusStop())
                                            .etaMinutes(0)
                                            .createdAt(java.time.LocalDateTime.now())
                                            .build();
                                    triggeredAlerts.add(notif);
                                }
                            }
                        }
                    }
                }

                if (!triggeredAlerts.isEmpty()) {
                    transportNotificationRepository.saveAll(triggeredAlerts);
                }
            }
        } catch (Exception ignored) {}

        TransportRoute savedRoute = transportRouteRepository.save(route);

        // Store breadcrumb log
        if (lat != null && lng != null) {
            TransportGpsLog log = TransportGpsLog.builder()
                    .routeId(id)
                    .latitude(lat)
                    .longitude(lng)
                    .speedKmh(speed)
                    .headingDegrees(heading)
                    .accuracyMeters(accuracy)
                    .source(source)
                    .recordedAt(java.time.LocalDateTime.now())
                    .build();
            transportGpsLogRepository.save(log);
        }

        return ResponseEntity.ok(Map.of(
                "success", true,
                "route", savedRoute,
                "ignition", route.getIsIgnitionOn(),
                "tripStatus", route.getTripStatus(),
                "triggeredAlertsCount", triggeredAlerts.size(),
                "timestamp", route.getLastGpsTimestamp()
        ));
    }

    /**
     * Hardware IoT Tracker Ingestion by Device ID / IMEI
     */
    @PostMapping("/transport/hardware-gps-stream")
    public ResponseEntity<?> streamHardwareGpsByDeviceId(@RequestBody Map<String, Object> req) {
        String deviceId = (String) req.get("deviceId");
        if (deviceId == null && req.containsKey("imei")) deviceId = (String) req.get("imei");

        List<TransportRoute> routes = transportRouteRepository.findAll();
        TransportRoute target = null;
        for (TransportRoute r : routes) {
            if (deviceId != null && deviceId.equalsIgnoreCase(r.getHardwareDeviceId())) {
                target = r;
                break;
            }
        }

        if (target == null && !routes.isEmpty()) {
            target = routes.get(0);
        }

        if (target == null) {
            return ResponseEntity.badRequest().body(Map.of("message", "No route found for device ID: " + deviceId));
        }

        return streamGpsLocation(target.getId(), req);
    }

    @GetMapping("/transport/{id}/gps-history")
    public ResponseEntity<List<TransportGpsLog>> getGpsHistory(@PathVariable Long id) {
        List<TransportGpsLog> logs = transportGpsLogRepository.findTop100ByRouteIdOrderByRecordedAtDesc(id);
        return ResponseEntity.ok(logs);
    }

    @PostMapping("/transport/{id}/board-passenger")
    public ResponseEntity<?> recordBoarding(@PathVariable Long id, @RequestBody Map<String, Object> req) {
        Long studentId = ((Number) req.get("studentId")).longValue();
        String studentName = (String) req.get("studentName");
        String actionType = req.containsKey("actionType") ? (String) req.get("actionType") : "BOARDED_PICKUP";
        String stopName = (String) req.get("stopName");
        Double lat = req.containsKey("latitude") ? ((Number) req.get("latitude")).doubleValue() : null;
        Double lng = req.containsKey("longitude") ? ((Number) req.get("longitude")).doubleValue() : null;
        String scannedBy = req.containsKey("scannedBy") ? (String) req.get("scannedBy") : "BUS_HARDWARE_SCANNER";

        if (studentName == null) {
            Student s = studentRepository.findById(studentId).orElse(null);
            if (s != null) studentName = s.getFullName();
        }

        TransportBoardingLog log = TransportBoardingLog.builder()
                .routeId(id)
                .studentId(studentId)
                .studentName(studentName != null ? studentName : "Student #" + studentId)
                .actionType(actionType)
                .stopName(stopName)
                .latitude(lat)
                .longitude(lng)
                .scannedBy(scannedBy)
                .scannedAt(java.time.LocalDateTime.now())
                .build();

        TransportBoardingLog saved = transportBoardingLogRepository.save(log);
        return ResponseEntity.ok(Map.of("success", true, "boardingRecord", saved));
    }

    @GetMapping("/transport/{id}/boarding-logs")
    public ResponseEntity<List<TransportBoardingLog>> getBoardingLogs(@PathVariable Long id) {
        return ResponseEntity.ok(transportBoardingLogRepository.findByRouteIdOrderByScannedAtDesc(id));
    }

    @GetMapping("/transport/my-notifications")
    public ResponseEntity<?> getMyTransportNotifications(@AuthenticationPrincipal User authUser) {
        if (authUser == null) return ResponseEntity.badRequest().body(Map.of("message", "Not authenticated"));

        Student student = studentRepository.findByUserId(authUser.getId()).orElse(null);
        if (student == null || student.getTransportRoute() == null) {
            return ResponseEntity.ok(List.of());
        }

        List<TransportNotification> notifs = transportNotificationRepository
                .findTop20ByStudentIdOrRouteIdOrderByCreatedAtDesc(student.getId(), student.getTransportRoute().getId());
        return ResponseEntity.ok(notifs);
    }

    @GetMapping("/transport/bus-console")
    public ResponseEntity<?> getBusConsoleData(@AuthenticationPrincipal User authUser) {
        if (authUser == null) return ResponseEntity.badRequest().body(Map.of("message", "Not authenticated"));

        List<TransportRoute> routes = transportRouteRepository.findAll();
        TransportRoute assignedRoute = null;

        // Find by operator username or match first route
        for (TransportRoute r : routes) {
            if (authUser.getUsername().equalsIgnoreCase(r.getOperatorUsername()) || authUser.getUsername().equalsIgnoreCase("bus0" + r.getId())) {
                assignedRoute = r;
                break;
            }
        }

        if (assignedRoute == null && !routes.isEmpty()) {
            assignedRoute = routes.get(0);
        }

        if (assignedRoute == null) {
            return ResponseEntity.ok(Map.of("hasBus", false));
        }

        List<Student> students = studentRepository.findByTransportRouteId(assignedRoute.getId());
        List<TransportBoardingLog> boardingLogs = transportBoardingLogRepository.findByRouteIdOrderByScannedAtDesc(assignedRoute.getId());
        List<TransportNotification> notifications = transportNotificationRepository.findTop50ByRouteIdOrderByCreatedAtDesc(assignedRoute.getId());

        Map<String, Object> resp = new HashMap<>();
        resp.put("hasBus", true);
        resp.put("route", assignedRoute);
        resp.put("assignedStudentsCount", students.size());
        resp.put("students", students.stream().map(s -> {
            Map<String, Object> sm = new HashMap<>();
            sm.put("id", s.getId());
            sm.put("fullName", s.getFullName());
            sm.put("admissionNumber", s.getAdmissionNumber());
            sm.put("className", s.getSchoolClass() != null ? s.getSchoolClass().getName() + " " + s.getSchoolClass().getSection() : "N/A");
            sm.put("busStop", s.getBusStop());
            return sm;
        }).collect(Collectors.toList()));
        resp.put("boardingLogs", boardingLogs.stream().limit(20).collect(Collectors.toList()));
        resp.put("notifications", notifications.stream().limit(10).collect(Collectors.toList()));
        return ResponseEntity.ok(resp);
    }

    @PostMapping("/transport/{id}/sos")
    public ResponseEntity<?> triggerEmergencySos(@PathVariable Long id, @RequestBody Map<String, Object> req) {
        TransportRoute route = transportRouteRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Transport route not found: " + id));
        String status = (String) req.getOrDefault("emergencyStatus", "EMERGENCY_SOS");
        String message = (String) req.getOrDefault("sosAlertMessage", "Emergency SOS triggered by On-Bus Unit");

        route.setEmergencyStatus(status);
        route.setSosAlertMessage(message);
        TransportRoute saved = transportRouteRepository.save(route);

        TransportNotification sosNotif = TransportNotification.builder()
                .routeId(id)
                .notificationType("EMERGENCY_SOS")
                .title("⚠️ EMERGENCY SOS ALERT: " + route.getBusNumber())
                .message(message)
                .createdAt(java.time.LocalDateTime.now())
                .build();
        transportNotificationRepository.save(sosNotif);

        return ResponseEntity.ok(Map.of(
                "success", true,
                "route", saved,
                "emergencyStatus", status,
                "alertMessage", message
        ));
    }

    @PostMapping("/transport/{id}/assign-student")
    @PreAuthorize("hasRole('MANAGEMENT')")
    public ResponseEntity<?> assignStudentToRoute(
            @PathVariable Long id,
            @RequestBody Map<String, Object> req) {
        TransportRoute route = transportRouteRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Transport route not found: " + id));
        Long studentId = ((Number) req.get("studentId")).longValue();
        String busStop = (String) req.get("busStop");

        Student student = studentRepository.findById(studentId)
                .orElseThrow(() -> new RuntimeException("Student not found: " + studentId));

        long currentCount = studentRepository.countByTransportRouteId(id);
        if (route.getCapacity() != null && currentCount >= route.getCapacity() && (student.getTransportRoute() == null || !student.getTransportRoute().getId().equals(id))) {
            return ResponseEntity.badRequest().body(Map.of("message", "Cannot assign student: Bus has reached maximum capacity (" + route.getCapacity() + " seats)."));
        }

        student.setTransportRoute(route);
        student.setBusStop(busStop);
        studentRepository.save(student);

        return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "Student " + student.getFullName() + " assigned to " + route.getRouteName() + " (Stop: " + (busStop != null ? busStop : "Default") + ")"
        ));
    }

    @PostMapping("/transport/unassign-student/{studentId}")
    @PreAuthorize("hasRole('MANAGEMENT')")
    public ResponseEntity<?> unassignStudent(@PathVariable Long studentId) {
        Student student = studentRepository.findById(studentId)
                .orElseThrow(() -> new RuntimeException("Student not found: " + studentId));
        student.setTransportRoute(null);
        student.setBusStop(null);
        studentRepository.save(student);
        return ResponseEntity.ok(Map.of("success", true, "message", "Student removed from transport route"));
    }

    @GetMapping("/transport/my-bus")
    public ResponseEntity<?> getMyBus(@AuthenticationPrincipal User authUser) {
        if (authUser == null) return ResponseEntity.badRequest().body(Map.of("message", "Not authenticated"));

        Student student = studentRepository.findByUserId(authUser.getId()).orElse(null);
        if (student == null || student.getTransportRoute() == null) {
            return ResponseEntity.ok(Map.of("assigned", false, "message", "No school bus route assigned to your student profile"));
        }

        TransportRoute route = student.getTransportRoute();
        List<TransportBoardingLog> myBoardingLogs = transportBoardingLogRepository.findByStudentIdOrderByScannedAtDesc(student.getId());

        Map<String, Object> resp = new HashMap<>();
        resp.put("assigned", true);
        resp.put("studentId", student.getId());
        resp.put("studentName", student.getFullName());
        resp.put("admissionNumber", student.getAdmissionNumber());
        resp.put("busStop", student.getBusStop());
        resp.put("route", route);
        resp.put("recentBoardings", myBoardingLogs.stream().limit(5).collect(Collectors.toList()));
        return ResponseEntity.ok(resp);
    }

    @GetMapping("/transport/my-bus/live")
    public ResponseEntity<?> getMyBusLive(@AuthenticationPrincipal User authUser) {
        if (authUser == null) return ResponseEntity.badRequest().body(Map.of("message", "Not authenticated"));

        Student student = studentRepository.findByUserId(authUser.getId()).orElse(null);
        if (student == null || student.getTransportRoute() == null) {
            return ResponseEntity.ok(Map.of("assigned", false));
        }

        TransportRoute route = student.getTransportRoute();
        Double busLat = route.getCurrentLat();
        Double busLng = route.getCurrentLng();

        Double stopLat = null;
        Double stopLng = null;
        double distanceToStopMeters = -1.0;
        int etaMinutes = route.getNextStopEtaMinutes() != null ? route.getNextStopEtaMinutes() : 5;

        if (route.getStopsJson() != null && student.getBusStop() != null && busLat != null && busLng != null) {
            try {
                com.fasterxml.jackson.databind.ObjectMapper mapper = new com.fasterxml.jackson.databind.ObjectMapper();
                List<Map<String, Object>> stops = mapper.readValue(route.getStopsJson(), new com.fasterxml.jackson.core.type.TypeReference<List<Map<String, Object>>>() {});
                for (Map<String, Object> s : stops) {
                    if (student.getBusStop().equalsIgnoreCase((String) s.get("name"))) {
                        stopLat = ((Number) s.get("lat")).doubleValue();
                        stopLng = ((Number) s.get("lng")).doubleValue();
                        distanceToStopMeters = calculateHaversineMeters(busLat, busLng, stopLat, stopLng);
                        int speedVal = route.getCurrentSpeedKmh() != null && route.getCurrentSpeedKmh() > 5 ? route.getCurrentSpeedKmh() : 25;
                        etaMinutes = Math.max(1, (int) Math.round((distanceToStopMeters / 1000.0) / speedVal * 60.0));
                        break;
                    }
                }
            } catch (Exception ignored) {}
        }

        List<TransportBoardingLog> myBoardingLogs = transportBoardingLogRepository.findByStudentIdOrderByScannedAtDesc(student.getId());
        List<TransportNotification> recentNotifs = transportNotificationRepository
                .findTop20ByStudentIdOrRouteIdOrderByCreatedAtDesc(student.getId(), route.getId());

        Map<String, Object> resp = new HashMap<>();
        resp.put("assigned", true);
        resp.put("studentName", student.getFullName());
        resp.put("busStop", student.getBusStop());
        resp.put("stopLat", stopLat);
        resp.put("stopLng", stopLng);
        resp.put("distanceToStopMeters", distanceToStopMeters);
        resp.put("isApproaching", distanceToStopMeters >= 0 && distanceToStopMeters <= 1000.0);
        resp.put("is10MinAlert", etaMinutes <= 10 && etaMinutes > 0);
        resp.put("etaMinutes", etaMinutes);
        resp.put("route", route);
        resp.put("lastBoarding", myBoardingLogs.isEmpty() ? null : myBoardingLogs.get(0));
        resp.put("recentNotifications", recentNotifs.stream().limit(5).collect(Collectors.toList()));

        return ResponseEntity.ok(resp);
    }

    private double calculateHaversineMeters(double lat1, double lon1, double lat2, double lon2) {
        final int R = 6371; // Earth radius in km
        double latDistance = Math.toRadians(lat2 - lat1);
        double lonDistance = Math.toRadians(lon2 - lon1);
        double a = Math.sin(latDistance / 2) * Math.sin(latDistance / 2)
                + Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2))
                * Math.sin(lonDistance / 2) * Math.sin(lonDistance / 2);
        double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c * 1000.0;
    }

    // ================= LIBRARY MODULE =================
    @GetMapping("/library/books")
    public ResponseEntity<List<LibraryBook>> getBooks(@RequestParam(required = false) String query) {
        if (query != null && !query.isEmpty()) {
            return ResponseEntity.ok(libraryBookRepository.findByTitleContainingIgnoreCaseOrAuthorContainingIgnoreCase(query, query));
        }
        return ResponseEntity.ok(libraryBookRepository.findAll());
    }

    @PostMapping("/library/books")
    @PreAuthorize("hasRole('MANAGEMENT')")
    public ResponseEntity<LibraryBook> createBook(@RequestBody LibraryBook book) {
        if (book.getTotalCopies() != null && (book.getTotalCopies() < 1 || book.getTotalCopies() > 5000)) {
            throw new IllegalArgumentException("Total book copies must be in the permitted range [1, 5000]. Provided: " + book.getTotalCopies());
        }
        if (book.getAvailableCopies() == null) {
            book.setAvailableCopies(book.getTotalCopies() != null ? book.getTotalCopies() : 1);
        } else {
            int maxCopies = book.getTotalCopies() != null ? book.getTotalCopies() : 1;
            if (book.getAvailableCopies() < 0 || book.getAvailableCopies() > maxCopies) {
                throw new IllegalArgumentException(String.format("Available copies (%d) must be in the permitted range [0, %d].", book.getAvailableCopies(), maxCopies));
            }
        }
        return ResponseEntity.ok(libraryBookRepository.save(book));
    }

    @Data
    public static class ApplyLeaveRequest {
        private Long studentId;
        private String startDate;
        private String endDate;
        private String reason;
    }

    @Data
    public static class CreateSalaryRequest {
        private Long teacherId;
        private String monthYear;
        private BigDecimal basicSalary;
        private BigDecimal allowances;
        private BigDecimal deductions;
        private String status;
    }

    // ================= ONLINE ADMISSIONS APPLICATION MODULE =================
    @PostMapping("/admissions/apply")
    public ResponseEntity<AdmissionApplication> submitAdmission(@RequestBody AdmissionApplication app) {
        if (app.getDateOfBirth() != null) {
            LocalDate minDate = LocalDate.now().minusYears(40);
            LocalDate maxDate = LocalDate.now().minusYears(2);
            if (app.getDateOfBirth().isAfter(maxDate) || app.getDateOfBirth().isBefore(minDate)) {
                throw new IllegalArgumentException("Date of birth must represent a valid applicant age between 2 and 40 years. Provided: " + app.getDateOfBirth());
            }
        }
        if (app.getAppliedDate() == null) app.setAppliedDate(LocalDate.now());
        if (app.getApplicationNo() == null || app.getApplicationNo().isEmpty()) {
            app.setApplicationNo("ADM-" + System.currentTimeMillis());
        }
        app.setStatus(AdmissionApplication.ApplicationStatus.PENDING);
        return ResponseEntity.ok(admissionApplicationRepository.save(app));
    }

    @GetMapping("/admissions/applications")
    @PreAuthorize("hasRole('MANAGEMENT')")
    public ResponseEntity<List<AdmissionApplication>> getAdmissionApplications() {
        List<AdmissionApplication> list = admissionApplicationRepository.findAllByOrderByAppliedDateDesc();
        if (list.isEmpty()) {
            // Seed sample admission application for demo
            AdmissionApplication sample = AdmissionApplication.builder()
                    .applicationNo("ADM-2026-9081")
                    .studentName("Ethan Vance")
                    .applyingForGrade("Grade 9")
                    .parentName("David Vance")
                    .phone("9876543210")
                    .email("david.vance@example.com")
                    .previousSchool("Saint Xavier Academy")
                    .dateOfBirth(LocalDate.of(2011, 4, 12))
                    .address("45 Greenfield Enclave, Tech City")
                    .status(AdmissionApplication.ApplicationStatus.PENDING)
                    .appliedDate(LocalDate.now())
                    .build();
            admissionApplicationRepository.save(sample);
            list = List.of(sample);
        }
        return ResponseEntity.ok(list);
    }

    @PutMapping("/admissions/applications/{id}/status")
    @PreAuthorize("hasRole('MANAGEMENT')")
    public ResponseEntity<AdmissionApplication> updateAdmissionStatus(@PathVariable Long id, @RequestBody Map<String, String> body) {
        AdmissionApplication app = admissionApplicationRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Admission application not found"));
        String statusStr = body.get("status");
        if (statusStr != null) {
            app.setStatus(AdmissionApplication.ApplicationStatus.valueOf(statusStr.toUpperCase()));
        }
        return ResponseEntity.ok(admissionApplicationRepository.save(app));
    }

    // ================= DIGITAL STUDENT ID CARD GENERATOR =================
    @GetMapping("/idcards/student/{studentId}")
    public ResponseEntity<Map<String, Object>> getStudentIdCard(
            @PathVariable Long studentId,
            @AuthenticationPrincipal User authUser) {
        if (authUser != null && authUser.getRole() == User.Role.STUDENT) {
            Student s = studentRepository.findByUserId(authUser.getId()).orElse(null);
            if (s != null && !s.getId().equals(studentId) && !s.getUser().getId().equals(studentId)) {
                throw new org.springframework.security.access.AccessDeniedException("Access denied: You can only view your own ID card.");
            }
        }

        Student s = studentRepository.findById(studentId)
                .orElseGet(() -> studentRepository.findByUserId(studentId).orElse(null));

        if (s == null) {
            throw new RuntimeException("Student not found for ID Card");
        }

        ParentContact parent = parentContactRepository.findByStudentId(s.getId()).stream().findFirst().orElse(null);
        StudentHealth health = studentHealthRepository.findByStudentId(s.getId()).orElse(null);
        com.sms.model.cms.SchoolInfo schoolInfo = schoolInfoRepository.findAll().stream().findFirst().orElse(null);

        String schoolName = schoolInfo != null ? schoolInfo.getSchoolName() : "Antigravity Public School";
        String schoolPhone = schoolInfo != null ? schoolInfo.getPhone() : "+91 98765 43210";
        String principalName = schoolInfo != null && schoolInfo.getPrincipalName() != null ? schoolInfo.getPrincipalName() : "Dr. E. Vance";

        Map<String, Object> card = new java.util.HashMap<>();
        card.put("studentId", s.getId());
        card.put("fullName", s.getFullName());
        card.put("admissionNo", s.getAdmissionNumber() != null ? s.getAdmissionNumber() : "ADM2026" + s.getId());
        card.put("rollNo", "10" + s.getId());
        card.put("className", s.getSchoolClass() != null ? s.getSchoolClass().getName() + " - " + s.getSchoolClass().getSection() : "Grade 10 - A");
        card.put("academicYear", s.getAcademicYear() != null ? s.getAcademicYear() : "2025-2026");
        card.put("dob", s.getDateOfBirth() != null ? s.getDateOfBirth().toString() : "2010-05-15");
        card.put("bloodGroup", health != null && health.getBloodGroup() != null ? health.getBloodGroup() : "O+");
        card.put("parentPhone", parent != null ? parent.getPhone() : schoolPhone);
        card.put("emergencyContact", parent != null ? parent.getPhone() : schoolPhone);
        card.put("schoolName", schoolName);
        card.put("principalName", principalName);
        card.put("qrPayload", "SMS-ID:" + s.getAdmissionNumber() + "|" + s.getFullName() + "|" + (s.getSchoolClass() != null ? s.getSchoolClass().getName() : "Gr10"));

        return ResponseEntity.ok(card);
    }

    // ================= 1-CLICK CLASS REPORT CARD GENERATOR =================
    @PostMapping("/reportcard/class/{classId}/generate")
    @PreAuthorize("hasAnyRole('TEACHER', 'MANAGEMENT')")
    public ResponseEntity<Map<String, Object>> generateClassReportCards(
            @PathVariable Long classId,
            @RequestParam(defaultValue = "FINAL") String term,
            @RequestParam(required = false) String academicYear,
            @AuthenticationPrincipal User authUser) {
        String publisherName = authUser != null
                ? teacherRepository.findByUserId(authUser.getId()).map(Teacher::getFullName).orElse(authUser.getUsername())
                : "Faculty Member";
        Map<String, Object> result = reportCardService.generateClassReportCards(classId, term, academicYear, publisherName);
        return ResponseEntity.ok(result);
    }

    @GetMapping("/reportcard/class/{classId}")
    @PreAuthorize("hasAnyRole('TEACHER', 'MANAGEMENT')")
    public ResponseEntity<Map<String, Object>> getClassReportCards(
            @PathVariable Long classId,
            @RequestParam(required = false) String term) {
        return ResponseEntity.ok(reportCardService.getClassReportCards(classId, term));
    }

    @GetMapping("/reportcard/student/{studentId}/status")
    public ResponseEntity<Map<String, Object>> getStudentReportCardStatus(
            @PathVariable Long studentId,
            @AuthenticationPrincipal User authUser) {
        return ResponseEntity.ok(reportCardService.getStudentReportCardStatus(studentId));
    }

    // ================= OFFICIAL TERM REPORT CARD GENERATOR =================
    @GetMapping("/reportcard/student/{studentId}")
    public ResponseEntity<Map<String, Object>> getStudentReportCard(
            @PathVariable Long studentId,
            @RequestParam(defaultValue = "FINAL") String term,
            @AuthenticationPrincipal User authUser) {
        if (authUser != null && authUser.getRole() == User.Role.STUDENT) {
            Student s = studentRepository.findByUserId(authUser.getId()).orElse(null);
            if (s != null && !s.getId().equals(studentId) && !s.getUser().getId().equals(studentId)) {
                throw new org.springframework.security.access.AccessDeniedException("Access denied: You can only view your own report card.");
            }
        }

        Student s = studentRepository.findById(studentId)
                .orElseGet(() -> studentRepository.findByUserId(studentId).orElse(null));

        if (s == null) {
            throw new RuntimeException("Student not found for Report Card");
        }

        // 1. Check if official published report card exists
        Map<String, Object> publishedReport = reportCardService.getStudentReportCard(s.getId(), term);
        if (Boolean.TRUE.equals(publishedReport.get("published"))) {
            return ResponseEntity.ok(publishedReport);
        }

        List<StudentGrade> grades = studentGradeRepository.findByStudentId(s.getId());
        com.sms.model.cms.SchoolInfo schoolInfo = schoolInfoRepository.findAll().stream().findFirst().orElse(null);

        // Core CBSE Scholastic Subjects list
        String[] defaultSubjects = {
            "Language I: English Core",
            "Language II: Hindi / Regional",
            "Mathematics & Analytical Geometry",
            "Science (Physics, Chemistry, Biology)",
            "Social Sciences (History, Civics, Geography)",
            "Information Technology & AI Applications"
        };

        List<Map<String, Object>> scholasticList = new java.util.ArrayList<>();
        double totalObtained = 0.0;
        double totalMax = defaultSubjects.length * 100.0;

        int seedBase = (int) (s.getId() != null ? (s.getId() % 7) : 3);
        double[][] scorePatterns = {
            {18.5, 9.0, 64.0}, // Total 91.5 -> A1
            {19.0, 9.5, 66.5}, // Total 95.0 -> A1
            {17.0, 8.5, 60.5}, // Total 86.0 -> A2
            {18.0, 9.0, 61.0}, // Total 88.0 -> A2
            {16.5, 8.0, 58.0}, // Total 82.5 -> A2
            {19.5, 10.0, 67.5} // Total 97.0 -> A1
        };

        for (int i = 0; i < defaultSubjects.length; i++) {
            String subj = defaultSubjects[i];
            double[] scores = scorePatterns[(i + seedBase) % scorePatterns.length];
            double pt = scores[0];
            double sep = scores[1];
            double te = scores[2];
            double tot = Math.round((pt + sep + te) * 10.0) / 10.0;
            totalObtained += tot;

            String grade;
            double gp;
            if (tot >= 91.0) { grade = "A1"; gp = 10.0; }
            else if (tot >= 81.0) { grade = "A2"; gp = 9.0; }
            else if (tot >= 71.0) { grade = "B1"; gp = 8.0; }
            else if (tot >= 61.0) { grade = "B2"; gp = 7.0; }
            else if (tot >= 51.0) { grade = "C1"; gp = 6.0; }
            else if (tot >= 41.0) { grade = "C2"; gp = 5.0; }
            else if (tot >= 33.0) { grade = "D";  gp = 4.0; }
            else { grade = "E"; gp = 0.0; }

            Map<String, Object> subMap = new java.util.HashMap<>();
            subMap.put("subject", subj);
            subMap.put("ptMarks", pt);      // Periodic Test (Max 20)
            subMap.put("sepMarks", sep);    // Subject Enrichment / Portfolio (Max 10)
            subMap.put("termMarks", te);    // Term End Exam (Max 70)
            subMap.put("totalMarks", tot);  // Total (Max 100)
            subMap.put("grade", grade);
            subMap.put("gradePoint", gp);
            scholasticList.add(subMap);
        }

        double percentage = Math.round((totalObtained / totalMax) * 1000.0) / 10.0;
        double cgpa = Math.round((percentage / 9.5) * 10.0) / 10.0;
        String overallGrade = percentage >= 91.0 ? "A1" : percentage >= 81.0 ? "A2" : percentage >= 71.0 ? "B1" : "B2";

        // Co-Scholastic 3-point grading (A=Outstanding, B=Very Good, C=Fair)
        List<Map<String, Object>> coScholastic = List.of(
            Map.of("area", "Work Education (Skill-Based / Computer Literacy)", "grade", "A", "descriptor", "Demonstrates strong computational and project craftsmanship."),
            Map.of("area", "Art Education (Visual & Expressive Performance)", "grade", "A", "descriptor", "Active participant with high creative and cultural awareness."),
            Map.of("area", "Health & Physical Education (Sports / Yoga)", "grade", "A", "descriptor", "High stamina, teamwork, and adherence to physical fitness standards."),
            Map.of("area", "Discipline & Institutional Demeanour", "grade", "A", "descriptor", "Exemplary adherence to academy code of conduct, punctuality, and values.")
        );

        Map<String, Object> report = new java.util.HashMap<>();
        report.put("studentId", s.getId());
        report.put("fullName", s.getFullName());
        report.put("admissionNo", s.getAdmissionNumber() != null ? s.getAdmissionNumber() : "ADM26-C10-001");
        report.put("rollNo", s.getId() != null ? "26" + String.format("%03d", s.getId() % 1000) : "26001");
        report.put("className", s.getSchoolClass() != null ? s.getSchoolClass().getName() + " - " + s.getSchoolClass().getSection() : "Class 10 - Section A");
        report.put("academicYear", s.getAcademicYear() != null ? s.getAcademicYear() : "2025-2026");
        report.put("term", term);
        report.put("termLabel", "TERM II & CONSOLIDATED ANNUAL ASSESSMENT");
        report.put("schoolName", schoolInfo != null ? schoolInfo.getSchoolName() : "Apex International Academy");
        report.put("affiliationNo", "CBSE / AFF-2130892 / REG-71204");
        report.put("principalName", schoolInfo != null && schoolInfo.getPrincipalName() != null ? schoolInfo.getPrincipalName() : "Dr. Eleanor Vance, Ph.D.");
        report.put("classTeacherName", "Prof. R. S. Bhattacharya");
        report.put("controllerOfExams", "Dr. K. S. Ramanujan");

        // Personal & Demographics
        report.put("dateOfBirth", s.getDateOfBirth() != null ? s.getDateOfBirth().toString() : "2010-08-16");
        report.put("gender", s.getGender() != null ? s.getGender().name() : "MALE");
        List<ParentContact> contacts = parentContactRepository.findByStudentId(s.getId());
        String pFather = contacts.stream()
                .filter(c -> c.getRelation() == ParentContact.Relation.FATHER)
                .map(ParentContact::getName)
                .findFirst()
                .orElse("Mr. Rajesh Prasad");
        String pMother = contacts.stream()
                .filter(c -> c.getRelation() == ParentContact.Relation.MOTHER)
                .map(ParentContact::getName)
                .findFirst()
                .orElse("Mrs. Sunita Prasad");
        report.put("fathersName", pFather);
        report.put("mothersName", pMother);

        // Attendance & Health profile
        int workingDays = 218;
        int presentDays = 207 + (int)(s.getId() != null ? (s.getId() % 9) : 3);
        if (presentDays > workingDays) presentDays = workingDays;
        double attPct = Math.round(((double) presentDays / workingDays) * 1000.0) / 10.0;

        report.put("attendance", Map.of(
            "totalWorkingDays", workingDays,
            "daysAttended", presentDays,
            "attendancePercentage", attPct,
            "statutoryStatus", attPct >= 75.0 ? "REGULAR (STATUTORY REQUIREMENT SATISFIED)" : "CONDONED"
        ));

        report.put("healthProfile", Map.of(
            "heightCm", 163,
            "weightKg", 52.4,
            "bmi", "19.7 (Healthy Range)",
            "bloodGroup", "B+",
            "vision", "6/6 (Normal)"
        ));

        report.put("scholasticSubjects", scholasticList);
        report.put("totalObtained", Math.round(totalObtained * 10.0) / 10.0);
        report.put("totalMax", totalMax);
        report.put("percentage", percentage);
        report.put("cgpa", cgpa);
        report.put("overallGrade", overallGrade);
        report.put("resultStatus", "PASSED — PROMOTED WITH DISTINCTION");
        report.put("remarks", "Exemplary scholastic grasp, curious demeanor, and outstanding leadership in co-curricular initiatives.");

        return ResponseEntity.ok(report);
    }

    // ================= AI REVISION & STUDY TUTOR MODULE =================
    @PostMapping("/ai/chat")
    public ResponseEntity<Map<String, Object>> aiStudyAssistant(
            @RequestBody Map<String, String> body,
            @RequestHeader(value = "X-Gemini-Key", required = false) String headerKey) {
        String prompt = body != null ? body.getOrDefault("prompt", "Hello") : "Hello";
        String subject = body != null ? body.getOrDefault("subject", "General Science") : "General Science";
        String apiKey = body != null && body.containsKey("apiKey") && !body.get("apiKey").isBlank()
                ? body.get("apiKey")
                : headerKey;
        return ResponseEntity.ok(aiStudyService.chat(prompt, subject, apiKey));
    }

    @PostMapping("/ai/quiz")
    public ResponseEntity<Map<String, Object>> generateAiQuiz(
            @RequestBody Map<String, Object> body,
            @RequestHeader(value = "X-Gemini-Key", required = false) String headerKey) {
        String subject = body != null && body.containsKey("subject") ? body.get("subject").toString() : "Mathematics";
        String topic = body != null && body.containsKey("topic") ? body.get("topic").toString() : "Core Concepts";
        String apiKey = body != null && body.containsKey("apiKey") && !body.get("apiKey").toString().isBlank()
                ? body.get("apiKey").toString()
                : headerKey;
        int count = 4;
        if (body != null && body.containsKey("count")) {
            try {
                count = Integer.parseInt(body.get("count").toString());
            } catch (Exception ignored) {}
        }
        List<Map<String, Object>> questions = aiStudyService.generateQuiz(subject, topic, count, apiKey);
        Map<String, Object> resp = new HashMap<>();
        resp.put("subject", subject);
        resp.put("topic", topic);
        resp.put("questions", questions);
        resp.put("totalQuestions", questions.size());
        return ResponseEntity.ok(resp);
    }

    @PostMapping("/ai/worksheet")
    public ResponseEntity<Map<String, Object>> generateAiWorksheet(
            @RequestBody Map<String, Object> body,
            @RequestHeader(value = "X-Gemini-Key", required = false) String headerKey) {
        String subject = body != null && body.containsKey("subject") ? body.get("subject").toString() : "Mathematics";
        String topic = body != null && body.containsKey("topic") ? body.get("topic").toString() : "General Revision";
        String gradeLevel = body != null && body.containsKey("gradeLevel") ? body.get("gradeLevel").toString() : "Class 10";
        String apiKey = body != null && body.containsKey("apiKey") && !body.get("apiKey").toString().isBlank()
                ? body.get("apiKey").toString()
                : headerKey;
        Map<String, Object> worksheet = aiStudyService.generateWorksheet(subject, topic, gradeLevel, apiKey);
        return ResponseEntity.ok(worksheet);
    }

    // ================= HOUSE LEADERBOARD & MERIT BADGES =================
    @GetMapping("/leaderboard/houses")
    public ResponseEntity<Map<String, Object>> getHouseLeaderboard() {
        List<Map<String, Object>> houses = List.of(
            Map.of("houseName", "Ruby Red Dragons", "color", "#DC2626", "points", 1450, "rank", 1, "motto", "Courage & Valor"),
            Map.of("houseName", "Sapphire Blue Falcons", "color", "#2563EB", "points", 1380, "rank", 2, "motto", "Wisdom & Honor"),
            Map.of("houseName", "Emerald Green Spartans", "color", "#059669", "points", 1290, "rank", 3, "motto", "Strength & Discipline"),
            Map.of("houseName", "Topaz Gold Lions", "color", "#D97706", "points", 1210, "rank", 4, "motto", "Integrity & Pride")
        );

        List<Map<String, Object>> badges = List.of(
            Map.of("badgeName", "100% Attendance Star", "icon", "🏆", "description", "Awarded for zero absences in Term 1"),
            Map.of("badgeName", "STEM Academic Titan", "icon", "🔬", "description", "Scored 90%+ in Physics & Math"),
            Map.of("badgeName", "Sportsmanship Honor", "icon", "⚽", "description", "Captain in Inter-House Tournament")
        );

        Map<String, Object> res = new java.util.HashMap<>();
        res.put("houses", houses);
        res.put("myBadges", badges);
        return ResponseEntity.ok(res);
    }

    // ================= DIGITAL E-BOOK & TEACHER STUDY MATERIAL MODULE =================
    @GetMapping("/library/e-books")
    public ResponseEntity<Map<String, Object>> getEBooks(
            @RequestParam(required = false) Long studentId,
            @RequestParam(required = false) Long classId,
            @RequestParam(required = false) Long teacherId,
            @AuthenticationPrincipal User authUser) {

        // 1. Digital textbooks & reference curriculum
        List<Map<String, Object>> digitalBooks = List.of(
            Map.of("id", 101L, "title", "Concepts of Physics — Grade 10 & 11", "author", "Dr. H.C. Verma", "subject", "Physics", "pdfUrl", "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf", "readTime", "15 mins", "fileType", "PDF", "isTeacherMaterial", false),
            Map.of("id", 102L, "title", "Advanced Algebra & Trigonometry Handbook", "author", "Prof. S.L. Loney", "subject", "Mathematics", "pdfUrl", "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf", "readTime", "20 mins", "fileType", "PDF", "isTeacherMaterial", false),
            Map.of("id", 103L, "title", "Modern Inorganic & Organic Chemistry Notes", "author", "NCERT Board", "subject", "Chemistry", "pdfUrl", "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf", "readTime", "12 mins", "fileType", "PDF", "isTeacherMaterial", false),
            Map.of("id", 104L, "title", "Java Programming & Data Structures Guide", "author", "E. Balagurusamy", "subject", "Computer Science", "pdfUrl", "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf", "readTime", "25 mins", "fileType", "PDF", "isTeacherMaterial", false)
        );

        // 2. Resolve target scope
        List<StudyMaterial> teacherMaterials;

        Long targetClassId = classId;
        if (targetClassId == null && studentId != null) {
            Student s = studentRepository.findById(studentId)
                    .orElseGet(() -> studentRepository.findByUserId(studentId).orElse(null));
            if (s != null && s.getSchoolClass() != null) {
                targetClassId = s.getSchoolClass().getId();
            }
        }
        if (targetClassId == null && authUser != null && authUser.getRole() == User.Role.STUDENT) {
            Student s = studentRepository.findByUserId(authUser.getId()).orElse(null);
            if (s != null && s.getSchoolClass() != null) {
                targetClassId = s.getSchoolClass().getId();
            }
        }

        if (targetClassId != null) {
            // Student or Class view: includes class teacher materials + all institute-wide admin broadcast materials
            teacherMaterials = studyMaterialRepository.findForClassOrInstituteWide(targetClassId);
        } else if (teacherId != null) {
            Teacher t = teacherRepository.findById(teacherId)
                    .orElseGet(() -> teacherRepository.findByUserId(teacherId).orElse(null));
            Long tId = t != null ? t.getId() : teacherId;
            teacherMaterials = studyMaterialRepository.findByTeacherIdOrderByUploadedDateDesc(tId);
        } else if (authUser != null && authUser.getRole() == User.Role.TEACHER) {
            Teacher t = teacherRepository.findByUserId(authUser.getId()).orElse(null);
            if (t != null) {
                teacherMaterials = studyMaterialRepository.findByTeacherIdOrderByUploadedDateDesc(t.getId());
            } else {
                teacherMaterials = studyMaterialRepository.findAllByOrderByUploadedDateDesc();
            }
        } else {
            // Management / Admin view: sees all materials across entire institute
            teacherMaterials = studyMaterialRepository.findAllByOrderByUploadedDateDesc();
        }

        Map<String, Object> result = new HashMap<>();
        result.put("teacherMaterials", teacherMaterials);
        result.put("digitalBooks", digitalBooks);
        return ResponseEntity.ok(result);
    }

    @PostMapping("/library/e-books")
    @PreAuthorize("hasAnyRole('MANAGEMENT', 'TEACHER')")
    public ResponseEntity<StudyMaterial> uploadStudyMaterial(
            @RequestBody CreateStudyMaterialRequest req,
            @AuthenticationPrincipal User authUser) {

        boolean isManagement = authUser != null && authUser.getRole() == User.Role.MANAGEMENT;
        boolean isTeacher = authUser != null && authUser.getRole() == User.Role.TEACHER;

        SchoolClass sClass = req.getClassId() != null ? schoolClassRepository.findById(req.getClassId()).orElse(null) : null;
        Subject subj = req.getSubjectId() != null ? subjectRepository.findById(req.getSubjectId()).orElse(null) : null;

        Teacher teacher = null;
        if (isTeacher) {
            teacher = teacherRepository.findByUserId(authUser.getId()).orElse(null);
            if (teacher == null) {
                throw new org.springframework.security.access.AccessDeniedException("Teacher profile not found.");
            }

            if (sClass == null) {
                throw new org.springframework.security.access.AccessDeniedException("Teachers must select an assigned class for study materials.");
            }

            // Verify teacher is assigned to this class and subject by Management
            boolean isAssigned = false;
            if (subj != null) {
                isAssigned = teacherClassAssignmentRepository.existsByTeacherIdAndSchoolClassIdAndSubjectId(
                        teacher.getId(), sClass.getId(), subj.getId());
            } else {
                isAssigned = teacherClassAssignmentRepository.existsByTeacherIdAndSchoolClassId(
                        teacher.getId(), sClass.getId());
            }

            if (!isAssigned) {
                throw new org.springframework.security.access.AccessDeniedException(
                        "Access denied: You are not assigned to teach " 
                        + (subj != null ? subj.getName() : "this subject") 
                        + " in " + sClass.getName() + " (" + sClass.getSection() + "). Only management-assigned classes and subjects can be accessed.");
            }
        } else if (req.getTeacherId() != null) {
            teacher = teacherRepository.findById(req.getTeacherId())
                    .orElseGet(() -> teacherRepository.findByUserId(req.getTeacherId()).orElse(null));
        }

        // Only Admin/Management can broadcast throughout the entire institute to all students
        boolean instituteWide = false;
        if (isManagement) {
            instituteWide = req.getIsInstituteWide() != null ? req.getIsInstituteWide() : (sClass == null);
        } else {
            instituteWide = false; // Teacher materials are bound to subject/class
        }

        String author = teacher != null ? teacher.getFullName() :
                (isManagement ? "School Academic Directorate / Management" :
                (req.getAuthorOrSource() != null ? req.getAuthorOrSource() : "Faculty"));

        StudyMaterial material = StudyMaterial.builder()
                .title(req.getTitle())
                .description(req.getDescription())
                .schoolClass(sClass)
                .subject(subj)
                .teacher(teacher)
                .fileUrl(req.getFileUrl())
                .fileType(req.getFileType())
                .authorOrSource(author)
                .uploadedByRole(isManagement ? "MANAGEMENT" : "TEACHER")
                .isInstituteWide(instituteWide)
                .uploadedDate(LocalDate.now())
                .build();

        return ResponseEntity.ok(studyMaterialRepository.save(material));
    }

    @DeleteMapping("/library/e-books/{id}")
    @PreAuthorize("hasAnyRole('MANAGEMENT', 'TEACHER')")
    public ResponseEntity<Map<String, String>> deleteStudyMaterial(
            @PathVariable Long id,
            @AuthenticationPrincipal User authUser) {
        
        StudyMaterial material = studyMaterialRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Study material not found"));

        if (authUser != null && authUser.getRole() == User.Role.TEACHER) {
            Teacher teacher = teacherRepository.findByUserId(authUser.getId()).orElse(null);
            if (teacher != null && material.getTeacher() != null && !material.getTeacher().getId().equals(teacher.getId())) {
                throw new RuntimeException("You can only delete study materials uploaded by you.");
            }
        }

        studyMaterialRepository.deleteById(id);
        return ResponseEntity.ok(Map.of("message", "Study material deleted successfully"));
    }

    // ================= HOSTEL & GATE PASS SYSTEM =================
    @GetMapping("/hostel/my-room")
    public ResponseEntity<Map<String, Object>> getHostelRoomInfo() {
        Map<String, Object> h = new java.util.HashMap<>();
        h.put("hostelBlock", "Nightingale Hall — Block A");
        h.put("roomNumber", "A-304");
        h.put("wardenName", "Mr. S. K. Sharma");
        h.put("wardenPhone", "+91 98765 88990");
        h.put("messTimings", "Breakfast: 07:30 AM | Lunch: 01:00 PM | Dinner: 08:00 PM");
        h.put("gatePassStatus", "APPROVED (Valid till 08:00 PM)");
        return ResponseEntity.ok(h);
    }

    // ================= TEACHER SUBSTITUTION TIMETABLE =================
    @GetMapping("/substitutions/today")
    public ResponseEntity<List<Map<String, Object>>> getTodaySubstitutions() {
        List<Map<String, Object>> subs = List.of(
            Map.of("period", "Period 2 (10:00 AM)", "class", "Grade 10 - A", "absentTeacher", "Prof. Alan Vance", "substituteTeacher", "Sarah Jenkins (Math)", "status", "ASSIGNED"),
            Map.of("period", "Period 5 (02:00 PM)", "class", "Grade 9 - B", "absentTeacher", "Dr. Clara Oswald", "substituteTeacher", "Robert Morgan (Physics)", "status", "ASSIGNED")
        );
        return ResponseEntity.ok(subs);
    }

    // ================= PRINCIPAL VOICE ANNOUNCEMENT PLAYER =================
    @GetMapping("/announcements/principal-voice")
    public ResponseEntity<Map<String, Object>> getPrincipalVoiceAnnouncement() {
        Map<String, Object> audio = new java.util.HashMap<>();
        audio.put("title", "Principal's Welcome & Mid-Term Exam Blueprint Address");
        audio.put("principalName", "Dr. E. Vance");
        audio.put("date", LocalDate.now().toString());
        audio.put("audioUrl", "https://actions.google.com/sounds/v1/ambiences/office_hubbub.ogg");
        audio.put("transcript", "Dear students, parents, and faculty members. Welcome to the new academic session. Work hard for the upcoming mid-term examinations and uphold institutional values.");
        return ResponseEntity.ok(audio);
    }

    // ================= FACULTY & STAFF CAREERS VACANCIES =================
    @GetMapping("/careers/vacancies")
    public ResponseEntity<List<Map<String, Object>>> getJobVacancies() {
        List<Map<String, Object>> vacancies = List.of(
            Map.of("id", 1, "title", "Senior Mathematics Faculty (Grades 9-12)", "department", "Academics", "experience", "3+ Years", "type", "Full-Time", "location", "Main Campus"),
            Map.of("id", 2, "title", "Physics & Robotics Lab Instructor", "department", "Science", "experience", "2+ Years", "type", "Full-Time", "location", "Science Block"),
            Map.of("id", 3, "title", "Physical Education & Sports Coach", "department", "Sports", "experience", "1+ Years", "type", "Full-Time", "location", "Sports Quad")
        );
        return ResponseEntity.ok(vacancies);
    }

    @PostMapping("/careers/apply")
    public ResponseEntity<Map<String, Object>> applyJob(@RequestBody Map<String, String> body) {
        Map<String, Object> resp = new java.util.HashMap<>();
        resp.put("applicationId", "APP-JOB-" + System.currentTimeMillis());
        resp.put("status", "SUBMITTED");
        resp.put("message", "Your job application has been successfully submitted to HR.");
        return ResponseEntity.ok(resp);
    }

    // ================= STUDENT CERTIFICATE REQUEST ENGINE =================
    @GetMapping("/certificates/my-requests")
    public ResponseEntity<List<Map<String, Object>>> getCertificateRequests(
            @RequestParam(required = false) Long studentId,
            @org.springframework.security.core.annotation.AuthenticationPrincipal User user) {

        List<Map<String, Object>> reqs = List.of(
            Map.of("id", 101, "certificateType", "Bonafide Certificate", "reason", "Passport Application", "requestedDate", LocalDate.now().minusDays(2).toString(), "status", "ISSUED", "downloadUrl", "#"),
            Map.of("id", 102, "certificateType", "Conduct & Character Certificate", "reason", "Higher Secondary Board Exam", "requestedDate", LocalDate.now().toString(), "status", "PROCESSING", "downloadUrl", "#")
        );
        return ResponseEntity.ok(reqs);
    }

    @PostMapping("/certificates/request")
    public ResponseEntity<Map<String, Object>> requestCertificate(@RequestBody Map<String, String> body) {
        Map<String, Object> resp = new java.util.HashMap<>();
        resp.put("id", System.currentTimeMillis() % 10000);
        resp.put("certificateType", body.getOrDefault("certificateType", "Bonafide Certificate"));
        resp.put("reason", body.getOrDefault("reason", "Official Verification"));
        resp.put("requestedDate", LocalDate.now().toString());
        resp.put("status", "PROCESSING");
        return ResponseEntity.ok(resp);
    }

    // ================= INSTITUTIONAL NEWS & MEDIA HUB =================
    @GetMapping("/news/articles")
    public ResponseEntity<List<Map<String, Object>>> getNewsArticles() {
        List<Map<String, Object>> news = List.of(
            Map.of("id", 1, "title", "Apex Academy Wins Regional Science & Robotics Olympiad 2026", "date", "August 05, 2026", "category", "ACADEMICS", "summary", "Our Grade 10 Science team secured First Rank in the State Robotics Olympiad.", "imageUrl", "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=800&q=80"),
            Map.of("id", 2, "title", "Annual Athletics Meet Announced with New Synthetic Running Track", "date", "August 01, 2026", "category", "SPORTS", "summary", "State-of-the-art sports facilities inaugurated by District Sports Council.", "imageUrl", "https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&w=800&q=80")
        );
        return ResponseEntity.ok(news);
    }

    // ================= PARENT AI HELPDESK CHATBOT =================
    @PostMapping("/faq/ask")
    public ResponseEntity<Map<String, Object>> parentFaqBot(@RequestBody Map<String, String> body) {
        String q = body.getOrDefault("question", "").toLowerCase();
        String ans = "Thank you for reaching out! ";

        if (q.contains("fee") || q.contains("payment") || q.contains("due")) {
            ans += "School fees can be paid online via UPI QR code or NetBanking on the Student Fee Portal. Installment breakdowns are generated at admission.";
        } else if (q.contains("admission") || q.contains("apply") || q.contains("age")) {
            ans += "Admissions for Session 2025-2026 are open! You can submit an online application form on our website under Apply Online.";
        } else if (q.contains("timing") || q.contains("hour") || q.contains("schedule")) {
            ans += "School hours are 08:30 AM to 03:15 PM Monday through Friday. Administrative office hours are 09:00 AM to 04:30 PM.";
        } else if (q.contains("bus") || q.contains("transport") || q.contains("route")) {
            ans += "We operate 12 GPS-tracked school bus routes across the city. Each bus is equipped with CCTV and trained drivers.";
        } else {
            ans += "For specialized inquiries, please contact our Admissions Office at +91 98765 43210 or email admin@school.edu.";
        }

        Map<String, Object> resp = new java.util.HashMap<>();
        resp.put("question", body.get("question"));
        resp.put("answer", ans);
        return ResponseEntity.ok(resp);
    }

    // ================= DISTINGUISHED ALUMNI WALL OF FAME =================
    @GetMapping("/alumni/public")
    public ResponseEntity<List<Map<String, Object>>> getPublicAlumni() {
        List<Map<String, Object>> list = List.of(
            Map.of("id", 1, "name", "Dr. Aravind Menon", "batch", "Batch of 2012", "achievement", "Principal AI Scientist at Google Research", "photo", "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80"),
            Map.of("id", 2, "name", "Ms. Ananya Sharma", "batch", "Batch of 2015", "achievement", "IAS Officer, District Collector", "photo", "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=400&q=80"),
            Map.of("id", 3, "name", "Karan Malhotra", "batch", "Batch of 2018", "achievement", "National Badminton Champion & Olympian", "photo", "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80")
        );
        return ResponseEntity.ok(list);
    }

    // ================= DASHBOARD LIVE ALERTS & NOTIFICATIONS =================
    @GetMapping("/dashboard/alerts")
    public ResponseEntity<List<Map<String, Object>>> getDashboardAlerts(
            @RequestParam(required = false) Long studentId,
            @RequestParam(required = false) Long teacherId,
            @RequestParam(required = false) String role,
            @AuthenticationPrincipal User authUser) {

        List<Map<String, Object>> alerts = new ArrayList<>();

        String effectiveRole = role;
        Long effectiveStudentId = studentId;
        Long effectiveTeacherId = teacherId;

        if (authUser != null) {
            if (effectiveRole == null && authUser.getRole() != null) {
                effectiveRole = authUser.getRole().name();
            }
            if (effectiveRole != null && effectiveRole.equalsIgnoreCase("STUDENT") && effectiveStudentId == null) {
                Student s = studentRepository.findByUserId(authUser.getId()).orElse(null);
                if (s != null) effectiveStudentId = s.getId();
            } else if (effectiveRole != null && effectiveRole.equalsIgnoreCase("TEACHER") && effectiveTeacherId == null) {
                Teacher t = teacherRepository.findByUserId(authUser.getId()).orElse(null);
                if (t != null) effectiveTeacherId = t.getId();
            }
        }

        final Long finalStudentId = effectiveStudentId;
        final Long finalTeacherId = effectiveTeacherId;

        if ("STUDENT".equalsIgnoreCase(effectiveRole) || finalStudentId != null) {
            Student s = finalStudentId != null ? studentRepository.findById(finalStudentId)
                    .orElseGet(() -> studentRepository.findByUserId(finalStudentId).orElse(null)) : null;
            Long sId = s != null ? s.getId() : finalStudentId;

            if (sId != null) {
                // 1. Leave approvals / rejections
                List<LeaveRequest> leaves = leaveRequestRepository.findByStudentIdOrderByAppliedDateDesc(sId);
                for (LeaveRequest l : leaves) {
                    if (l.getStatus() == LeaveRequest.LeaveStatus.APPROVED) {
                        Map<String, Object> a = new HashMap<>();
                        a.put("id", "leave-" + l.getId());
                        a.put("type", "LEAVE");
                        a.put("status", "APPROVED");
                        a.put("title", "Leave Request Approved ✅");
                        a.put("message", "Your leave application for " + l.getStartDate() + " to " + l.getEndDate() + " has been APPROVED.");
                        a.put("remarks", l.getAdminRemarks() != null ? l.getAdminRemarks() : "Approved by Academic Administration.");
                        a.put("date", l.getAppliedDate() != null ? l.getAppliedDate().toString() : "");
                        a.put("urgency", "SUCCESS");
                        alerts.add(a);
                    } else if (l.getStatus() == LeaveRequest.LeaveStatus.REJECTED) {
                        Map<String, Object> a = new HashMap<>();
                        a.put("id", "leave-" + l.getId());
                        a.put("type", "LEAVE");
                        a.put("status", "REJECTED");
                        a.put("title", "Leave Request Rejected ❌");
                        a.put("message", "Your leave application for " + l.getStartDate() + " to " + l.getEndDate() + " was REJECTED.");
                        a.put("remarks", l.getAdminRemarks() != null ? l.getAdminRemarks() : "Please contact class teacher or school office.");
                        a.put("date", l.getAppliedDate() != null ? l.getAppliedDate().toString() : "");
                        a.put("urgency", "DANGER");
                        alerts.add(a);
                    }
                }

                // 2. PTM status alerts
                List<PtmAppointment> ptms = ptmAppointmentRepository.findByStudentIdOrderByAppointmentDateDesc(sId);
                for (PtmAppointment p : ptms) {
                    String tName = p.getTeacher() != null ? p.getTeacher().getFullName() : "Faculty";
                    if (p.getStatus() == PtmAppointment.PtmStatus.ACCEPTED || p.getStatus() == PtmAppointment.PtmStatus.SCHEDULED) {
                        Map<String, Object> a = new HashMap<>();
                        a.put("id", "ptm-" + p.getId());
                        a.put("type", "PTM");
                        a.put("status", "ACCEPTED");
                        a.put("title", "PTM Slot Confirmed 🗓️");
                        a.put("message", "Meeting with " + tName + " is CONFIRMED for " + p.getAppointmentDate() + " (" + (p.getTimeSlot() != null ? p.getTimeSlot() : "10:00 AM") + ").");
                        a.put("remarks", p.getAdminRemarks() != null ? p.getAdminRemarks() : (p.getNotes() != null ? p.getNotes() : "Please be punctual."));
                        a.put("date", p.getAppointmentDate().toString());
                        a.put("urgency", "INFO");
                        alerts.add(a);
                    } else if (p.getStatus() == PtmAppointment.PtmStatus.REJECTED || p.getStatus() == PtmAppointment.PtmStatus.CANCELLED) {
                        Map<String, Object> a = new HashMap<>();
                        a.put("id", "ptm-" + p.getId());
                        a.put("type", "PTM");
                        a.put("status", "REJECTED");
                        a.put("title", "PTM Request Declined / Cancelled ⚠️");
                        a.put("message", "PTM slot with " + tName + " for " + p.getAppointmentDate() + " was not accepted.");
                        a.put("remarks", p.getAdminRemarks() != null ? p.getAdminRemarks() : "Faculty unavailable during selected slot.");
                        a.put("date", p.getAppointmentDate().toString());
                        a.put("urgency", "WARNING");
                        alerts.add(a);
                    }
                }

                // 3. Assignment resubmission requests
                List<AssignmentSubmission> subs = assignmentSubmissionRepository.findByStudentId(sId);
                for (AssignmentSubmission sub : subs) {
                    if ("NEEDS_RESUBMISSION".equalsIgnoreCase(sub.getStatus()) || "NEEDS_REVISION".equalsIgnoreCase(sub.getStatus())) {
                        Map<String, Object> a = new HashMap<>();
                        a.put("id", "asg-" + sub.getId());
                        a.put("type", "ASSIGNMENT");
                        a.put("status", "NEEDS_RESUBMISSION");
                        a.put("title", "Assignment Resubmission Requested ⚠️");
                        String asgTitle = sub.getAssignment() != null ? sub.getAssignment().getTitle() : "Assignment";
                        a.put("message", "Teacher requested revision for: " + asgTitle);
                        a.put("remarks", sub.getFeedback() != null ? sub.getFeedback() : "Please check feedback and re-upload solution.");
                        a.put("date", sub.getSubmissionDate() != null ? sub.getSubmissionDate().toString() : "");
                        a.put("urgency", "WARNING");
                        alerts.add(a);
                    }
                }

                // 4. Daily Cover Substitution Alerts for Student's Class
                if (s.getSchoolClass() != null) {
                    List<TeacherSubstitution> studentSubs = teacherSubstitutionRepository.findByDateAndSchoolClassId(LocalDate.now(), s.getSchoolClass().getId());
                    for (TeacherSubstitution sub : studentSubs) {
                        Map<String, Object> a = new HashMap<>();
                        a.put("id", "sub-" + sub.getId());
                        a.put("type", "SUBSTITUTION");
                        a.put("status", "ACTIVE");
                        a.put("title", "🔁 Daily Cover Teacher Today");
                        String subName = sub.getSubstituteTeacher() != null ? sub.getSubstituteTeacher().getFullName() : "Cover Faculty";
                        String subjName = sub.getSubject() != null ? sub.getSubject().getName() : "Period Slot";
                        a.put("message", "Period (" + subjName + ") will be conducted today by Cover Teacher: " + subName + ".");
                        a.put("remarks", "Assigned by Academic Administration for daily cover.");
                        a.put("date", sub.getDate().toString());
                        a.put("urgency", "INFO");
                        alerts.add(a);
                    }
                }
            }
        } else if ("TEACHER".equalsIgnoreCase(effectiveRole) || finalTeacherId != null) {
            Teacher t = finalTeacherId != null ? teacherRepository.findById(finalTeacherId)
                    .orElseGet(() -> teacherRepository.findByUserId(finalTeacherId).orElse(null)) : null;
            Long tId = t != null ? t.getId() : finalTeacherId;

            if (tId != null) {
                // 1. Daily Cover Substitution Assignments for Teacher Today
                List<TeacherSubstitution> teacherCovers = teacherSubstitutionRepository.findByDateAndSubstituteTeacherId(LocalDate.now(), tId);
                for (TeacherSubstitution sub : teacherCovers) {
                    Map<String, Object> a = new HashMap<>();
                    a.put("id", "sub-cover-" + sub.getId());
                    a.put("type", "SUBSTITUTION");
                    a.put("status", "ASSIGNED");
                    a.put("title", "⚡ Daily Cover Assignment Today!");
                    String cName = sub.getSchoolClass() != null ? sub.getSchoolClass().getName() : "Assigned Class";
                    String subjName = sub.getSubject() != null ? sub.getSubject().getName() : "Subject";
                    String absName = sub.getAbsentTeacher() != null ? sub.getAbsentTeacher().getFullName() : "Absent Teacher";
                    a.put("message", "You are assigned to cover Class " + cName + " (" + subjName + ") for absent faculty " + absName + " today.");
                    a.put("remarks", "Please report to classroom at scheduled period time.");
                    a.put("date", sub.getDate().toString());
                    a.put("urgency", "WARNING");
                    alerts.add(a);
                }
                // 1. PTM meetings with parents
                List<PtmAppointment> ptms = ptmAppointmentRepository.findByTeacherIdOrderByAppointmentDateDesc(tId);
                for (PtmAppointment p : ptms) {
                    String sName = p.getStudent() != null ? p.getStudent().getFullName() : "Student";
                    if (p.getStatus() == PtmAppointment.PtmStatus.PENDING || p.getStatus() == PtmAppointment.PtmStatus.SCHEDULED || p.getStatus() == PtmAppointment.PtmStatus.ACCEPTED) {
                        Map<String, Object> a = new HashMap<>();
                        a.put("id", "ptm-" + p.getId());
                        a.put("type", "PTM");
                        a.put("status", p.getStatus().name());
                        a.put("title", "Parent-Teacher Meeting 🗓️ (" + p.getStatus() + ")");
                        a.put("message", "PTM with parent of " + sName + " on " + p.getAppointmentDate() + " (" + (p.getTimeSlot() != null ? p.getTimeSlot() : "10:00 AM") + ")");
                        a.put("remarks", p.getNotes() != null ? p.getNotes() : "Agenda: Student academic review");
                        a.put("date", p.getAppointmentDate().toString());
                        a.put("urgency", "INFO");
                        alerts.add(a);
                    }
                }

                // 2. Pending student leaves in assigned classes
                List<TeacherClassAssignment> tClasses = teacherClassAssignmentRepository.findByTeacherId(tId);
                List<Long> classIds = tClasses.stream().map(tc -> tc.getSchoolClass().getId()).distinct().toList();
                List<LeaveRequest> allLeaves = leaveRequestRepository.findAllByOrderByAppliedDateDesc();
                for (LeaveRequest l : allLeaves) {
                    if (l.getStatus() == LeaveRequest.LeaveStatus.PENDING && l.getStudent() != null && l.getStudent().getSchoolClass() != null) {
                        if (classIds.contains(l.getStudent().getSchoolClass().getId())) {
                            Map<String, Object> a = new HashMap<>();
                            a.put("id", "leave-" + l.getId());
                            a.put("type", "LEAVE");
                            a.put("status", "PENDING");
                            a.put("title", "Student Leave Application Pending 📋");
                            a.put("message", l.getStudent().getFullName() + " (" + l.getStudent().getSchoolClass().getName() + ") applied for leave: " + l.getStartDate() + " to " + l.getEndDate());
                            a.put("remarks", l.getReason());
                            a.put("date", l.getAppliedDate() != null ? l.getAppliedDate().toString() : "");
                            a.put("urgency", "WARNING");
                            alerts.add(a);
                        }
                    }
                }
            }
        } else {
            // Management alerts
            List<LeaveRequest> pendingLeaves = leaveRequestRepository.findAllByOrderByAppliedDateDesc().stream()
                    .filter(l -> l.getStatus() == LeaveRequest.LeaveStatus.PENDING).toList();
            for (LeaveRequest l : pendingLeaves) {
                Map<String, Object> a = new HashMap<>();
                a.put("id", "leave-" + l.getId());
                a.put("type", "LEAVE");
                a.put("status", "PENDING");
                String sName = l.getStudent() != null ? l.getStudent().getFullName() : "Student";
                a.put("title", "Student Leave Approval Pending 📋");
                a.put("message", sName + " requested leave from " + l.getStartDate() + " to " + l.getEndDate());
                a.put("remarks", l.getReason());
                a.put("date", l.getAppliedDate() != null ? l.getAppliedDate().toString() : "");
                a.put("urgency", "WARNING");
                alerts.add(a);
            }

            List<PtmAppointment> pendingPtms = ptmAppointmentRepository.findAllByOrderByAppointmentDateDesc().stream()
                    .filter(p -> p.getStatus() == PtmAppointment.PtmStatus.PENDING).toList();
            for (PtmAppointment p : pendingPtms) {
                Map<String, Object> a = new HashMap<>();
                a.put("id", "ptm-" + p.getId());
                a.put("type", "PTM");
                a.put("status", "PENDING");
                String sName = p.getStudent() != null ? p.getStudent().getFullName() : "Student";
                String tName = p.getTeacher() != null ? p.getTeacher().getFullName() : "Teacher";
                a.put("title", "PTM Booking Request 🗓️");
                a.put("message", "PTM between " + sName + " and " + tName + " for " + p.getAppointmentDate());
                a.put("remarks", p.getNotes());
                a.put("date", p.getAppointmentDate().toString());
                a.put("urgency", "INFO");
                alerts.add(a);
            }
        }

        return ResponseEntity.ok(alerts);
    }

    @Data
    @com.fasterxml.jackson.annotation.JsonIgnoreProperties(ignoreUnknown = true)
    public static class CreateStudyMaterialRequest {
        private String title;
        private String description;
        private Long classId;
        private Long schoolClassId;
        private Long subjectId;
        private String subject;
        private Long teacherId;
        private String fileUrl;
        private String fileData;
        private String fileType;
        private String authorOrSource;
        private Boolean isInstituteWide;

        public Long getClassId() {
            return classId != null ? classId : schoolClassId;
        }

        public String getFileUrl() {
            return fileUrl != null ? fileUrl : fileData;
        }
    }
}
