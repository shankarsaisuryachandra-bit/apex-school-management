package com.sms.repository.cms;

import com.sms.model.cms.SchoolInfo;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.List;

@Repository
public interface SchoolInfoRepository extends JpaRepository<SchoolInfo, Long> {
    Optional<SchoolInfo> findByTenantSlug(String tenantSlug);
    List<SchoolInfo> findAllByOrderByIdAsc();
}
