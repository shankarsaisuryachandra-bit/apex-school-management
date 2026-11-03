package com.sms.model;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDate;

@Entity
@Table(name = "school_assets")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class SchoolAsset {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "item_name", nullable = false, length = 150)
    private String itemName;

    @Column(name = "category", length = 50)
    private String category; // e.g. "LAB", "COMPUTER", "FURNITURE", "SPORTS"

    @Column(name = "quantity", nullable = false)
    private Integer quantity;

    @Column(name = "location", length = 100)
    private String location; // e.g. "Physics Lab 2", "Block B Room 10"

    @Column(name = "asset_condition", length = 30)
    private String assetCondition; // e.g. "GOOD", "REPAIR_NEEDED", "EXCELLENT"

    @Column(name = "last_inspected")
    private LocalDate lastInspected;

    @PrePersist
    protected void onCreate() {
        if (this.lastInspected == null) this.lastInspected = LocalDate.now();
    }
}
