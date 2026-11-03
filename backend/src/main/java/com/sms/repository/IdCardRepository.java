package com.sms.repository;

import com.sms.model.IdCard;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;

@Repository
public interface IdCardRepository extends JpaRepository<IdCard, Long> {
    Optional<IdCard> findByStudentId(Long studentId);
}
