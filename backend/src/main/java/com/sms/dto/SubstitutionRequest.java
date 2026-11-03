package com.sms.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SubstitutionRequest {
    private LocalDate date;
    private Long classId;
    private String dayOfWeek;
    private String periodId;
    private String periodLabel;
    private String startTime;
    private String endTime;
    private Long subjectId;
    private String subjectName;
    private Long absentTeacherId;
    private Long substituteTeacherId;
    private String room;
    private String notes;
    private String academicYear;
}
