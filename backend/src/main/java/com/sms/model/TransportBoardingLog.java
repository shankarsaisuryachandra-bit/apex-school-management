package com.sms.model;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "transport_boarding_logs")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class TransportBoardingLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "route_id", nullable = false)
    private Long routeId;

    @Column(name = "student_id", nullable = false)
    private Long studentId;

    @Column(name = "student_name", nullable = false, length = 100)
    private String studentName;

    @Column(name = "action_type", nullable = false, length = 30)
    private String actionType; // BOARDED_PICKUP, DROPPED_CAMPUS, BOARDED_CAMPUS, DROPPED_HOME

    @Column(name = "stop_name", length = 100)
    private String stopName;

    @Column(name = "latitude")
    private Double latitude;

    @Column(name = "longitude")
    private Double longitude;

    @Column(name = "scanned_at")
    @Builder.Default
    private LocalDateTime scannedAt = LocalDateTime.now();

    @Column(name = "scanned_by", length = 50)
    @Builder.Default
    private String scannedBy = "DRIVER"; // DRIVER, CONDUCTOR, AUTO_RFID
}
