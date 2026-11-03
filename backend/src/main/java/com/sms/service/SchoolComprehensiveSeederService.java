package com.sms.service;

import com.sms.model.*;
import com.sms.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;

@Service
@RequiredArgsConstructor
@Slf4j
public class SchoolComprehensiveSeederService {

    private final UserRepository userRepository;
    private final SchoolClassRepository schoolClassRepository;
    private final SubjectRepository subjectRepository;
    private final TeacherRepository teacherRepository;
    private final TeacherClassAssignmentRepository teacherClassAssignmentRepository;
    private final StudentRepository studentRepository;
    private final ParentContactRepository parentContactRepository;
    private final StudentFeeRepository studentFeeRepository;
    private final TimetableSlotRepository timetableSlotRepository;
    private final TimetablePeriodConfigRepository timetablePeriodConfigRepository;
    private final AssignmentRepository assignmentRepository;
    private final AssignmentSubmissionRepository assignmentSubmissionRepository;
    private final NoticeRepository noticeRepository;
    private final LibraryBookRepository libraryBookRepository;
    private final SchoolEventRepository schoolEventRepository;
    private final TransportRouteRepository transportRouteRepository;
    private final PasswordEncoder passwordEncoder;

    public static final String ACADEMIC_YEAR = "2025-2026";

    // Curated 24 Faculty Members spanning all subjects and grade bands
    public static final Object[][] FACULTY_DATA = {
        // Name, EmpId, Phone, Email, Qualification, ClassTeacherGrade, PrimarySubjectCode
        {"Mrs. Mary Fernandez", "EMP-T101", "9840111101", "mary.fernandez@apexacademy.edu", "M.A. English, B.Ed.", 1, "ENG101"},
        {"Mr. Suresh Menon", "EMP-T102", "9840111102", "suresh.menon@apexacademy.edu", "B.Sc. Mathematics, B.Ed.", 2, "MATH101"},
        {"Mrs. Geetha Raman", "EMP-T103", "9840111103", "geetha.raman@apexacademy.edu", "B.A. Social Studies, B.Ed.", 3, "EVS101"},
        {"Mrs. Nandini Patel", "EMP-T104", "9840111104", "nandini.patel@apexacademy.edu", "M.Sc. Environmental Science, B.Ed.", 4, "EVS101"},
        {"Mrs. Deepa Chawla", "EMP-T105", "9840111105", "deepa.chawla@apexacademy.edu", "M.A. Hindi, B.Ed.", 5, "HIN101"},
        {"Mrs. Lakshmi Narayanan", "EMP-T106", "9840111106", "lakshmi.n@apexacademy.edu", "M.Sc. Chemistry, B.Ed.", 6, "SCI101"},
        {"Mrs. Sunita Deshmukh", "EMP-T107", "9840111107", "sunita.deshmukh@apexacademy.edu", "M.A. History, B.Ed.", 7, "SST101"},
        {"Mr. Pradeep Verma", "EMP-T108", "9840111108", "pradeep.verma@apexacademy.edu", "M.P.Ed., NIS Coach", 8, "PHE101"},
        {"Mr. Vikramaditya Rathore", "EMP-T109", "9840111109", "vikram.rathore@apexacademy.edu", "M.A. English Lit, B.Ed.", 9, "ENG101"},
        {"Mrs. Sarah Jenkins", "T101", "9876543210", "sarah.jenkins@school.edu", "M.Sc. Mathematics", 10, "MATH101"},
        {"Dr. Rajesh Sharma", "EMP-T111", "9840111111", "rajesh.sharma@apexacademy.edu", "Ph.D. Physics", 11, "PHY101"},
        {"Dr. Meenakshi Sundaram", "EMP-T112", "9840111112", "meenakshi.s@apexacademy.edu", "Ph.D. Chemistry", 12, "CHM101"},
        {"Mrs. Kavitha Krishnan", "EMP-T113", "9840111113", "kavitha.krishnan@apexacademy.edu", "M.Sc. Botany, M.Phil.", null, "BIO101"},
        {"Mr. Arvind Nambiar", "EMP-T114", "9840111114", "arvind.nambiar@apexacademy.edu", "M.Tech. Computer Science", null, "CSC101"},
        {"Mrs. Shweta Mukherjee", "EMP-T115", "9840111115", "shweta.m@apexacademy.edu", "M.Com., M.Phil.", null, "ACC101"},
        {"Mr. Rakesh Kulkarni", "EMP-T116", "9840111116", "rakesh.kulkarni@apexacademy.edu", "M.A. Economics, B.Ed.", null, "ECO101"},
        {"Mrs. Priya Iyer", "EMP-T117", "9840111117", "priya.iyer@apexacademy.edu", "M.Sc. Mathematics, B.Ed.", null, "MATH101"},
        {"Mr. Sanjay Verma", "EMP-T118", "9840111118", "sanjay.verma@apexacademy.edu", "M.Sc. Physics", null, "PHY101"},
        {"Mrs. Neha Kapoor", "EMP-T119", "9840111119", "neha.kapoor@apexacademy.edu", "M.Sc. Chemistry, B.Ed.", null, "CHM101"},
        {"Mr. Alok Joshi", "EMP-T120", "9840111120", "alok.joshi@apexacademy.edu", "M.A. History & Political Science", null, "HIS101"},
        {"Mrs. Ritu Sen", "EMP-T121", "9840111121", "ritu.sen@apexacademy.edu", "M.A. English Literature", null, "ENG101"},
        {"Mr. Devendra Bhatt", "EMP-T122", "9840111122", "devendra.bhatt@apexacademy.edu", "M.Com., MBA Finance", null, "BST101"},
        {"Ms. Pooja Hegde", "EMP-T123", "9840111123", "pooja.hegde@apexacademy.edu", "MCA, B.Sc. IT", null, "CSC101"},
        {"Mrs. Swati Mukherjee", "EMP-T124", "9840111124", "swati.m@apexacademy.edu", "Master of Fine Arts (MFA)", null, "ART101"}
    };

    // Curated authentic Indian first and last names for natural, realistic student records
    private static final String[] BOY_NAMES = {
        "Aarav", "Vivaan", "Aditya", "Vihaan", "Arjun", "Sai", "Reyansh", "Aayush",
        "Krishna", "Ishaan", "Shaurya", "Atharv", "Dhruv", "Kabir", "Ritvik", "Darsh",
        "Anirudh", "Siddharth", "Rohan", "Pranav", "Tejas", "Advait", "Samar", "Rishabh",
        "Yash", "Nikhil", "Harish", "Karthik", "Varun", "Madhav", "Dev", "Raghav",
        "Chirag", "Kedar", "Tushar", "Abhinav", "Gautam", "Harsh", "Naman", "Tanmay",
        "Vikram", "Prateek", "Sujay", "Manish", "Girish", "Kunal", "Alok", "Sameer",
        "Sanjay", "Deepak", "Bhavesh", "Sachin", "Mohit", "Ashwin", "Vishal", "Akash",
        "Mayank", "Naveen", "Praveen", "Surya"
    };

    private static final String[] GIRL_NAMES = {
        "Saanvi", "Anya", "Aadhya", "Aarohi", "Ananya", "Pari", "Diya", "Riya",
        "Kiara", "Myra", "Ira", "Avani", "Kavya", "Navya", "Anika", "Prisha",
        "Ishita", "Meera", "Sneha", "Tanvi", "Pooja", "Shreya", "Trisha", "Lavanya",
        "Kriti", "Nandini", "Bhavana", "Deepika", "Swati", "Keerthi", "Malini", "Shalini",
        "Divya", "Priyanka", "Ritu", "Meenakshi", "Gayathri", "Lakshmi", "Preethi", "Roshni",
        "Anjali", "Neha", "Simran", "Vandana", "Akshara", "Harini", "Archana", "Sowmya",
        "Soundarya", "Vasundhara", "Madhuri", "Sunita", "Anita", "Geeta", "Radha", "Revathi",
        "Nirupama", "Samyuktha", "Shruti", "Pavithra"
    };

    private static final String[] SURNAMES = {
        "Sharma", "Verma", "Patel", "Iyer", "Nair", "Nambiar", "Sundaram", "Deshmukh",
        "Kulkarni", "Chawla", "Mukherjee", "Sen", "Banerjee", "Reddy", "Rao", "Pillai",
        "Joshi", "Gupta", "Agarwal", "Bhat", "Hegde", "Menon", "Kurup", "Shetty",
        "Ranganathan", "Natarajan", "Balakrishnan", "Raman", "Swaminathan", "Srinivasan",
        "Venkatesh", "Choudhury", "Bose", "Dutta", "Das", "Ghosh", "Mishra", "Pandey",
        "Tiwari", "Dubey", "Shukla", "Tripathi", "Sinha", "Prasad", "Saxena", "Bhatnagar",
        "Kapoor", "Malhotra", "Khanna", "Mehta", "Shah", "Parikh", "Desai", "Grover",
        "Bhardwaj", "Naidu", "Chowdary", "Gowda", "Patil", "Chavan"
    };

    private static final String[] LOCALITIES = {
        "Anna Nagar, Chennai", "T. Nagar, Chennai", "Adyar, Chennai", "Velachery, Chennai",
        "R.S. Puram, Coimbatore", "Gandhipuram, Coimbatore", "Peelamedu, Coimbatore",
        "Indiranagar, Bengaluru", "Koramangala, Bengaluru", "Whitefield, Bengaluru", "Jayanagar, Bengaluru",
        "Banjara Hills, Hyderabad", "Jubilee Hills, Hyderabad", "Gachibowli, Hyderabad",
        "Shivaji Nagar, Pune", "Kothrud, Pune", "Bandra West, Mumbai", "Andheri East, Mumbai"
    };

    @Transactional
    public Map<String, Object> seedAllSchoolData() {
        log.info("Starting comprehensive school data seeding (Classes 1-12, 60 students per class, faculty, timetable, assignments)...");
        long start = System.currentTimeMillis();

        // 1. Seed Subjects
        Map<String, Subject> subjectsMap = seedSubjects();

        // 2. Seed Classes 1 to 12
        Map<Integer, SchoolClass> classesMap = seedClasses();

        // 3. Seed Teachers & Class Teacher assignments (24 teachers)
        List<Teacher> allTeachers = seedTeachersAndAssignments(classesMap, subjectsMap);

        // 4. Seed 60 Students into EACH Class 1 to 12 (Total = 720 students)
        int totalStudentsSeeded = seedStudents60PerClass(classesMap);

        // 5. Seed Weekly Timetable for All Classes 1 to 12 (420 conflict-free slots)
        int totalTimetableSlots = seedTimetables(classesMap, subjectsMap, allTeachers);

        // 6. Seed Assignments & Submissions across all classes
        int totalAssignments = seedAssignmentsAndSubmissions(classesMap, subjectsMap, allTeachers);

        // 7. Seed Other Records (Notices, Library, Events, Routes)
        seedNoticesLibraryEvents();

        long duration = System.currentTimeMillis() - start;
        log.info("Completed school seeding in {} ms. Total classes: 12, Total students populated: {}", duration, totalStudentsSeeded);

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("status", "SUCCESS");
        result.put("durationMs", duration);
        result.put("classesCount", classesMap.size());
        result.put("studentsCount", studentRepository.count());
        result.put("teachersCount", teacherRepository.count());
        result.put("subjectsCount", subjectRepository.count());
        result.put("timetableSlotsCount", totalTimetableSlots);
        result.put("assignmentsCount", totalAssignments);
        return result;
    }

    private Map<String, Subject> seedSubjects() {
        Map<String, String> defaultSubjects = new LinkedHashMap<>();
        defaultSubjects.put("ENG101", "English Core");
        defaultSubjects.put("MATH101", "Mathematics");
        defaultSubjects.put("EVS101", "Environmental Studies");
        defaultSubjects.put("SCI101", "General Science");
        defaultSubjects.put("SST101", "Social Studies");
        defaultSubjects.put("HIN101", "Hindi");
        defaultSubjects.put("PHY101", "Physics");
        defaultSubjects.put("CHM101", "Chemistry");
        defaultSubjects.put("BIO101", "Biology");
        defaultSubjects.put("CSC101", "Computer Science & AI");
        defaultSubjects.put("HIS101", "History & Civics");
        defaultSubjects.put("GEO101", "Geography");
        defaultSubjects.put("ACC101", "Accountancy");
        defaultSubjects.put("ECO101", "Economics");
        defaultSubjects.put("BST101", "Business Studies");
        defaultSubjects.put("PHE101", "Physical Education");
        defaultSubjects.put("ART101", "Visual Arts");

        Map<String, Subject> result = new HashMap<>();

        // Also index existing subjects in DB
        for (Subject existing : subjectRepository.findAll()) {
            result.put(existing.getCode(), existing);
            result.put(existing.getName().toUpperCase(), existing);
        }

        for (Map.Entry<String, String> entry : defaultSubjects.entrySet()) {
            String code = entry.getKey();
            String name = entry.getValue();

            Subject subj = subjectRepository.findByCode(code).orElse(null);
            if (subj == null) {
                // Check by name case-insensitively
                subj = subjectRepository.findAll().stream()
                        .filter(s -> s.getName().equalsIgnoreCase(name))
                        .findFirst().orElse(null);
            }
            if (subj == null) {
                subj = Subject.builder()
                        .code(code)
                        .name(name)
                        .build();
                subj = subjectRepository.save(subj);
                log.info("Created subject: {} ({})", name, code);
            }
            result.put(code, subj);
            result.put(name.toUpperCase(), subj);
        }

        return result;
    }

    private Map<Integer, SchoolClass> seedClasses() {
        Map<Integer, SchoolClass> map = new TreeMap<>();

        // Existing Grade 10 -> Class 10 (Sort 10)
        SchoolClass class10 = schoolClassRepository.findById(1L).orElse(null);
        if (class10 == null) {
            class10 = schoolClassRepository.findByNameAndSectionAndAcademicYear("Grade 10", "A", ACADEMIC_YEAR).orElse(null);
        }
        if (class10 != null) {
            class10.setName("Class 10");
            class10.setSortOrder(10);
            class10 = schoolClassRepository.save(class10);
            map.put(10, class10);
        }

        // Existing Grade 9 -> Class 9 (Sort 9)
        SchoolClass class9 = schoolClassRepository.findById(2L).orElse(null);
        if (class9 == null) {
            class9 = schoolClassRepository.findByNameAndSectionAndAcademicYear("Grade 9", "A", ACADEMIC_YEAR).orElse(null);
        }
        if (class9 != null) {
            class9.setName("Class 9");
            class9.setSortOrder(9);
            class9 = schoolClassRepository.save(class9);
            map.put(9, class9);
        }

        // Classes 1 through 12
        for (int i = 1; i <= 12; i++) {
            if (map.containsKey(i)) continue;

            String className = "Class " + i;
            SchoolClass sc = schoolClassRepository.findByNameAndSectionAndAcademicYear(className, "A", ACADEMIC_YEAR).orElse(null);
            if (sc == null) {
                sc = SchoolClass.builder()
                        .name(className)
                        .section("A")
                        .sortOrder(i)
                        .academicYear(ACADEMIC_YEAR)
                        .build();
                sc = schoolClassRepository.save(sc);
                log.info("Created class: {} - Section A (Sort: {})", className, i);
            } else {
                sc.setSortOrder(i);
                sc = schoolClassRepository.save(sc);
            }
            map.put(i, sc);
        }

        return map;
    }

    private List<Teacher> seedTeachersAndAssignments(Map<Integer, SchoolClass> classesMap, Map<String, Subject> subjectsMap) {
        String defaultTeacherPasswordHash = passwordEncoder.encode("teacher123");
        List<Teacher> allCreatedTeachers = new ArrayList<>();

        for (int idx = 0; idx < FACULTY_DATA.length; idx++) {
            String name = (String) FACULTY_DATA[idx][0];
            String empId = (String) FACULTY_DATA[idx][1];
            String phone = (String) FACULTY_DATA[idx][2];
            String email = (String) FACULTY_DATA[idx][3];
            String qual = (String) FACULTY_DATA[idx][4];
            Integer classGrade = (Integer) FACULTY_DATA[idx][5];
            String subjectCode = (String) FACULTY_DATA[idx][6];

            String username = (classGrade != null && classGrade == 10) ? "teacher1" : "faculty_" + empId.toLowerCase().replace("-", "_");

            User u = userRepository.findByUsername(username).orElse(null);
            if (u == null) {
                u = User.builder()
                        .username(username)
                        .passwordHash(defaultTeacherPasswordHash)
                        .role(User.Role.TEACHER)
                        .staffRole("Faculty")
                        .isActive(true)
                        .build();
                u = userRepository.save(u);
            } else {
                u.setPasswordHash(defaultTeacherPasswordHash);
                u.setRole(User.Role.TEACHER);
                u.setIsActive(true);
                userRepository.save(u);
            }

            Teacher teacher = teacherRepository.findByUserId(u.getId()).orElse(null);
            if (teacher == null) {
                teacher = teacherRepository.findByEmployeeId(empId).orElse(null);
            }
            if (teacher == null) {
                teacher = Teacher.builder()
                        .user(u)
                        .fullName(name)
                        .employeeId(empId)
                        .phone(phone)
                        .email(email)
                        .qualification(qual)
                        .dateOfJoining(LocalDate.of(2021, 6, 1))
                        .build();
                teacher = teacherRepository.save(teacher);
            } else {
                teacher.setFullName(name);
                teacher.setEmployeeId(empId);
                teacher = teacherRepository.save(teacher);
            }

            allCreatedTeachers.add(teacher);

            // Assign Class Teacher if designated
            if (classGrade != null && classesMap.containsKey(classGrade)) {
                SchoolClass sc = classesMap.get(classGrade);
                sc.setClassTeacher(teacher);
                schoolClassRepository.save(sc);
            }

            // Create TeacherClassAssignment
            Subject primarySub = subjectsMap.get(subjectCode);
            if (primarySub == null && subjectsMap.containsKey("MATHS")) {
                primarySub = subjectsMap.get("MATHS");
            }
            if (primarySub != null && classGrade != null && classesMap.containsKey(classGrade)) {
                SchoolClass sc = classesMap.get(classGrade);
                boolean assigned = teacherClassAssignmentRepository.existsByTeacherIdAndSchoolClassIdAndSubjectIdAndAcademicYear(
                        teacher.getId(), sc.getId(), primarySub.getId(), ACADEMIC_YEAR);
                if (!assigned) {
                    TeacherClassAssignment tca = TeacherClassAssignment.builder()
                            .teacher(teacher)
                            .schoolClass(sc)
                            .subject(primarySub)
                            .academicYear(ACADEMIC_YEAR)
                            .build();
                    teacherClassAssignmentRepository.save(tca);
                }
            }
        }

        log.info("Initialized {} teachers and linked class teachers to all 12 classes.", allCreatedTeachers.size());
        return allCreatedTeachers;
    }

    private String resolveSubjectForGrade(int grade, String teacherSubCode) {
        if (grade <= 5) {
            if ("PHY101".equals(teacherSubCode) || "CHM101".equals(teacherSubCode) || "BIO101".equals(teacherSubCode)) {
                return "SCI101";
            } else if ("ACC101".equals(teacherSubCode) || "BST101".equals(teacherSubCode)) {
                return "MATH101";
            } else if ("ECO101".equals(teacherSubCode) || "HIS101".equals(teacherSubCode) || "SST101".equals(teacherSubCode)) {
                return "EVS101";
            }
        } else if (grade <= 8) {
            if ("PHY101".equals(teacherSubCode) || "CHM101".equals(teacherSubCode) || "BIO101".equals(teacherSubCode)) {
                return "SCI101";
            } else if ("ACC101".equals(teacherSubCode) || "BST101".equals(teacherSubCode)) {
                return "MATH101";
            } else if ("ECO101".equals(teacherSubCode) || "HIS101".equals(teacherSubCode) || "EVS101".equals(teacherSubCode)) {
                return "SST101";
            }
        } else if (grade <= 10) {
            if ("EVS101".equals(teacherSubCode)) {
                return "BIO101";
            } else if ("ACC101".equals(teacherSubCode) || "BST101".equals(teacherSubCode)) {
                return "MATH101";
            }
        } else {
            if ("EVS101".equals(teacherSubCode) || "SCI101".equals(teacherSubCode)) {
                return "BIO101";
            }
        }
        return teacherSubCode;
    }

    private int seedStudents60PerClass(Map<Integer, SchoolClass> classesMap) {
        String studentPasswordHash = passwordEncoder.encode("student123");
        int totalSeeded = 0;

        for (int grade = 1; grade <= 12; grade++) {
            SchoolClass sc = classesMap.get(grade);
            if (sc == null) continue;

            List<Student> existingList = studentRepository.findBySchoolClassId(sc.getId());
            int existingCount = existingList.size();
            log.info("Class {} - Section A currently has {} students. Target: 60.", grade, existingCount);

            int studentsNeeded = 60 - existingCount;
            if (studentsNeeded <= 0) continue;

            // Age estimation: Class 1 is ~6-7 yrs old (born 2019), Class 12 is ~17-18 (born 2008)
            int birthYear = 2020 - grade;

            for (int sIdx = 1; sIdx <= studentsNeeded; sIdx++) {
                int studentNumber = existingCount + sIdx;
                boolean isBoy = (studentNumber % 2 != 0);

                String firstName = isBoy
                        ? BOY_NAMES[(grade * 5 + sIdx) % BOY_NAMES.length]
                        : GIRL_NAMES[(grade * 5 + sIdx) % GIRL_NAMES.length];
                String lastName = SURNAMES[(grade * 7 + sIdx) % SURNAMES.length];
                String fullName = firstName + " " + lastName;

                String admNo = String.format("ADM26-C%02d-%03d", grade, studentNumber);
                String username = String.format("stu_c%02d_%02d", grade, studentNumber);

                // Create or find User
                User u = userRepository.findByUsername(username).orElse(null);
                if (u == null) {
                    u = User.builder()
                            .username(username)
                            .passwordHash(studentPasswordHash)
                            .role(User.Role.STUDENT)
                            .isActive(true)
                            .build();
                    u = userRepository.save(u);
                }

                int birthMonth = (sIdx % 12) + 1;
                int birthDay = (sIdx % 28) + 1;
                LocalDate dob = LocalDate.of(birthYear, birthMonth, birthDay);

                String address = ((sIdx * 3) + 12) + ", " + LOCALITIES[(grade + sIdx) % LOCALITIES.length];

                Student student = studentRepository.findByAdmissionNumber(admNo).orElse(null);
                if (student == null) {
                    student = Student.builder()
                            .user(u)
                            .fullName(fullName)
                            .admissionNumber(admNo)
                            .schoolClass(sc)
                            .dateOfBirth(dob)
                            .gender(isBoy ? Student.Gender.MALE : Student.Gender.FEMALE)
                            .address(address)
                            .admissionDate(LocalDate.of(2025, 4, 1))
                            .academicYear(ACADEMIC_YEAR)
                            .isActive(true)
                            .build();
                    student = studentRepository.save(student);
                    totalSeeded++;
                }

                // Parent Contact
                boolean isFather = (sIdx % 3 != 0);
                String parentName = (isFather ? "Mr. " : "Mrs. ") + firstName + "'s " + (isFather ? "Father" : "Mother") + " " + lastName;
                String phone = String.format("9840%02d%04d", grade, studentNumber);

                List<ParentContact> pContacts = parentContactRepository.findByStudentId(student.getId());
                if (pContacts.isEmpty()) {
                    ParentContact parent = ParentContact.builder()
                            .student(student)
                            .relation(isFather ? ParentContact.Relation.FATHER : ParentContact.Relation.MOTHER)
                            .name(parentName)
                            .phone(phone)
                            .email(firstName.toLowerCase() + ".parent@gmail.com")
                            .whatsappNumber("91" + phone)
                            .build();
                    parentContactRepository.save(parent);
                }

                // Student Fee Record
                BigDecimal feeAmount = BigDecimal.valueOf(35000 + (grade * 2500));
                BigDecimal paidAmount = (studentNumber % 4 == 0)
                        ? feeAmount
                        : feeAmount.multiply(BigDecimal.valueOf(0.6)).setScale(2, java.math.RoundingMode.HALF_UP);

                if (!studentFeeRepository.findByStudentIdAndAcademicYear(student.getId(), ACADEMIC_YEAR).isPresent()) {
                    StudentFee fee = StudentFee.builder()
                            .student(student)
                            .academicYear(ACADEMIC_YEAR)
                            .currentYearDue(feeAmount)
                            .previousYearPending(BigDecimal.ZERO)
                            .totalPaid(paidAmount)
                            .status(paidAmount.compareTo(feeAmount) >= 0 ? StudentFee.FeeStatus.PAID : StudentFee.FeeStatus.PARTIAL)
                            .build();
                    studentFeeRepository.save(fee);
                }
            }

            log.info("Class {} - Section A successfully populated to 60 students.", grade);
        }

        return totalSeeded;
    }

    private int seedTimetables(Map<Integer, SchoolClass> classesMap, Map<String, Subject> subjectsMap, List<Teacher> allTeachers) {
        String[] days = {"Monday", "Tuesday", "Wednesday", "Thursday", "Friday"};

        String[][] periodConfigs = {
            {"p1", "Period 1", "08:30 AM", "09:15 AM"},
            {"p2", "Period 2", "09:15 AM", "10:00 AM"},
            {"p3", "Period 3", "10:15 AM", "11:00 AM"},
            {"p4", "Period 4", "11:00 AM", "11:45 AM"},
            {"p5", "Period 5", "12:30 PM", "01:15 PM"},
            {"p6", "Period 6", "01:15 PM", "02:00 PM"},
            {"p7", "Period 7", "02:00 PM", "02:45 PM"}
        };

        // Ensure 7 official period configs exist in periodConfigRepository
        List<TimetablePeriodConfig> existingPeriods = timetablePeriodConfigRepository.findByAcademicYearOrderBySortOrderAsc(ACADEMIC_YEAR);
        if (existingPeriods.size() != 7) {
            timetablePeriodConfigRepository.deleteByAcademicYear(ACADEMIC_YEAR);
            List<TimetablePeriodConfig> configsToSave = new ArrayList<>();
            for (int i = 0; i < periodConfigs.length; i++) {
                configsToSave.add(TimetablePeriodConfig.builder()
                        .periodId(periodConfigs[i][0])
                        .periodLabel(periodConfigs[i][1])
                        .startTime(periodConfigs[i][2])
                        .endTime(periodConfigs[i][3])
                        .sortOrder(i + 1)
                        .academicYear(ACADEMIC_YEAR)
                        .build());
            }
            timetablePeriodConfigRepository.saveAll(configsToSave);
            log.info("Seeded 7 official period configs (p1 through p7) for {}", ACADEMIC_YEAR);
        }

        // Clean slate to eliminate legacy uppercase or partial slots
        timetableSlotRepository.deleteAll();
        timetableSlotRepository.flush();

        int slotsCount = 0;
        int numTeachers = allTeachers.size();

        for (int c = 0; c < 12; c++) {
            int grade = c + 1;
            SchoolClass sc = classesMap.get(grade);
            if (sc == null) continue;

            String baseRoom = (c < 5) ? ("Room " + (101 + c)) : (c < 10 ? ("Room " + (201 + (c - 5))) : ("Room " + (301 + (c - 10))));

            for (int dayIdx = 0; dayIdx < days.length; dayIdx++) {
                String day = days[dayIdx];

                for (int pIdx = 0; pIdx < periodConfigs.length; pIdx++) {
                    String pId = periodConfigs[pIdx][0];
                    String pLabel = periodConfigs[pIdx][1];
                    String start = periodConfigs[pIdx][2];
                    String end = periodConfigs[pIdx][3];

                    // Conflict-Free Mathematical Assignment:
                    // For any fixed (dayIdx, pIdx), teacher index varies by 2*c (mod 24).
                    // Since 2*c mod 24 produces 12 distinct values for c in 0..11, ZERO clashes occur!
                    int tIdx = (2 * c + 3 * dayIdx + pIdx) % numTeachers;
                    Teacher teacher = allTeachers.get(tIdx);

                    String teacherSubCode = (tIdx < FACULTY_DATA.length) ? (String) FACULTY_DATA[tIdx][6] : "ENG101";
                    String effectiveSubCode = resolveSubjectForGrade(grade, teacherSubCode);

                    Subject subject = subjectsMap.get(effectiveSubCode);
                    if (subject == null) subject = subjectsMap.get(teacherSubCode);
                    if (subject == null) subject = subjectsMap.values().stream().findFirst().orElse(null);

                    String subjectName = (subject != null) ? subject.getName() : "General Studies";
                    String room = "PHE101".equals(effectiveSubCode) ? ("Sports Ground - Zone " + ((c % 3) + 1)) : baseRoom;

                    TimetableSlot slot = TimetableSlot.builder()
                            .schoolClass(sc)
                            .dayOfWeek(day)
                            .periodId(pId)
                            .periodLabel(pLabel)
                            .startTime(start)
                            .endTime(end)
                            .subject(subject)
                            .subjectName(subjectName)
                            .teacher(teacher)
                            .teacherName(teacher != null ? teacher.getFullName() : "Faculty Member")
                            .room(room)
                            .academicYear(ACADEMIC_YEAR)
                            .build();

                    timetableSlotRepository.save(slot);
                    slotsCount++;

                    // Also link TeacherClassAssignment if not exists
                    if (teacher != null && subject != null) {
                        boolean assigned = teacherClassAssignmentRepository.existsByTeacherIdAndSchoolClassIdAndSubjectIdAndAcademicYear(
                                teacher.getId(), sc.getId(), subject.getId(), ACADEMIC_YEAR);
                        if (!assigned) {
                            TeacherClassAssignment tca = TeacherClassAssignment.builder()
                                    .teacher(teacher)
                                    .schoolClass(sc)
                                    .subject(subject)
                                    .academicYear(ACADEMIC_YEAR)
                                    .build();
                            teacherClassAssignmentRepository.save(tca);
                        }
                    }
                }
            }
        }

        log.info("Total timetable slots active across 12 classes: {} (100% full, zero teacher/room clashes)", slotsCount);
        return slotsCount;
    }

    private int seedAssignmentsAndSubmissions(Map<Integer, SchoolClass> classesMap, Map<String, Subject> subjectsMap, List<Teacher> allTeachers) {
        Teacher defaultTeacher = allTeachers.isEmpty() ? null : allTeachers.get(0);

        // Standard rich curriculum assignments per class
        Map<Integer, String[][]> classAsgMeta = new HashMap<>();
        classAsgMeta.put(1, new String[][]{
            {"Phonics & Reading Journal", "Read Chapter 3 story aloud and write down 10 new sight words.", "ENG101", "50"},
            {"Numbers Count & Match Activity", "Complete worksheet pages 15-18 matching quantities 1 to 50.", "MATH101", "50"}
        });
        classAsgMeta.put(2, new String[][]{
            {"Living vs Non-Living Organisms", "Draw 5 living and 5 non-living things found in your garden.", "EVS101", "50"},
            {"Addition & Subtraction Word Problems", "Solve the 10 real-world math word problems in notebook.", "MATH101", "100"}
        });
        classAsgMeta.put(3, new String[][]{
            {"Plant Parts & Functions Illustration", "Label root, stem, leaf, and flower with their core functions.", "EVS101", "50"},
            {"Multiplication Tables Mastery 1-12", "Practice and record speed drill sheet for tables 6 through 12.", "MATH101", "100"}
        });
        classAsgMeta.put(4, new String[][]{
            {"Solar System & Planetary Orbits", "Create a model or colorful diagram of the eight planets in order.", "EVS101", "100"},
            {"Fractions and Division Basics", "Divide given geometric shapes into halves, thirds, and quarters.", "MATH101", "100"}
        });
        classAsgMeta.put(5, new String[][]{
            {"Human Digestive System Overview", "Chart the path of food from mouth to stomach with annotations.", "SCI101", "100"},
            {"Geometry: Perimeter & Area of Rectangles", "Measure and calculate perimeter & area of 5 household objects.", "MATH101", "100"}
        });
        classAsgMeta.put(6, new String[][]{
            {"Simple Electric Circuit Experiment", "Describe switch, battery, and bulb connectivity with circuit diagram.", "SCI101", "100"},
            {"Ancient Indus Valley Civilization Report", "Summary of Harappa urban planning, granaries, and drainage system.", "SST101", "100"}
        });
        classAsgMeta.put(7, new String[][]{
            {"Acids, Bases & Natural Indicators", "Test turmeric and litmus paper reactions with lemon juice and soap.", "SCI101", "100"},
            {"Algebraic Expressions & Linear Equations", "Solve practice exercise 4.2 focusing on variables and constants.", "MATH101", "100"}
        });
        classAsgMeta.put(8, new String[][]{
            {"Microorganisms: Friend and Foe", "Research bacterial fermentation in curd and yeast in baking.", "SCI101", "100"},
            {"Fundamental Rights in Indian Constitution", "Analyze the 6 fundamental rights with recent real-life examples.", "SST101", "100"}
        });
        classAsgMeta.put(9, new String[][]{
            {"Newton's Laws of Motion Analysis", "Document inertia, momentum, and action-reaction with practical proofs.", "PHY101", "100"},
            {"Quadratic Polynomial Factorization", "Solve the 15 standard factorization and middle-term splitting questions.", "MATH101", "100"}
        });
        classAsgMeta.put(10, new String[][]{
            {"Trigonometric Heights & Distances Case Study", "Solve real-world angle of elevation & depression problems.", "MATH101", "100"},
            {"Carbon and Its Versatile Compounds", "Explain tetravalency, catenation, and homologous series of alkanes.", "CHM101", "100"}
        });
        classAsgMeta.put(11, new String[][]{
            {"Kinematics & Projectile Motion Calculations", "Derive trajectory equation, maximum height, and horizontal range.", "PHY101", "100"},
            {"Python Data Structures & Algorithm Design", "Write clean Python programs for binary search and dictionary operations.", "CSC101", "100"}
        });
        classAsgMeta.put(12, new String[][]{
            {"Electromagnetic Induction & Faraday's Laws", "Solve numericals on Lenz's law, mutual inductance, and AC generator.", "PHY101", "100"},
            {"Macroeconomics: National Income Accounting", "Calculate GDP, GNP, NNP at factor cost and market prices from dataset.", "ECO101", "100"}
        });

        int totalAssignments = 0;

        for (int grade = 1; grade <= 12; grade++) {
            SchoolClass sc = classesMap.get(grade);
            if (sc == null) continue;

            String[][] asgs = classAsgMeta.get(grade);
            if (asgs == null) continue;

            Teacher assignedTeacher = (sc.getClassTeacher() != null) ? sc.getClassTeacher() : defaultTeacher;
            List<Student> classStudents = studentRepository.findBySchoolClassId(sc.getId());

            for (String[] meta : asgs) {
                String title = meta[0];
                String instructions = meta[1];
                String sCode = meta[2];
                int maxMarks = Integer.parseInt(meta[3]);

                Subject subj = subjectsMap.get(sCode);
                if (subj == null) subj = subjectsMap.values().stream().findFirst().orElse(null);

                String solutionPdf = resolveSolutionPdfUrl(title);

                // Check if assignment exists
                Assignment asg = assignmentRepository.findBySchoolClassId(sc.getId()).stream()
                        .filter(a -> a.getTitle().equalsIgnoreCase(title))
                        .findFirst().orElse(null);

                if (asg == null) {
                    asg = Assignment.builder()
                            .schoolClass(sc)
                            .subject(subj)
                            .title(title)
                            .instructions(instructions)
                            .dueDate(LocalDate.now().plusDays(14))
                            .maxMarks(maxMarks)
                            .teacher(assignedTeacher)
                            .createdDate(LocalDate.now().minusDays(5))
                            .fileUrl(solutionPdf)
                            .build();
                    asg = assignmentRepository.save(asg);
                    totalAssignments++;
                } else if (asg.getFileUrl() == null || asg.getFileUrl().isEmpty()) {
                    asg.setFileUrl(solutionPdf);
                    asg = assignmentRepository.save(asg);
                }

                // Seed graded submissions for students in this class
                for (int sIdx = 0; sIdx < classStudents.size(); sIdx++) {
                    Student st = classStudents.get(sIdx);

                    AssignmentSubmission sub = assignmentSubmissionRepository.findByAssignmentIdAndStudentId(asg.getId(), st.getId()).orElse(null);
                    if (sub == null) {
                        // Grade distribution: realistic mix of scores
                        int scorePct = 70 + ((sIdx * 7) % 28); // scores between 70% and 98%
                        if (sIdx == 0) scorePct = 95; // top student
                        if (sIdx % 15 == 0) scorePct = 88;

                        int marks = (int) Math.round((scorePct / 100.0) * maxMarks);
                        String remarks = marks >= (maxMarks * 0.9) ? "Outstanding analytical depth & presentation!"
                                : marks >= (maxMarks * 0.8) ? "Very good effort. Clear and organized."
                                : "Good submission. Keep focusing on fundamentals.";

                        sub = AssignmentSubmission.builder()
                                .assignment(asg)
                                .student(st)
                                .submissionDate(LocalDate.now().minusDays((sIdx % 4) + 1))
                                .status("GRADED")
                                .marksObtained(marks)
                                .feedback(remarks)
                                .fileUrl(solutionPdf)
                                .build();
                        assignmentSubmissionRepository.save(sub);
                    } else if (sub.getFileUrl() == null || sub.getFileUrl().isEmpty()) {
                        sub.setFileUrl(solutionPdf);
                        assignmentSubmissionRepository.save(sub);
                    }
                }
            }
        }

        log.info("Assignments and student submissions successfully populated across all 12 classes with attached solution PDFs.");
        return totalAssignments;
    }

    private String resolveSolutionPdfUrl(String title) {
        if (title == null) return "/uploads/solutions/indus_valley_civilization_report_solution.pdf";
        String t = title.trim();
        if (t.equalsIgnoreCase("Ancient Indus Valley Civilization Report")) return "/uploads/solutions/indus_valley_civilization_report_solution.pdf";
        if (t.equalsIgnoreCase("Simple Electric Circuit Experiment")) return "/uploads/solutions/simple_electric_circuit_experiment_solution.pdf";
        if (t.equalsIgnoreCase("Phonics & Reading Journal")) return "/uploads/solutions/phonics_reading_journal_solution.pdf";
        if (t.equalsIgnoreCase("Numbers Count & Match Activity")) return "/uploads/solutions/numbers_count_match_activity_solution.pdf";
        if (t.equalsIgnoreCase("Living vs Non-Living Organisms")) return "/uploads/solutions/living_vs_non_living_organisms_solution.pdf";
        if (t.equalsIgnoreCase("Addition & Subtraction Word Problems")) return "/uploads/solutions/addition_subtraction_word_problems_solution.pdf";
        if (t.equalsIgnoreCase("Plant Parts & Functions Illustration")) return "/uploads/solutions/plant_parts_functions_illustration_solution.pdf";
        if (t.equalsIgnoreCase("Multiplication Tables Mastery 1-12")) return "/uploads/solutions/multiplication_tables_mastery_1_12_solution.pdf";
        if (t.equalsIgnoreCase("Solar System & Planetary Orbits")) return "/uploads/solutions/solar_system_planetary_orbits_solution.pdf";
        if (t.equalsIgnoreCase("Fractions and Division Basics")) return "/uploads/solutions/fractions_and_division_basics_solution.pdf";
        if (t.equalsIgnoreCase("Human Digestive System Overview")) return "/uploads/solutions/human_digestive_system_overview_solution.pdf";
        if (t.equalsIgnoreCase("Geometry: Perimeter & Area of Rectangles")) return "/uploads/solutions/geometry_perimeter_area_rectangles_solution.pdf";
        if (t.equalsIgnoreCase("Acids, Bases & Natural Indicators")) return "/uploads/solutions/acids_bases_natural_indicators_solution.pdf";
        if (t.equalsIgnoreCase("Algebraic Expressions & Linear Equations")) return "/uploads/solutions/algebraic_expressions_linear_equations_solution.pdf";
        if (t.equalsIgnoreCase("Microorganisms: Friend and Foe")) return "/uploads/solutions/microorganisms_friend_and_foe_solution.pdf";
        if (t.equalsIgnoreCase("Fundamental Rights in Indian Constitution")) return "/uploads/solutions/fundamental_rights_indian_constitution_solution.pdf";
        if (t.equalsIgnoreCase("Newton's Laws of Motion Analysis")) return "/uploads/solutions/newtons_laws_of_motion_analysis_solution.pdf";
        if (t.equalsIgnoreCase("Quadratic Polynomial Factorization")) return "/uploads/solutions/quadratic_polynomial_factorization_solution.pdf";
        if (t.equalsIgnoreCase("Trigonometric Heights & Distances Case Study")) return "/uploads/solutions/trigonometric_heights_distances_solution.pdf";
        if (t.equalsIgnoreCase("Carbon and Its Versatile Compounds")) return "/uploads/solutions/carbon_versatile_compounds_solution.pdf";
        if (t.equalsIgnoreCase("Kinematics & Projectile Motion Calculations")) return "/uploads/solutions/kinematics_projectile_motion_calculations_solution.pdf";
        if (t.equalsIgnoreCase("Python Data Structures & Algorithm Design")) return "/uploads/solutions/python_data_structures_algorithm_design_solution.pdf";
        if (t.equalsIgnoreCase("Electromagnetic Induction & Faraday's Laws")) return "/uploads/solutions/electromagnetic_induction_faradays_laws_solution.pdf";
        if (t.equalsIgnoreCase("Macroeconomics: National Income Accounting")) return "/uploads/solutions/macroeconomics_national_income_accounting_solution.pdf";
        if (t.equalsIgnoreCase("AI Python Neural Network Lab")) return "/uploads/solutions/ai_python_neural_network_lab_solution.pdf";
        if (t.equalsIgnoreCase("Python Computer Vision Lab")) return "/uploads/solutions/python_computer_vision_lab_solution.pdf";
        if (t.equalsIgnoreCase("TQM")) return "/uploads/solutions/tqm_total_quality_management_solution.pdf";
        if (t.equalsIgnoreCase("Algebra & Quadratic Equations - Unit 3 Assignment")) return "/uploads/solutions/algebra_quadratic_equations_unit3_solution.pdf";

        String slug = t.toLowerCase().replaceAll("[^a-z0-9]+", "_").replaceAll("^_+|_+$", "");
        return "/uploads/solutions/" + slug + "_solution.pdf";
    }

    private void seedNoticesLibraryEvents() {
        // Notices
        if (noticeRepository.count() < 5) {
            String[][] notices = {
                {"Annual CBSE Science & Robotics Olympiad 2026", "Registrations open for Classes 6-12. Project abstract submissions are due by end of month in the Senior Innovation Lab."},
                {"Mid-Session Term Assessment Timetable Released", "Term-II written assessments will commence on the second Monday of next month. Hall tickets are available in the Scholar Portal."},
                {"Inter-House Athletics & Track Field Trials", "Athletics selection trials for 100m, 400m, and 4x100m relay will be conducted on the main school grounds this Friday morning."},
                {"Digital E-Library & Academic Resources Access", "Scholars from Classes 1-12 can now access digital reference textbooks, research journals, and audio modules through the digital library."},
                {"Parent-Teacher Association (PTA) General Assembly", "The bi-annual PTA conference is scheduled for the coming Saturday. Discussion on holistic co-curricular development."}
            };
            User admin = userRepository.findByUsername("admin").orElse(null);
            for (String[] n : notices) {
                Notice notice = Notice.builder()
                        .title(n[0])
                        .content(n[1])
                        .audience(Notice.Audience.ALL)
                        .postedBy(admin)
                        .createdAt(LocalDateTime.now())
                        .build();
                noticeRepository.save(notice);
            }
            log.info("Initialized official school notices.");
        }

        // Library Books
        if (libraryBookRepository.count() < 10) {
            String[][] books = {
                {"Mathematics for Class 10 (R.S. Aggarwal)", "R.S. Aggarwal", "978-8177099859", "Mathematics", "15"},
                {"Concepts of Physics (Vol 1 & 2)", "Dr. H.C. Verma", "978-8177091877", "Physics", "20"},
                {"Comprehensive Chemistry for Class 12", "Dr. N.K. Verma", "978-8170081234", "Chemistry", "12"},
                {"Elementary Biology (Trueman's)", "K.N. Bhatia", "978-8187223019", "Biology", "14"},
                {"Computer Science with Python", "Sumita Arora", "978-9389245123", "Computer Science", "18"},
                {"Indian Economic Development", "T.R. Jain & V.K. Ohri", "978-9389012345", "Economics", "10"},
                {"Wings of Fire: An Autobiography", "Dr. A.P.J. Abdul Kalam", "978-8173711466", "Biography", "25"},
                {"Malgudi Days", "R.K. Narayan", "978-8185986173", "Literature", "20"},
                {"The Discovery of India", "Jawaharlal Nehru", "978-0143031031", "History", "15"},
                {"Oxford Student Atlas for India", "Oxford University Press", "978-0190128456", "Geography", "30"}
            };
            for (String[] b : books) {
                LibraryBook book = LibraryBook.builder()
                        .title(b[0])
                        .author(b[1])
                        .isbn(b[2])
                        .category(b[3])
                        .totalCopies(Integer.parseInt(b[4]))
                        .availableCopies(Integer.parseInt(b[4]) - 2)
                        .build();
                libraryBookRepository.save(book);
            }
            log.info("Initialized library reference catalogue.");
        }

        // School Events
        if (schoolEventRepository.count() < 4) {
            String[][] events = {
                {"Annual Athletic Meet & Sports Gala", "Track events, march past, and inter-house athletic finals.", "SPORTS", "Main Sports Quadrangle"},
                {"CBSE Regional Science Exhibition", "STEM model displays, innovative science projects, and guest lectures.", "ACADEMIC", "Dr. A.P.J. Abdul Kalam Auditorium"},
                {"Annual Day Cultural Fest 'Tarang'", "Musical orchestra, theatrical drama, and annual academic excellence awards.", "CULTURAL", "Grand Open Air Amphitheatre"},
                {"Republic Day Ceremonial Parade", "Flag hoisting ceremony, patriotic choir, and NCC cadet guard of honor.", "CEREMONY", "Central Campus Parade Ground"}
            };
            for (int eIdx = 0; eIdx < events.length; eIdx++) {
                SchoolEvent se = SchoolEvent.builder()
                        .title(events[eIdx][0])
                        .description(events[eIdx][1])
                        .eventType(events[eIdx][2])
                        .venue(events[eIdx][3])
                        .eventDate(LocalDate.now().plusDays(10 + (eIdx * 15)))
                        .build();
                schoolEventRepository.save(se);
            }
            log.info("Initialized school calendar events.");
        }

        // Transport Routes
        if (transportRouteRepository.count() < 3) {
            String[][] routes = {
                {"Route 1 - North Corridor Express", "TN-09-AB-1001", "TN09AB1001", "K. Murugan", "9840222001", "G. Palani"},
                {"Route 2 - Central City Shuttle", "TN-09-AB-1002", "TN09AB1002", "S. Selvaraj", "9840222002", "R. Kumar"},
                {"Route 3 - South Tech Transit", "TN-09-AB-1003", "TN09AB1003", "M. Anthony", "9840222003", "V. Mani"},
                {"Route 4 - Western Ring Feeder", "TN-09-AB-1004", "TN09AB1004", "P. Ramakrishnan", "9840222004", "T. Joseph"}
            };
            for (String[] r : routes) {
                TransportRoute tr = TransportRoute.builder()
                        .routeName(r[0])
                        .busNumber(r[1])
                        .plateNumber(r[2])
                        .driverName(r[3])
                        .driverPhone(r[4])
                        .conductorName(r[5])
                        .build();
                transportRouteRepository.save(tr);
            }
            log.info("Initialized institutional transport routes.");
        }
    }
}
