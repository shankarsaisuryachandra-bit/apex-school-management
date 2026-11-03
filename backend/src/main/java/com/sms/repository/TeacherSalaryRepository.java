package com.sms.repository;

import com.sms.model.TeacherSalary;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface TeacherSalaryRepository extends JpaRepository<TeacherSalary, Long> {
    List<TeacherSalary> findByMonthYear(String monthYear);
    List<TeacherSalary> findByTeacherId(Long teacherId);
}
