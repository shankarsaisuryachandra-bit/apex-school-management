package com.sms.model.cms;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "school_info")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SchoolInfo {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "school_name", length = 150)
    private String schoolName;

    @Column(name = "tagline", length = 200)
    private String tagline;

    @Column(name = "address", columnDefinition = "TEXT")
    private String address;

    @Column(name = "phone", length = 30)
    private String phone;

    @Column(name = "email", length = 100)
    private String email;

    @Column(name = "whatsapp", length = 30)
    private String whatsapp;

    @Column(name = "established_year", length = 10)
    private String establishedYear;

    @Column(name = "affiliation", length = 200)
    private String affiliation;

    @Column(name = "principal_name", length = 100)
    private String principalName;

    @Column(name = "instagram_url", length = 300)
    private String instagramUrl;

    @Column(name = "facebook_url", length = 300)
    private String facebookUrl;

    @Column(name = "twitter_url", length = 300)
    private String twitterUrl;

    @Column(name = "trust_badge_1", length = 100)
    private String trustBadge1;

    @Column(name = "trust_badge_2", length = 100)
    private String trustBadge2;

    @Column(name = "trust_badge_3", length = 100)
    private String trustBadge3;

    @Column(name = "trust_badge_4", length = 100)
    private String trustBadge4;

    @Column(name = "cta_primary_label", length = 80)
    private String ctaPrimaryLabel;

    @Column(name = "cta_secondary_label", length = 80)
    private String ctaSecondaryLabel;

    @Column(name = "footer_tagline", columnDefinition = "TEXT")
    private String footerTagline;

    @Column(name = "upi_id", length = 100)
    private String upiId;

    @Column(name = "upi_qr_url", length = 500)
    private String upiQrUrl;

    @Column(name = "tenant_slug", length = 80)
    private String tenantSlug;

    @Column(name = "primary_color", length = 30)
    private String primaryColor;

    @Column(name = "accent_color", length = 30)
    private String accentColor;

    @Column(name = "logo_url", length = 500)
    private String logoUrl;
}
