package com.sms.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class GradebookStudentResponse {
    private Long studentId;
    private String studentName;
    private String admissionNumber;
    private Integer rollNumber;
    private BigDecimal marksObtained;
    private String remarks;
}
