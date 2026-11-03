package com.sms.dto;

import com.sms.model.TimetablePeriodConfig;
import com.sms.model.TimetableSlot;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.Map;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ClassTimetableResponse {
    private Long classId;
    private String className;
    private String section;
    private List<String> days;
    private List<TimetablePeriodConfig> periods;
    private List<TimetableSlot> slots;
    // Map of day -> periodId -> TimetableSlot for instant O(1) table cell lookup
    private Map<String, Map<String, TimetableSlot>> matrix;
}
