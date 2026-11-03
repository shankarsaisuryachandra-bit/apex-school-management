package com.sms.controller;

import com.sms.model.*;
import com.sms.repository.*;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
public class AdminManagementController {

    private final UserRepository userRepository;
    private final StudentRepository studentRepository;
    private final TeacherRepository teacherRepository;
    private final SchoolClassRepository schoolClassRepository;
    private final SubjectRepository subjectRepository;
    private final TeacherClassAssignmentRepository assignmentRepository;
    private final StudentFeeRepository studentFeeRepository;
    private final ParentContactRepository parentContactRepository;
    private final PasswordEncoder passwordEncoder;
    private final ClassCurriculumSubjectRepository classCurriculumSubjectRepository;
    private final com.sms.service.SchoolComprehensiveSeederService schoolComprehensiveSeederService;

    @PostMapping("/seed-school-records")
    @PreAuthorize("hasRole('MANAGEMENT')")
    public ResponseEntity<Map<String, Object>> seedFullSchool() {
        return ResponseEntity.ok(schoolComprehensiveSeederService.seedAllSchoolData());
    }

    /**
     * List all students.
     */
    @GetMapping("/students")
    @PreAuthorize("hasRole('MANAGEMENT')")
    public ResponseEntity<List<Student>> getAllStudents() {
        return ResponseEntity.ok(studentRepository.findByIsActiveTrue());
    }

    /**
     * Add new student with safe validation, auto-generation, and rollback integrity.
     */
    @PostMapping("/students")
    @PreAuthorize("hasRole('MANAGEMENT')")
    @Transactional
    public ResponseEntity<Map<String, Object>> createStudent(@RequestBody CreateStudentRequest req) {
        if (req.getFullName() == null || req.getFullName().trim().isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("message", "Student full name is required"));
        }

        String academicYear = (req.getAcademicYear() != null && !req.getAcademicYear().trim().isEmpty())
                ? req.getAcademicYear().trim()
                : "2025-2026";

        // Determine Admission Number (auto-generate if blank)
        String admissionNumber = (req.getAdmissionNumber() != null && !req.getAdmissionNumber().trim().isEmpty())
                ? req.getAdmissionNumber().trim().toUpperCase()
                : generateAdmissionNumber();

        if (studentRepository.findByAdmissionNumber(admissionNumber).isPresent()) {
            return ResponseEntity.badRequest().body(Map.of("message", "Admission Number '" + admissionNumber + "' already exists. Please choose a different number."));
        }

        // Determine Username (auto-generate if blank)
        String username = (req.getUsername() != null && !req.getUsername().trim().isEmpty())
                ? req.getUsername().trim().toLowerCase()
                : generateUsername(req.getFullName());

        if (userRepository.existsByUsername(username)) {
            return ResponseEntity.badRequest().body(Map.of("message", "Username '" + username + "' is already in use. Please choose another username."));
        }

        // 1. Create User
        String rawPassword = (req.getPassword() != null && !req.getPassword().trim().isEmpty())
                ? req.getPassword().trim()
                : "student123";

        User user = User.builder()
                .username(username)
                .passwordHash(passwordEncoder.encode(rawPassword))
                .role(User.Role.STUDENT)
                .isActive(true)
                .build();
        user = userRepository.save(user);

        // 2. Resolve Class
        SchoolClass schoolClass = null;
        if (req.getClassId() != null) {
            schoolClass = schoolClassRepository.findById(req.getClassId()).orElse(null);
        }

        // Parse Date of Birth safely
        LocalDate dob = null;
        if (req.getDateOfBirth() != null && !req.getDateOfBirth().trim().isEmpty()) {
            try {
                dob = LocalDate.parse(req.getDateOfBirth().trim());
                LocalDate minDate = LocalDate.now().minusYears(40);
                LocalDate maxDate = LocalDate.now().minusYears(2);
                if (dob.isAfter(maxDate) || dob.isBefore(minDate)) {
                    return ResponseEntity.badRequest().body(Map.of("message", "Date of birth must represent a valid student age between 2 and 40 years. Provided: " + dob));
                }
            } catch (java.time.format.DateTimeParseException ex) {
                return ResponseEntity.badRequest().body(Map.of("message", "Invalid date of birth format. Please provide YYYY-MM-DD."));
            }
        }

        // Parse Gender safely
        Student.Gender gender = Student.Gender.MALE;
        if (req.getGender() != null && !req.getGender().trim().isEmpty()) {
            try {
                gender = Student.Gender.valueOf(req.getGender().trim().toUpperCase());
            } catch (Exception ignored) {
                gender = Student.Gender.OTHER;
            }
        }

        // 3. Create Student
        Student student = Student.builder()
                .user(user)
                .fullName(req.getFullName().trim())
                .admissionNumber(admissionNumber)
                .schoolClass(schoolClass)
                .dateOfBirth(dob)
                .gender(gender)
                .address(req.getAddress())
                .admissionDate(LocalDate.now())
                .academicYear(academicYear)
                .isActive(true)
                .build();
        student = studentRepository.save(student);

        // 4. Create Parent Contact if info provided
        if ((req.getParentName() != null && !req.getParentName().trim().isEmpty()) ||
            (req.getParentPhone() != null && !req.getParentPhone().trim().isEmpty())) {
            ParentContact parent = ParentContact.builder()
                    .student(student)
                    .relation(ParentContact.Relation.FATHER)
                    .name(req.getParentName() != null && !req.getParentName().trim().isEmpty() ? req.getParentName().trim() : "Parent / Guardian")
                    .phone(req.getParentPhone() != null ? req.getParentPhone().trim() : "")
                    .email(req.getParentEmail() != null ? req.getParentEmail().trim() : null)
                    .whatsappNumber(req.getParentPhone() != null ? req.getParentPhone().trim() : "")
                    .build();
            parentContactRepository.save(parent);
        }

        // 5. Initialize Student Fee Record
        BigDecimal prevPending = req.getEffectivePreviousPendingFee();
        BigDecimal currentDue = req.getAnnualFee() != null ? req.getAnnualFee() : new BigDecimal("45000.00");
        if (currentDue.compareTo(BigDecimal.ZERO) < 0 || currentDue.compareTo(new BigDecimal("5000000")) > 0) {
            return ResponseEntity.badRequest().body(Map.of("message", "Annual fee must be in the permitted range [0, 5,000,000]. Provided: " + currentDue));
        }
        if (prevPending != null && (prevPending.compareTo(BigDecimal.ZERO) < 0 || prevPending.compareTo(new BigDecimal("5000000")) > 0)) {
            return ResponseEntity.badRequest().body(Map.of("message", "Previous pending fee must be in the permitted range [0, 5,000,000]. Provided: " + prevPending));
        }
        StudentFee fee = StudentFee.builder()
                .student(student)
                .academicYear(academicYear)
                .currentYearDue(currentDue)
                .previousYearPending(prevPending)
                .totalPaid(BigDecimal.ZERO)
                .status(StudentFee.FeeStatus.UNPAID)
                .build();
        studentFeeRepository.save(fee);

        return ResponseEntity.ok(Map.of(
                "message", "Student registered successfully",
                "studentId", student.getId(),
                "admissionNumber", student.getAdmissionNumber(),
                "username", user.getUsername()
        ));
    }

    /**
     * Update student details.
     */
    @PutMapping("/students/{id}")
    @PreAuthorize("hasRole('MANAGEMENT')")
    @Transactional
    public ResponseEntity<Map<String, Object>> updateStudent(
            @PathVariable Long id,
            @RequestBody CreateStudentRequest req) {
        Student student = studentRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Student not found: " + id));

        if (req.getFullName() != null && !req.getFullName().trim().isEmpty()) {
            student.setFullName(req.getFullName().trim());
        }

        if (req.getClassId() != null) {
            SchoolClass sc = schoolClassRepository.findById(req.getClassId()).orElse(null);
            student.setSchoolClass(sc);
        }

        if (req.getDateOfBirth() != null && !req.getDateOfBirth().trim().isEmpty()) {
            try {
                LocalDate dob = LocalDate.parse(req.getDateOfBirth().trim());
                LocalDate minDate = LocalDate.now().minusYears(40);
                LocalDate maxDate = LocalDate.now().minusYears(2);
                if (dob.isAfter(maxDate) || dob.isBefore(minDate)) {
                    return ResponseEntity.badRequest().body(Map.of("message", "Date of birth must represent a valid student age between 2 and 40 years. Provided: " + dob));
                }
                student.setDateOfBirth(dob);
            } catch (java.time.format.DateTimeParseException ex) {
                return ResponseEntity.badRequest().body(Map.of("message", "Invalid date of birth format. Please provide YYYY-MM-DD."));
            }
        }

        if (req.getGender() != null && !req.getGender().trim().isEmpty()) {
            try {
                student.setGender(Student.Gender.valueOf(req.getGender().trim().toUpperCase()));
            } catch (Exception ignored) {}
        }

        if (req.getAddress() != null) {
            student.setAddress(req.getAddress());
        }

        studentRepository.save(student);

        // Update Parent Contact if exists or create
        if (req.getParentName() != null || req.getParentPhone() != null) {
            ParentContact parent = parentContactRepository.findByStudentId(student.getId()).stream().findFirst().orElse(null);
            if (parent != null) {
                if (req.getParentName() != null) parent.setName(req.getParentName());
                if (req.getParentPhone() != null) {
                    parent.setPhone(req.getParentPhone());
                    parent.setWhatsappNumber(req.getParentPhone());
                }
                if (req.getParentEmail() != null) parent.setEmail(req.getParentEmail());
                parentContactRepository.save(parent);
            }
        }

        return ResponseEntity.ok(Map.of("message", "Student details updated successfully"));
    }

    /**
     * Delete / deactivate student.
     */
    @DeleteMapping("/students/{id}")
    @PreAuthorize("hasRole('MANAGEMENT')")
    @Transactional
    public ResponseEntity<Map<String, String>> deleteStudent(@PathVariable Long id) {
        Student student = studentRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Student not found: " + id));

        student.setIsActive(false);
        if (student.getUser() != null) {
            student.getUser().setIsActive(false);
            userRepository.save(student.getUser());
        }
        studentRepository.save(student);
        return ResponseEntity.ok(Map.of("message", "Student deactivated successfully"));
    }

    private String generateAdmissionNumber() {
        long count = studentRepository.count() + 1;
        String candidate = String.format("ADM2025%03d", count);
        while (studentRepository.findByAdmissionNumber(candidate).isPresent()) {
            count++;
            candidate = String.format("ADM2025%03d", count);
        }
        return candidate;
    }

    private String generateUsername(String fullName) {
        String base = (fullName != null ? fullName : "student")
                .toLowerCase()
                .replaceAll("[^a-z0-9]", "");
        if (base.isEmpty()) base = "student";
        String candidate = base;
        int suffix = 1;
        while (userRepository.existsByUsername(candidate)) {
            candidate = base + suffix;
            suffix++;
        }
        return candidate;
    }

    /**
     * List all teachers.
     */
    @GetMapping("/teachers")
    @PreAuthorize("hasRole('MANAGEMENT')")
    public ResponseEntity<List<Teacher>> getAllTeachers() {
        return ResponseEntity.ok(teacherRepository.findAll());
    }

    /**
     * List all classes for current academic year.
     */
    @GetMapping("/classes")
    @PreAuthorize("hasRole('MANAGEMENT')")
    public ResponseEntity<List<SchoolClass>> getAllClasses(
            @RequestParam(defaultValue = "2025-2026") String academicYear) {
        return ResponseEntity.ok(schoolClassRepository.findByAcademicYearOrderBySortOrderAsc(academicYear));
    }

    /**
     * List all subjects.
     */
    @GetMapping("/subjects")
    @PreAuthorize("hasRole('MANAGEMENT')")
    public ResponseEntity<List<Subject>> getAllSubjects() {
        return ResponseEntity.ok(subjectRepository.findAll());
    }

    /**
     * Add new teacher.
     */
    @PostMapping("/teachers")
    @PreAuthorize("hasRole('MANAGEMENT')")
    public ResponseEntity<Map<String, Object>> createTeacher(@RequestBody CreateTeacherRequest req) {
        if (userRepository.existsByUsername(req.getUsername())) {
            return ResponseEntity.badRequest().body(Map.of("message", "Username already exists"));
        }

        User user = User.builder()
                .username(req.getUsername().trim())
                .passwordHash(passwordEncoder.encode(req.getPassword() != null ? req.getPassword() : "teacher123"))
                .role(User.Role.TEACHER)
                .isActive(true)
                .build();
        user = userRepository.save(user);

        Teacher teacher = Teacher.builder()
                .user(user)
                .fullName(req.getFullName())
                .employeeId(req.getEmployeeId())
                .phone(req.getPhone())
                .email(req.getEmail())
                .qualification(req.getQualification())
                .dateOfJoining(LocalDate.now())
                .build();
        teacher = teacherRepository.save(teacher);

        return ResponseEntity.ok(Map.of(
                "message", "Teacher created successfully",
                "teacherId", teacher.getId(),
                "employeeId", teacher.getEmployeeId()
        ));
    }

    /**
     * Add new class section.
     */
    @PostMapping("/classes")
    @PreAuthorize("hasRole('MANAGEMENT')")
    public ResponseEntity<SchoolClass> createClass(@RequestBody SchoolClass schoolClass) {
        if (schoolClass.getAcademicYear() == null) schoolClass.setAcademicYear("2025-2026");
        return ResponseEntity.ok(schoolClassRepository.save(schoolClass));
    }

    /**
     * Add new subject.
     */
    @PostMapping("/subjects")
    @PreAuthorize("hasRole('MANAGEMENT')")
    public ResponseEntity<Subject> createSubject(@RequestBody Subject subject) {
        return ResponseEntity.ok(subjectRepository.save(subject));
    }

    /**
     * Assign Class Teacher for a class section.
     */
    @PutMapping("/classes/{classId}/class-teacher")
    @PreAuthorize("hasRole('MANAGEMENT')")
    public ResponseEntity<Map<String, Object>> assignClassTeacher(
            @PathVariable Long classId,
            @RequestParam(required = false) Long teacherId) {
        SchoolClass schoolClass = schoolClassRepository.findById(classId)
                .orElseThrow(() -> new RuntimeException("Class not found"));

        if (teacherId != null && teacherId > 0) {
            Teacher teacher = teacherRepository.findById(teacherId)
                    .orElseThrow(() -> new RuntimeException("Teacher not found"));
            schoolClass.setClassTeacher(teacher);
        } else {
            schoolClass.setClassTeacher(null);
        }

        schoolClassRepository.save(schoolClass);
        return ResponseEntity.ok(Map.of(
                "message", "Class Teacher assigned successfully",
                "classId", classId,
                "classTeacherName", schoolClass.getClassTeacher() != null ? schoolClass.getClassTeacher().getFullName() : "None"
        ));
    }

    /**
     * Update class name, section, and sort order.
     */
    @PutMapping("/classes/{id}")
    @PreAuthorize("hasRole('MANAGEMENT')")
    public ResponseEntity<SchoolClass> updateClass(@PathVariable Long id, @RequestBody SchoolClass req) {
        SchoolClass schoolClass = schoolClassRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Class not found: " + id));

        if (req.getName() != null) schoolClass.setName(req.getName());
        if (req.getSection() != null) schoolClass.setSection(req.getSection());
        if (req.getSortOrder() != null) schoolClass.setSortOrder(req.getSortOrder());
        if (req.getAcademicYear() != null) schoolClass.setAcademicYear(req.getAcademicYear());

        return ResponseEntity.ok(schoolClassRepository.save(schoolClass));
    }

    /**
    /**
     * Delete a class section safely with cascading cleanup of assignments and curriculum records.
     */
    @DeleteMapping("/classes/{id}")
    @PreAuthorize("hasRole('MANAGEMENT')")
    @Transactional
    public ResponseEntity<Map<String, Object>> deleteClass(@PathVariable Long id) {
        SchoolClass schoolClass = schoolClassRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Class not found: " + id));

        // Check if active students are in this class
        long activeStudents = studentRepository.countBySchoolClassIdAndIsActiveTrue(id);
        if (activeStudents > 0) {
            return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "message", "Cannot delete " + schoolClass.getName() + " (" + schoolClass.getSection() + ") because " + activeStudents + " active student(s) are currently enrolled. Please transfer or promote them first."
            ));
        }

        // Delete associated teacher assignments
        assignmentRepository.deleteBySchoolClassId(id);

        // Delete associated class curriculum records
        classCurriculumSubjectRepository.deleteBySchoolClassId(id);

        // Delete class
        schoolClassRepository.delete(schoolClass);

        return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "Grade / Class '" + schoolClass.getName() + " (" + schoolClass.getSection() + ")' deleted successfully"
        ));
    }

    /**
     * Get all teacher subject assignments for a year.
     */
    @GetMapping("/teacher-assignments")
    @PreAuthorize("hasRole('MANAGEMENT')")
    public ResponseEntity<List<TeacherClassAssignment>> getAllTeacherAssignments(
            @RequestParam(defaultValue = "2025-2026") String academicYear) {
        return ResponseEntity.ok(assignmentRepository.findAll().stream()
                .filter(a -> academicYear.equals(a.getAcademicYear()))
                .toList());
    }

    /**
     * Delete a teacher subject assignment.
     */
    @DeleteMapping("/assign-teacher/{id}")
    @PreAuthorize("hasRole('MANAGEMENT')")
    public ResponseEntity<Map<String, String>> deleteTeacherAssignment(@PathVariable Long id) {
        assignmentRepository.deleteById(id);
        return ResponseEntity.ok(Map.of("message", "Assignment removed successfully"));
    }

    /**
     * Assign teacher to class and subject (allows multiple co-teachers for the same subject).
     */
    @PostMapping("/assign-teacher")
    @PreAuthorize("hasRole('MANAGEMENT')")
    @Transactional
    public ResponseEntity<Map<String, Object>> assignTeacher(@RequestBody AssignTeacherRequest req) {
        Teacher teacher = teacherRepository.findById(req.getTeacherId())
                .orElseThrow(() -> new RuntimeException("Teacher not found"));
        SchoolClass schoolClass = schoolClassRepository.findById(req.getClassId())
                .orElseThrow(() -> new RuntimeException("Class not found"));
        Subject subject = subjectRepository.findById(req.getSubjectId())
                .orElseThrow(() -> new RuntimeException("Subject not found"));

        String year = req.getAcademicYear() != null ? req.getAcademicYear() : "2025-2026";

        List<TeacherClassAssignment> existingForSubject = assignmentRepository
                .findBySchoolClassIdAndSubjectIdAndAcademicYear(schoolClass.getId(), subject.getId(), year);

        // Check if THIS exact teacher is already assigned to this subject in this class
        boolean alreadyAssigned = existingForSubject.stream()
                .anyMatch(a -> a.getTeacher().getId().equals(teacher.getId()));

        if (alreadyAssigned) {
            return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "message", teacher.getFullName() + " is already assigned to " + subject.getName() + " in " + schoolClass.getName() + " (" + schoolClass.getSection() + ")"
            ));
        }

        // Ensure this class curriculum subject is marked offered
        Optional<ClassCurriculumSubject> ccsOpt = classCurriculumSubjectRepository
                .findBySchoolClassIdAndSubjectIdAndAcademicYear(schoolClass.getId(), subject.getId(), year);
        ClassCurriculumSubject ccs = ccsOpt.orElseGet(() -> ClassCurriculumSubject.builder()
                .schoolClass(schoolClass)
                .subject(subject)
                .academicYear(year)
                .build());
        ccs.setIsOffered(true);
        classCurriculumSubjectRepository.save(ccs);

        // Save new assignment without removing existing teachers (enabling multiple teachers!)
        TeacherClassAssignment assignment = TeacherClassAssignment.builder()
                .teacher(teacher)
                .schoolClass(schoolClass)
                .subject(subject)
                .academicYear(year)
                .build();

        assignmentRepository.save(assignment);

        int totalTeachers = existingForSubject.size() + 1;
        return ResponseEntity.ok(Map.of(
                "success", true,
                "message", teacher.getFullName() + " assigned to " + subject.getName() + " (" + totalTeachers + " faculty now assigned)",
                "assignmentId", assignment.getId(),
                "totalAssigned", totalTeachers
        ));
    }

    /**
     * Unassign teacher from class and subject. If teacherId is provided, unassigns only that specific teacher.
     */
    @PostMapping("/unassign-teacher")
    @PreAuthorize("hasRole('MANAGEMENT')")
    @Transactional
    public ResponseEntity<Map<String, String>> unassignTeacher(@RequestBody Map<String, Object> req) {
        Long classId = Long.valueOf(req.get("classId").toString());
        Long subjectId = Long.valueOf(req.get("subjectId").toString());
        String year = req.get("academicYear") != null ? req.get("academicYear").toString() : "2025-2026";

        if (req.get("teacherId") != null && !req.get("teacherId").toString().isEmpty()) {
            Long teacherId = Long.valueOf(req.get("teacherId").toString());
            List<TeacherClassAssignment> match = assignmentRepository
                    .findBySchoolClassIdAndSubjectIdAndAcademicYear(classId, subjectId, year)
                    .stream()
                    .filter(a -> a.getTeacher().getId().equals(teacherId))
                    .toList();
            assignmentRepository.deleteAll(match);
            return ResponseEntity.ok(Map.of("message", "Teacher unassigned from class subject successfully"));
        }

        assignmentRepository.deleteBySchoolClassIdAndSubjectIdAndAcademicYear(classId, subjectId, year);
        return ResponseEntity.ok(Map.of("message", "All faculty unassigned from class subject successfully"));
    }

    /**
     * Update User Credentials (Username & Password) for any user account.
     */
    @PutMapping("/users/{userId}/credentials")
    @PreAuthorize("hasRole('MANAGEMENT')")
    public ResponseEntity<Map<String, String>> updateUserCredentials(
            @PathVariable Long userId,
            @RequestBody UpdateCredentialsRequest req) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User account not found"));

        if (req.getUsername() != null && !req.getUsername().trim().isEmpty()) {
            String newUsername = req.getUsername().trim();
            if (!newUsername.equals(user.getUsername()) && userRepository.existsByUsername(newUsername)) {
                return ResponseEntity.badRequest().body(Map.of("message", "Username '" + newUsername + "' is already taken"));
            }
            user.setUsername(newUsername);
        }

        if (req.getPassword() != null && !req.getPassword().trim().isEmpty()) {
            user.setPasswordHash(passwordEncoder.encode(req.getPassword().trim()));
        }

        userRepository.save(user);

        return ResponseEntity.ok(Map.of(
                "message", "Login credentials updated successfully for user '" + user.getUsername() + "'"
        ));
    }

    /**
     * Get curriculum subjects for all classes (auto-seeds defaults if empty)
     */
    @GetMapping("/class-curriculum")
    @PreAuthorize("hasRole('MANAGEMENT')")
    @Transactional
    public ResponseEntity<List<ClassCurriculumSubject>> getClassCurriculum(
            @RequestParam(defaultValue = "2025-2026") String academicYear) {
        List<ClassCurriculumSubject> list = classCurriculumSubjectRepository.findByAcademicYear(academicYear);
        if (list.isEmpty()) {
            List<SchoolClass> allClasses = schoolClassRepository.findByAcademicYearOrderBySortOrderAsc(academicYear);
            List<Subject> allSubjects = subjectRepository.findAll();
            List<TeacherClassAssignment> assignments = assignmentRepository.findAll();

            for (SchoolClass cls : allClasses) {
                Set<Long> assignedSubIds = assignments.stream()
                        .filter(a -> a.getSchoolClass() != null && a.getSchoolClass().getId().equals(cls.getId()) && a.getSubject() != null)
                        .map(a -> a.getSubject().getId())
                        .collect(Collectors.toSet());

                for (Subject sub : allSubjects) {
                    boolean offered = assignedSubIds.contains(sub.getId());
                    if (assignedSubIds.isEmpty()) {
                        String sName = sub.getName().toLowerCase();
                        offered = sName.contains("english") || sName.contains("math") || sName.contains("science") || sName.contains("hindi");
                    }
                    if (offered) {
                        ClassCurriculumSubject ccs = ClassCurriculumSubject.builder()
                                .schoolClass(cls)
                                .subject(sub)
                                .academicYear(academicYear)
                                .isOffered(true)
                                .weeklyPeriods(5)
                                .build();
                        classCurriculumSubjectRepository.save(ccs);
                        list.add(ccs);
                    }
                }
            }
        }
        return ResponseEntity.ok(list);
    }

    /**
     * Toggle whether a subject is offered in a specific class curriculum
     */
    @PostMapping("/class-curriculum/toggle")
    @PreAuthorize("hasRole('MANAGEMENT')")
    @Transactional
    public ResponseEntity<Map<String, Object>> toggleClassCurriculumSubject(@RequestBody ToggleCurriculumRequest req) {
        String year = req.getAcademicYear() != null ? req.getAcademicYear() : "2025-2026";
        Optional<ClassCurriculumSubject> opt = classCurriculumSubjectRepository
                .findBySchoolClassIdAndSubjectIdAndAcademicYear(req.getClassId(), req.getSubjectId(), year);

        boolean nowOffered;
        if (opt.isPresent()) {
            ClassCurriculumSubject existing = opt.get();
            nowOffered = (req.getIsOffered() != null) ? req.getIsOffered() : !existing.getIsOffered();
            existing.setIsOffered(nowOffered);
            classCurriculumSubjectRepository.save(existing);
        } else {
            SchoolClass cls = schoolClassRepository.findById(req.getClassId())
                    .orElseThrow(() -> new RuntimeException("Class not found"));
            Subject sub = subjectRepository.findById(req.getSubjectId())
                    .orElseThrow(() -> new RuntimeException("Subject not found"));
            nowOffered = (req.getIsOffered() != null) ? req.getIsOffered() : true;
            ClassCurriculumSubject ccs = ClassCurriculumSubject.builder()
                    .schoolClass(cls)
                    .subject(sub)
                    .academicYear(year)
                    .isOffered(nowOffered)
                    .weeklyPeriods(5)
                    .build();
            classCurriculumSubjectRepository.save(ccs);
        }

        // If toggled OFF, also remove any teacher assignment for this class & subject
        if (!nowOffered) {
            assignmentRepository.deleteBySchoolClassIdAndSubjectIdAndAcademicYear(req.getClassId(), req.getSubjectId(), year);
        }

        return ResponseEntity.ok(Map.of(
                "success", true,
                "classId", req.getClassId(),
                "subjectId", req.getSubjectId(),
                "isOffered", nowOffered,
                "message", nowOffered ? "Subject added to class curriculum" : "Subject removed from class curriculum"
        ));
    }

    /**
     * Allocate or reallocate teacher(s) directly from grid cell (with curriculum toggle & multi-teacher support)
     */
    @PostMapping("/allocate-cell")
    @PreAuthorize("hasRole('MANAGEMENT')")
    @Transactional
    public ResponseEntity<Map<String, Object>> allocateGridCell(@RequestBody AllocateCellRequest req) {
        String year = req.getAcademicYear() != null ? req.getAcademicYear() : "2025-2026";
        SchoolClass schoolClass = schoolClassRepository.findById(req.getClassId())
                .orElseThrow(() -> new RuntimeException("Class not found"));
        Subject subject = subjectRepository.findById(req.getSubjectId())
                .orElseThrow(() -> new RuntimeException("Subject not found"));

        // 1. Update Curriculum status
        boolean isOffered = req.getIsOffered() != null ? req.getIsOffered() : true;
        Optional<ClassCurriculumSubject> ccsOpt = classCurriculumSubjectRepository
                .findBySchoolClassIdAndSubjectIdAndAcademicYear(schoolClass.getId(), subject.getId(), year);

        ClassCurriculumSubject ccs = ccsOpt.orElseGet(() -> ClassCurriculumSubject.builder()
                .schoolClass(schoolClass)
                .subject(subject)
                .academicYear(year)
                .build());
        ccs.setIsOffered(isOffered);
        classCurriculumSubjectRepository.save(ccs);

        // 2. Resolve Target Teachers
        List<Long> targetTeacherIds = new ArrayList<>();
        if (req.getTeacherIds() != null) {
            targetTeacherIds.addAll(req.getTeacherIds().stream().filter(id -> id != null && id > 0).toList());
        } else if (req.getTeacherId() != null && req.getTeacherId() > 0) {
            targetTeacherIds.add(req.getTeacherId());
        }

        // If not offered or target list is empty, remove all teachers for this subject in this class
        if (!isOffered || targetTeacherIds.isEmpty()) {
            assignmentRepository.deleteBySchoolClassIdAndSubjectIdAndAcademicYear(schoolClass.getId(), subject.getId(), year);
            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "isOffered", isOffered,
                    "teacherAssigned", false,
                    "assignedCount", 0,
                    "message", !isOffered ? "Subject marked as Not Offered for this class" : "All faculty unassigned from class subject"
            ));
        }

        // Existing assignments for this class and subject
        List<TeacherClassAssignment> existingAssigns = assignmentRepository
                .findBySchoolClassIdAndSubjectIdAndAcademicYear(schoolClass.getId(), subject.getId(), year);

        // Remove assignments for teachers no longer in targetTeacherIds
        List<TeacherClassAssignment> toRemove = existingAssigns.stream()
                .filter(a -> !targetTeacherIds.contains(a.getTeacher().getId()))
                .toList();
        if (!toRemove.isEmpty()) {
            assignmentRepository.deleteAll(toRemove);
        }

        // Add assignments for new teachers in targetTeacherIds
        Set<Long> alreadyAssigned = existingAssigns.stream()
                .map(a -> a.getTeacher().getId())
                .collect(Collectors.toSet());

        List<String> teacherNames = new ArrayList<>();
        for (Long tId : targetTeacherIds) {
            Teacher teacher = teacherRepository.findById(tId).orElse(null);
            if (teacher != null) {
                teacherNames.add(teacher.getFullName());
                if (!alreadyAssigned.contains(tId)) {
                    TeacherClassAssignment newAssignment = TeacherClassAssignment.builder()
                            .teacher(teacher)
                            .schoolClass(schoolClass)
                            .subject(subject)
                            .academicYear(year)
                            .build();
                    assignmentRepository.save(newAssignment);
                }
            }
        }

        return ResponseEntity.ok(Map.of(
                "success", true,
                "isOffered", true,
                "teacherAssigned", true,
                "assignedCount", teacherNames.size(),
                "teacherNames", teacherNames,
                "message", String.join(", ", teacherNames) + " allocated to " + schoolClass.getName() + " (" + schoolClass.getSection() + ") for " + subject.getName()
        ));
    }

    /**
     * Get teachers who teach each subject across the institution.
     */
    @GetMapping("/subject-teachers")
    @PreAuthorize("hasRole('MANAGEMENT')")
    public ResponseEntity<Map<Long, List<Teacher>>> getSubjectTeachers(
            @RequestParam(defaultValue = "2025-2026") String academicYear) {
        List<TeacherClassAssignment> assignments = assignmentRepository.findAll().stream()
                .filter(a -> academicYear.equals(a.getAcademicYear()))
                .toList();

        Map<Long, Set<Teacher>> map = new HashMap<>();
        for (TeacherClassAssignment a : assignments) {
            if (a.getSubject() != null && a.getTeacher() != null) {
                map.computeIfAbsent(a.getSubject().getId(), k -> new LinkedHashSet<>()).add(a.getTeacher());
            }
        }

        Map<Long, List<Teacher>> result = new HashMap<>();
        map.forEach((k, v) -> result.put(k, new ArrayList<>(v)));
        return ResponseEntity.ok(result);
    }

    @Data
    public static class ToggleCurriculumRequest {
        private Long classId;
        private Long subjectId;
        private Boolean isOffered;
        private String academicYear;
    }

    @Data
    public static class AllocateCellRequest {
        private Long classId;
        private Long subjectId;
        private Long teacherId;
        private List<Long> teacherIds;
        private Boolean isOffered;
        private String academicYear;
    }

    @Data
    public static class UpdateCredentialsRequest {
        private String username;
        private String password;
    }

    @Data
    public static class CreateTeacherRequest {
        private String fullName;
        private String username;
        private String password;
        private String employeeId;
        private String phone;
        private String email;
        private String qualification;
    }

    @Data
    public static class CreateStudentRequest {
        private String fullName;
        private String username;
        private String password;
        private String admissionNumber;
        private Long classId;
        private String dateOfBirth;
        private String gender;
        private String address;
        private String parentName;
        private String parentPhone;
        private String parentEmail;
        private BigDecimal annualFee;
        private BigDecimal previousPendingFee;
        private BigDecimal previousYearPending;
        private String academicYear;

        public BigDecimal getEffectivePreviousPendingFee() {
            if (previousPendingFee != null && previousPendingFee.compareTo(BigDecimal.ZERO) > 0) {
                return previousPendingFee;
            }
            if (previousYearPending != null && previousYearPending.compareTo(BigDecimal.ZERO) > 0) {
                return previousYearPending;
            }
            return BigDecimal.ZERO;
        }
    }

    @Data
    public static class AssignTeacherRequest {
        private Long teacherId;
        private Long classId;
        private Long subjectId;
        private String academicYear;
    }
}

