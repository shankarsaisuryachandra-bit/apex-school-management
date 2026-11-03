package com.sms.repository;

import com.sms.model.ReportCardRecord;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ReportCardRecordRepository extends JpaRepository<ReportCardRecord, Long> {

    List<ReportCardRecord> findBySchoolClassIdAndTermOrderByClassRankAsc(Long classId, String term);

    List<ReportCardRecord> findBySchoolClassIdOrderByClassRankAsc(Long classId);

    Optional<ReportCardRecord> findByStudentIdAndTerm(Long studentId, String term);

    Optional<ReportCardRecord> findFirstByStudentIdOrderByPublishedAtDesc(Long studentId);

    Optional<ReportCardRecord> findFirstByStudentUserIdOrderByPublishedAtDesc(Long userId);

    List<ReportCardRecord> findByStudentIdOrderByPublishedAtDesc(Long studentId);

    void deleteBySchoolClassIdAndTerm(Long classId, String term);
}

