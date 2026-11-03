package com.sms.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PaymentHistoryResponse {
    private Long id;
    private String receiptNumber;
    private BigDecimal amountPaid;
    private LocalDateTime paymentDate;
    private String paymentMode;
    private String recordedByName;
    private String notes;
    private String academicYear;
    private String whatsappReceiptLink;
}
