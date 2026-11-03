package com.sms.controller;

import com.sms.dto.*;
import com.sms.model.*;
import com.sms.repository.StudentRepository;
import com.sms.repository.TeacherRepository;
import com.sms.service.TimetableService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/timetable")
@RequiredArgsConstructor
@Slf4j
public class TimetableController {

    private final TimetableService timetableService;
    private final StudentRepository studentRepository;
    private final TeacherRepository teacherRepository;

    /**
     * Get timetable config (days and periods)
     */
    @GetMapping("/config")
    @PreAuthorize("hasAnyRole('MANAGEMENT', 'TEACHER', 'STUDENT')")
    public ResponseEntity<TimetableConfigDto> getConfig(
            @RequestParam(defaultValue = "2025-2026") String academicYear) {
        return ResponseEntity.ok(timetableService.getConfig(academicYear));
    }

    /**
     * Update period slot configs (Management only)
     */
    @PostMapping("/config")
    @PreAuthorize("hasRole('MANAGEMENT')")
    public ResponseEntity<List<TimetablePeriodConfig>> updateConfig(
            @RequestBody List<TimetablePeriodConfig> configs,
            @RequestParam(defaultValue = "2025-2026") String academicYear) {
        return ResponseEntity.ok(timetableService.updatePeriodConfigs(configs, academicYear));
    }

    /**
     * Get timetable for a specific class
     */
    @GetMapping("/class/{classId}")
    @PreAuthorize("hasAnyRole('MANAGEMENT', 'TEACHER', 'STUDENT')")
    public ResponseEntity<ClassTimetableResponse> getClassTimetable(
            @PathVariable Long classId,
            @RequestParam(defaultValue = "2025-2026") String academicYear) {
        return ResponseEntity.ok(timetableService.getClassTimetable(classId, academicYear));
    }

    /**
     * Get logged-in student's own class timetable
     */
    @GetMapping("/my-class")
    @PreAuthorize("hasRole('STUDENT')")
    public ResponseEntity<ClassTimetableResponse> getMyClassTimetable(
            @AuthenticationPrincipal User user,
            @RequestParam(defaultValue = "2025-2026") String academicYear) {
        Student student = studentRepository.findByUserId(user.getId())
                .orElseThrow(() -> new RuntimeException("Student record not found for user: " + user.getUsername()));

        if (student.getSchoolClass() == null) {
            throw new RuntimeException("No class currently assigned to student: " + student.getFullName());
        }

        return ResponseEntity.ok(timetableService.getClassTimetable(student.getSchoolClass().getId(), academicYear));
    }

    /**
     * Get timetable for a specific teacher (Management or Teacher)
     */
    @GetMapping("/teacher/{teacherId}")
    @PreAuthorize("hasAnyRole('MANAGEMENT', 'TEACHER')")
    public ResponseEntity<TeacherScheduleResponse> getTeacherSchedule(
            @PathVariable Long teacherId,
            @RequestParam(defaultValue = "2025-2026") String academicYear) {
        return ResponseEntity.ok(timetableService.getTeacherSchedule(teacherId, academicYear));
    }

    /**
     * Get logged-in teacher's own teaching schedule
     */
    @GetMapping("/my-schedule")
    @PreAuthorize("hasRole('TEACHER')")
    public ResponseEntity<TeacherScheduleResponse> getMyTeachingSchedule(
            @AuthenticationPrincipal User user,
            @RequestParam(defaultValue = "2025-2026") String academicYear) {
        Teacher teacher = teacherRepository.findByUserId(user.getId())
                .orElseThrow(() -> new RuntimeException("Teacher record not found for user: " + user.getUsername()));

        return ResponseEntity.ok(timetableService.getTeacherSchedule(teacher.getId(), academicYear));
    }

    /**
     * Save a timetable slot with STRICT TEACHER CLASH DETECTION (Management only)
     */
    @PostMapping("/slot")
    @PreAuthorize("hasRole('MANAGEMENT')")
    public ResponseEntity<?> saveSlot(@RequestBody TimetableSlotRequest req) {
        TimetableSlot slot = timetableService.saveSlot(req);
        if (slot == null) {
            return ResponseEntity.ok(Map.of("message", "Slot cleared successfully"));
        }
        return ResponseEntity.ok(slot);
    }

    /**
     * Delete/Clear a slot (Management only)
     */
    @DeleteMapping("/slot")
    @PreAuthorize("hasRole('MANAGEMENT')")
    public ResponseEntity<Map<String, String>> deleteSlot(
            @RequestParam Long classId,
            @RequestParam String dayOfWeek,
            @RequestParam String periodId,
            @RequestParam(defaultValue = "2025-2026") String academicYear) {
        timetableService.deleteSlot(classId, dayOfWeek, periodId, academicYear);
        return ResponseEntity.ok(Map.of("message", "Slot removed successfully"));
    }
}
