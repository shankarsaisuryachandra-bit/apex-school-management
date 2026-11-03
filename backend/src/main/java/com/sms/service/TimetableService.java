package com.sms.service;

import com.sms.dto.ClassTimetableResponse;
import com.sms.dto.TeacherScheduleResponse;
import com.sms.dto.TimetableConfigDto;
import com.sms.dto.TimetableSlotRequest;
import com.sms.exception.ScheduleConflictException;
import com.sms.model.*;
import com.sms.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;

@Service
@RequiredArgsConstructor
@Slf4j
public class TimetableService {

    private final TimetableSlotRepository slotRepository;
    private final TimetablePeriodConfigRepository periodConfigRepository;
    private final SchoolClassRepository schoolClassRepository;
    private final TeacherRepository teacherRepository;
    private final SubjectRepository subjectRepository;

    private static final List<String> DEFAULT_DAYS = List.of(
            "Monday", "Tuesday", "Wednesday", "Thursday", "Friday"
    );

    /**
     * Get timetable configuration (active days and period list)
     */
    public TimetableConfigDto getConfig(String academicYear) {
        String year = (academicYear != null && !academicYear.isBlank()) ? academicYear : "2025-2026";
        ensureDefaultPeriodConfigs(year);
        List<TimetablePeriodConfig> periods = periodConfigRepository.findByAcademicYearOrderBySortOrderAsc(year);
        return TimetableConfigDto.builder()
                .days(DEFAULT_DAYS)
                .periods(periods)
                .academicYear(year)
                .build();
    }

    /**
     * Get timetable for a specific school class
     */
    public ClassTimetableResponse getClassTimetable(Long classId, String academicYear) {
        String year = (academicYear != null && !academicYear.isBlank()) ? academicYear : "2025-2026";
        SchoolClass schoolClass = schoolClassRepository.findById(classId)
                .orElseThrow(() -> new RuntimeException("School class not found with ID: " + classId));

        ensureDefaultPeriodConfigs(year);
        List<TimetablePeriodConfig> periods = periodConfigRepository.findByAcademicYearOrderBySortOrderAsc(year);
        List<TimetableSlot> slots = slotRepository.findBySchoolClassIdAndAcademicYear(classId, year);

        // Build matrix for easy lookup: matrix[day][periodId] -> slot
        Map<String, Map<String, TimetableSlot>> matrix = new LinkedHashMap<>();
        for (String day : DEFAULT_DAYS) {
            matrix.put(day, new LinkedHashMap<>());
        }
        for (TimetableSlot slot : slots) {
            String pId = slot.getPeriodId();
            Map<String, TimetableSlot> dayMap = matrix.computeIfAbsent(slot.getDayOfWeek(), k -> new LinkedHashMap<>());
            dayMap.put(pId, slot);
            if (pId != null) {
                dayMap.put(pId.toLowerCase(), slot);
                dayMap.put(pId.toUpperCase(), slot);
            }
        }

        return ClassTimetableResponse.builder()
                .classId(schoolClass.getId())
                .className(schoolClass.getName())
                .section(schoolClass.getSection())
                .days(DEFAULT_DAYS)
                .periods(periods)
                .slots(slots)
                .matrix(matrix)
                .build();
    }

    /**
     * Get teaching schedule for a specific teacher across all classes
     */
    public TeacherScheduleResponse getTeacherSchedule(Long teacherId, String academicYear) {
        String year = (academicYear != null && !academicYear.isBlank()) ? academicYear : "2025-2026";
        Teacher teacher = teacherRepository.findById(teacherId)
                .orElseThrow(() -> new RuntimeException("Teacher not found with ID: " + teacherId));

        ensureDefaultPeriodConfigs(year);
        List<TimetablePeriodConfig> periods = periodConfigRepository.findByAcademicYearOrderBySortOrderAsc(year);
        List<TimetableSlot> slots = slotRepository.findByTeacherIdAndAcademicYear(teacherId, year);

        List<TeacherScheduleResponse.TeacherSlotDto> slotDtos = new ArrayList<>();
        for (TimetableSlot slot : slots) {
            slotDtos.add(TeacherScheduleResponse.TeacherSlotDto.builder()
                    .slotId(slot.getId())
                    .classId(slot.getSchoolClass().getId())
                    .className(slot.getSchoolClass().getName())
                    .section(slot.getSchoolClass().getSection())
                    .dayOfWeek(slot.getDayOfWeek())
                    .periodId(slot.getPeriodId())
                    .periodLabel(slot.getPeriodLabel())
                    .startTime(slot.getStartTime())
                    .endTime(slot.getEndTime())
                    .subjectId(slot.getSubject() != null ? slot.getSubject().getId() : null)
                    .subjectName(slot.getSubjectName() != null ? slot.getSubjectName() : (slot.getSubject() != null ? slot.getSubject().getName() : ""))
                    .room(slot.getRoom())
                    .build());
        }

        return TeacherScheduleResponse.builder()
                .teacherId(teacher.getId())
                .teacherName(teacher.getFullName())
                .employeeId(teacher.getEmployeeId())
                .days(DEFAULT_DAYS)
                .periods(periods)
                .assignedSlots(slotDtos)
                .build();
    }

    /**
     * Save or update a timetable slot with STRICT TEACHER CLASH DETECTION
     */
    @Transactional
    public TimetableSlot saveSlot(TimetableSlotRequest req) {
        if (req.getClassId() == null) {
            throw new RuntimeException("Class ID is required");
        }
        if (req.getDayOfWeek() == null || req.getDayOfWeek().isBlank()) {
            throw new RuntimeException("Day of week is required");
        }
        if (req.getPeriodId() == null || req.getPeriodId().isBlank()) {
            throw new RuntimeException("Period ID is required");
        }

        String year = (req.getAcademicYear() != null && !req.getAcademicYear().isBlank()) ? req.getAcademicYear() : "2025-2026";
        SchoolClass schoolClass = schoolClassRepository.findById(req.getClassId())
                .orElseThrow(() -> new RuntimeException("Class not found with ID: " + req.getClassId()));

        // Resolve Teacher if provided
        Teacher teacher = null;
        if (req.getTeacherId() != null) {
            teacher = teacherRepository.findById(req.getTeacherId()).orElse(null);
        } else if (req.getTeacherName() != null && !req.getTeacherName().isBlank()) {
            teacher = teacherRepository.findAll().stream()
                    .filter(t -> t.getFullName().equalsIgnoreCase(req.getTeacherName().trim()))
                    .findFirst().orElse(null);
        }

        // Resolve Subject if provided
        Subject subject = null;
        if (req.getSubjectId() != null) {
            subject = subjectRepository.findById(req.getSubjectId()).orElse(null);
        } else if (req.getSubjectName() != null && !req.getSubjectName().isBlank()) {
            subject = subjectRepository.findAll().stream()
                    .filter(s -> s.getName().equalsIgnoreCase(req.getSubjectName().trim()))
                    .findFirst().orElse(null);
        }

        String effectiveSubjectName = (subject != null) ? subject.getName() : req.getSubjectName();
        String effectiveTeacherName = (teacher != null) ? teacher.getFullName() : req.getTeacherName();

        // ══════════════════════════════════════════════════════════════════
        // STRICT TEACHER CLASH DETECTION LOGIC
        // ══════════════════════════════════════════════════════════════════
        if (teacher != null) {
            List<TimetableSlot> existingAssignmentsForTeacher =
                    slotRepository.findByTeacherIdAndDayOfWeekAndPeriodIdAndAcademicYear(
                            teacher.getId(), req.getDayOfWeek().trim(), req.getPeriodId().trim(), year);

            for (TimetableSlot clashSlot : existingAssignmentsForTeacher) {
                // If the teacher is already assigned to a DIFFERENT class on this day and period
                if (!clashSlot.getSchoolClass().getId().equals(schoolClass.getId())) {
                    String otherClassName = clashSlot.getSchoolClass().getName() + " (" + clashSlot.getSchoolClass().getSection() + ")";
                    String timeLabel = (clashSlot.getStartTime() != null && clashSlot.getEndTime() != null)
                            ? " (" + clashSlot.getStartTime() + " - " + clashSlot.getEndTime() + ")"
                            : "";
                    String subjectInfo = (clashSlot.getSubjectName() != null && !clashSlot.getSubjectName().isBlank())
                            ? " to teach " + clashSlot.getSubjectName()
                            : "";

                    String errorMsg = String.format(
                            "Schedule Conflict: Teacher %s is already assigned%s in %s on %s during %s%s. A teacher cannot be scheduled in two classes simultaneously!",
                            teacher.getFullName(),
                            subjectInfo,
                            otherClassName,
                            req.getDayOfWeek(),
                            clashSlot.getPeriodLabel(),
                            timeLabel
                    );

                    log.warn(errorMsg);
                    throw new ScheduleConflictException(errorMsg);
                }
            }
        }

        // ══════════════════════════════════════════════════════════════════
        // STRICT ROOM CLASH DETECTION LOGIC
        // ══════════════════════════════════════════════════════════════════
        if (req.getRoom() != null && !req.getRoom().trim().isEmpty() &&
                !req.getRoom().trim().equalsIgnoreCase("TBD") &&
                !req.getRoom().trim().equalsIgnoreCase("N/A")) {
            String room = req.getRoom().trim();
            List<TimetableSlot> roomSlots = slotRepository
                    .findByRoomAndDayOfWeekAndPeriodIdAndAcademicYear(room, req.getDayOfWeek().trim(), req.getPeriodId().trim(), year);

            for (TimetableSlot clashRoomSlot : roomSlots) {
                if (!clashRoomSlot.getSchoolClass().getId().equals(schoolClass.getId())) {
                    String otherClassName = clashRoomSlot.getSchoolClass().getName() + " (" + clashRoomSlot.getSchoolClass().getSection() + ")";
                    String errorMsg = String.format(
                            "Schedule Conflict: %s is already occupied by class %s on %s during %s. Two different classes cannot be scheduled in the same physical room simultaneously!",
                            room,
                            otherClassName,
                            req.getDayOfWeek(),
                            clashRoomSlot.getPeriodLabel()
                    );
                    log.warn(errorMsg);
                    throw new ScheduleConflictException(errorMsg);
                }
            }
        }

        // Check if a slot already exists for this class, day, and period
        Optional<TimetableSlot> existingSlotOpt =
                slotRepository.findBySchoolClassIdAndDayOfWeekAndPeriodIdAndAcademicYear(
                        schoolClass.getId(), req.getDayOfWeek().trim(), req.getPeriodId().trim(), year);

        // If both subject and teacher are empty, delete the slot (clearing the period)
        boolean isEmptySlot = (effectiveSubjectName == null || effectiveSubjectName.isBlank()) &&
                              (teacher == null && (effectiveTeacherName == null || effectiveTeacherName.isBlank()));

        if (isEmptySlot) {
            if (existingSlotOpt.isPresent()) {
                slotRepository.delete(existingSlotOpt.get());
                log.info("Cleared slot for class {} on {} at {}", schoolClass.getName(), req.getDayOfWeek(), req.getPeriodId());
            }
            return null;
        }

        // Find period config for time/label fallback if not provided
        TimetablePeriodConfig periodConfig = periodConfigRepository.findByPeriodIdAndAcademicYear(req.getPeriodId().trim(), year)
                .orElse(null);

        String periodLabel = (req.getPeriodLabel() != null && !req.getPeriodLabel().isBlank())
                ? req.getPeriodLabel()
                : (periodConfig != null ? periodConfig.getPeriodLabel() : req.getPeriodId());

        String startTime = (req.getStartTime() != null && !req.getStartTime().isBlank())
                ? req.getStartTime()
                : (periodConfig != null ? periodConfig.getStartTime() : "");

        String endTime = (req.getEndTime() != null && !req.getEndTime().isBlank())
                ? req.getEndTime()
                : (periodConfig != null ? periodConfig.getEndTime() : "");

        TimetableSlot slotToSave;
        if (existingSlotOpt.isPresent()) {
            slotToSave = existingSlotOpt.get();
        } else {
            slotToSave = new TimetableSlot();
            slotToSave.setSchoolClass(schoolClass);
            slotToSave.setDayOfWeek(req.getDayOfWeek().trim());
            slotToSave.setPeriodId(req.getPeriodId().trim());
            slotToSave.setAcademicYear(year);
        }

        slotToSave.setPeriodLabel(periodLabel);
        slotToSave.setStartTime(startTime);
        slotToSave.setEndTime(endTime);
        slotToSave.setSubject(subject);
        slotToSave.setSubjectName(effectiveSubjectName);
        slotToSave.setTeacher(teacher);
        slotToSave.setTeacherName(effectiveTeacherName);
        slotToSave.setRoom(req.getRoom() != null ? req.getRoom().trim() : "Room 101");

        TimetableSlot saved = slotRepository.save(slotToSave);
        log.info("Saved timetable slot: Class={} ({}), Day={}, Period={}, Teacher={}, Subject={}",
                schoolClass.getName(), schoolClass.getSection(), saved.getDayOfWeek(), saved.getPeriodId(),
                saved.getTeacherName(), saved.getSubjectName());
        return saved;
    }

    /**
     * Delete / Clear a slot
     */
    @Transactional
    public void deleteSlot(Long classId, String dayOfWeek, String periodId, String academicYear) {
        String year = (academicYear != null && !academicYear.isBlank()) ? academicYear : "2025-2026";
        slotRepository.deleteBySchoolClassIdAndDayOfWeekAndPeriodIdAndAcademicYear(classId, dayOfWeek, periodId, year);
    }

    /**
     * Update period slot definitions
     */
    @Transactional
    public List<TimetablePeriodConfig> updatePeriodConfigs(List<TimetablePeriodConfig> configs, String academicYear) {
        String year = (academicYear != null && !academicYear.isBlank()) ? academicYear : "2025-2026";
        periodConfigRepository.deleteByAcademicYear(year);

        int order = 1;
        List<TimetablePeriodConfig> toSave = new ArrayList<>();
        for (TimetablePeriodConfig cfg : configs) {
            cfg.setId(null);
            cfg.setAcademicYear(year);
            if (cfg.getSortOrder() == null) {
                cfg.setSortOrder(order++);
            }
            toSave.add(cfg);
        }
        return periodConfigRepository.saveAll(toSave);
    }

    /**
     * Ensure standard 7-period configuration is seeded for the academic year
     */
    @Transactional
    public void ensureDefaultPeriodConfigs(String academicYear) {
        List<TimetablePeriodConfig> existing = periodConfigRepository.findByAcademicYearOrderBySortOrderAsc(academicYear);
        if (existing.size() != 7) {
            log.info("Resetting/seeding default 7 period configs for academic year {}", academicYear);
            periodConfigRepository.deleteByAcademicYear(academicYear);
            List<TimetablePeriodConfig> defaults = List.of(
                    TimetablePeriodConfig.builder().periodId("p1").periodLabel("Period 1").startTime("08:30 AM").endTime("09:15 AM").sortOrder(1).academicYear(academicYear).build(),
                    TimetablePeriodConfig.builder().periodId("p2").periodLabel("Period 2").startTime("09:15 AM").endTime("10:00 AM").sortOrder(2).academicYear(academicYear).build(),
                    TimetablePeriodConfig.builder().periodId("p3").periodLabel("Period 3").startTime("10:15 AM").endTime("11:00 AM").sortOrder(3).academicYear(academicYear).build(),
                    TimetablePeriodConfig.builder().periodId("p4").periodLabel("Period 4").startTime("11:00 AM").endTime("11:45 AM").sortOrder(4).academicYear(academicYear).build(),
                    TimetablePeriodConfig.builder().periodId("p5").periodLabel("Period 5").startTime("12:30 PM").endTime("01:15 PM").sortOrder(5).academicYear(academicYear).build(),
                    TimetablePeriodConfig.builder().periodId("p6").periodLabel("Period 6").startTime("01:15 PM").endTime("02:00 PM").sortOrder(6).academicYear(academicYear).build(),
                    TimetablePeriodConfig.builder().periodId("p7").periodLabel("Period 7").startTime("02:00 PM").endTime("02:45 PM").sortOrder(7).academicYear(academicYear).build()
            );
            periodConfigRepository.saveAll(defaults);
        }
    }
}
