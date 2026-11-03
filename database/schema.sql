-- ============================================================
-- School Management System — Complete Database Schema
-- MySQL 8.0+
-- ============================================================

CREATE DATABASE IF NOT EXISTS school_management;
USE school_management;

-- ============================================================
-- 1. USERS & ROLES
-- ============================================================

CREATE TABLE users (
    id              BIGINT          AUTO_INCREMENT PRIMARY KEY,
    username        VARCHAR(50)     NOT NULL UNIQUE,
    password_hash   VARCHAR(255)    NOT NULL,
    role            ENUM('MANAGEMENT', 'TEACHER', 'STUDENT') NOT NULL,
    is_active       BOOLEAN         DEFAULT TRUE,
    created_at      TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_users_role (role),
    INDEX idx_users_active (is_active)
) ENGINE=InnoDB;

CREATE TABLE management_profiles (
    id              BIGINT          AUTO_INCREMENT PRIMARY KEY,
    user_id         BIGINT          NOT NULL UNIQUE,
    full_name       VARCHAR(100)    NOT NULL,
    designation     VARCHAR(50),
    phone           VARCHAR(15),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE teachers (
    id              BIGINT          AUTO_INCREMENT PRIMARY KEY,
    user_id         BIGINT          NOT NULL UNIQUE,
    full_name       VARCHAR(100)    NOT NULL,
    employee_id     VARCHAR(20)     UNIQUE,
    phone           VARCHAR(15),
    email           VARCHAR(100),
    qualification   VARCHAR(100),
    date_of_joining DATE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE classes (
    id              BIGINT          AUTO_INCREMENT PRIMARY KEY,
    name            VARCHAR(30)     NOT NULL,
    section         VARCHAR(5)      DEFAULT 'A',
    academic_year   VARCHAR(9)      NOT NULL,
    sort_order      INT             NOT NULL,
    UNIQUE KEY uk_class_section_year (name, section, academic_year),
    INDEX idx_classes_year (academic_year),
    INDEX idx_classes_sort (sort_order)
) ENGINE=InnoDB;

CREATE TABLE students (
    id              BIGINT          AUTO_INCREMENT PRIMARY KEY,
    user_id         BIGINT          NOT NULL UNIQUE,
    full_name       VARCHAR(100)    NOT NULL,
    admission_number VARCHAR(20)    NOT NULL UNIQUE,
    class_id        BIGINT,
    date_of_birth   DATE,
    gender          ENUM('MALE', 'FEMALE', 'OTHER'),
    address         TEXT,
    admission_date  DATE,
    academic_year   VARCHAR(9),
    is_active       BOOLEAN         DEFAULT TRUE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE SET NULL,
    INDEX idx_students_class (class_id),
    INDEX idx_students_active (is_active),
    INDEX idx_students_year (academic_year)
) ENGINE=InnoDB;

CREATE TABLE parent_contacts (
    id              BIGINT          AUTO_INCREMENT PRIMARY KEY,
    student_id      BIGINT          NOT NULL,
    relation        ENUM('FATHER', 'MOTHER', 'GUARDIAN') NOT NULL,
    name            VARCHAR(100)    NOT NULL,
    phone           VARCHAR(15)     NOT NULL,
    email           VARCHAR(100),
    whatsapp_number VARCHAR(15),
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
    INDEX idx_parent_student (student_id)
) ENGINE=InnoDB;

-- ============================================================
-- 2. ACADEMICS
-- ============================================================

CREATE TABLE subjects (
    id              BIGINT          AUTO_INCREMENT PRIMARY KEY,
    name            VARCHAR(50)     NOT NULL,
    code            VARCHAR(10)     UNIQUE
) ENGINE=InnoDB;

CREATE TABLE teacher_class_assignments (
    id              BIGINT          AUTO_INCREMENT PRIMARY KEY,
    teacher_id      BIGINT          NOT NULL,
    class_id        BIGINT          NOT NULL,
    subject_id      BIGINT          NOT NULL,
    academic_year   VARCHAR(9)      NOT NULL,
    FOREIGN KEY (teacher_id) REFERENCES teachers(id) ON DELETE CASCADE,
    FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE,
    FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE,
    UNIQUE KEY uk_assignment (teacher_id, class_id, subject_id, academic_year),
    INDEX idx_assign_teacher (teacher_id),
    INDEX idx_assign_class (class_id)
) ENGINE=InnoDB;

-- ============================================================
-- 3. FEE STRUCTURE
-- ============================================================

CREATE TABLE fee_components (
    id              BIGINT          AUTO_INCREMENT PRIMARY KEY,
    name            VARCHAR(50)     NOT NULL,
    amount          DECIMAL(10,2)   NOT NULL,
    class_id        BIGINT          NULL,
    academic_year   VARCHAR(9)      NOT NULL,
    is_mandatory    BOOLEAN         DEFAULT TRUE,
    FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE SET NULL,
    INDEX idx_fee_comp_year (academic_year),
    INDEX idx_fee_comp_class (class_id)
) ENGINE=InnoDB;

CREATE TABLE student_fees (
    id                      BIGINT          AUTO_INCREMENT PRIMARY KEY,
    student_id              BIGINT          NOT NULL,
    academic_year           VARCHAR(9)      NOT NULL,
    current_year_due        DECIMAL(10,2)   NOT NULL DEFAULT 0.00,
    previous_year_pending   DECIMAL(10,2)   NOT NULL DEFAULT 0.00,
    total_paid              DECIMAL(10,2)   NOT NULL DEFAULT 0.00,
    grand_total             DECIMAL(10,2)   GENERATED ALWAYS AS (current_year_due + previous_year_pending) STORED,
    balance_due             DECIMAL(10,2)   GENERATED ALWAYS AS (current_year_due + previous_year_pending - total_paid) STORED,
    status                  ENUM('PAID', 'PARTIAL', 'UNPAID') DEFAULT 'UNPAID',
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
    UNIQUE KEY uk_student_fee_year (student_id, academic_year),
    INDEX idx_sfee_status (status),
    INDEX idx_sfee_year (academic_year)
) ENGINE=InnoDB;

CREATE TABLE payment_history (
    id              BIGINT          AUTO_INCREMENT PRIMARY KEY,
    student_fee_id  BIGINT          NOT NULL,
    amount_paid     DECIMAL(10,2)   NOT NULL,
    payment_date    TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    payment_mode    VARCHAR(50),
    receipt_number  VARCHAR(30)     UNIQUE,
    recorded_by     BIGINT,
    notes           TEXT,
    FOREIGN KEY (student_fee_id) REFERENCES student_fees(id) ON DELETE CASCADE,
    FOREIGN KEY (recorded_by) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_payment_date (payment_date)
) ENGINE=InnoDB;

-- Trigger: Auto-update fee status after payment
DELIMITER //
CREATE TRIGGER trg_update_fee_status AFTER INSERT ON payment_history
FOR EACH ROW
BEGIN
    UPDATE student_fees
    SET total_paid = total_paid + NEW.amount_paid,
        status = CASE
            WHEN (total_paid + NEW.amount_paid) >= (current_year_due + previous_year_pending) THEN 'PAID'
            WHEN (total_paid + NEW.amount_paid) > 0 THEN 'PARTIAL'
            ELSE 'UNPAID'
        END
    WHERE id = NEW.student_fee_id;
END //
DELIMITER ;

-- ============================================================
-- 4. ATTENDANCE
-- ============================================================

CREATE TABLE attendance (
    id              BIGINT          AUTO_INCREMENT PRIMARY KEY,
    student_id      BIGINT          NOT NULL,
    class_id        BIGINT          NOT NULL,
    date            DATE            NOT NULL,
    status          ENUM('PRESENT', 'ABSENT', 'LATE') NOT NULL,
    marked_by       BIGINT,
    marked_at       TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
    FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE,
    FOREIGN KEY (marked_by) REFERENCES users(id) ON DELETE SET NULL,
    UNIQUE KEY uk_student_date (student_id, date),
    INDEX idx_att_class_date (class_id, date),
    INDEX idx_att_status (status)
) ENGINE=InnoDB;

-- ============================================================
-- 5. ACADEMIC PERFORMANCE (DYNAMIC GRADING)
-- ============================================================

CREATE TABLE assessment_headers (
    id              BIGINT          AUTO_INCREMENT PRIMARY KEY,
    name            VARCHAR(50)     NOT NULL,
    class_id        BIGINT          NOT NULL,
    subject_id      BIGINT          NOT NULL,
    max_marks       DECIMAL(5,2)    NOT NULL,
    assessment_date DATE,
    academic_year   VARCHAR(9)      NOT NULL,
    created_by      BIGINT,
    FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE,
    FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE,
    FOREIGN KEY (created_by) REFERENCES teachers(id) ON DELETE SET NULL,
    INDEX idx_assess_class (class_id),
    INDEX idx_assess_year (academic_year)
) ENGINE=InnoDB;

CREATE TABLE student_grades (
    id                      BIGINT          AUTO_INCREMENT PRIMARY KEY,
    student_id              BIGINT          NOT NULL,
    assessment_header_id    BIGINT          NOT NULL,
    marks_obtained          DECIMAL(5,2),
    remarks                 VARCHAR(255),
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
    FOREIGN KEY (assessment_header_id) REFERENCES assessment_headers(id) ON DELETE CASCADE,
    UNIQUE KEY uk_student_assessment (student_id, assessment_header_id)
) ENGINE=InnoDB;

-- ============================================================
-- 6. CMS (CONTENT MANAGEMENT)
-- ============================================================

CREATE TABLE hero_sections (
    id                  BIGINT          AUTO_INCREMENT PRIMARY KEY,
    overline            VARCHAR(100),
    headline            VARCHAR(200)    NOT NULL,
    subtext             TEXT,
    background_image_url VARCHAR(500),
    logo_url            VARCHAR(500),
    favicon_url         VARCHAR(500),
    marquee_text        TEXT,
    updated_at          TIMESTAMP       DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE facilities (
    id              BIGINT          AUTO_INCREMENT PRIMARY KEY,
    icon            VARCHAR(50),
    title           VARCHAR(100)    NOT NULL,
    description     TEXT,
    sort_order      INT             DEFAULT 0,
    is_active       BOOLEAN         DEFAULT TRUE,
    INDEX idx_facility_sort (sort_order)
) ENGINE=InnoDB;

CREATE TABLE achievements (
    id              BIGINT          AUTO_INCREMENT PRIMARY KEY,
    title           VARCHAR(200)    NOT NULL,
    description     TEXT,
    achievement_date DATE,
    image_url       VARCHAR(500)
) ENGINE=InnoDB;

CREATE TABLE gallery_media (
    id              BIGINT          AUTO_INCREMENT PRIMARY KEY,
    title           VARCHAR(200),
    media_url       VARCHAR(500)    NOT NULL,
    media_type      ENUM('IMAGE', 'VIDEO') DEFAULT 'IMAGE',
    category        VARCHAR(50),
    uploaded_at     TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_gallery_category (category)
) ENGINE=InnoDB;

-- ============================================================
-- 7. ALUMNI REGISTRY
-- ============================================================

CREATE TABLE alumni_registry (
    id              BIGINT          AUTO_INCREMENT PRIMARY KEY,
    student_id      BIGINT,
    full_name       VARCHAR(100)    NOT NULL,
    admission_number VARCHAR(20),
    graduation_year VARCHAR(9)      NOT NULL,
    final_class     VARCHAR(30),
    date_of_birth   DATE,
    parent_phone    VARCHAR(15),
    migrated_at     TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE SET NULL,
    INDEX idx_alumni_grad_year (graduation_year)
) ENGINE=InnoDB;

-- ============================================================
-- 8. SEED DATA — Classes (Nursery to Grade 10)
-- ============================================================

INSERT INTO classes (name, section, academic_year, sort_order) VALUES
('Nursery',   'A', '2025-2026', 1),
('LKG',       'A', '2025-2026', 2),
('UKG',       'A', '2025-2026', 3),
('Grade 1',   'A', '2025-2026', 4),
('Grade 2',   'A', '2025-2026', 5),
('Grade 3',   'A', '2025-2026', 6),
('Grade 4',   'A', '2025-2026', 7),
('Grade 5',   'A', '2025-2026', 8),
('Grade 6',   'A', '2025-2026', 9),
('Grade 7',   'A', '2025-2026', 10),
('Grade 8',   'A', '2025-2026', 11),
('Grade 9',   'A', '2025-2026', 12),
('Grade 10',  'A', '2025-2026', 13);

-- Seed: Default subjects
INSERT INTO subjects (name, code) VALUES
('Mathematics', 'MATH'),
('English',     'ENG'),
('Science',     'SCI'),
('Social Studies', 'SST'),
('Hindi',       'HIN'),
('Computer Science', 'CS'),
('Physical Education', 'PE');

-- Seed: Default hero section
INSERT INTO hero_sections (overline, headline, subtext, marquee_text) VALUES
('Welcome to', 'Our School', 'Nurturing minds, shaping futures.', 'Admissions Open for 2025-2026 | Annual Day Celebrations Coming Soon!');

-- Seed: Default accounts are created by DataInitializer.java at runtime
-- using BCryptPasswordEncoder for reliable hashing.
-- Credentials:
--   admin    / admin123    (MANAGEMENT)
--   teacher1 / teacher123  (TEACHER)
--   student1 / student123  (STUDENT)
