package com.sms.repository;

import com.sms.model.AdmitCard;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface AdmitCardRepository extends JpaRepository<AdmitCard, Long> {
    List<AdmitCard> findByStudentId(Long studentId);
}
