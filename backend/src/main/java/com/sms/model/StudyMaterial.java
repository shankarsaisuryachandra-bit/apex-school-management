package com.sms.model;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDate;

@Entity
@Table(name = "study_materials")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class StudyMaterial {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 150)
    private String title;

    @Column(length = 500)
    private String description;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "class_id")
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
    private SchoolClass schoolClass;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "subject_id")
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
    private Subject subject;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "teacher_id")
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
    private Teacher teacher;

    @Column(name = "file_url", nullable = false, length = 500)
    private String fileUrl; // URL to PDF or Photo (e.g. /uploads/math_formulas.png or .pdf)

    @Column(name = "file_type", length = 20)
    private String fileType; // PDF, IMAGE, NOTES

    @Column(name = "author_or_source", length = 100)
    private String authorOrSource;

    @Column(name = "uploaded_by_role", length = 30)
    @Builder.Default
    private String uploadedByRole = "TEACHER"; // TEACHER or MANAGEMENT

    @Column(name = "is_institute_wide")
    @Builder.Default
    private Boolean isInstituteWide = false; // true if sent throughout the institute to all students

    @Column(name = "uploaded_date")
    private LocalDate uploadedDate;

    @PrePersist
    protected void onCreate() {
        if (this.uploadedDate == null) this.uploadedDate = LocalDate.now();
        if (this.isInstituteWide == null) this.isInstituteWide = (this.schoolClass == null);
        if (this.uploadedByRole == null) this.uploadedByRole = "TEACHER";
        if (this.fileType == null) {
            if (this.fileUrl != null && (this.fileUrl.toLowerCase().endsWith(".png") ||
                    this.fileUrl.toLowerCase().endsWith(".jpg") ||
                    this.fileUrl.toLowerCase().endsWith(".jpeg") ||
                    this.fileUrl.toLowerCase().endsWith(".webp") ||
                    this.fileUrl.toLowerCase().startsWith("data:image/"))) {
                this.fileType = "IMAGE";
            } else {
                this.fileType = "PDF";
            }
        }
    }
}
