package com.sms.model;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "alumni_registry")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class AlumniRegistry {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "student_id")
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
    private Student student;

    @Column(name = "full_name", nullable = false, length = 100)
    private String fullName;

    @Column(name = "admission_number", length = 20)
    private String admissionNumber;

    @Column(name = "graduation_year", nullable = false, length = 9)
    private String graduationYear;

    @Column(name = "final_class", length = 30)
    private String finalClass;

    @Column(name = "date_of_birth")
    private LocalDate dateOfBirth;

    @Column(name = "parent_phone", length = 15)
    private String parentPhone;

    @Column(name = "migrated_at")
    private LocalDateTime migratedAt;

    @PrePersist
    protected void onCreate() {
        this.migratedAt = LocalDateTime.now();
    }
}
