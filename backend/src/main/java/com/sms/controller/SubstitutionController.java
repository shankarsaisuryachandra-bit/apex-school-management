package com.sms.controller;

import com.sms.dto.AvailableTeacherDto;
import com.sms.dto.SubstitutionRequest;
import com.sms.model.Teacher;
import com.sms.model.TeacherSubstitution;
import com.sms.model.User;
import com.sms.repository.TeacherRepository;
import com.sms.service.SubstitutionService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/substitutions")
@RequiredArgsConstructor
@Slf4j
public class SubstitutionController {

    private final SubstitutionService substitutionService;
    private final TeacherRepository teacherRepository;

    /**
     * Get all substitutions for a date
     */
    @GetMapping("/daily")
    @PreAuthorize("hasAnyRole('MANAGEMENT', 'TEACHER', 'STUDENT', 'PARENT')")
    public ResponseEntity<List<TeacherSubstitution>> getDailySubstitutions(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        LocalDate queryDate = (date != null) ? date : LocalDate.now();
        return ResponseEntity.ok(substitutionService.getDailySubstitutions(queryDate));
    }

    /**
     * Get timetable slots belonging to an absent teacher on a date needing cover
     */
    @GetMapping("/affected-slots")
    @PreAuthorize("hasRole('MANAGEMENT')")
    public ResponseEntity<List<Map<String, Object>>> getAffectedSlots(
            @RequestParam Long teacherId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        LocalDate queryDate = (date != null) ? date : LocalDate.now();
        return ResponseEntity.ok(substitutionService.getAffectedSlotsForAbsentTeacher(teacherId, queryDate));
    }

    /**
     * Get list of substitute teachers for a slot with clash checking
     */
    @GetMapping("/available-teachers")
    @PreAuthorize("hasRole('MANAGEMENT')")
    public ResponseEntity<List<AvailableTeacherDto>> getAvailableTeachers(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date,
            @RequestParam(required = false) String dayOfWeek,
            @RequestParam String periodId,
            @RequestParam(required = false) Long absentTeacherId) {
        LocalDate queryDate = (date != null) ? date : LocalDate.now();
        return ResponseEntity.ok(substitutionService.getAvailableSubstitutes(queryDate, dayOfWeek, periodId, absentTeacherId));
    }

    /**
     * Assign a substitute teacher with clash detection
     */
    @PostMapping({"", "/assign"})
    @PreAuthorize("hasRole('MANAGEMENT')")
    public ResponseEntity<TeacherSubstitution> assignSubstitute(@RequestBody SubstitutionRequest req) {
        TeacherSubstitution saved = substitutionService.assignSubstitute(req);
        return ResponseEntity.ok(saved);
    }

    /**
     * Cancel/Remove a substitution
     */
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('MANAGEMENT')")
    public ResponseEntity<Map<String, String>> cancelSubstitution(@PathVariable Long id) {
        substitutionService.cancelSubstitution(id);
        return ResponseEntity.ok(Map.of("message", "Substitution cancelled successfully"));
    }

    /**
     * Get substitutions assigned to the currently logged-in teacher for today
     */
    @GetMapping("/my-covers")
    @PreAuthorize("hasRole('TEACHER')")
    public ResponseEntity<List<TeacherSubstitution>> getMyCovers(
            @AuthenticationPrincipal User user,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        Teacher teacher = teacherRepository.findByUserId(user.getId())
                .orElseThrow(() -> new RuntimeException("Teacher profile not found for user: " + user.getUsername()));

        LocalDate queryDate = (date != null) ? date : LocalDate.now();
        return ResponseEntity.ok(substitutionService.getSubstitutionsForSubstituteTeacher(teacher.getId(), queryDate));
    }
}
