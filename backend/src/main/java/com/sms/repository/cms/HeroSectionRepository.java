package com.sms.repository.cms;

import com.sms.model.cms.HeroSection;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface HeroSectionRepository extends JpaRepository<HeroSection, Long> {
}
