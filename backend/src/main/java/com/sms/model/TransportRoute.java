package com.sms.model;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;

@Entity
@Table(name = "transport_routes")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class TransportRoute {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "route_name", nullable = false, length = 100)
    private String routeName;

    @Column(name = "bus_number", nullable = false, length = 30)
    private String busNumber;

    @Column(name = "plate_number", length = 30)
    private String plateNumber;

    @Column(name = "driver_name", length = 100)
    private String driverName;

    @Column(name = "driver_phone", length = 20)
    private String driverPhone;

    @Column(name = "driver_license", length = 50)
    private String driverLicense;

    @Column(name = "conductor_name", length = 100)
    private String conductorName;

    @Column(name = "conductor_phone", length = 20)
    private String conductorPhone;

    @Column(name = "monthly_fee", precision = 10, scale = 2)
    private BigDecimal monthlyFee;

    @Column(name = "capacity")
    private Integer capacity;

    @Column(name = "current_status", length = 40)
    @Builder.Default
    private String currentStatus = "IN_TRANSIT"; // IN_TRANSIT, AT_CAMPUS, EVENING_DROPOFF, STANDBY, MAINTENANCE

    @Column(name = "current_speed_kmh")
    @Builder.Default
    private Integer currentSpeedKmh = 40;

    @Column(name = "fuel_level_percent")
    @Builder.Default
    private Integer fuelLevelPercent = 85;

    @Column(name = "current_lat")
    private Double currentLat;

    @Column(name = "current_lng")
    private Double currentLng;

    @Column(name = "next_stop", length = 100)
    private String nextStop;

    @Column(name = "next_stop_eta_minutes")
    private Integer nextStopEtaMinutes;

    @Column(name = "morning_departure_time", length = 20)
    private String morningDepartureTime;

    @Column(name = "morning_arrival_time", length = 20)
    private String morningArrivalTime;

    @Column(name = "evening_departure_time", length = 20)
    private String eveningDepartureTime;

    @Column(name = "evening_arrival_time", length = 20)
    private String eveningArrivalTime;

    @Column(name = "stops_json", columnDefinition = "TEXT")
    private String stopsJson;

    @Column(name = "heading")
    @Builder.Default
    private Double heading = 0.0;

    @Column(name = "gps_accuracy_meters")
    @Builder.Default
    private Double gpsAccuracyMeters = 5.0;

    @Column(name = "is_broadcasting")
    @Builder.Default
    private Boolean isBroadcasting = false;

    @Column(name = "last_gps_timestamp")
    private String lastGpsTimestamp;

    @Column(name = "hardware_device_id", length = 50)
    private String hardwareDeviceId; // e.g. "GPS-APEX-01" / OBD-II IMEI

    @Column(name = "is_ignition_on")
    @Builder.Default
    private Boolean isIgnitionOn = false;

    @Column(name = "trip_status", length = 50)
    @Builder.Default
    private String tripStatus = "IDLE_AT_CAMPUS"; // IDLE_AT_CAMPUS, TRIP_STARTED, IN_TRANSIT, TRIP_COMPLETED

    @Column(name = "trip_start_time", length = 30)
    private String tripStartTime;

    @Column(name = "source_name", length = 100)
    private String sourceName;

    @Column(name = "destination_name", length = 100)
    private String destinationName;

    @Column(name = "operator_username", length = 50)
    private String operatorUsername;

    @Column(name = "emergency_status", length = 30)
    @Builder.Default
    private String emergencyStatus = "NORMAL"; // NORMAL, DELAYED, EMERGENCY_SOS

    @Column(name = "sos_alert_message", length = 255)
    private String sosAlertMessage;
}
