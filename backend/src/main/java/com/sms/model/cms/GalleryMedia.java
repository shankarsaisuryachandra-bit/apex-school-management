package com.sms.model.cms;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

@Entity
@Table(name = "gallery_media")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonIgnoreProperties(ignoreUnknown = true)
public class GalleryMedia {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(length = 200)
    private String title;

    @Column(name = "media_url", nullable = false, length = 500)
    private String mediaUrl;

    @Enumerated(EnumType.STRING)
    @Column(name = "media_type")
    @Builder.Default
    private MediaType mediaType = MediaType.IMAGE;

    @Column(length = 50)
    private String category;

    @Column(length = 500)
    private String description;

    @Column(name = "uploaded_at")
    private LocalDateTime uploadedAt;

    @PrePersist
    protected void onCreate() {
        this.uploadedAt = LocalDateTime.now();
    }

    public void setImageUrl(String imageUrl) {
        if (imageUrl != null && !imageUrl.isBlank()) {
            this.mediaUrl = imageUrl;
        }
    }

    public String getImageUrl() {
        return this.mediaUrl;
    }

    public enum MediaType {
        IMAGE, VIDEO
    }
}
