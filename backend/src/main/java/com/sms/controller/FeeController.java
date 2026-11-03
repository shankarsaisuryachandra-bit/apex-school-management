package com.sms.controller;

import com.sms.dto.*;
import com.sms.model.PaymentHistory;
import com.sms.model.User;
import com.sms.service.FeeService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/fees")
@RequiredArgsConstructor
public class FeeController {

    private final FeeService feeService;
    private final com.sms.repository.StudentRepository studentRepository;

    /**
     * Fee Dashboard — bar chart data with independent count queries (Anti-Bug).
     */
    @GetMapping("/dashboard")
    @PreAuthorize("hasRole('MANAGEMENT')")
    public ResponseEntity<FeeDashboardResponse> getDashboard(
            @RequestParam(defaultValue = "2025-2026") String academicYear) {
        return ResponseEntity.ok(feeService.getFeeDashboard(academicYear));
    }

    /**
     * Filter students by class and payment status.
     */
    @GetMapping("/students")
    @PreAuthorize("hasRole('MANAGEMENT')")
    public ResponseEntity<List<StudentFeeResponse>> getStudents(
            @RequestParam Long classId,
            @RequestParam(required = false) String status,
            @RequestParam(defaultValue = "2025-2026") String academicYear) {
        return ResponseEntity.ok(feeService.getStudentsByClassAndStatus(classId, status, academicYear));
    }

    /**
     * Individual student fee breakdown.
     */
    @GetMapping("/student/{studentId}")
    @PreAuthorize("hasAnyRole('MANAGEMENT', 'STUDENT')")
    public ResponseEntity<StudentFeeResponse> getStudentFee(
            @PathVariable Long studentId,
            @RequestParam(defaultValue = "2025-2026") String academicYear,
            @AuthenticationPrincipal User user) {
        if (user != null && user.getRole() == User.Role.STUDENT) {
            com.sms.model.Student s = studentRepository.findByUserId(user.getId()).orElse(null);
            if (s == null || (!s.getId().equals(studentId) && !s.getUser().getId().equals(studentId))) {
                throw new org.springframework.security.access.AccessDeniedException("Access denied: You can only view your own fee status.");
            }
        }
        return ResponseEntity.ok(feeService.getStudentFee(studentId, academicYear));
    }

    /**
     * Current student's own fee status.
     */
    @GetMapping("/my-fees")
    @PreAuthorize("hasRole('STUDENT')")
    public ResponseEntity<StudentFeeResponse> getMyFees(
            @AuthenticationPrincipal User user,
            @RequestParam(defaultValue = "2025-2026") String academicYear) {
        // Resolve student from user
        return ResponseEntity.ok(feeService.getStudentFee(user.getId(), academicYear));
    }

    /**
     * Record a payment (Online Payment by Student/Parent or Cash Payment by Management).
     */
    @PostMapping({"", "/payment", "/pay"})
    @PreAuthorize("hasAnyRole('MANAGEMENT', 'STUDENT')")
    public ResponseEntity<Map<String, Object>> recordPayment(
            @Valid @RequestBody PaymentRequest request,
            @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(feeService.recordPayment(request, user));
    }

    /**
     * Get transaction payment history ledger for a student.
     */
    @GetMapping("/student/{studentId}/history")
    @PreAuthorize("hasAnyRole('MANAGEMENT', 'STUDENT')")
    public ResponseEntity<List<PaymentHistoryResponse>> getStudentPaymentHistory(
            @PathVariable Long studentId,
            @RequestParam(defaultValue = "2025-2026") String academicYear,
            @AuthenticationPrincipal User user) {
        if (user != null && user.getRole() == User.Role.STUDENT) {
            com.sms.model.Student s = studentRepository.findByUserId(user.getId()).orElse(null);
            if (s == null || (!s.getId().equals(studentId) && !s.getUser().getId().equals(studentId))) {
                throw new org.springframework.security.access.AccessDeniedException("Access denied: You can only view your own payment history.");
            }
        }
        return ResponseEntity.ok(feeService.getStudentPaymentHistory(studentId, academicYear));
    }

    /**
     * Export fee records as CSV.
     */
    @GetMapping("/export/csv")
    @PreAuthorize("hasRole('MANAGEMENT')")
    public ResponseEntity<List<String[]>> exportCsv(
            @RequestParam Long classId,
            @RequestParam(required = false) String status,
            @RequestParam(defaultValue = "2025-2026") String academicYear) {
        return ResponseEntity.ok(feeService.exportFeesToCsv(classId, status, academicYear));
    }

    /**
     * Get fee components.
     */
    @GetMapping("/components")
    @PreAuthorize("hasRole('MANAGEMENT')")
    public ResponseEntity<List<com.sms.model.FeeComponent>> getComponents(
            @RequestParam(required = false) Long classId,
            @RequestParam(defaultValue = "2025-2026") String academicYear) {
        return ResponseEntity.ok(feeService.getFeeComponents(classId, academicYear));
    }

    /**
     * Create fee component.
     */
    @PostMapping("/components")
    @PreAuthorize("hasRole('MANAGEMENT')")
    public ResponseEntity<com.sms.model.FeeComponent> createComponent(
            @RequestBody com.sms.model.FeeComponent component) {
        return ResponseEntity.ok(feeService.createFeeComponent(component));
    }

    /**
     * Update student fee structure (currentYearDue, previousYearPending).
     */
    @PutMapping("/student/{studentId}")
    @PreAuthorize("hasRole('MANAGEMENT')")
    public ResponseEntity<StudentFeeResponse> updateStudentFee(
            @PathVariable Long studentId,
            @RequestBody Map<String, Object> body,
            @RequestParam(defaultValue = "2025-2026") String academicYear) {
        java.math.BigDecimal currentDue = body.get("currentYearDue") != null ?
                new java.math.BigDecimal(body.get("currentYearDue").toString()) : null;
        java.math.BigDecimal prevPending = body.get("previousYearPending") != null ?
                new java.math.BigDecimal(body.get("previousYearPending").toString()) : null;
        return ResponseEntity.ok(feeService.updateStudentFee(studentId, currentDue, prevPending, academicYear));
    }

    /**
     * Get Fee Defaulters with aging analysis.
     */
    @GetMapping("/defaulters")
    @PreAuthorize("hasRole('MANAGEMENT')")
    public ResponseEntity<List<Map<String, Object>>> getDefaulters(
            @RequestParam(defaultValue = "2025-2026") String academicYear,
            @RequestParam(required = false) Long classId,
            @RequestParam(required = false, defaultValue = "ALL") String stage) {
        return ResponseEntity.ok(feeService.getFeeDefaulters(academicYear, classId, stage));
    }

    /**
     * Send Defaulter Reminder across channels (In-App, SMS, WhatsApp).
     */
    @PostMapping("/defaulters/reminder")
    @PreAuthorize("hasRole('MANAGEMENT')")
    public ResponseEntity<Map<String, Object>> sendReminder(
            @RequestBody Map<String, Object> body,
            @AuthenticationPrincipal User user) {
        Long studentId = Long.valueOf(body.get("studentId").toString());
        String reminderType = (String) body.getOrDefault("reminderType", "IN_APP");
        String customNote = (String) body.get("customNote");
        String deadlineDate = (String) body.get("deadlineDate");
        return ResponseEntity.ok(feeService.sendDefaulterReminder(studentId, reminderType, customNote, deadlineDate, user));
    }

    /**
     * Record structured installment plan relief agreement.
     */
    @PostMapping("/defaulters/installment-plan")
    @PreAuthorize("hasRole('MANAGEMENT')")
    public ResponseEntity<Map<String, Object>> recordInstallmentPlan(
            @RequestBody Map<String, Object> body) {
        Long studentId = Long.valueOf(body.get("studentId").toString());
        int installments = Integer.parseInt(body.getOrDefault("installments", 3).toString());
        String startDate = (String) body.get("startDate");
        String termsNote = (String) body.get("termsNote");
        return ResponseEntity.ok(feeService.recordInstallmentPlan(studentId, installments, startDate, termsNote));
    }
}
