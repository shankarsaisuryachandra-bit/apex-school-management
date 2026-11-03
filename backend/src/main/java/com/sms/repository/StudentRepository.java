package com.sms.repository;

import com.sms.model.Student;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface StudentRepository extends JpaRepository<Student, Long> {
    Optional<Student> findByUserId(Long userId);
    Optional<Student> findByAdmissionNumber(String admissionNumber);
    List<Student> findBySchoolClassIdAndIsActiveTrue(Long classId);
    List<Student> findBySchoolClassId(Long classId);
    List<Student> findBySchoolClassIdAndAcademicYear(Long classId, String academicYear);
    List<Student> findByIsActiveTrue();
    List<Student> findByAcademicYearAndIsActiveTrue(String academicYear);
    long countBySchoolClassIdAndIsActiveTrue(Long classId);
    List<Student> findByTransportRouteId(Long routeId);
    long countByTransportRouteId(Long routeId);
}
