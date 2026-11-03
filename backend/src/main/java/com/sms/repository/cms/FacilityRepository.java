package com.sms.repository.cms;

import com.sms.model.cms.Facility;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface FacilityRepository extends JpaRepository<Facility, Long> {
    List<Facility> findByIsActiveTrueOrderBySortOrderAsc();
}
