package com.sms.repository;

import com.sms.model.AlumniRegistry;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface AlumniRegistryRepository extends JpaRepository<AlumniRegistry, Long> {
    List<AlumniRegistry> findByGraduationYearOrderByFullNameAsc(String graduationYear);
    List<AlumniRegistry> findAllByOrderByGraduationYearDescFullNameAsc();
    Optional<AlumniRegistry> findByStudentId(Long studentId);
    Optional<AlumniRegistry> findByAdmissionNumber(String admissionNumber);
}
