package com.sms.repository;

import com.sms.model.LeaveRequest;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.time.LocalDate;
import java.util.List;

@Repository
public interface LeaveRequestRepository extends JpaRepository<LeaveRequest, Long> {
    List<LeaveRequest> findByStudentIdOrderByAppliedDateDesc(Long studentId);
    List<LeaveRequest> findAllByOrderByAppliedDateDesc();

    @Query("SELECT l FROM LeaveRequest l WHERE l.student.id = :studentId AND l.status = 'APPROVED' AND :date BETWEEN l.startDate AND l.endDate")
    List<LeaveRequest> findApprovedLeavesForStudentOnDate(@Param("studentId") Long studentId, @Param("date") LocalDate date);

    @Query("SELECT CASE WHEN COUNT(l) > 0 THEN true ELSE false END FROM LeaveRequest l " +
           "WHERE l.student.id = :studentId " +
           "AND l.status IN :statuses " +
           "AND l.startDate <= :endDate " +
           "AND l.endDate >= :startDate")
    boolean existsOverlappingLeave(@Param("studentId") Long studentId,
                                  @Param("startDate") LocalDate startDate,
                                  @Param("endDate") LocalDate endDate,
                                  @Param("statuses") List<LeaveRequest.LeaveStatus> statuses);
}
