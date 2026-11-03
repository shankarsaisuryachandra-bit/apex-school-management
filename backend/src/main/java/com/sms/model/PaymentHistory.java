package com.sms.model;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "payment_history")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PaymentHistory {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "student_fee_id", nullable = false)
    private StudentFee studentFee;

    @Column(name = "amount_paid", nullable = false, precision = 10, scale = 2)
    private BigDecimal amountPaid;

    @Column(name = "payment_date")
    private LocalDateTime paymentDate;

    @Enumerated(EnumType.STRING)
    @Column(name = "payment_mode")
    private PaymentMode paymentMode;

    @Column(name = "receipt_number", unique = true, length = 30)
    private String receiptNumber;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "recorded_by")
    private User recordedBy;

    @Column(columnDefinition = "TEXT")
    private String notes;

    @PrePersist
    protected void onCreate() {
        if (this.paymentDate == null) {
            this.paymentDate = LocalDateTime.now();
        }
    }

    public enum PaymentMode {
        CASH, ONLINE, UPI, CHEQUE, DD, CARD, NET_BANKING;

        public static PaymentMode fromString(String mode) {
            if (mode == null || mode.trim().isEmpty()) return CASH;
            String upper = mode.trim().toUpperCase();
            if (upper.contains("UPI")) return UPI;
            if (upper.contains("CARD")) return CARD;
            if (upper.contains("NET") || upper.contains("BANK") || upper.contains("NEFT") || upper.contains("RTGS")) return NET_BANKING;
            if (upper.contains("CHEQUE") || upper.contains("CHECK")) return CHEQUE;
            if (upper.contains("DD") || upper.contains("DRAFT")) return DD;
            if (upper.contains("ONLINE") || upper.contains("RAZORPAY") || upper.contains("GATEWAY")) return ONLINE;
            try {
                return PaymentMode.valueOf(upper);
            } catch (Exception e) {
                return CASH;
            }
        }
    }
}
