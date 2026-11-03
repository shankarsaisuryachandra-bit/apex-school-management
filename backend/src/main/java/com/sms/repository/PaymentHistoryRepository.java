package com.sms.repository;

import com.sms.model.PaymentHistory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface PaymentHistoryRepository extends JpaRepository<PaymentHistory, Long> {
    List<PaymentHistory> findByStudentFeeIdOrderByPaymentDateDesc(Long studentFeeId);
    Optional<PaymentHistory> findByReceiptNumber(String receiptNumber);
}
