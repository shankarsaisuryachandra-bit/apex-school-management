package com.sms.model;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "class_curriculum_subjects",
       uniqueConstraints = @UniqueConstraint(
           columnNames = {"class_id", "subject_id", "academic_year"}
       ))
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class ClassCurriculumSubject {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "class_id", nullable = false)
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
    private SchoolClass schoolClass;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "subject_id", nullable = false)
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
    private Subject subject;

    @Column(name = "academic_year", nullable = false, length = 9)
    @Builder.Default
    private String academicYear = "2025-2026";

    @Column(name = "is_offered", nullable = false)
    @Builder.Default
    private Boolean isOffered = true;

    @Column(name = "weekly_periods")
    @Builder.Default
    private Integer weeklyPeriods = 5;
}
