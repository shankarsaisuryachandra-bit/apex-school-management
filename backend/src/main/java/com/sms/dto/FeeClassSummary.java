package com.sms.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FeeClassSummary {
    private Long classId;
    private String className;
    private long totalStudents;
    private long paidCount;
    private long partialCount;
    private long unpaidCount;
}
