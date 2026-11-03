package com.sms.service;

import com.sms.dto.AvailableTeacherDto;
import com.sms.dto.SubstitutionRequest;
import com.sms.exception.ScheduleConflictException;
import com.sms.model.*;
import com.sms.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.*;

@Service
@RequiredArgsConstructor
@Slf4j
public class SubstitutionService {

    private final TeacherSubstitutionRepository substitutionRepository;
    private final TimetableSlotRepository slotRepository;
    private final TeacherRepository teacherRepository;
    private final SchoolClassRepository schoolClassRepository;
    private final SubjectRepository subjectRepository;

    /**
     * Get all substitutions for a given date
     */
    public List<TeacherSubstitution> getDailySubstitutions(LocalDate date) {
        LocalDate queryDate = (date != null) ? date : LocalDate.now();
        return substitutionRepository.findByDateOrderByStartTimeAsc(queryDate);
    }

    /**
     * Get timetable slots belonging to an absent teacher on a specific date needing cover
     */
    public List<Map<String, Object>> getAffectedSlotsForAbsentTeacher(Long absentTeacherId, LocalDate date) {
        LocalDate queryDate = (date != null) ? date : LocalDate.now();
        String dayOfWeek = capitalizeDay(queryDate.getDayOfWeek().name());
        String year = "2025-2026";

        Teacher absentTeacher = teacherRepository.findById(absentTeacherId)
                .orElseThrow(() -> new RuntimeException("Absent teacher not found with ID: " + absentTeacherId));

        List<TimetableSlot> regularSlots = slotRepository.findByTeacherIdAndAcademicYear(absentTeacherId, year).stream()
                .filter(s -> s.getDayOfWeek().equalsIgnoreCase(dayOfWeek))
                .toList();

        List<Map<String, Object>> result = new ArrayList<>();
        for (TimetableSlot slot : regularSlots) {
            Optional<TeacherSubstitution> subOpt = substitutionRepository
                    .findByDateAndSchoolClassIdAndPeriodId(queryDate, slot.getSchoolClass().getId(), slot.getPeriodId());

            Map<String, Object> item = new LinkedHashMap<>();
            item.put("slotId", slot.getId());
            item.put("classId", slot.getSchoolClass().getId());
            item.put("className", slot.getSchoolClass().getName() + " (" + slot.getSchoolClass().getSection() + ")");
            item.put("dayOfWeek", dayOfWeek);
            item.put("periodId", slot.getPeriodId());
            item.put("periodLabel", slot.getPeriodLabel());
            item.put("startTime", slot.getStartTime());
            item.put("endTime", slot.getEndTime());
            item.put("subjectId", slot.getSubject() != null ? slot.getSubject().getId() : null);
            item.put("subjectName", slot.getSubjectName() != null ? slot.getSubjectName() : (slot.getSubject() != null ? slot.getSubject().getName() : ""));
            item.put("room", slot.getRoom());
            item.put("absentTeacherId", absentTeacher.getId());
            item.put("absentTeacherName", absentTeacher.getFullName());

            if (subOpt.isPresent()) {
                TeacherSubstitution sub = subOpt.get();
                item.put("substitutionId", sub.getId());
                item.put("substituteTeacherId", sub.getSubstituteTeacher().getId());
                item.put("substituteTeacherName", sub.getSubstituteTeacher().getFullName());
                item.put("status", sub.getStatus().name());
                item.put("isCovered", true);
            } else {
                item.put("substitutionId", null);
                item.put("substituteTeacherId", null);
                item.put("substituteTeacherName", null);
                item.put("status", "UNASSIGNED");
                item.put("isCovered", false);
            }

            result.add(item);
        }

        return result;
    }

    /**
     * Get available substitute teachers for a specific day and period with CONFLICT CHECKING
     */
    public List<AvailableTeacherDto> getAvailableSubstitutes(LocalDate date, String dayOfWeek, String periodId, Long absentTeacherId) {
        LocalDate queryDate = (date != null) ? date : LocalDate.now();
        String day = (dayOfWeek != null && !dayOfWeek.isBlank()) ? dayOfWeek : capitalizeDay(queryDate.getDayOfWeek().name());
        String year = "2025-2026";

        List<Teacher> allTeachers = teacherRepository.findAll();
        List<AvailableTeacherDto> availableList = new ArrayList<>();

        for (Teacher teacher : allTeachers) {
            // Exclude the teacher who is absent
            if (absentTeacherId != null && teacher.getId().equals(absentTeacherId)) {
                continue;
            }

            boolean isBusyWithRegularClass = false;
            String unavailabilityReason = null;

            // 1. Check if teacher has a regular class assigned in master timetable at this day & period
            List<TimetableSlot> regularSlots = slotRepository
                    .findByTeacherIdAndDayOfWeekAndPeriodIdAndAcademicYear(teacher.getId(), day.trim(), periodId.trim(), year);

            if (!regularSlots.isEmpty()) {
                TimetableSlot busySlot = regularSlots.get(0);
                isBusyWithRegularClass = true;
                unavailabilityReason = "Teaching " + busySlot.getSchoolClass().getName() + " (" + busySlot.getSchoolClass().getSection() + ") — " + busySlot.getSubjectName();
            }

            // 2. Check if teacher is ALREADY covering another substitution at this date & period
            List<TeacherSubstitution> existingSubs = substitutionRepository
                    .findByDateAndSubstituteTeacherIdAndPeriodId(queryDate, teacher.getId(), periodId.trim());

            if (!existingSubs.isEmpty()) {
                TeacherSubstitution busySub = existingSubs.get(0);
                isBusyWithRegularClass = true;
                unavailabilityReason = "Already substituting " + busySub.getSchoolClass().getName() + " (" + busySub.getSchoolClass().getSection() + ")";
            }

            // 3. Count total substitutions performed by this teacher on this date
            long todaySubCount = substitutionRepository.findByDateAndSubstituteTeacherId(queryDate, teacher.getId()).size();

            availableList.add(AvailableTeacherDto.builder()
                    .teacherId(teacher.getId())
                    .fullName(teacher.getFullName())
                    .employeeId(teacher.getEmployeeId())
                    .qualification(teacher.getQualification())
                    .email(teacher.getEmail())
                    .isAvailable(!isBusyWithRegularClass)
                    .unavailabilityReason(unavailabilityReason)
                    .todaySubstitutionCount(todaySubCount)
                    .build());
        }

        // Sort: Available teachers first, then by lowest substitution workload count
        availableList.sort(Comparator.comparing(AvailableTeacherDto::getIsAvailable).reversed()
                .thenComparing(AvailableTeacherDto::getTodaySubstitutionCount));

        return availableList;
    }

    /**
     * Assign a substitute teacher with STRICT CONFLICT CHECKING
     */
    @Transactional
    public TeacherSubstitution assignSubstitute(SubstitutionRequest req) {
        LocalDate date = (req.getDate() != null) ? req.getDate() : LocalDate.now();
        if (date.isBefore(LocalDate.now())) {
            throw new IllegalArgumentException("Cannot assign teacher substitutions for past dates (" + date + ").");
        }

        String year = (req.getAcademicYear() != null && !req.getAcademicYear().isBlank()) ? req.getAcademicYear() : "2025-2026";
        String dayOfWeek = (req.getDayOfWeek() != null && !req.getDayOfWeek().isBlank())
                ? req.getDayOfWeek()
                : capitalizeDay(date.getDayOfWeek().name());

        if (req.getClassId() == null) throw new IllegalArgumentException("Class ID is required");
        if (req.getPeriodId() == null || req.getPeriodId().isBlank()) throw new IllegalArgumentException("Period ID is required");
        if (req.getSubstituteTeacherId() == null) throw new IllegalArgumentException("Substitute Teacher ID is required");
        if (req.getAbsentTeacherId() == null) throw new IllegalArgumentException("Absent Teacher ID is required");

        if (req.getSubstituteTeacherId().equals(req.getAbsentTeacherId())) {
            throw new IllegalArgumentException("Cannot assign a teacher to substitute for themselves.");
        }

        SchoolClass schoolClass = schoolClassRepository.findById(req.getClassId())
                .orElseThrow(() -> new IllegalArgumentException("Class not found with ID: " + req.getClassId()));
        Teacher absentTeacher = teacherRepository.findById(req.getAbsentTeacherId())
                .orElseThrow(() -> new IllegalArgumentException("Absent Teacher not found with ID: " + req.getAbsentTeacherId()));
        Teacher substituteTeacher = teacherRepository.findById(req.getSubstituteTeacherId())
                .orElseThrow(() -> new IllegalArgumentException("Substitute Teacher not found with ID: " + req.getSubstituteTeacherId()));

        Subject subject = null;
        if (req.getSubjectId() != null) {
            subject = subjectRepository.findById(req.getSubjectId()).orElse(null);
        }

        // ══════════════════════════════════════════════════════════════════
        // STRICT CLASH DETECTION FOR SUBSTITUTE
        // ══════════════════════════════════════════════════════════════════
        // Check 1: Regular timetable clash
        List<TimetableSlot> regularClashes = slotRepository
                .findByTeacherIdAndDayOfWeekAndPeriodIdAndAcademicYear(substituteTeacher.getId(), dayOfWeek, req.getPeriodId(), year);

        if (!regularClashes.isEmpty()) {
            TimetableSlot clash = regularClashes.get(0);
            if (!clash.getSchoolClass().getId().equals(schoolClass.getId())) {
                String errorMsg = String.format(
                        "Substitution Conflict: %s is already teaching %s (%s) on %s at %s. Cannot assign as substitute!",
                        substituteTeacher.getFullName(),
                        clash.getSchoolClass().getName(),
                        clash.getSchoolClass().getSection(),
                        dayOfWeek,
                        req.getPeriodLabel() != null ? req.getPeriodLabel() : req.getPeriodId()
                );
                log.warn(errorMsg);
                throw new ScheduleConflictException(errorMsg);
            }
        }

        // Check 2: Existing substitution clash on the same date and period
        List<TeacherSubstitution> subClashes = substitutionRepository
                .findByDateAndSubstituteTeacherIdAndPeriodId(date, substituteTeacher.getId(), req.getPeriodId());

        for (TeacherSubstitution clash : subClashes) {
            if (!clash.getSchoolClass().getId().equals(schoolClass.getId())) {
                String errorMsg = String.format(
                        "Substitution Conflict: %s is already assigned to substitute in %s (%s) on %s at %s!",
                        substituteTeacher.getFullName(),
                        clash.getSchoolClass().getName(),
                        clash.getSchoolClass().getSection(),
                        date.toString(),
                        clash.getPeriodLabel()
                );
                log.warn(errorMsg);
                throw new ScheduleConflictException(errorMsg);
            }
        }

        // Upsert substitution record
        Optional<TeacherSubstitution> existingOpt = substitutionRepository
                .findByDateAndSchoolClassIdAndPeriodId(date, schoolClass.getId(), req.getPeriodId());

        TeacherSubstitution subToSave;
        if (existingOpt.isPresent()) {
            subToSave = existingOpt.get();
        } else {
            subToSave = new TeacherSubstitution();
            subToSave.setDate(date);
            subToSave.setDayOfWeek(dayOfWeek);
            subToSave.setPeriodId(req.getPeriodId());
            subToSave.setSchoolClass(schoolClass);
            subToSave.setAcademicYear(year);
        }

        subToSave.setPeriodLabel(req.getPeriodLabel() != null ? req.getPeriodLabel() : req.getPeriodId());
        subToSave.setStartTime(req.getStartTime());
        subToSave.setEndTime(req.getEndTime());
        subToSave.setSubject(subject);
        subToSave.setSubjectName((subject != null) ? subject.getName() : req.getSubjectName());
        subToSave.setAbsentTeacher(absentTeacher);
        subToSave.setSubstituteTeacher(substituteTeacher);
        subToSave.setRoom(req.getRoom() != null ? req.getRoom() : "Room 101");
        subToSave.setNotes(req.getNotes() != null ? req.getNotes() : "Covering for " + absentTeacher.getFullName());
        subToSave.setStatus(TeacherSubstitution.SubstitutionStatus.ASSIGNED);

        TeacherSubstitution saved = substitutionRepository.save(subToSave);
        log.info("Assigned substitution: Date={}, Class={} ({}), Period={}, Sub={}, Absent={}",
                date, schoolClass.getName(), schoolClass.getSection(), req.getPeriodId(),
                substituteTeacher.getFullName(), absentTeacher.getFullName());
        return saved;
    }

    /**
     * Delete/Cancel substitution
     */
    @Transactional
    public void cancelSubstitution(Long substitutionId) {
        substitutionRepository.deleteById(substitutionId);
    }

    /**
     * Get substitutions assigned to a specific substitute teacher on a date
     */
    public List<TeacherSubstitution> getSubstitutionsForSubstituteTeacher(Long teacherId, LocalDate date) {
        LocalDate queryDate = (date != null) ? date : LocalDate.now();
        return substitutionRepository.findByDateAndSubstituteTeacherId(queryDate, teacherId);
    }

    private String capitalizeDay(String name) {
        if (name == null || name.isBlank()) return "Monday";
        return name.substring(0, 1).toUpperCase() + name.substring(1).toLowerCase();
    }
}
