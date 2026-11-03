package com.sms.repository;

import com.sms.model.TransportBoardingLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface TransportBoardingLogRepository extends JpaRepository<TransportBoardingLog, Long> {
    List<TransportBoardingLog> findByRouteIdOrderByScannedAtDesc(Long routeId);
    List<TransportBoardingLog> findByStudentIdOrderByScannedAtDesc(Long studentId);
    List<TransportBoardingLog> findByRouteIdAndScannedAtAfterOrderByScannedAtDesc(Long routeId, LocalDateTime after);
    void deleteByRouteId(Long routeId);
}
