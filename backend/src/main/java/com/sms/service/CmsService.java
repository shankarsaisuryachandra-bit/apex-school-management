package com.sms.service;

import com.sms.model.cms.*;
import com.sms.repository.cms.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import javax.imageio.ImageIO;
import java.awt.*;
import java.awt.image.BufferedImage;
import java.io.*;
import java.nio.file.*;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class CmsService {

    private final HeroSectionRepository heroSectionRepository;
    private final FacilityRepository facilityRepository;
    private final AchievementRepository achievementRepository;
    private final GalleryMediaRepository galleryMediaRepository;
    private final SchoolInfoRepository schoolInfoRepository;
    private final CmsStatRepository cmsStatRepository;
    private final CmsTestimonialRepository cmsTestimonialRepository;

    @Value("${app.upload.dir:./uploads}")
    private String uploadDir;

    @Value("${app.upload.max-image-width:1920}")
    private int maxImageWidth;

    // ==================== HERO SECTION ====================

    @Transactional
    public HeroSection getHeroSection() {
        List<HeroSection> list = heroSectionRepository.findAll();
        if (list.isEmpty()) {
            HeroSection h = HeroSection.builder()
                    .headline("Shaping Young Minds for a Better Tomorrow")
                    .subtext("Apex International Academy has been a cornerstone of quality education in Chennai for over two decades.")
                    .overline("CBSE Affiliated School — Since 1998")
                    .heroImageUrl("/uploads/hero_campus_quad.png")
                    .marqueeText("Admissions Open for Academic Year 2025-2026")
                    .ctaPrimaryLabel("Apply for Admission")
                    .ctaSecondaryLabel("View Programs")
                    .build();
            return heroSectionRepository.save(h);
        }
        return list.get(0);
    }

    @Transactional
    public HeroSection updateHeroSection(HeroSection updated) {
        List<HeroSection> list = heroSectionRepository.findAll();
        HeroSection hero = list.isEmpty() ? new HeroSection() : list.get(0);

        hero.setOverline(updated.getOverline());
        hero.setHeadline(updated.getHeadline());
        hero.setSubtext(updated.getSubtext());
        hero.setBackgroundImageUrl(updated.getBackgroundImageUrl());
        hero.setHeroImageUrl(updated.getHeroImageUrl());
        hero.setLogoUrl(updated.getLogoUrl());
        hero.setFaviconUrl(updated.getFaviconUrl());
        hero.setMarqueeText(updated.getMarqueeText());
        hero.setCtaPrimaryLabel(updated.getCtaPrimaryLabel());
        hero.setCtaSecondaryLabel(updated.getCtaSecondaryLabel());

        if (list.size() > 1) {
            for (int i = 1; i < list.size(); i++) {
                heroSectionRepository.delete(list.get(i));
            }
        }

        return heroSectionRepository.save(hero);
    }

    @Transactional
    public HeroSection setHeroImageUrl(String photoUrl) {
        log.info(">>> setHeroImageUrl called with: {}", photoUrl);
        List<HeroSection> list = heroSectionRepository.findAll();
        HeroSection hero;
        if (list.isEmpty()) {
            hero = HeroSection.builder()
                    .headline("Shaping Young Minds for a Better Tomorrow")
                    .subtext("Apex International Academy has been a cornerstone of quality education in Chennai for over two decades.")
                    .overline("CBSE Affiliated School — Since 1998")
                    .heroImageUrl(photoUrl)
                    .marqueeText("Admissions Open for Academic Year 2025-2026")
                    .ctaPrimaryLabel("Apply for Admission")
                    .ctaSecondaryLabel("View Programs")
                    .build();
        } else {
            hero = list.get(0);
            hero.setHeroImageUrl(photoUrl);
            if (list.size() > 1) {
                for (int i = 1; i < list.size(); i++) {
                    heroSectionRepository.delete(list.get(i));
                }
            }
        }
        log.info("Hero image URL updated in database to: {}", photoUrl);
        return heroSectionRepository.save(hero);
    }

    // ==================== SCHOOL INFO ====================

    public SchoolInfo getSchoolInfo() {
        return schoolInfoRepository.findAll().stream().findFirst()
                .orElse(SchoolInfo.builder()
                        .schoolName("Apex Academy")
                        .tagline("Excellence in Education")
                        .phone("+91 98765 43210")
                        .email("admin@apexacademy.edu")
                        .whatsapp("9876543210")
                        .address("123 Education Street, Tech City, TN 600001")
                        .affiliation("CBSE & State Board Approved")
                        .principalName("Dr. E. Vance")
                        .trustBadge1("CBSE & State Approved")
                        .trustBadge2("100% Digital Marksheets")
                        .trustBadge3("Instant WhatsApp Alerts")
                        .trustBadge4("Secure JWT Auth")
                        .footerTagline("Empowering future generations with holistic education, modern digital portals, and character-building programs.")
                        .upiId("apexschool.fee@upi")
                        .build());
    }

    @Transactional
    public SchoolInfo updateSchoolInfo(SchoolInfo updated) {
        SchoolInfo info = schoolInfoRepository.findAll().stream().findFirst()
                .orElse(new SchoolInfo());
        info.setSchoolName(updated.getSchoolName());
        info.setTagline(updated.getTagline());
        info.setPhone(updated.getPhone());
        info.setEmail(updated.getEmail());
        info.setWhatsapp(updated.getWhatsapp());
        info.setAddress(updated.getAddress());
        info.setAffiliation(updated.getAffiliation());
        info.setPrincipalName(updated.getPrincipalName());
        info.setEstablishedYear(updated.getEstablishedYear());
        info.setInstagramUrl(updated.getInstagramUrl());
        info.setFacebookUrl(updated.getFacebookUrl());
        info.setTwitterUrl(updated.getTwitterUrl());
        info.setTrustBadge1(updated.getTrustBadge1());
        info.setTrustBadge2(updated.getTrustBadge2());
        info.setTrustBadge3(updated.getTrustBadge3());
        info.setTrustBadge4(updated.getTrustBadge4());
        info.setCtaPrimaryLabel(updated.getCtaPrimaryLabel());
        info.setCtaSecondaryLabel(updated.getCtaSecondaryLabel());
        info.setFooterTagline(updated.getFooterTagline());
        info.setUpiId(updated.getUpiId());
        info.setUpiQrUrl(updated.getUpiQrUrl());
        info.setTenantSlug(updated.getTenantSlug());
        info.setPrimaryColor(updated.getPrimaryColor());
        info.setAccentColor(updated.getAccentColor());
        info.setLogoUrl(updated.getLogoUrl());
        return schoolInfoRepository.save(info);
    }

    public List<SchoolInfo> getAllTenants() {
        return schoolInfoRepository.findAllByOrderByIdAsc();
    }

    public SchoolInfo getTenantBySlug(String tenantSlug) {
        return schoolInfoRepository.findByTenantSlug(tenantSlug)
                .orElseGet(this::getSchoolInfo);
    }

    // ==================== FACILITIES ====================

    public List<Facility> getActiveFacilities() {
        return facilityRepository.findByIsActiveTrueOrderBySortOrderAsc();
    }

    public List<Facility> getAllFacilities() {
        return facilityRepository.findAll();
    }

    public Facility createFacility(Facility facility) {
        return facilityRepository.save(facility);
    }

    public Facility updateFacility(Long id, Facility updated) {
        Facility facility = facilityRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Facility not found"));
        facility.setIcon(updated.getIcon());
        facility.setTitle(updated.getTitle());
        facility.setDescription(updated.getDescription());
        facility.setSortOrder(updated.getSortOrder());
        facility.setIsActive(updated.getIsActive());
        return facilityRepository.save(facility);
    }

    public void deleteFacility(Long id) {
        facilityRepository.deleteById(id);
    }

    // ==================== ACHIEVEMENTS ====================

    public List<Achievement> getAchievements() {
        return achievementRepository.findAllByOrderByAchievementDateDesc();
    }

    public Achievement createAchievement(Achievement achievement) {
        return achievementRepository.save(achievement);
    }

    public Achievement updateAchievement(Long id, Achievement updated) {
        Achievement ach = achievementRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Achievement not found"));
        ach.setTitle(updated.getTitle());
        ach.setDescription(updated.getDescription());
        ach.setAchievementDate(updated.getAchievementDate());
        ach.setImageUrl(updated.getImageUrl());
        return achievementRepository.save(ach);
    }

    public void deleteAchievement(Long id) {
        achievementRepository.deleteById(id);
    }

    // ==================== STATS ====================

    public List<CmsStat> getStats() {
        return cmsStatRepository.findAllByOrderBySortOrderAsc();
    }

    public CmsStat createStat(CmsStat stat) {
        return cmsStatRepository.save(stat);
    }

    public CmsStat updateStat(Long id, CmsStat updated) {
        CmsStat stat = cmsStatRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Stat not found"));
        stat.setValue(updated.getValue());
        stat.setLabel(updated.getLabel());
        stat.setColorClass(updated.getColorClass());
        stat.setSortOrder(updated.getSortOrder());
        return cmsStatRepository.save(stat);
    }

    public void deleteStat(Long id) {
        cmsStatRepository.deleteById(id);
    }

    // ==================== TESTIMONIALS ====================

    public List<CmsTestimonial> getTestimonials() {
        return cmsTestimonialRepository.findAllByOrderBySortOrderAsc();
    }

    public List<CmsTestimonial> getActiveTestimonials() {
        return cmsTestimonialRepository.findByIsActiveTrueOrderBySortOrderAsc();
    }

    public CmsTestimonial createTestimonial(CmsTestimonial testimonial) {
        if (testimonial.getIsActive() == null) testimonial.setIsActive(true);
        return cmsTestimonialRepository.save(testimonial);
    }

    public CmsTestimonial updateTestimonial(Long id, CmsTestimonial updated) {
        CmsTestimonial t = cmsTestimonialRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Testimonial not found"));
        t.setName(updated.getName());
        t.setRole(updated.getRole());
        t.setAvatarInitials(updated.getAvatarInitials());
        t.setText(updated.getText());
        t.setGradientClass(updated.getGradientClass());
        t.setSortOrder(updated.getSortOrder());
        t.setIsActive(updated.getIsActive());
        return cmsTestimonialRepository.save(t);
    }

    public void deleteTestimonial(Long id) {
        cmsTestimonialRepository.deleteById(id);
    }

    // ==================== GALLERY ====================

    public List<GalleryMedia> getGallery(String category) {
        if (category != null && !category.isEmpty()) {
            return galleryMediaRepository.findByCategoryOrderByUploadedAtDesc(category);
        }
        return galleryMediaRepository.findAllByOrderByUploadedAtDesc();
    }

    public GalleryMedia createGalleryMedia(GalleryMedia media) {
        if (media.getMediaType() == null) media.setMediaType(GalleryMedia.MediaType.IMAGE);
        return galleryMediaRepository.save(media);
    }

    public GalleryMedia updateGalleryMedia(Long id, GalleryMedia updated) {
        GalleryMedia m = galleryMediaRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Gallery media item not found: " + id));
        m.setTitle(updated.getTitle());
        m.setMediaUrl(updated.getMediaUrl());
        m.setMediaType(updated.getMediaType());
        m.setCategory(updated.getCategory());
        return galleryMediaRepository.save(m);
    }

    public void deleteGalleryMedia(Long id) {
        galleryMediaRepository.deleteById(id);
    }

    // ==================== FILE UPLOAD ====================

    public String uploadImage(MultipartFile file) throws IOException {
        if (file.isEmpty()) {
            throw new RuntimeException("File is empty");
        }
        if (file.getSize() > 25 * 1024 * 1024) {
            throw new RuntimeException("File size exceeds 25MB limit");
        }

        // Read bytes up-front so stream is not consumed twice
        byte[] fileBytes = file.getBytes();
        String extension = getExtension(file.getOriginalFilename());
        String filename = UUID.randomUUID().toString() + "." + extension;
        Path uploadPath = Paths.get(uploadDir);
        Files.createDirectories(uploadPath);
        File outputFile = uploadPath.resolve(filename).toFile();

        try {
            BufferedImage originalImage = ImageIO.read(new java.io.ByteArrayInputStream(fileBytes));
            if (originalImage != null) {
                BufferedImage processedImage = originalImage;
                if (originalImage.getWidth() > maxImageWidth) {
                    double ratio = (double) maxImageWidth / originalImage.getWidth();
                    int newHeight = (int) (originalImage.getHeight() * ratio);
                    processedImage = new BufferedImage(maxImageWidth, newHeight, BufferedImage.TYPE_INT_RGB);
                    Graphics2D g2d = processedImage.createGraphics();
                    g2d.setRenderingHint(RenderingHints.KEY_INTERPOLATION, RenderingHints.VALUE_INTERPOLATION_BILINEAR);
                    g2d.drawImage(originalImage, 0, 0, maxImageWidth, newHeight, null);
                    g2d.dispose();
                }
                String format = extension.equalsIgnoreCase("png") ? "png" : "jpg";
                // Force JPEG output for non-PNG to guarantee compatibility
                if (!format.equals("png")) {
                    format = "jpg";
                    filename = filename.replaceAll("\\.[^.]+$", ".jpg");
                    outputFile = uploadPath.resolve(filename).toFile();
                    // Convert ARGB to RGB for JPEG
                    if (processedImage.getType() == BufferedImage.TYPE_INT_ARGB) {
                        BufferedImage rgb = new BufferedImage(processedImage.getWidth(), processedImage.getHeight(), BufferedImage.TYPE_INT_RGB);
                        rgb.createGraphics().drawImage(processedImage, 0, 0, null);
                        processedImage = rgb;
                    }
                }
                boolean written = ImageIO.write(processedImage, format, outputFile);
                if (written && outputFile.length() > 0) {
                    log.info("Image processed & saved: {}, size: {}KB", filename, outputFile.length() / 1024);
                    return "/uploads/" + filename;
                }
            }
        } catch (Exception e) {
            log.warn("ImageIO failed, writing raw bytes: {}", e.getMessage());
        }

        // Fallback: write raw bytes directly
        Files.write(outputFile.toPath(), fileBytes);
        log.info("Image saved (raw): {}, size: {}KB", filename, outputFile.length() / 1024);
        return "/uploads/" + filename;
    }

    private String getExtension(String filename) {
        if (filename == null) return "jpg";
        int lastDot = filename.lastIndexOf('.');
        return lastDot > 0 ? filename.substring(lastDot + 1).toLowerCase() : "jpg";
    }
}
