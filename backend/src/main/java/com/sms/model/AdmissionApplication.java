package com.sms.model;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDate;

@Entity
@Table(name = "admission_applications")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class AdmissionApplication {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "application_no", nullable = false, unique = true, length = 30)
    private String applicationNo;

    @Column(name = "student_name", nullable = false, length = 100)
    private String studentName;

    @Column(name = "applying_for_grade", nullable = false, length = 30)
    private String applyingForGrade;

    @Column(name = "parent_name", nullable = false, length = 100)
    private String parentName;

    @Column(nullable = false, length = 20)
    private String phone;

    @Column(length = 100)
    private String email;

    @Column(name = "previous_school", length = 150)
    private String previousSchool;

    @Column(name = "date_of_birth")
    private LocalDate dateOfBirth;

    @Column(columnDefinition = "TEXT")
    private String address;

    @Enumerated(EnumType.STRING)
    @Builder.Default
    private ApplicationStatus status = ApplicationStatus.PENDING;

    @Column(name = "applied_date")
    private LocalDate appliedDate;

    public enum ApplicationStatus {
        PENDING, APPROVED, REJECTED
    }

    @PrePersist
    protected void onCreate() {
        if (this.appliedDate == null) this.appliedDate = LocalDate.now();
        if (this.applicationNo == null) this.applicationNo = "ADM-" + System.currentTimeMillis();
    }
}
