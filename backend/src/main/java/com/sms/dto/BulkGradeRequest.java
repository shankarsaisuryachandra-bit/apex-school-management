package com.sms.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.Data;
import java.math.BigDecimal;
import java.util.List;

@Data
public class BulkGradeRequest {

    @NotNull(message = "Assessment header ID is required")
    private Long assessmentHeaderId;

    @NotEmpty(message = "At least one grade entry is required")
    private List<@Valid GradeEntry> grades;

    @Data
    public static class GradeEntry {
        @NotNull
        private Long studentId;

        @DecimalMin(value = "0.0", message = "Marks obtained cannot be negative. Permitted range is [0 - 1000].")
        @DecimalMax(value = "1000.0", message = "Marks obtained cannot exceed 1000. Permitted range is [0 - 1000].")
        private BigDecimal marksObtained;

        private String remarks;
    }
}
