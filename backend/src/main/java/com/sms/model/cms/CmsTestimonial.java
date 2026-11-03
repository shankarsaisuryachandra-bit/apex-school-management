package com.sms.model.cms;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "cms_testimonials")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CmsTestimonial {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 100)
    private String name;

    @Column(length = 120)
    private String role;

    @Column(name = "avatar_initials", length = 5)
    private String avatarInitials;

    @Column(columnDefinition = "TEXT")
    private String text;

    @Column(name = "gradient_class", length = 80)
    private String gradientClass;

    @Column(name = "sort_order")
    private Integer sortOrder;

    @Column(name = "is_active")
    private Boolean isActive;
}
