package com.sms.repository;

import com.sms.model.ParentContact;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface ParentContactRepository extends JpaRepository<ParentContact, Long> {
    List<ParentContact> findByStudentId(Long studentId);
    List<ParentContact> findByUserId(Long userId);
    java.util.Optional<ParentContact> findFirstByUserId(Long userId);
    List<ParentContact> findByEmailIgnoreCase(String email);
    List<ParentContact> findByPhone(String phone);
}
