package com.sms.repository;

import com.sms.model.ManagementProfile;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;

@Repository
public interface ManagementProfileRepository extends JpaRepository<ManagementProfile, Long> {
    Optional<ManagementProfile> findByUserId(Long userId);
    void deleteByUserId(Long userId);
}
