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
public class TimetableConfigDto {
    private List<String> days;
    private List<TimetablePeriodConfig> periods;
    private String academicYear;
}
