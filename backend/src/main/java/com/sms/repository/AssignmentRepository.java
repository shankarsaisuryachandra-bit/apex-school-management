package com.sms.repository;

import com.sms.model.Assignment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface AssignmentRepository extends JpaRepository<Assignment, Long> {
    List<Assignment> findBySchoolClassId(Long classId);
    List<Assignment> findBySchoolClassIdOrderByDueDateAsc(Long classId);
    List<Assignment> findByTeacherIdOrderByDueDateAsc(Long teacherId);
    List<Assignment> findBySchoolClassIdInOrderByDueDateAsc(List<Long> classIds);
    List<Assignment> findAllByOrderByDueDateAsc();
}
