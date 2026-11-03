package com.sms.repository;

import com.sms.model.StudentHealth;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;

@Repository
public interface StudentHealthRepository extends JpaRepository<StudentHealth, Long> {
    Optional<StudentHealth> findByStudentId(Long studentId);
}
