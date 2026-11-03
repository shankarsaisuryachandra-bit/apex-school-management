package com.sms.model;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDate;

@Entity
@Table(name = "ptm_appointments")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class PtmAppointment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "student_id", nullable = false)
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
    private Student student;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "teacher_id", nullable = false)
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
    private Teacher teacher;

    @Column(name = "appointment_date", nullable = false)
    private LocalDate appointmentDate;

    @Column(name = "time_slot", length = 30)
    private String timeSlot; // e.g. "10:00 AM - 10:30 AM"

    @Column(name = "notes", length = 300)
    private String notes;

    @Column(name = "admin_remarks", length = 300)
    private String adminRemarks;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    private PtmStatus status;

    public enum PtmStatus {
        PENDING, SCHEDULED, ACCEPTED, REJECTED, COMPLETED, CANCELLED
    }

    @PrePersist
    protected void onCreate() {
        if (this.status == null) this.status = PtmStatus.SCHEDULED;
    }
}
