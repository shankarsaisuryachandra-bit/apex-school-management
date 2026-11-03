package com.sms.controller;

import com.sms.model.cms.*;
import com.sms.service.CmsService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/cms")
@RequiredArgsConstructor
public class CmsController {

    private final CmsService cmsService;

    // ==================== HERO SECTION ====================

    @GetMapping("/hero")
    public ResponseEntity<HeroSection> getHeroSection() {
        return ResponseEntity.ok(cmsService.getHeroSection());
    }

    @PutMapping("/hero")
    @PreAuthorize("hasRole('MANAGEMENT')")
    public ResponseEntity<HeroSection> updateHeroSection(@RequestBody HeroSection heroSection) {
        return ResponseEntity.ok(cmsService.updateHeroSection(heroSection));
    }

    @PutMapping("/hero/image")
    @PreAuthorize("hasRole('MANAGEMENT')")
    public ResponseEntity<HeroSection> setHeroImage(@RequestBody Map<String, String> body) {
        String url = body.get("imageUrl");
        return ResponseEntity.ok(cmsService.setHeroImageUrl(url));
    }

    // ==================== SCHOOL INFO ====================

    @GetMapping("/info")
    public ResponseEntity<SchoolInfo> getSchoolInfo() {
        return ResponseEntity.ok(cmsService.getSchoolInfo());
    }

    @PutMapping("/info")
    @PreAuthorize("hasRole('MANAGEMENT')")
    public ResponseEntity<SchoolInfo> updateSchoolInfo(@RequestBody SchoolInfo info) {
        return ResponseEntity.ok(cmsService.updateSchoolInfo(info));
    }

    @GetMapping("/tenants")
    public ResponseEntity<List<SchoolInfo>> getAllTenants() {
        return ResponseEntity.ok(cmsService.getAllTenants());
    }

    @GetMapping("/tenants/{tenantSlug}")
    public ResponseEntity<SchoolInfo> getTenantBySlug(@PathVariable String tenantSlug) {
        return ResponseEntity.ok(cmsService.getTenantBySlug(tenantSlug));
    }

    // ==================== FACILITIES ====================

    @GetMapping("/facilities")
    public ResponseEntity<List<Facility>> getFacilities() {
        return ResponseEntity.ok(cmsService.getActiveFacilities());
    }

    @GetMapping("/facilities/all")
    @PreAuthorize("hasRole('MANAGEMENT')")
    public ResponseEntity<List<Facility>> getAllFacilities() {
        return ResponseEntity.ok(cmsService.getAllFacilities());
    }

    @PostMapping("/facilities")
    @PreAuthorize("hasRole('MANAGEMENT')")
    public ResponseEntity<Facility> createFacility(@RequestBody Facility facility) {
        return ResponseEntity.ok(cmsService.createFacility(facility));
    }

    @PutMapping("/facilities/{id}")
    @PreAuthorize("hasRole('MANAGEMENT')")
    public ResponseEntity<Facility> updateFacility(@PathVariable Long id, @RequestBody Facility facility) {
        return ResponseEntity.ok(cmsService.updateFacility(id, facility));
    }

    @DeleteMapping("/facilities/{id}")
    @PreAuthorize("hasRole('MANAGEMENT')")
    public ResponseEntity<Map<String, String>> deleteFacility(@PathVariable Long id) {
        cmsService.deleteFacility(id);
        return ResponseEntity.ok(Map.of("message", "Facility deleted successfully"));
    }

    // ==================== ACHIEVEMENTS ====================

    @GetMapping("/achievements")
    public ResponseEntity<List<Achievement>> getAchievements() {
        return ResponseEntity.ok(cmsService.getAchievements());
    }

    @PostMapping("/achievements")
    @PreAuthorize("hasRole('MANAGEMENT')")
    public ResponseEntity<Achievement> createAchievement(@RequestBody Achievement achievement) {
        return ResponseEntity.ok(cmsService.createAchievement(achievement));
    }

    @PutMapping("/achievements/{id}")
    @PreAuthorize("hasRole('MANAGEMENT')")
    public ResponseEntity<Achievement> updateAchievement(@PathVariable Long id, @RequestBody Achievement achievement) {
        return ResponseEntity.ok(cmsService.updateAchievement(id, achievement));
    }

    @DeleteMapping("/achievements/{id}")
    @PreAuthorize("hasRole('MANAGEMENT')")
    public ResponseEntity<Map<String, String>> deleteAchievement(@PathVariable Long id) {
        cmsService.deleteAchievement(id);
        return ResponseEntity.ok(Map.of("message", "Achievement deleted"));
    }

    // ==================== STATS ====================

    @GetMapping("/stats")
    public ResponseEntity<List<CmsStat>> getStats() {
        return ResponseEntity.ok(cmsService.getStats());
    }

    @PostMapping("/stats")
    @PreAuthorize("hasRole('MANAGEMENT')")
    public ResponseEntity<CmsStat> createStat(@RequestBody CmsStat stat) {
        return ResponseEntity.ok(cmsService.createStat(stat));
    }

    @PutMapping("/stats/{id}")
    @PreAuthorize("hasRole('MANAGEMENT')")
    public ResponseEntity<CmsStat> updateStat(@PathVariable Long id, @RequestBody CmsStat stat) {
        return ResponseEntity.ok(cmsService.updateStat(id, stat));
    }

    @DeleteMapping("/stats/{id}")
    @PreAuthorize("hasRole('MANAGEMENT')")
    public ResponseEntity<Map<String, String>> deleteStat(@PathVariable Long id) {
        cmsService.deleteStat(id);
        return ResponseEntity.ok(Map.of("message", "Stat deleted"));
    }

    // ==================== TESTIMONIALS ====================

    @GetMapping("/testimonials")
    public ResponseEntity<List<CmsTestimonial>> getTestimonials() {
        return ResponseEntity.ok(cmsService.getActiveTestimonials());
    }

    @GetMapping("/testimonials/all")
    @PreAuthorize("hasRole('MANAGEMENT')")
    public ResponseEntity<List<CmsTestimonial>> getAllTestimonials() {
        return ResponseEntity.ok(cmsService.getTestimonials());
    }

    @PostMapping("/testimonials")
    @PreAuthorize("hasRole('MANAGEMENT')")
    public ResponseEntity<CmsTestimonial> createTestimonial(@RequestBody CmsTestimonial testimonial) {
        return ResponseEntity.ok(cmsService.createTestimonial(testimonial));
    }

    @PutMapping("/testimonials/{id}")
    @PreAuthorize("hasRole('MANAGEMENT')")
    public ResponseEntity<CmsTestimonial> updateTestimonial(@PathVariable Long id, @RequestBody CmsTestimonial testimonial) {
        return ResponseEntity.ok(cmsService.updateTestimonial(id, testimonial));
    }

    @DeleteMapping("/testimonials/{id}")
    @PreAuthorize("hasRole('MANAGEMENT')")
    public ResponseEntity<Map<String, String>> deleteTestimonial(@PathVariable Long id) {
        cmsService.deleteTestimonial(id);
        return ResponseEntity.ok(Map.of("message", "Testimonial deleted"));
    }

    // ==================== GALLERY ====================

    @GetMapping("/gallery")
    public ResponseEntity<List<GalleryMedia>> getGallery(
            @RequestParam(required = false) String category) {
        return ResponseEntity.ok(cmsService.getGallery(category));
    }

    @PostMapping("/gallery")
    @PreAuthorize("hasRole('MANAGEMENT')")
    public ResponseEntity<GalleryMedia> createGalleryMedia(@RequestBody GalleryMedia media) {
        return ResponseEntity.ok(cmsService.createGalleryMedia(media));
    }

    @PutMapping("/gallery/{id}")
    @PreAuthorize("hasRole('MANAGEMENT')")
    public ResponseEntity<GalleryMedia> updateGalleryMedia(@PathVariable Long id, @RequestBody GalleryMedia media) {
        return ResponseEntity.ok(cmsService.updateGalleryMedia(id, media));
    }

    @DeleteMapping("/gallery/{id}")
    @PreAuthorize("hasRole('MANAGEMENT')")
    public ResponseEntity<Map<String, String>> deleteGalleryMedia(@PathVariable Long id) {
        cmsService.deleteGalleryMedia(id);
        return ResponseEntity.ok(Map.of("message", "Gallery media deleted successfully"));
    }

    // ==================== FILE UPLOAD ====================

    @PostMapping("/upload")
    @PreAuthorize("hasAnyRole('MANAGEMENT', 'TEACHER', 'STUDENT')")
    public ResponseEntity<Map<String, String>> uploadImage(@RequestParam("file") MultipartFile file)
            throws IOException {
        String url = cmsService.uploadImage(file);
        return ResponseEntity.ok(Map.of("url", url, "message", "Image uploaded successfully"));
    }
}
