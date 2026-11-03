package com.sms.repository.cms;

import com.sms.model.cms.CmsStat;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface CmsStatRepository extends JpaRepository<CmsStat, Long> {
    List<CmsStat> findAllByOrderBySortOrderAsc();
}
