package com.sms.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TimetableSlotRequest {
    private Long classId;
    private String dayOfWeek;
    private String periodId;
    private String periodLabel;
    private String startTime;
    private String endTime;
    private Long subjectId;
    private String subjectName;
    private Long teacherId;
    private String teacherName;
    private String room;
    private String academicYear;
}
