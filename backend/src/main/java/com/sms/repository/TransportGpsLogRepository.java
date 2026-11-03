package com.sms.repository;

import com.sms.model.TransportGpsLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface TransportGpsLogRepository extends JpaRepository<TransportGpsLog, Long> {
    List<TransportGpsLog> findTop100ByRouteIdOrderByRecordedAtDesc(Long routeId);
    List<TransportGpsLog> findByRouteIdOrderByRecordedAtAsc(Long routeId);
    void deleteByRouteId(Long routeId);
}
