package com.sms.repository;

import com.sms.model.AdmissionApplication;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface AdmissionApplicationRepository extends JpaRepository<AdmissionApplication, Long> {
    List<AdmissionApplication> findAllByOrderByAppliedDateDesc();
    Optional<AdmissionApplication> findByApplicationNo(String applicationNo);
}
