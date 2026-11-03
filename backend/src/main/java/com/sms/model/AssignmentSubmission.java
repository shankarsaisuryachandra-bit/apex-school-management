package com.sms.model;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDate;

@Entity
@Table(name = "assignment_submissions")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class AssignmentSubmission {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "assignment_id", nullable = false)
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
    private Assignment assignment;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "student_id", nullable = false)
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
    private Student student;

    @Column(name = "submission_date")
    private LocalDate submissionDate;

    @Column(name = "file_url", length = 1000)
    private String fileUrl; 

    @Column(name = "status", length = 50)
    private String status; // SUBMITTED, GRADED, LATE

    @Column(name = "marks_obtained")
    private Integer marksObtained;

    @Column(name = "feedback", length = 1000)
    private String feedback;

    @PrePersist
    protected void onCreate() {
        if (this.submissionDate == null) this.submissionDate = LocalDate.now();
        if (this.status == null) this.status = "SUBMITTED";
    }
}
