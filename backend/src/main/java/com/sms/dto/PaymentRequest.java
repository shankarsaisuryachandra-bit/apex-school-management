package com.sms.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import lombok.Data;
import java.math.BigDecimal;

@Data
@JsonIgnoreProperties(ignoreUnknown = true)
public class PaymentRequest {

    @NotNull(message = "Student ID is required")
    private Long studentId;

    @NotNull(message = "Amount is required")
    @DecimalMin(value = "0.01", message = "Payment amount must be greater than zero. Outside permitted range.")
    @DecimalMax(value = "5000000.00", message = "Payment amount cannot exceed 5,000,000. Outside permitted range.")
    private BigDecimal amount;

    private String academicYear;
    private String paymentMode;
    private String notes;
    private String remarks;

    public String getEffectiveNotes() {
        if (notes != null && !notes.trim().isEmpty()) return notes.trim();
        if (remarks != null && !remarks.trim().isEmpty()) return remarks.trim();
        return "";
    }
}
