package com.sms.model.cms;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "hero_sections")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class HeroSection {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(length = 100)
    private String overline;

    @Column(nullable = false, length = 200)
    private String headline;

    @Column(columnDefinition = "TEXT")
    private String subtext;

    @Column(name = "background_image_url", length = 500)
    private String backgroundImageUrl;

    @Column(name = "hero_image_url", length = 500)
    private String heroImageUrl;

    @Column(name = "logo_url", length = 500)
    private String logoUrl;

    @Column(name = "favicon_url", length = 500)
    private String faviconUrl;

    @Column(name = "marquee_text", columnDefinition = "TEXT")
    private String marqueeText;

    @Column(name = "cta_primary_label", length = 80)
    private String ctaPrimaryLabel;

    @Column(name = "cta_secondary_label", length = 80)
    private String ctaSecondaryLabel;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }
}

