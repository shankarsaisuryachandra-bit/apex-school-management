package com.sms.repository;

import com.sms.model.SchoolClass;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface SchoolClassRepository extends JpaRepository<SchoolClass, Long> {
    List<SchoolClass> findByAcademicYearOrderBySortOrderAsc(String academicYear);
    Optional<SchoolClass> findByNameAndSectionAndAcademicYear(String name, String section, String academicYear);
    Optional<SchoolClass> findBySortOrderAndAcademicYear(Integer sortOrder, String academicYear);
    Optional<SchoolClass> findTopByAcademicYearOrderBySortOrderDesc(String academicYear);
    List<SchoolClass> findByClassTeacherId(Long classTeacherId);
    List<SchoolClass> findByClassTeacherIdAndAcademicYear(Long classTeacherId, String academicYear);
}

