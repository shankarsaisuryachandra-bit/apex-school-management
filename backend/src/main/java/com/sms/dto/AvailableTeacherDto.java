package com.sms.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AvailableTeacherDto {
    private Long teacherId;
    private String fullName;
    private String employeeId;
    private String qualification;
    private String email;
    private Boolean isAvailable;
    private String unavailabilityReason;
    private Long todaySubstitutionCount;
}
