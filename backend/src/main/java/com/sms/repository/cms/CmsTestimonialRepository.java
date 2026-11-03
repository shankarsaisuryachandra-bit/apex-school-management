package com.sms.repository.cms;

import com.sms.model.cms.CmsTestimonial;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface CmsTestimonialRepository extends JpaRepository<CmsTestimonial, Long> {
    List<CmsTestimonial> findByIsActiveTrueOrderBySortOrderAsc();
    List<CmsTestimonial> findAllByOrderBySortOrderAsc();
}
