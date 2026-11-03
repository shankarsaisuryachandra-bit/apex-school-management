package com.sms.model;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "transport_notifications")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class TransportNotification {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "route_id", nullable = false)
    private Long routeId;

    @Column(name = "student_id")
    private Long studentId; // Null for route-wide broadcasts, or specific student

    @Column(name = "notification_type", nullable = false, length = 50)
    private String notificationType; // TRIP_STARTED_AT_SCHOOL, PROXIMITY_10_MIN_AWAY, AT_BOARDING_STOP, TRIP_COMPLETED, EMERGENCY_SOS

    @Column(name = "title", nullable = false, length = 120)
    private String title;

    @Column(name = "message", nullable = false, length = 500)
    private String message;

    @Column(name = "stop_name", length = 100)
    private String stopName;

    @Column(name = "eta_minutes")
    private Integer etaMinutes;

    @Column(name = "created_at")
    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column(name = "is_read")
    @Builder.Default
    private Boolean isRead = false;
}
