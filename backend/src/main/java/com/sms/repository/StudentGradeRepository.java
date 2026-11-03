package com.sms.repository;

import com.sms.model.StudentGrade;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface StudentGradeRepository extends JpaRepository<StudentGrade, Long> {
    List<StudentGrade> findByStudentId(Long studentId);
    List<StudentGrade> findByAssessmentHeaderId(Long assessmentHeaderId);

    @Query("SELECT sg FROM StudentGrade sg " +
           "JOIN FETCH sg.assessmentHeader ah " +
           "WHERE sg.student.id = :studentId " +
           "AND ah.subject.id = :subjectId " +
           "ORDER BY ah.assessmentDate ASC")
    List<StudentGrade> findByStudentAndSubjectChronological(@Param("studentId") Long studentId,
                                                            @Param("subjectId") Long subjectId);
}
