package com.sms.dto;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDate;

@Data
public class AssessmentRequest {

    @NotBlank(message = "Assessment name is required")
    private String name;

    @NotNull(message = "Class ID is required")
    private Long classId;

    @NotNull(message = "Subject ID is required")
    private Long subjectId;

    @NotNull(message = "Max marks is required")
    @DecimalMin(value = "1.0", message = "Maximum marks must be at least 1")
    @DecimalMax(value = "1000.0", message = "Maximum marks cannot exceed 1000")
    private BigDecimal maxMarks;

    private LocalDate assessmentDate;
    private String academicYear;
}
