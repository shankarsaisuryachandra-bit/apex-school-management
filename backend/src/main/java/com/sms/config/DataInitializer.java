package com.sms.config;

import com.sms.model.*;
import com.sms.repository.*;
import com.sms.model.cms.SchoolInfo;
import com.sms.repository.cms.SchoolInfoRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@Component
@RequiredArgsConstructor
@Slf4j
public class DataInitializer implements CommandLineRunner {

    private final UserRepository userRepository;
    private final ManagementProfileRepository managementProfileRepository;
    private final TeacherRepository teacherRepository;
    private final StudentRepository studentRepository;
    private final ParentContactRepository parentContactRepository;
    private final SchoolClassRepository schoolClassRepository;
    private final SubjectRepository subjectRepository;
    private final TeacherClassAssignmentRepository assignmentRepository;
    private final NoticeRepository noticeRepository;
    private final StudentFeeRepository studentFeeRepository;
    private final TransportRouteRepository transportRouteRepository;
    private final TransportNotificationRepository transportNotificationRepository;
    private final TransportBoardingLogRepository transportBoardingLogRepository;
    private final LibraryBookRepository libraryBookRepository;
    private final SchoolInfoRepository schoolInfoRepository;
    private final com.sms.repository.cms.GalleryMediaRepository galleryMediaRepository;
    private final PasswordEncoder passwordEncoder;
    private final AssignmentRepository classAssignmentRepository;
    private final AssignmentSubmissionRepository assignmentSubmissionRepository;
    private final StudyMaterialRepository studyMaterialRepository;
    private final PtmAppointmentRepository ptmAppointmentRepository;
    private final LeaveRequestRepository leaveRequestRepository;
    private final AppNotificationRepository appNotificationRepository;
    private final org.springframework.jdbc.core.JdbcTemplate jdbcTemplate;
    private final com.sms.service.SchoolComprehensiveSeederService schoolComprehensiveSeederService;

    @Override
    public void run(String... args) throws Exception {
        cleanupLegacyConstraints();
        initAdminUser();
        initSampleTeacherAndStudent();
        initParentUserAndNotifications();
        initAssignments();
        initNotices();
        initTransportAndLibrary();
        initCampusGallery();
        initStudyMaterialsAndAlerts();

        // Comprehensive school seeding: Classes 1-12, 60 students per class, faculty, timetable, assignments
        try {
            schoolComprehensiveSeederService.seedAllSchoolData();
        } catch (Exception e) {
            log.error("Error running comprehensive school seeder: {}", e.getMessage(), e);
        }
    }

    private void cleanupLegacyConstraints() {
        if (jdbcTemplate != null) {
            try {
                java.util.List<String> userConstraints = jdbcTemplate.queryForList(
                    "SELECT CONSTRAINT_NAME FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS WHERE TABLE_NAME IN ('USERS', 'USER') AND CONSTRAINT_TYPE = 'CHECK'",
                    String.class
                );
                for (String cName : userConstraints) {
                    jdbcTemplate.execute("ALTER TABLE users DROP CONSTRAINT IF EXISTS " + cName);
                }
            } catch (Exception e) {
                log.warn("Cleanup user check constraints: {}", e.getMessage());
            }

            try {
                java.util.List<String> ptmConstraints = jdbcTemplate.queryForList(
                    "SELECT CONSTRAINT_NAME FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS WHERE TABLE_NAME = 'PTM_APPOINTMENTS' AND CONSTRAINT_TYPE = 'CHECK'",
                    String.class
                );
                for (String cName : ptmConstraints) {
                    jdbcTemplate.execute("ALTER TABLE ptm_appointments DROP CONSTRAINT " + cName);
                }
            } catch (Exception e) {
                log.warn("Cleanup ptm constraints: {}", e.getMessage());
            }

            try {
                java.util.List<String> leaveConstraints = jdbcTemplate.queryForList(
                    "SELECT CONSTRAINT_NAME FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS WHERE TABLE_NAME = 'LEAVE_REQUESTS' AND CONSTRAINT_TYPE = 'CHECK'",
                    String.class
                );
                for (String cName : leaveConstraints) {
                    jdbcTemplate.execute("ALTER TABLE leave_requests DROP CONSTRAINT " + cName);
                }
            } catch (Exception e) {
                log.warn("Cleanup leave constraints: {}", e.getMessage());
            }

            try {
                jdbcTemplate.execute("DROP INDEX IF EXISTS UKFH0R5SFDT16UDYW5QUF5SYVWH_INDEX_2");
                jdbcTemplate.execute("DROP INDEX IF EXISTS UK_ATTENDANCE_STUDENT_DATE");
            } catch (Exception e) {
                log.warn("Drop index: {}", e.getMessage());
            }

            try {
                java.util.List<String> attendanceConstraints = jdbcTemplate.queryForList(
                    "SELECT CONSTRAINT_NAME FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS WHERE TABLE_NAME IN ('ATTENDANCE', 'ATTENDANCES') AND CONSTRAINT_TYPE = 'UNIQUE'",
                    String.class
                );
                for (String cName : attendanceConstraints) {
                    jdbcTemplate.execute("ALTER TABLE attendance DROP CONSTRAINT IF EXISTS " + cName);
                }
            } catch (Exception e) {
                log.warn("Cleanup attendance constraints: {}", e.getMessage());
            }

            try {
                java.util.List<String> uniqueIndexes = jdbcTemplate.queryForList(
                    "SELECT INDEX_NAME FROM INFORMATION_SCHEMA.INDEXES WHERE TABLE_NAME IN ('ATTENDANCE', 'ATTENDANCES') AND NON_UNIQUE = FALSE AND INDEX_TYPE_NAME <> 'PRIMARY KEY'",
                    String.class
                );
                for (String idxName : uniqueIndexes) {
                    jdbcTemplate.execute("DROP INDEX IF EXISTS " + idxName);
                }
            } catch (Exception e) {
                log.warn("Cleanup attendance indexes: {}", e.getMessage());
            }

            try {
                java.util.List<String> feeConstraints = jdbcTemplate.queryForList(
                    "SELECT CONSTRAINT_NAME FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS WHERE TABLE_NAME IN ('PAYMENT_HISTORY', 'payment_history') AND CONSTRAINT_TYPE = 'CHECK'",
                    String.class
                );
                for (String cName : feeConstraints) {
                    jdbcTemplate.execute("ALTER TABLE payment_history DROP CONSTRAINT IF EXISTS " + cName);
                }
                jdbcTemplate.execute("ALTER TABLE payment_history ALTER COLUMN payment_mode VARCHAR(50)");
            } catch (Exception e) {
                log.warn("Cleanup payment_history constraints: {}", e.getMessage());
            }
        }
    }

    private void initAdminUser() {
        // 1. Root Super Admin (Full Oversight)
        User admin = userRepository.findByUsername("admin").orElse(null);
        if (admin == null) {
            admin = User.builder()
                    .username("admin")
                    .passwordHash(passwordEncoder.encode("admin123"))
                    .role(User.Role.MANAGEMENT)
                    .staffRole("SUPER_ADMIN")
                    .permissions("*")
                    .isActive(true)
                    .build();
            admin = userRepository.save(admin);

            ManagementProfile profile = ManagementProfile.builder()
                    .user(admin)
                    .fullName("System Administrator")
                    .designation("Principal & Director")
                    .phone("+1 555-0100")
                    .email("principal@apex-academy.edu")
                    .build();
            managementProfileRepository.save(profile);
            log.info("Initialized default management admin account (admin / admin123)");
        } else {
            admin.setPasswordHash(passwordEncoder.encode("admin123"));
            admin.setStaffRole("SUPER_ADMIN");
            admin.setPermissions("*");
            admin.setIsActive(true);
            userRepository.save(admin);
            log.info("Updated admin password hash and super_admin role for admin123");
        }

        // 2. Sample Staff: Bursar / Chief Accountant (Fees, Payroll, Inventory)
        User bursar = userRepository.findByUsername("bursar").orElse(null);
        if (bursar == null) {
            bursar = User.builder()
                    .username("bursar")
                    .passwordHash(passwordEncoder.encode("admin123"))
                    .role(User.Role.MANAGEMENT)
                    .staffRole("ACCOUNTANT")
                    .permissions("DASHBOARD,FEES,PAYROLL,INVENTORY,AUDIT_LOGS")
                    .isActive(true)
                    .build();
            bursar = userRepository.save(bursar);

            ManagementProfile profile = ManagementProfile.builder()
                    .user(bursar)
                    .fullName("Marcus Vance")
                    .designation("Chief Bursar & Accounts Officer")
                    .phone("+1 555-0145")
                    .email("bursar@apex-academy.edu")
                    .build();
            managementProfileRepository.save(profile);
            log.info("Initialized staff bursar account (bursar / admin123)");
        } else {
            bursar.setPasswordHash(passwordEncoder.encode("admin123"));
            bursar.setStaffRole("ACCOUNTANT");
            bursar.setPermissions("DASHBOARD,FEES,PAYROLL,INVENTORY,AUDIT_LOGS");
            bursar.setIsActive(true);
            userRepository.save(bursar);
        }

        // 3. Sample Staff: Chief Librarian (E-Library, Inventory, Events)
        User librarian = userRepository.findByUsername("librarian").orElse(null);
        if (librarian == null) {
            librarian = User.builder()
                    .username("librarian")
                    .passwordHash(passwordEncoder.encode("admin123"))
                    .role(User.Role.MANAGEMENT)
                    .staffRole("LIBRARIAN")
                    .permissions("DASHBOARD,LIBRARY,INVENTORY,EVENTS")
                    .isActive(true)
                    .build();
            librarian = userRepository.save(librarian);

            ManagementProfile profile = ManagementProfile.builder()
                    .user(librarian)
                    .fullName("Clara Higgins")
                    .designation("Senior Head Librarian")
                    .phone("+1 555-0188")
                    .email("library@apex-academy.edu")
                    .build();
            managementProfileRepository.save(profile);
            log.info("Initialized staff librarian account (librarian / admin123)");
        } else {
            librarian.setPasswordHash(passwordEncoder.encode("admin123"));
            librarian.setStaffRole("LIBRARIAN");
            librarian.setPermissions("DASHBOARD,LIBRARY,INVENTORY,EVENTS");
            librarian.setIsActive(true);
            userRepository.save(librarian);
        }

        // 4. Sample Staff: Admissions & Registrar Officer
        User registrar = userRepository.findByUsername("registrar").orElse(null);
        if (registrar == null) {
            registrar = User.builder()
                    .username("registrar")
                    .passwordHash(passwordEncoder.encode("admin123"))
                    .role(User.Role.MANAGEMENT)
                    .staffRole("REGISTRAR")
                    .permissions("DASHBOARD,STUDENTS,PROMOTIONS,CLASSES,ADMIT_CARDS,EVENTS,ALUMNI")
                    .isActive(true)
                    .build();
            registrar = userRepository.save(registrar);

            ManagementProfile profile = ManagementProfile.builder()
                    .user(registrar)
                    .fullName("Eleanor Vance")
                    .designation("Registrar & Admissions Officer")
                    .phone("+1 555-0192")
                    .email("admissions@apex-academy.edu")
                    .build();
            managementProfileRepository.save(profile);
            log.info("Initialized staff registrar account (registrar / admin123)");
        } else {
            registrar.setPasswordHash(passwordEncoder.encode("admin123"));
            registrar.setStaffRole("REGISTRAR");
            registrar.setPermissions("DASHBOARD,STUDENTS,PROMOTIONS,CLASSES,ADMIT_CARDS,EVENTS,ALUMNI");
            registrar.setIsActive(true);
            userRepository.save(registrar);
        }

        // 5. Dedicated Bus Operator Sub-Logins (Department of Transport)
        User bus01 = userRepository.findByUsername("bus01").orElse(null);
        if (bus01 == null) {
            bus01 = User.builder()
                    .username("bus01")
                    .passwordHash(passwordEncoder.encode("bus123"))
                    .role(User.Role.BUS_OPERATOR)
                    .staffRole("BUS_OPERATOR")
                    .permissions("TRANSPORT,BUS_CONSOLE,GPS_TRACKER")
                    .isActive(true)
                    .build();
            userRepository.save(bus01);
            log.info("Initialized Bus 01 operator sub-login (bus01 / bus123)");
        } else {
            bus01.setPasswordHash(passwordEncoder.encode("bus123"));
            bus01.setRole(User.Role.BUS_OPERATOR);
            bus01.setStaffRole("BUS_OPERATOR");
            userRepository.save(bus01);
        }

        User bus02 = userRepository.findByUsername("bus02").orElse(null);
        if (bus02 == null) {
            bus02 = User.builder()
                    .username("bus02")
                    .passwordHash(passwordEncoder.encode("bus123"))
                    .role(User.Role.BUS_OPERATOR)
                    .staffRole("BUS_OPERATOR")
                    .permissions("TRANSPORT,BUS_CONSOLE,GPS_TRACKER")
                    .isActive(true)
                    .build();
            userRepository.save(bus02);
            log.info("Initialized Bus 02 operator sub-login (bus02 / bus123)");
        } else {
            bus02.setPasswordHash(passwordEncoder.encode("bus123"));
            bus02.setRole(User.Role.BUS_OPERATOR);
            bus02.setStaffRole("BUS_OPERATOR");
            userRepository.save(bus02);
        }

        User transportOfficer = userRepository.findByUsername("transport_officer").orElse(null);
        if (transportOfficer == null) {
            transportOfficer = User.builder()
                    .username("transport_officer")
                    .passwordHash(passwordEncoder.encode("transport123"))
                    .role(User.Role.MANAGEMENT)
                    .staffRole("TRANSPORT_OFFICER")
                    .permissions("DASHBOARD,TRANSPORT,INVENTORY")
                    .isActive(true)
                    .build();
            userRepository.save(transportOfficer);
            log.info("Initialized Transport Officer account (transport_officer / transport123)");
        }
    }

    private void initSampleTeacherAndStudent() {
        String academicYear = "2025-2026";

        // 1. Teacher account (teacher1 / teacher123)
        User teacherUser = userRepository.findByUsername("teacher1").orElse(null);
        Teacher teacher = null;
        if (teacherUser == null) {
            teacherUser = User.builder()
                    .username("teacher1")
                    .passwordHash(passwordEncoder.encode("teacher123"))
                    .role(User.Role.TEACHER)
                    .isActive(true)
                    .build();
            teacherUser = userRepository.save(teacherUser);

            String empId = teacherRepository.findByEmployeeId("T101").isPresent() ? "T" + (System.currentTimeMillis() % 10000) : "T101";
            teacher = Teacher.builder()
                    .user(teacherUser)
                    .fullName("Sarah Jenkins")
                    .employeeId(empId)
                    .phone("9876543210")
                    .email("sarah.jenkins@school.edu")
                    .qualification("M.Sc. Mathematics")
                    .dateOfJoining(LocalDate.of(2020, 6, 1))
                    .build();
            teacher = teacherRepository.save(teacher);
            log.info("Initialized sample teacher account (teacher1 / teacher123)");
        } else {
            teacherUser.setPasswordHash(passwordEncoder.encode("teacher123"));
            userRepository.save(teacherUser);
            teacher = teacherRepository.findByUserId(teacherUser.getId()).orElse(null);
        }

        // 2. Class & Subject Assignment for Teacher
        SchoolClass grade10 = schoolClassRepository
                .findByNameAndSectionAndAcademicYear("Grade 10", "A", academicYear)
                .orElse(null);
        Subject math = subjectRepository.findByCode("MATH").orElse(null);

        if (teacher != null && grade10 != null && math != null) {
            boolean exists = assignmentRepository
                    .existsByTeacherIdAndSchoolClassIdAndAcademicYear(teacher.getId(), grade10.getId(), academicYear);
            if (!exists) {
                TeacherClassAssignment assignment = TeacherClassAssignment.builder()
                        .teacher(teacher)
                        .schoolClass(grade10)
                        .subject(math)
                        .academicYear(academicYear)
                        .build();
                assignmentRepository.save(assignment);
                log.info("Assigned teacher1 to Grade 10 A — Mathematics");
            }
        }

        // 3. Student account (student1 / student123)
        User studentUser = userRepository.findByUsername("student1").orElse(null);
        if (studentUser == null) {
            studentUser = User.builder()
                    .username("student1")
                    .passwordHash(passwordEncoder.encode("student123"))
                    .role(User.Role.STUDENT)
                    .isActive(true)
                    .build();
            studentUser = userRepository.save(studentUser);

            Student student = Student.builder()
                    .user(studentUser)
                    .fullName("Alex Morgan")
                    .admissionNumber("ADM2025001")
                    .schoolClass(grade10)
                    .dateOfBirth(LocalDate.of(2010, 5, 15))
                    .gender(Student.Gender.MALE)
                    .address("123 Education Lane, Tech City")
                    .admissionDate(LocalDate.of(2025, 4, 1))
                    .academicYear(academicYear)
                    .isActive(true)
                    .build();
            student = studentRepository.save(student);

            // Parent contact
            ParentContact parent = ParentContact.builder()
                    .student(student)
                    .relation(ParentContact.Relation.FATHER)
                    .name("Robert Morgan")
                    .phone("9876500000")
                    .email("robert.morgan@gmail.com")
                    .whatsappNumber("919876500000")
                    .build();
            parentContactRepository.save(parent);

            // Student Fee Record
            StudentFee fee = StudentFee.builder()
                    .student(student)
                    .academicYear(academicYear)
                    .currentYearDue(new BigDecimal("45000.00"))
                    .previousYearPending(new BigDecimal("5000.00"))
                    .totalPaid(new BigDecimal("20000.00"))
                    .status(StudentFee.FeeStatus.PARTIAL)
                    .build();
            studentFeeRepository.save(fee);

            log.info("Initialized sample student account (student1 / student123)");
        }

        // Ensure student has class assigned and is active if created previously
        Student existingStudent = studentRepository.findByAdmissionNumber("ADM2025001").orElse(null);
        if (existingStudent != null) {
            existingStudent.setIsActive(true);
            if (existingStudent.getSchoolClass() == null || (grade10 != null && !grade10.getId().equals(existingStudent.getSchoolClass().getId()))) {
                existingStudent.setSchoolClass(grade10);
            }
            studentRepository.save(existingStudent);
            log.info("Ensured Alex Morgan is active and linked to Grade 10");
        }
    }

    private void initAssignments() {
        if (classAssignmentRepository.count() == 0) {
            SchoolClass grade10 = schoolClassRepository.findAll().stream()
                    .filter(c -> "Grade 10".equalsIgnoreCase(c.getName()))
                    .findFirst().orElse(null);
            Subject math = subjectRepository.findAll().stream()
                    .filter(s -> "Maths".equalsIgnoreCase(s.getName()))
                    .findFirst().orElse(null);
            Teacher teacher = teacherRepository.findAll().stream().findFirst().orElse(null);
            Student student = studentRepository.findByAdmissionNumber("ADM2025001").orElse(null);

            if (grade10 != null && math != null && teacher != null) {
                com.sms.model.Assignment asg = com.sms.model.Assignment.builder()
                        .schoolClass(grade10)
                        .subject(math)
                        .teacher(teacher)
                        .title("Algebra & Quadratic Equations - Unit 3 Assignment")
                        .instructions("Please solve all exercises from 3.1 to 3.5. Show all working steps clearly on paper, and upload your completed solution as a PDF or clear photograph. Late submissions will have points deducted.")
                        .fileUrl("/uploads/sample_math_assignment.png")
                        .dueDate(LocalDate.now().plusDays(4))
                        .maxMarks(100)
                        .createdDate(LocalDate.now().minusDays(1))
                        .build();
                asg = classAssignmentRepository.save(asg);
                log.info("Initialized sample assignment: {}", asg.getTitle());

                if (student != null) {
                    com.sms.model.AssignmentSubmission submission = com.sms.model.AssignmentSubmission.builder()
                            .assignment(asg)
                            .student(student)
                            .fileUrl("/uploads/sample_math_submission.png")
                            .status("SUBMITTED")
                            .submissionDate(LocalDate.now())
                            .build();
                    assignmentSubmissionRepository.save(submission);
                    log.info("Initialized sample student submission for Alex Morgan");
                }
            }
        }
    }

    private void initNotices() {
        if (noticeRepository.count() == 0) {
            User admin = userRepository.findByUsername("admin").orElse(null);
            Notice n1 = Notice.builder()
                    .title("Annual Sports Meet 2025-2026")
                    .content("The Annual Sports Meet is scheduled for next Friday. All students are required to register with their respective physical education teachers.")
                    .audience(Notice.Audience.ALL)
                    .postedBy(admin)
                    .build();

            Notice n2 = Notice.builder()
                    .title("First Periodic Assessments Schedule")
                    .content("Periodic Assessments FA1 start from the 15th of this month. Please check your student portal for exam dates and subject syllabus.")
                    .audience(Notice.Audience.STUDENTS)
                    .postedBy(admin)
                    .build();

            noticeRepository.saveAll(java.util.List.of(n1, n2));
            log.info("Initialized sample school notice announcements");
        }
    }

    private void initTransportAndLibrary() {
        if (transportRouteRepository.count() < 4 || transportRouteRepository.findAll().stream().anyMatch(r -> r.getHardwareDeviceId() == null)) {
            List<Student> allStudents = studentRepository.findAll();
            for (Student s : allStudents) {
                s.setTransportRoute(null);
            }
            studentRepository.saveAll(allStudents);
            studentRepository.flush();

            transportNotificationRepository.deleteAll();
            transportNotificationRepository.flush();

            transportBoardingLogRepository.deleteAll();
            transportBoardingLogRepository.flush();

            transportRouteRepository.deleteAll();
            transportRouteRepository.flush();

            TransportRoute r1 = TransportRoute.builder()
                    .routeName("Route 1 — Northern Metro & Hillside Corridor")
                    .busNumber("BUS-01 (Apex Eagle)")
                    .plateNumber("DL-01-AX-9942")
                    .hardwareDeviceId("GPS-APEX-01")
                    .isIgnitionOn(true)
                    .tripStatus("IN_TRANSIT")
                    .tripStartTime("06:45 AM")
                    .sourceName("Greenfield Heights Terminal")
                    .destinationName("Apex International Main Quadrangle")
                    .operatorUsername("bus01")
                    .driverName("Capt. Rajesh Sharma")
                    .driverPhone("+91 98765 43210")
                    .driverLicense("DL-COMM-2021-99881")
                    .conductorName("Suresh Kumar")
                    .conductorPhone("+91 98765 43211")
                    .monthlyFee(new BigDecimal("2400.00"))
                    .capacity(45)
                    .currentStatus("IN_TRANSIT")
                    .currentSpeedKmh(42)
                    .fuelLevelPercent(84)
                    .currentLat(28.6448)
                    .currentLng(77.2167)
                    .heading(142.0)
                    .gpsAccuracyMeters(4.0)
                    .isBroadcasting(true)
                    .nextStop("Civil Lines Metro Interchange")
                    .nextStopEtaMinutes(4)
                    .morningDepartureTime("06:45 AM")
                    .morningArrivalTime("07:50 AM")
                    .eveningDepartureTime("03:15 PM")
                    .eveningArrivalTime("04:30 PM")
                    .emergencyStatus("NORMAL")
                    .stopsJson("[{\"id\":1,\"name\":\"Greenfield Heights Gate 2\",\"time\":\"06:50 AM\",\"lat\":28.665,\"lng\":77.205,\"students\":8},{\"id\":2,\"name\":\"St. Xavier Circle\",\"time\":\"07:05 AM\",\"lat\":28.652,\"lng\":77.210,\"students\":12},{\"id\":3,\"name\":\"Civil Lines Metro Interchange\",\"time\":\"07:20 AM\",\"lat\":28.640,\"lng\":77.218,\"students\":9},{\"id\":4,\"name\":\"Diplomatic Avenue Point\",\"time\":\"07:35 AM\",\"lat\":28.625,\"lng\":77.228,\"students\":7},{\"id\":5,\"name\":\"Apex International Main Quadrangle\",\"time\":\"07:50 AM\",\"lat\":28.610,\"lng\":77.235,\"students\":0}]")
                    .build();

            TransportRoute r2 = TransportRoute.builder()
                    .routeName("Route 2 — South City & Tech Park Express")
                    .busNumber("BUS-02 (Apex Falcon)")
                    .plateNumber("DL-02-BX-8819")
                    .hardwareDeviceId("GPS-APEX-02")
                    .isIgnitionOn(true)
                    .tripStatus("IN_TRANSIT")
                    .tripStartTime("06:30 AM")
                    .sourceName("Prestige Cyber Enclave")
                    .destinationName("Apex International Main Quadrangle")
                    .operatorUsername("bus02")
                    .driverName("Mahesh Verma")
                    .driverPhone("+91 98765 43220")
                    .driverLicense("DL-COMM-2019-44321")
                    .conductorName("Ramesh Rao")
                    .conductorPhone("+91 98765 43221")
                    .monthlyFee(new BigDecimal("2800.00"))
                    .capacity(40)
                    .currentStatus("IN_TRANSIT")
                    .currentSpeedKmh(38)
                    .fuelLevelPercent(78)
                    .currentLat(28.5355)
                    .currentLng(77.2410)
                    .heading(95.0)
                    .gpsAccuracyMeters(3.5)
                    .isBroadcasting(true)
                    .nextStop("Cyber City Crossing")
                    .nextStopEtaMinutes(6)
                    .morningDepartureTime("06:30 AM")
                    .morningArrivalTime("07:45 AM")
                    .eveningDepartureTime("03:15 PM")
                    .eveningArrivalTime("04:40 PM")
                    .emergencyStatus("NORMAL")
                    .stopsJson("[{\"id\":1,\"name\":\"Prestige Cyber Enclave\",\"time\":\"06:40 AM\",\"lat\":28.510,\"lng\":77.230,\"students\":10},{\"id\":2,\"name\":\"Cyber City Crossing\",\"time\":\"07:00 AM\",\"lat\":28.530,\"lng\":77.240,\"students\":14},{\"id\":3,\"name\":\"Royal Palm Boulevard\",\"time\":\"07:20 AM\",\"lat\":28.565,\"lng\":77.238,\"students\":8},{\"id\":4,\"name\":\"Heritage Clock Tower\",\"time\":\"07:35 AM\",\"lat\":28.590,\"lng\":77.236,\"students\":5},{\"id\":5,\"name\":\"Apex International Main Quadrangle\",\"time\":\"07:45 AM\",\"lat\":28.610,\"lng\":77.235,\"students\":0}]")
                    .build();

            TransportRoute r3 = TransportRoute.builder()
                    .routeName("Route 3 — Eastern Riverside & Lakeview Link")
                    .busNumber("BUS-03 (Apex Arrow)")
                    .plateNumber("DL-03-CX-7703")
                    .hardwareDeviceId("GPS-APEX-03")
                    .isIgnitionOn(false)
                    .tripStatus("IDLE_AT_CAMPUS")
                    .sourceName("Riverside Orchid Villas")
                    .destinationName("Apex International Main Quadrangle")
                    .driverName("Gurpreet Singh")
                    .driverPhone("+91 98765 43230")
                    .driverLicense("DL-COMM-2022-77112")
                    .conductorName("Amit Joshi")
                    .conductorPhone("+91 98765 43231")
                    .monthlyFee(new BigDecimal("2200.00"))
                    .capacity(50)
                    .currentStatus("AT_CAMPUS")
                    .currentSpeedKmh(0)
                    .fuelLevelPercent(92)
                    .currentLat(28.6100)
                    .currentLng(77.2350)
                    .nextStop("Campus Depot (Arrived)")
                    .nextStopEtaMinutes(0)
                    .morningDepartureTime("06:40 AM")
                    .morningArrivalTime("07:45 AM")
                    .eveningDepartureTime("03:15 PM")
                    .eveningArrivalTime("04:25 PM")
                    .emergencyStatus("NORMAL")
                    .stopsJson("[{\"id\":1,\"name\":\"Riverside Orchid Villas\",\"time\":\"06:50 AM\",\"lat\":28.630,\"lng\":77.280,\"students\":11},{\"id\":2,\"name\":\"Lakeview Promenade Gate 1\",\"time\":\"07:10 AM\",\"lat\":28.620,\"lng\":77.260,\"students\":15},{\"id\":3,\"name\":\"Mayur Vihar Bridge Point\",\"time\":\"07:25 AM\",\"lat\":28.615,\"lng\":77.248,\"students\":9},{\"id\":4,\"name\":\"Apex International Main Quadrangle\",\"time\":\"07:45 AM\",\"lat\":28.610,\"lng\":77.235,\"students\":0}]")
                    .build();

            TransportRoute r4 = TransportRoute.builder()
                    .routeName("Route 4 — West Suburban & Cantonment Shuttle")
                    .busNumber("BUS-04 (Apex Phoenix)")
                    .plateNumber("DL-04-DX-6651")
                    .hardwareDeviceId("GPS-APEX-04")
                    .isIgnitionOn(false)
                    .tripStatus("IDLE_AT_CAMPUS")
                    .sourceName("Officers Enclave Gate 4")
                    .destinationName("Apex International Main Quadrangle")
                    .driverName("Vikram Rathore")
                    .driverPhone("+91 98765 43240")
                    .driverLicense("DL-COMM-2020-55299")
                    .conductorName("Manoj Tiwari")
                    .conductorPhone("+91 98765 43241")
                    .monthlyFee(new BigDecimal("2600.00"))
                    .capacity(35)
                    .currentStatus("IN_TRANSIT")
                    .currentSpeedKmh(48)
                    .fuelLevelPercent(65)
                    .currentLat(28.5800)
                    .currentLng(77.1600)
                    .nextStop("Cantonment North Gate")
                    .nextStopEtaMinutes(3)
                    .morningDepartureTime("06:35 AM")
                    .morningArrivalTime("07:50 AM")
                    .eveningDepartureTime("03:15 PM")
                    .eveningArrivalTime("04:35 PM")
                    .emergencyStatus("NORMAL")
                    .stopsJson("[{\"id\":1,\"name\":\"Officers Enclave Gate 4\",\"time\":\"06:45 AM\",\"lat\":28.550,\"lng\":77.140,\"students\":7},{\"id\":2,\"name\":\"Cantonment North Gate\",\"time\":\"07:05 AM\",\"lat\":28.575,\"lng\":77.158,\"students\":10},{\"id\":3,\"name\":\"Dhaula Kuan Interchange\",\"time\":\"07:25 AM\",\"lat\":28.592,\"lng\":77.185,\"students\":8},{\"id\":4,\"name\":\"Apex International Main Quadrangle\",\"time\":\"07:50 AM\",\"lat\":28.610,\"lng\":77.235,\"students\":0}]")
                    .build();

            List<TransportRoute> savedRoutes = transportRouteRepository.saveAll(java.util.List.of(r1, r2, r3, r4));
            log.info("Initialized 4 high-capacity GPS bus fleet routes with waypoints & telemetry");

            // Assign sample students to Route 1 and Route 2
            List<Student> students = studentRepository.findAll();
            if (!students.isEmpty() && savedRoutes.size() >= 2) {
                Student s1 = students.get(0);
                s1.setTransportRoute(savedRoutes.get(0));
                s1.setBusStop("St. Xavier Circle");
                studentRepository.save(s1);

                if (students.size() > 1) {
                    Student s2 = students.get(1);
                    s2.setTransportRoute(savedRoutes.get(0));
                    s2.setBusStop("Civil Lines Metro Interchange");
                    studentRepository.save(s2);
                }

                if (students.size() > 2) {
                    Student s3 = students.get(2);
                    s3.setTransportRoute(savedRoutes.get(1));
                    s3.setBusStop("Cyber City Crossing");
                    studentRepository.save(s3);
                }
                log.info("Assigned sample scholars to bus routes and waypoint stops");

                // Seed sample notifications for s1
                TransportNotification startNotif = TransportNotification.builder()
                        .routeId(savedRoutes.get(0).getId())
                        .studentId(s1.getId())
                        .notificationType("TRIP_STARTED_AT_SCHOOL")
                        .title("🚌 School Bus Started at Campus (BUS-01)")
                        .message("Bus BUS-01 (Apex Eagle) has started its trip at school (06:45 AM). Please get ready at your boarding stop: St. Xavier Circle.")
                        .stopName("St. Xavier Circle")
                        .createdAt(java.time.LocalDateTime.now().minusMinutes(12))
                        .build();

                TransportNotification proxNotif = TransportNotification.builder()
                        .routeId(savedRoutes.get(0).getId())
                        .studentId(s1.getId())
                        .notificationType("PROXIMITY_10_MIN_AWAY")
                        .title("🔔 Bus 10 Mins Away: BUS-01 (Apex Eagle)")
                        .message("Your bus BUS-01 is approx 10 minutes away (~1.5 km) from your boarding stop (St. Xavier Circle). Please proceed to your boarding point!")
                        .stopName("St. Xavier Circle")
                        .etaMinutes(10)
                        .createdAt(java.time.LocalDateTime.now().minusMinutes(4))
                        .build();

                transportNotificationRepository.saveAll(java.util.List.of(startNotif, proxNotif));
            }
        }

        if (libraryBookRepository.count() == 0) {
            LibraryBook b1 = LibraryBook.builder()
                    .title("Concepts of Physics — Vol 1")
                    .author("H.C. Verma")
                    .isbn("978-8177091877")
                    .category("Physics")
                    .totalCopies(15)
                    .availableCopies(12)
                    .build();

            LibraryBook b2 = LibraryBook.builder()
                    .title("Mathematics for Class 10")
                    .author("R.D. Sharma")
                    .isbn("978-9351448834")
                    .category("Mathematics")
                    .totalCopies(20)
                    .availableCopies(18)
                    .build();

            libraryBookRepository.saveAll(java.util.List.of(b1, b2));
            log.info("Initialized sample library books");
        }
    }

    private void initCampusGallery() {
        if (galleryMediaRepository.count() == 0) {
            com.sms.model.cms.GalleryMedia g1 = com.sms.model.cms.GalleryMedia.builder()
                    .title("Main Academic Block & Quadrangle")
                    .mediaUrl("/classic_school_hero.png")
                    .mediaType(com.sms.model.cms.GalleryMedia.MediaType.IMAGE)
                    .category("Campus")
                    .build();

            com.sms.model.cms.GalleryMedia g2 = com.sms.model.cms.GalleryMedia.builder()
                    .title("Smart Interactive Classroom")
                    .mediaUrl("https://images.unsplash.com/photo-1580582932707-520aed937b7b?auto=format&fit=crop&w=800&q=80")
                    .mediaType(com.sms.model.cms.GalleryMedia.MediaType.IMAGE)
                    .category("Classrooms")
                    .build();

            com.sms.model.cms.GalleryMedia g3 = com.sms.model.cms.GalleryMedia.builder()
                    .title("Advanced Chemistry & Science Lab")
                    .mediaUrl("https://images.unsplash.com/photo-1532094349884-543bc11b234d?auto=format&fit=crop&w=800&q=80")
                    .mediaType(com.sms.model.cms.GalleryMedia.MediaType.IMAGE)
                    .category("Laboratories")
                    .build();

            com.sms.model.cms.GalleryMedia g4 = com.sms.model.cms.GalleryMedia.builder()
                    .title("Institutional Sports Field & Athletics Track")
                    .mediaUrl("https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&w=800&q=80")
                    .mediaType(com.sms.model.cms.GalleryMedia.MediaType.IMAGE)
                    .category("Playground")
                    .build();

            com.sms.model.cms.GalleryMedia g5 = com.sms.model.cms.GalleryMedia.builder()
                    .title("Central Digital Library & Reading Hall")
                    .mediaUrl("https://images.unsplash.com/photo-1521587760476-6c12a4b040da?auto=format&fit=crop&w=800&q=80")
                    .mediaType(com.sms.model.cms.GalleryMedia.MediaType.IMAGE)
                    .category("Library")
                    .build();

            com.sms.model.cms.GalleryMedia g6 = com.sms.model.cms.GalleryMedia.builder()
                    .title("Student Computer Science & Robotics Studio")
                    .mediaUrl("https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=800&q=80")
                    .mediaType(com.sms.model.cms.GalleryMedia.MediaType.IMAGE)
                    .category("Laboratories")
                    .build();

            galleryMediaRepository.saveAll(java.util.List.of(g1, g2, g3, g4, g5, g6));
            log.info("Initialized sample campus gallery items");
        }

        initMultiTenantProfiles();
    }

    private void initMultiTenantProfiles() {
        if (schoolInfoRepository.count() <= 1) {
            schoolInfoRepository.deleteAll();
            schoolInfoRepository.flush();

            SchoolInfo s1 = SchoolInfo.builder()
                    .schoolName("Apex International Academy")
                    .tagline("Excellence in Education & Character Building")
                    .address("123 Academic Enclave, Education Knowledge City")
                    .phone("+91 98765 43210")
                    .email("admin@apexacademy.edu")
                    .principalName("Dr. E. Vance")
                    .affiliation("CBSE Affiliation Code: 1998004")
                    .tenantSlug("apex-academy")
                    .primaryColor("#0F2942")
                    .accentColor("#D97706")
                    .trustBadge1("CBSE Affiliated")
                    .trustBadge2("100% Board Pass Rate")
                    .trustBadge3("Robotics & STEM Labs")
                    .trustBadge4("GPS Bus Fleet")
                    .ctaPrimaryLabel("Enter Institutional Portals")
                    .ctaSecondaryLabel("View Academic Divisions")
                    .footerTagline("Designed with Classic Institutional Architecture.")
                    .upiId("apexschool.fee@upi")
                    .build();

            SchoolInfo s2 = SchoolInfo.builder()
                    .schoolName("St. Xavier Higher Secondary College")
                    .tagline("Faith, Excellence & Academic Heritage")
                    .address("78 Heritage Campus Square, Royal City")
                    .phone("+91 98765 11223")
                    .email("info@stxaviers.edu")
                    .principalName("Rev. Fr. Augustine")
                    .affiliation("ICSE & State Board Accreditation")
                    .tenantSlug("st-xaviers")
                    .primaryColor("#8B0000")
                    .accentColor("#E6C200")
                    .trustBadge1("ICSE Accredited")
                    .trustBadge2("Top 10 State Rank")
                    .trustBadge3("Classical Arts & Sports")
                    .trustBadge4("Digital Smart Campus")
                    .ctaPrimaryLabel("Access Student Gateway")
                    .ctaSecondaryLabel("Explore Campus Divisions")
                    .footerTagline("Empowering generations through values and leadership.")
                    .upiId("stxaviers.fee@upi")
                    .build();

            SchoolInfo s3 = SchoolInfo.builder()
                    .schoolName("Greenfield Global Public School")
                    .tagline("Eco-Friendly & Modern Holistic Education")
                    .address("45 Eco-Valley Road, Greenfield District")
                    .phone("+91 98765 77889")
                    .email("admissions@greenfieldglobal.edu")
                    .principalName("Dr. Sarah Jenkins")
                    .affiliation("CBSE International Curriculum")
                    .tenantSlug("greenfield")
                    .primaryColor("#064E3B")
                    .accentColor("#F59E0B")
                    .trustBadge1("Green Campus Certified")
                    .trustBadge2("International Exchange")
                    .trustBadge3("AI & Digital Labs")
                    .trustBadge4("Olympic Sports Quad")
                    .ctaPrimaryLabel("Apply for Admission")
                    .ctaSecondaryLabel("Discover Facilities")
                    .footerTagline("Inspiring young minds for a sustainable future.")
                    .upiId("greenfield.fee@upi")
                    .build();

            schoolInfoRepository.saveAllAndFlush(java.util.List.of(s1, s2, s3));
            log.info("Initialized 3 SaaS multi-tenant school client profiles");
        }
    }

    private void initStudyMaterialsAndAlerts() {
        if (studyMaterialRepository.count() == 0) {
            SchoolClass class1 = schoolClassRepository.findAll().stream().findFirst().orElse(null);
            Teacher teacher1 = teacherRepository.findAll().stream().findFirst().orElse(null);
            Subject math = subjectRepository.findAll().stream()
                    .filter(s -> s.getName().toLowerCase().contains("math")).findFirst()
                    .orElseGet(() -> subjectRepository.findAll().stream().findFirst().orElse(null));
            Subject physics = subjectRepository.findAll().stream()
                    .filter(s -> s.getName().toLowerCase().contains("physic")).findFirst().orElse(null);

            if (class1 != null && teacher1 != null && math != null) {
                StudyMaterial m1 = StudyMaterial.builder()
                        .title("Chapter 4 — Calculus & Integrals Quick Formula Sheet")
                        .description("Handwritten quick-revision formula sheet for board preparation with solved standard integrals.")
                        .schoolClass(class1)
                        .subject(math)
                        .teacher(teacher1)
                        .fileUrl("https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf")
                        .fileType("PDF")
                        .authorOrSource(teacher1.getFullName())
                        .uploadedDate(LocalDate.now().minusDays(2))
                        .build();

                StudyMaterial m2 = StudyMaterial.builder()
                        .title("Trigonometric Unit Circle & Identities Blueprint (Photo)")
                        .description("High-resolution graphic diagram of radian angles, quadrant signs, and Pythagorean trigonometric identities.")
                        .schoolClass(class1)
                        .subject(math)
                        .teacher(teacher1)
                        .fileUrl("https://images.unsplash.com/photo-1635070041078-e363dbe005cb?auto=format&fit=crop&w=800&q=80")
                        .fileType("IMAGE")
                        .authorOrSource(teacher1.getFullName())
                        .uploadedDate(LocalDate.now().minusDays(1))
                        .build();

                if (physics != null) {
                    StudyMaterial m3 = StudyMaterial.builder()
                            .title("Physics Lab Manual — Ray Optics & Reflection Experiments")
                            .description("Comprehensive experimental setup diagram, observation tables, and precautions for optical bench experiments.")
                            .schoolClass(class1)
                            .subject(physics)
                            .teacher(teacher1)
                            .fileUrl("https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf")
                            .fileType("PDF")
                            .authorOrSource(teacher1.getFullName())
                            .uploadedDate(LocalDate.now())
                            .build();

                    studyMaterialRepository.saveAll(java.util.List.of(m1, m2, m3));
                } else {
                    studyMaterialRepository.saveAll(java.util.List.of(m1, m2));
                }

                log.info("Initialized teacher study materials and notes (PDFs & Photos)");
            }
        }
    }

    private void initParentUserAndNotifications() {
        // 1. Initialize Parent account: parent1 / parent123
        User parentUser = userRepository.findByUsername("parent1").orElse(null);
        if (parentUser == null) {
            parentUser = User.builder()
                    .username("parent1")
                    .passwordHash(passwordEncoder.encode("parent123"))
                    .role(User.Role.PARENT)
                    .isActive(true)
                    .build();
            parentUser = userRepository.save(parentUser);
            log.info("Initialized default parent account (parent1 / parent123)");
        } else {
            parentUser.setPasswordHash(passwordEncoder.encode("parent123"));
            parentUser.setRole(User.Role.PARENT);
            userRepository.save(parentUser);
        }

        // Link parent user to Robert Morgan's ParentContact record for Alex Morgan
        Student alex = studentRepository.findByAdmissionNumber("ADM2025001").orElse(null);
        if (alex != null) {
            List<ParentContact> contacts = parentContactRepository.findByStudentId(alex.getId());
            if (!contacts.isEmpty()) {
                ParentContact p = contacts.get(0);
                p.setUser(parentUser);
                parentContactRepository.save(p);
            } else {
                ParentContact p = ParentContact.builder()
                        .student(alex)
                        .user(parentUser)
                        .relation(ParentContact.Relation.FATHER)
                        .name("Robert Morgan")
                        .phone("9876500000")
                        .email("robert.morgan@gmail.com")
                        .whatsappNumber("919876500000")
                        .build();
                parentContactRepository.save(p);
            }
        }

        // 2. Initialize Seed Notifications if empty
        if (appNotificationRepository.count() == 0) {
            // Parent notifications
            appNotificationRepository.save(AppNotification.builder()
                    .user(parentUser)
                    .title("🚌 Fleet Tracking: Bus #12 Route Active")
                    .message("School Bus #12 has departed campus on South Corridor. Estimated arrival at 123 Education Lane: 14 mins.")
                    .type("TRANSPORT")
                    .severity("INFO")
                    .link("/parent/attendance")
                    .isRead(false)
                    .build());

            appNotificationRepository.save(AppNotification.builder()
                    .user(parentUser)
                    .title("📄 Term II Examination Schedule Published")
                    .message("Mid-Term examinations begin Nov 10th. Grade 10 Mathematics syllabus and exam hall tickets are ready.")
                    .type("ACADEMIC")
                    .severity("INFO")
                    .link("/parent/academics")
                    .isRead(false)
                    .build());

            appNotificationRepository.save(AppNotification.builder()
                    .user(parentUser)
                    .title("💳 Term II Tuition Fee Reminder")
                    .message("Outstanding tuition balance of $25,000 for Alex Morgan is due before Oct 31.")
                    .type("FEE")
                    .severity("WARNING")
                    .link("/parent/fees")
                    .isRead(false)
                    .build());

            appNotificationRepository.save(AppNotification.builder()
                    .user(parentUser)
                    .title("🤝 PTM Appointment Confirmed")
                    .message("Parent-Teacher Conference with Mrs. Sarah Jenkins is scheduled for Friday at 03:30 PM.")
                    .type("PTM")
                    .severity("SUCCESS")
                    .link("/parent/ptm")
                    .isRead(true)
                    .build());

            // Broadcast notification to ALL
            appNotificationRepository.save(AppNotification.builder()
                    .title("🏛️ Annual Directorate Founder's Day")
                    .message("All scholars, faculty, and guardians are cordially invited to the 35th Annual Founder's Day in the Grand Quadrangle.")
                    .type("GENERAL")
                    .severity("INFO")
                    .link("/")
                    .isRead(false)
                    .build());

            log.info("Initialized default real-time app notifications");
        }
    }
}
