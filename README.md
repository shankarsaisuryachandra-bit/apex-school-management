# Comprehensive Web-Based School Management System

> **Final-Year BTech CSE Major Project**  
> Full-Stack Architecture built with **Java 24 (Spring Boot 3.2)**, **MySQL 8.0**, and **React 18 (Vite + Tailwind CSS)**.

---

## Key Features

- **Role-Based Access Control (RBAC)**: JWT authentication with dedicated portals for **Management (Admin)**, **Teachers**, and **Students**.
- **Fee Management & Anti-Bug Safeguards**:
  - Independent SQL `COUNT` queries prevent false-positive status rendering.
  - Calculated generated columns for `grand_total` and `balance_due`.
  - Export fee summaries to CSV and generate direct WhatsApp (`wa.me`) payment reminder links.
- **Attendance Register & Absence Alerts**:
  - Batch daily attendance marking per class.
  - Multi-channel notification pipeline (Gmail SMTP email alerts & Mock SMS service logs).
- **Academic Progress & Dynamic Gradebook**:
  - Teacher-defined assessment headers (e.g., FA1, Half-Yearly, Final Exam).
  - Bulk grade entry grid with real-time student mapping.
  - Interactive performance trend line charts for students.
- **Content Management System (CMS)**:
  - Dynamic public website with editable hero section, announcements marquee, facilities grid, and media gallery.
- **Year-End Promotions & Alumni Registry**:
  - Automatic promotion rules engine (Grade 1 to 9 promoted, Grade 10 migrated to Alumni Registry).
  - Dry-run promotion preview and alumni search portal.
- **Zero-Cost API Architecture**:
  - Fully functional without paid third-party services (Twilio, SendGrid, or WhatsApp Business API).

---

## Default System Credentials

| Role | Username | Password | Access / Features |
|------|----------|----------|-------------------|
| **MANAGEMENT** | `admin` | `admin123` | Full administrative control, fee dashboard, CMS editor, promotions |
| **TEACHER** | `teacher1` | `teacher123` | Grade 10 A (Mathematics) — Attendance marking & Gradebook |
| **STUDENT** | `student1` | `student123` | Grade 10 A — Fee status, academic progress, attendance history |

*All default accounts are automatically initialized on application startup by `DataInitializer.java` using `BCryptPasswordEncoder`.*

---

## Tech Stack & Architecture

### Backend (`/backend`)
- **Framework**: Spring Boot 3.2.5 (Java 24 compatibility)
- **Security**: Spring Security 6, JWT (`jjwt 0.12.5`), BCrypt Hashing
- **Persistence**: Spring Data JPA, Hibernate 6, HikariCP
- **Database**: MySQL 8.0+

### Frontend (`/frontend`)
- **Framework**: React 18, Vite 5
- **Styling**: Tailwind CSS 3.4
- **Charts**: Recharts / Canvas-based charts
- **Icons**: React Icons (Heroicons v2, FontAwesome)

---

## Installation & Running Guide

### 1. Database Setup
Create the MySQL database:
```sql
CREATE DATABASE IF NOT EXISTS school_management;
```
Import the schema:
```powershell
Get-Content .\database\schema.sql | mysql -u root school_management
```

### 2. Start Backend Server
```powershell
cd backend
mvn spring-boot:run
```
*The Spring Boot server will run on `http://localhost:8080`.*

### 3. Start Frontend Application
```powershell
cd frontend
npm install
npm run dev
```
*The Vite development server will run on `http://localhost:5173`.*

---

## API Documentation Overview

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| `POST` | `/api/auth/login` | Public | Authenticate user & receive JWT token |
| `POST` | `/api/auth/refresh` | Public | Refresh expired JWT token |
| `GET` | `/api/dashboard/stats` | Management | Real-time counts (students, teachers, fees, attendance) |
| `GET` | `/api/fees/dashboard` | Management | Anti-bug class fee status counts |
| `GET` | `/api/fees/my-fees` | Student | Individual fee breakdown |
| `POST` | `/api/fees/payment` | Management | Record fee payment & generate receipt |
| `POST` | `/api/attendance/mark` | Teacher/Admin | Batch mark class attendance & trigger alerts |
| `GET` | `/api/attendance/student/{id}` | Authenticated | Student attendance percentage & daily history |
| `POST` | `/api/academics/assessments` | Teacher | Create assessment header |
| `POST` | `/api/academics/grades/bulk` | Teacher | Submit student marks |
| `GET` | `/api/academics/grades/student/{id}` | Authenticated | Fetch performance line chart data |
| `GET` | `/api/cms/hero` | Public | Get dynamic landing page hero content |
| `POST` | `/api/promotions/promote-all` | Management | Execute year-end student promotion |

---

## License & University Submission
Developed as a Major Project for BTech Computer Science & Engineering.
