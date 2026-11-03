package com.sms.repository;

import com.sms.model.Attendance;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface AttendanceRepository extends JpaRepository<Attendance, Long> {

    Optional<Attendance> findByStudentIdAndDate(Long studentId, LocalDate date);

    Optional<Attendance> findByStudentIdAndDateAndSubjectId(Long studentId, LocalDate date, Long subjectId);

    Optional<Attendance> findByStudentIdAndDateAndSubjectIsNull(Long studentId, LocalDate date);

    List<Attendance> findBySchoolClassIdAndDate(Long classId, LocalDate date);

    List<Attendance> findBySchoolClassIdAndDateAndSubjectId(Long classId, LocalDate date, Long subjectId);

    List<Attendance> findBySchoolClassIdAndDateAndSubjectIsNull(Long classId, LocalDate date);

    List<Attendance> findByStudentIdAndDateBetween(Long studentId, LocalDate from, LocalDate to);

    @Query("SELECT COUNT(a) FROM Attendance a " +
           "WHERE a.student.id = :studentId " +
           "AND a.date BETWEEN :from AND :to")
    long countByStudentAndDateRange(@Param("studentId") Long studentId,
                                    @Param("from") LocalDate from,
                                    @Param("to") LocalDate to);

    @Query("SELECT COUNT(a) FROM Attendance a " +
           "WHERE a.student.id = :studentId " +
           "AND a.date BETWEEN :from AND :to " +
           "AND a.status = 'PRESENT'")
    long countPresentByStudentAndDateRange(@Param("studentId") Long studentId,
                                           @Param("from") LocalDate from,
                                           @Param("to") LocalDate to);

    List<Attendance> findBySchoolClassIdAndDateAndStatus(Long classId, LocalDate date,
                                                         Attendance.AttendanceStatus status);

    List<Attendance> findBySchoolClassIdAndDateAndSubjectIdAndStatus(Long classId, LocalDate date, Long subjectId,
                                                                     Attendance.AttendanceStatus status);

    long countByDate(LocalDate date);
}
