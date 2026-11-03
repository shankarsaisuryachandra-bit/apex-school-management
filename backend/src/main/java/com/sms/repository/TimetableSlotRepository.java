package com.sms.repository;

import com.sms.model.TimetableSlot;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface TimetableSlotRepository extends JpaRepository<TimetableSlot, Long> {

    List<TimetableSlot> findBySchoolClassIdAndAcademicYear(Long classId, String academicYear);

    List<TimetableSlot> findBySchoolClassId(Long classId);

    List<TimetableSlot> findByTeacherIdAndAcademicYear(Long teacherId, String academicYear);

    List<TimetableSlot> findByTeacherId(Long teacherId);

    Optional<TimetableSlot> findBySchoolClassIdAndDayOfWeekAndPeriodIdAndAcademicYear(
            Long classId, String dayOfWeek, String periodId, String academicYear);

    // Conflict detection: finds any slot where this teacher is assigned on this day and period
    List<TimetableSlot> findByTeacherIdAndDayOfWeekAndPeriodIdAndAcademicYear(
            Long teacherId, String dayOfWeek, String periodId, String academicYear);

    // Conflict detection: finds any slot where this room is already occupied on this day and period
    List<TimetableSlot> findByRoomAndDayOfWeekAndPeriodIdAndAcademicYear(
            String room, String dayOfWeek, String periodId, String academicYear);

    void deleteBySchoolClassIdAndDayOfWeekAndPeriodIdAndAcademicYear(
            Long classId, String dayOfWeek, String periodId, String academicYear);

    void deleteBySchoolClassId(Long classId);
}
