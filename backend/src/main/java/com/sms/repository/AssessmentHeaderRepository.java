package com.sms.repository;

import com.sms.model.AssessmentHeader;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface AssessmentHeaderRepository extends JpaRepository<AssessmentHeader, Long> {
    List<AssessmentHeader> findBySchoolClassIdAndSubjectIdAndAcademicYearOrderByAssessmentDateAsc(
            Long classId, Long subjectId, String academicYear);
    List<AssessmentHeader> findBySchoolClassIdAndAcademicYear(Long classId, String academicYear);
    List<AssessmentHeader> findByCreatedByIdAndAcademicYear(Long teacherId, String academicYear);
}
