package com.sms.repository;

import com.sms.model.StudentFee;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface StudentFeeRepository extends JpaRepository<StudentFee, Long> {

    Optional<StudentFee> findByStudentIdAndAcademicYear(Long studentId, String academicYear);

    List<StudentFee> findByAcademicYear(String academicYear);

    // ================================================================
    // FEE DASHBOARD — Independent count queries (Anti-Bug Safeguard)
    // Each count is independently computed from the DB, never derived.
    // ================================================================

    @Query("SELECT COUNT(sf) FROM StudentFee sf " +
           "WHERE sf.student.schoolClass.id = :classId " +
           "AND sf.academicYear = :year")
    long countByClassIdAndAcademicYear(@Param("classId") Long classId,
                                       @Param("year") String academicYear);

    @Query("SELECT COUNT(sf) FROM StudentFee sf " +
           "WHERE sf.student.schoolClass.id = :classId " +
           "AND sf.academicYear = :year " +
           "AND sf.status = :status")
    long countByClassIdAndAcademicYearAndStatus(@Param("classId") Long classId,
                                                @Param("year") String academicYear,
                                                @Param("status") StudentFee.FeeStatus status);

    @Query("SELECT sf FROM StudentFee sf JOIN FETCH sf.student s " +
           "WHERE s.schoolClass.id = :classId " +
           "AND sf.academicYear = :year " +
           "AND sf.status = :status")
    List<StudentFee> findByClassIdAndYearAndStatus(@Param("classId") Long classId,
                                                    @Param("year") String academicYear,
                                                    @Param("status") StudentFee.FeeStatus status);

    @Query("SELECT sf FROM StudentFee sf JOIN FETCH sf.student s " +
           "WHERE s.schoolClass.id = :classId " +
           "AND sf.academicYear = :year")
    List<StudentFee> findByClassIdAndYear(@Param("classId") Long classId,
                                           @Param("year") String academicYear);

    List<StudentFee> findByStudentIdIn(List<Long> studentIds);
}
