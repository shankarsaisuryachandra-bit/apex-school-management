package com.sms.dto;

import com.sms.model.TimetablePeriodConfig;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TeacherScheduleResponse {
    private Long teacherId;
    private String teacherName;
    private String employeeId;
    private List<String> days;
    private List<TimetablePeriodConfig> periods;
    private List<TeacherSlotDto> assignedSlots;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class TeacherSlotDto {
        private Long slotId;
        private Long classId;
        private String className;
        private String section;
        private String dayOfWeek;
        private String periodId;
        private String periodLabel;
        private String startTime;
        private String endTime;
        private Long subjectId;
        private String subjectName;
        private String room;
    }
}
