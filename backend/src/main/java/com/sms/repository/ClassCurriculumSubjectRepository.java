package com.sms.repository;

import com.sms.model.ClassCurriculumSubject;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ClassCurriculumSubjectRepository extends JpaRepository<ClassCurriculumSubject, Long> {

    List<ClassCurriculumSubject> findByAcademicYear(String academicYear);

    List<ClassCurriculumSubject> findBySchoolClassIdAndAcademicYear(Long classId, String academicYear);

    Optional<ClassCurriculumSubject> findBySchoolClassIdAndSubjectIdAndAcademicYear(Long classId, Long subjectId, String academicYear);

    boolean existsBySchoolClassIdAndSubjectIdAndAcademicYear(Long classId, Long subjectId, String academicYear);

    void deleteBySchoolClassIdAndSubjectIdAndAcademicYear(Long classId, Long subjectId, String academicYear);

    void deleteBySchoolClassIdAndAcademicYear(Long classId, String academicYear);

    List<ClassCurriculumSubject> findBySchoolClassId(Long classId);

    void deleteBySchoolClassId(Long classId);
}
