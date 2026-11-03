package com.sms.repository;

import com.sms.model.TimetablePeriodConfig;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface TimetablePeriodConfigRepository extends JpaRepository<TimetablePeriodConfig, Long> {

    List<TimetablePeriodConfig> findByAcademicYearOrderBySortOrderAsc(String academicYear);

    Optional<TimetablePeriodConfig> findByPeriodIdAndAcademicYear(String periodId, String academicYear);

    void deleteByAcademicYear(String academicYear);
}
