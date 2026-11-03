package com.sms.model.cms;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "cms_stats")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CmsStat {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "stat_value", nullable = false, length = 30)
    private String value;

    @Column(nullable = false, length = 80)
    private String label;

    @Column(name = "color_class", length = 50)
    private String colorClass;

    @Column(name = "sort_order")
    private Integer sortOrder;
}
