package com.sms.repository;

import com.sms.model.PtmAppointment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.time.LocalDate;
import java.util.List;

@Repository
public interface PtmAppointmentRepository extends JpaRepository<PtmAppointment, Long> {
    List<PtmAppointment> findByStudentIdOrderByAppointmentDateDesc(Long studentId);
    List<PtmAppointment> findByTeacherIdOrderByAppointmentDateDesc(Long teacherId);
    List<PtmAppointment> findAllByOrderByAppointmentDateDesc();

    @Query("SELECT CASE WHEN COUNT(p) > 0 THEN true ELSE false END FROM PtmAppointment p " +
           "WHERE p.teacher.id = :teacherId " +
           "AND p.appointmentDate = :appointmentDate " +
           "AND LOWER(TRIM(p.timeSlot)) = LOWER(TRIM(:timeSlot)) " +
           "AND p.status IN :statuses")
    boolean existsByTeacherAndDateAndTimeSlotAndStatusIn(
            @Param("teacherId") Long teacherId,
            @Param("appointmentDate") LocalDate appointmentDate,
            @Param("timeSlot") String timeSlot,
            @Param("statuses") List<PtmAppointment.PtmStatus> statuses);
}
