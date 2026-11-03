package com.sms.repository;

import com.sms.model.TransportNotification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface TransportNotificationRepository extends JpaRepository<TransportNotification, Long> {
    List<TransportNotification> findTop50ByRouteIdOrderByCreatedAtDesc(Long routeId);
    List<TransportNotification> findTop20ByStudentIdOrRouteIdOrderByCreatedAtDesc(Long studentId, Long routeId);
    List<TransportNotification> findTop30ByStudentIdOrderByCreatedAtDesc(Long studentId);
    List<TransportNotification> findByRouteIdAndNotificationTypeAndCreatedAtAfter(Long routeId, String notificationType, LocalDateTime after);
    void deleteByRouteId(Long routeId);
}
