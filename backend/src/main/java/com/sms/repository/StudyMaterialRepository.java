package com.sms.repository;

import com.sms.model.StudyMaterial;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface StudyMaterialRepository extends JpaRepository<StudyMaterial, Long> {
    List<StudyMaterial> findBySchoolClassIdOrderByUploadedDateDesc(Long classId);
    List<StudyMaterial> findByTeacherIdOrderByUploadedDateDesc(Long teacherId);
    List<StudyMaterial> findByIsInstituteWideTrueOrderByUploadedDateDesc();
    List<StudyMaterial> findAllByOrderByUploadedDateDesc();

    @Query("SELECT s FROM StudyMaterial s WHERE s.schoolClass.id = :classId OR s.isInstituteWide = true OR s.schoolClass IS NULL ORDER BY s.uploadedDate DESC")
    List<StudyMaterial> findForClassOrInstituteWide(@Param("classId") Long classId);
}

