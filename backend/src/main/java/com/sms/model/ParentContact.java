package com.sms.model;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "parent_contacts")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ParentContact {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "student_id", nullable = false)
    @com.fasterxml.jackson.annotation.JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
    private Student student;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    @com.fasterxml.jackson.annotation.JsonIgnoreProperties({"hibernateLazyInitializer", "handler", "passwordHash"})
    private User user;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Relation relation;

    @Column(nullable = false, length = 100)
    private String name;

    @Column(nullable = false, length = 15)
    private String phone;

    @Column(length = 100)
    private String email;

    @Column(name = "whatsapp_number", length = 15)
    private String whatsappNumber;

    public enum Relation {
        FATHER, MOTHER, GUARDIAN
    }
}
