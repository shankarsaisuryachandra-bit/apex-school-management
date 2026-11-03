package com.sms.model;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDate;

@Entity
@Table(name = "teacher_substitutions",
       uniqueConstraints = @UniqueConstraint(
           columnNames = {"substitution_date", "class_id", "period_id"}
       ))
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class TeacherSubstitution {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "substitution_date", nullable = false)
    private LocalDate date;

    @Column(name = "day_of_week", nullable = false, length = 20)
    private String dayOfWeek;

    @Column(name = "period_id", nullable = false, length = 20)
    private String periodId;

    @Column(name = "period_label", nullable = false, length = 50)
    private String periodLabel;

    @Column(name = "start_time", length = 20)
    private String startTime;

    @Column(name = "end_time", length = 20)
    private String endTime;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "class_id", nullable = false)
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
    private SchoolClass schoolClass;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "subject_id")
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
    private Subject subject;

    @Column(name = "subject_name", length = 100)
    private String subjectName;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "absent_teacher_id", nullable = false)
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
    private Teacher absentTeacher;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "substitute_teacher_id", nullable = false)
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
    private Teacher substituteTeacher;

    @Column(name = "room", length = 50)
    private String room;

    @Column(name = "notes", length = 300)
    private String notes;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    @Builder.Default
    private SubstitutionStatus status = SubstitutionStatus.ASSIGNED;

    @Column(name = "academic_year", nullable = false, length = 9)
    @Builder.Default
    private String academicYear = "2025-2026";

    public enum SubstitutionStatus {
        ASSIGNED, COMPLETED, CANCELLED
    }
}
