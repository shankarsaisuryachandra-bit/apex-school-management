package com.sms.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.math.BigDecimal;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StudentFeeResponse {
    private Long studentId;
    private String studentName;
    private String admissionNumber;
    private String className;
    private String academicYear;
    private BigDecimal currentYearDue;
    private BigDecimal previousYearPending;
    private BigDecimal grandTotal;
    private BigDecimal totalPaid;
    private BigDecimal balanceDue;
    private String status;
    private String whatsappLink;
    private String parentName;
    private String parentPhone;
    private String parentEmail;
    private List<PaymentHistoryResponse> paymentHistory;
}

