package com.sms.model;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDate;

@Entity
@Table(name = "exam_admit_cards")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class AdmitCard {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "student_id", nullable = false)
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
    private Student student;

    @Column(name = "exam_title", nullable = false, length = 150)
    private String examTitle; // e.g. "Annual Board Examination 2025-26"

    @Column(name = "roll_number", nullable = false, length = 50)
    private String rollNumber;

    @Column(name = "exam_center", length = 150)
    private String examCenter;

    @Column(name = "generated_date")
    private LocalDate generatedDate;

    @PrePersist
    protected void onCreate() {
        if (this.generatedDate == null) this.generatedDate = LocalDate.now();
    }
}
