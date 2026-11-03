package com.sms.dto;

import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.Data;
import java.time.LocalDate;
import java.util.List;

@Data
public class AttendanceRequest {

    @NotNull(message = "Class ID is required")
    private Long classId;

    private Long subjectId; // Optional subject ID for subject-wise attendance

    @NotNull(message = "Date is required")
    private LocalDate date;

    @NotEmpty(message = "At least one attendance entry is required")
    private List<AttendanceEntry> entries;

    @Data
    public static class AttendanceEntry {
        @NotNull
        private Long studentId;
        @NotNull
        private String status; // PRESENT, ABSENT, LATE, EXCUSED
        private String remarks;
    }
}
