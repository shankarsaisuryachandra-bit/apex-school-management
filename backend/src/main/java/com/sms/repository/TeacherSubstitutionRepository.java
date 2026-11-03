package com.sms.repository;

import com.sms.model.TeacherSubstitution;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface TeacherSubstitutionRepository extends JpaRepository<TeacherSubstitution, Long> {

    List<TeacherSubstitution> findByDateOrderByStartTimeAsc(LocalDate date);

    List<TeacherSubstitution> findByDateAndSchoolClassId(LocalDate date, Long classId);

    List<TeacherSubstitution> findByDateAndSubstituteTeacherId(LocalDate date, Long teacherId);

    List<TeacherSubstitution> findByDateAndAbsentTeacherId(LocalDate date, Long teacherId);

    Optional<TeacherSubstitution> findByDateAndSchoolClassIdAndPeriodId(LocalDate date, Long classId, String periodId);

    List<TeacherSubstitution> findByDateAndSubstituteTeacherIdAndPeriodId(LocalDate date, Long teacherId, String periodId);

    boolean existsByDateAndSubstituteTeacherIdAndPeriodId(LocalDate date, Long teacherId, String periodId);

    void deleteByDateAndSchoolClassIdAndPeriodId(LocalDate date, Long classId, String periodId);
}
