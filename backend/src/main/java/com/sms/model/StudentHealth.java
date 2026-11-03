package com.sms.model;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDate;

@Entity
@Table(name = "student_health_records")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class StudentHealth {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "student_id", nullable = false)
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
    private Student student;

    @Column(name = "blood_group", length = 10)
    private String bloodGroup;

    @Column(name = "allergies", length = 300)
    private String allergies;

    @Column(name = "height_cm")
    private Double heightCm;

    @Column(name = "weight_kg")
    private Double weightKg;

    @Column(name = "medical_notes", length = 500)
    private String medicalNotes;

    @Column(name = "last_checkup")
    private LocalDate lastCheckup;

    @PrePersist
    protected void onCreate() {
        if (this.lastCheckup == null) this.lastCheckup = LocalDate.now();
    }
}
