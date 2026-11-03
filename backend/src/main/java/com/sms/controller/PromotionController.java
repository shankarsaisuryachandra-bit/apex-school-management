package com.sms.controller;

import com.sms.service.PromotionService;
import com.sms.model.AlumniRegistry;
import com.sms.repository.AlumniRegistryRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class PromotionController {

    private final PromotionService promotionService;
    private final AlumniRegistryRepository alumniRegistryRepository;

    /**
     * Preview what promotion will do (dry run).
     */
    @GetMapping("/promotions/preview")
    @PreAuthorize("hasRole('MANAGEMENT')")
    public ResponseEntity<Map<String, Object>> previewPromotion(
            @RequestParam(defaultValue = "2025-2026") String academicYear) {
        return ResponseEntity.ok(promotionService.previewPromotion(academicYear));
    }

    /**
     * Check individual student promotion eligibility (attendance ≥ 75%, academics ≥ 50%).
     */
    @GetMapping("/promotions/eligibility/{studentId}")
    @PreAuthorize("hasAnyRole('MANAGEMENT', 'TEACHER')")
    public ResponseEntity<Map<String, Object>> checkEligibility(
            @PathVariable Long studentId,
            @RequestParam(defaultValue = "2025-2026") String academicYear) {
        return ResponseEntity.ok(promotionService.checkPromotionEligibility(studentId, academicYear));
    }

    /**
     * Execute bulk promotion.
     */
    @PostMapping("/promotions/promote-all")
    @PreAuthorize("hasRole('MANAGEMENT')")
    public ResponseEntity<Map<String, Object>> promoteAll(
            @RequestParam(defaultValue = "2025-2026") String academicYear) {
        return ResponseEntity.ok(promotionService.promoteAll(academicYear));
    }

    /**
     * Promote an individual student and roll over remaining fee balance to previous pending fee.
     */
    @PostMapping("/promotions/promote-student/{studentId}")
    @PreAuthorize("hasRole('MANAGEMENT')")
    public ResponseEntity<Map<String, Object>> promoteStudent(
            @PathVariable Long studentId,
            @RequestBody Map<String, Object> payload) {
        Long targetClassId = payload.get("targetClassId") != null && !payload.get("targetClassId").toString().trim().isEmpty() ?
                Long.valueOf(payload.get("targetClassId").toString().trim()) : null;

        String targetAcademicYear = payload.get("targetAcademicYear") != null ?
                payload.get("targetAcademicYear").toString() : null;

        java.math.BigDecimal newClassFee = payload.get("newClassFee") != null && !payload.get("newClassFee").toString().trim().isEmpty() ?
                new java.math.BigDecimal(payload.get("newClassFee").toString().trim()) : java.math.BigDecimal.ZERO;

        Boolean forceAlumni = payload.get("isAlumni") != null ?
                Boolean.valueOf(payload.get("isAlumni").toString()) : null;

        return ResponseEntity.ok(promotionService.promoteIndividualStudent(studentId, targetClassId, targetAcademicYear, newClassFee, forceAlumni));
    }

    /**
     * Get alumni filtered by graduation year.
     */
    @GetMapping("/alumni")
    @PreAuthorize("hasRole('MANAGEMENT')")
    public ResponseEntity<List<AlumniRegistry>> getAlumni(
            @RequestParam(required = false) String graduationYear) {
        if (graduationYear != null && !graduationYear.isEmpty()) {
            return ResponseEntity.ok(
                    alumniRegistryRepository.findByGraduationYearOrderByFullNameAsc(graduationYear));
        }
        return ResponseEntity.ok(alumniRegistryRepository.findAllByOrderByGraduationYearDescFullNameAsc());
    }
}
