package com.sms.repository;

import com.sms.model.FeeComponent;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface FeeComponentRepository extends JpaRepository<FeeComponent, Long> {
    List<FeeComponent> findByAcademicYear(String academicYear);
    List<FeeComponent> findBySchoolClassIdAndAcademicYear(Long classId, String academicYear);
    List<FeeComponent> findBySchoolClassIsNullAndAcademicYear(String academicYear);
}
