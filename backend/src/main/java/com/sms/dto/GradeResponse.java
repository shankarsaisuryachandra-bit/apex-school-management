package com.sms.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.math.BigDecimal;
import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class GradeResponse {
    private Long gradeId;
    private String assessmentName;
    private String subjectName;
    private LocalDate assessmentDate;
    private BigDecimal maxMarks;
    private BigDecimal marksObtained;
    private Double percentage;
    private String letterGrade;
    private Double gpa;
    private String remarks;
    private String assessmentType;
}
