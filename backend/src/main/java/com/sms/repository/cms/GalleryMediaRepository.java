package com.sms.repository.cms;

import com.sms.model.cms.GalleryMedia;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface GalleryMediaRepository extends JpaRepository<GalleryMedia, Long> {
    List<GalleryMedia> findByCategoryOrderByUploadedAtDesc(String category);
    List<GalleryMedia> findAllByOrderByUploadedAtDesc();
}
