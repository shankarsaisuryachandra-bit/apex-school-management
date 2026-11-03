package com.sms.repository;

import com.sms.model.SchoolAsset;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface SchoolAssetRepository extends JpaRepository<SchoolAsset, Long> {
    List<SchoolAsset> findByCategory(String category);
}
