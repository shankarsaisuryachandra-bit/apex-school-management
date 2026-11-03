package com.sms.model;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "report_card_records",
       uniqueConstraints = @UniqueConstraint(columnNames = {"student_id", "term", "academic_year"}))
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class ReportCardRecord {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "student_id", nullable = false)
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler", "user"})
    private Student student;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "class_id", nullable = false)
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler", "classTeacher"})
    private SchoolClass schoolClass;

    @Column(name = "academic_year", nullable = false, length = 12)
    private String academicYear;

    @Column(name = "term", nullable = false, length = 32)
    private String term;

    @Column(name = "term_label", length = 128)
    private String termLabel;

    @Column(name = "total_obtained")
    private Double totalObtained;

    @Column(name = "total_max")
    private Double totalMax;

    @Column(name = "percentage")
    private Double percentage;

    @Column(name = "cgpa")
    private Double cgpa;

    @Column(name = "overall_grade", length = 8)
    private String overallGrade;

    @Column(name = "class_rank")
    private Integer classRank;

    @Column(name = "total_students_in_class")
    private Integer totalStudentsInClass;

    @Column(name = "result_status", length = 128)
    private String resultStatus;

    @Column(columnDefinition = "TEXT")
    private String remarks;

    @Builder.Default
    @Column(name = "is_published", nullable = false)
    private Boolean published = true;

    @Column(name = "published_at")
    private LocalDateTime publishedAt;

    @Column(name = "published_by", length = 128)
    private String publishedBy;

    @Column(name = "report_data_json", columnDefinition = "TEXT")
    private String reportDataJson;
}

