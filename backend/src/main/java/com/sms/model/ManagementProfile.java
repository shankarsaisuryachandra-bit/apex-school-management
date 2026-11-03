package com.sms.model;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "management_profiles")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ManagementProfile {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false, unique = true)
    private User user;

    @Column(name = "full_name", nullable = false, length = 100)
    private String fullName;

    @Column(length = 50)
    private String designation;

    @Column(length = 15)
    private String phone;

    @Column(length = 100)
    private String email;
}
