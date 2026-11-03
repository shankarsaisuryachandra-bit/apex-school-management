package com.sms.controller;

import com.sms.dto.AttendanceRequest;
import com.sms.model.*;
import com.sms.service.AttendanceService;
import com.sms.service.communication.EmailService;
import com.sms.service.communication.SmsService;
import com.sms.repository.ParentContactRepository;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/attendance")
@RequiredArgsConstructor
public class AttendanceController {

    private final AttendanceService attendanceService;
    private final EmailService emailService;
    private final SmsService smsService;
    private final ParentContactRepository parentContactRepository;

    /**
     * Batch mark attendance for a class (and optional subject).
     * After marking, triggers notifications for absent students.
     */
    @PostMapping({"", "/mark"})
    @PreAuthorize("hasAnyRole('TEACHER', 'MANAGEMENT')")
    public ResponseEntity<Map<String, Object>> markAttendance(
            @Valid @RequestBody AttendanceRequest request,
            @AuthenticationPrincipal User user) {

        List<Attendance> records = attendanceService.markAttendance(request, user);

        // Trigger absence notifications
        List<Student> absentStudents = attendanceService
                .getAbsentStudents(request.getClassId(), request.getDate(), request.getSubjectId());
        for (Student student : absentStudents) {
            notifyParentsOfAbsence(student, request.getDate());
        }

        return ResponseEntity.ok(Map.of(
                "message", "Attendance marked successfully",
                "totalMarked", records.size(),
                "absentCount", absentStudents.size(),
                "date", request.getDate().toString()
        ));
    }

    /**
     * Get class attendance for a specific date (and optional subject).
     */
    @GetMapping("/class/{classId}")
    @PreAuthorize("hasAnyRole('TEACHER', 'MANAGEMENT')")
    public ResponseEntity<List<Map<String, Object>>> getClassAttendance(
            @PathVariable Long classId,
            @RequestParam String date,
            @RequestParam(required = false) Long subjectId) {
        LocalDate parsedDate = LocalDate.parse(date);
        return ResponseEntity.ok(attendanceService.getClassAttendance(classId, parsedDate, subjectId));
    }

    /**
     * Get student attendance over a date range with percentages.
     */
    @GetMapping("/student/{studentId}")
    public ResponseEntity<Map<String, Object>> getStudentAttendance(
            @PathVariable Long studentId,
            @RequestParam String from,
            @RequestParam String to) {
        LocalDate fromDate = LocalDate.parse(from);
        LocalDate toDate = LocalDate.parse(to);
        return ResponseEntity.ok(attendanceService.getStudentAttendance(studentId, fromDate, toDate));
    }

    /**
     * Multi-channel absence notification.
     */
    private void notifyParentsOfAbsence(Student student, LocalDate date) {
        List<ParentContact> parents = parentContactRepository.findByStudentId(student.getId());
        String dateStr = date.format(DateTimeFormatter.ofPattern("dd-MM-yyyy"));

        for (ParentContact parent : parents) {
            if (parent.getEmail() != null && !parent.getEmail().isEmpty()) {
                emailService.sendAbsenceAlert(parent.getEmail(), student.getFullName(), dateStr);
            }

            String smsMessage = String.format(
                    "Alert: %s was marked ABSENT on %s. Contact school if unexpected.",
                    student.getFullName(), dateStr);
            smsService.sendSms(parent.getPhone(), smsMessage);
        }
    }
}
