package com.sms.repository;

import com.sms.model.TeacherClassAssignment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface TeacherClassAssignmentRepository extends JpaRepository<TeacherClassAssignment, Long> {
    List<TeacherClassAssignment> findByTeacherIdAndAcademicYear(Long teacherId, String academicYear);
    List<TeacherClassAssignment> findBySchoolClassIdAndAcademicYear(Long classId, String academicYear);
    boolean existsByTeacherIdAndSchoolClassIdAndAcademicYear(Long teacherId, Long classId, String academicYear);
    boolean existsByTeacherIdAndSchoolClassIdAndSubjectIdAndAcademicYear(Long teacherId, Long classId, Long subjectId, String academicYear);
    boolean existsByTeacherIdAndSchoolClassId(Long teacherId, Long classId);
    boolean existsByTeacherIdAndSchoolClassIdAndSubjectId(Long teacherId, Long classId, Long subjectId);
    List<TeacherClassAssignment> findByTeacherId(Long teacherId);
    List<TeacherClassAssignment> findBySchoolClassId(Long classId);
    List<TeacherClassAssignment> findBySchoolClassIdAndSubjectIdAndAcademicYear(Long classId, Long subjectId, String academicYear);
    void deleteBySchoolClassIdAndSubjectIdAndAcademicYear(Long classId, Long subjectId, String academicYear);
    void deleteBySchoolClassId(Long classId);
}

