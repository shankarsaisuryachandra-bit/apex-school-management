package com.sms.model;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDate;

@Entity
@Table(name = "teacher_salaries")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class TeacherSalary {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "teacher_id", nullable = false)
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
    private Teacher teacher;

    @Column(name = "month_year", nullable = false, length = 20)
    private String monthYear; // e.g. "August 2025"

    @Column(name = "basic_salary", nullable = false, precision = 10, scale = 2)
    private BigDecimal basicSalary;

    @Column(name = "allowances", precision = 10, scale = 2)
    private BigDecimal allowances;

    @Column(name = "deductions", precision = 10, scale = 2)
    private BigDecimal deductions;

    @Column(name = "net_salary", precision = 10, scale = 2)
    private BigDecimal netSalary;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    private SalaryStatus status;

    @Column(name = "payment_date")
    private LocalDate paymentDate;

    public enum SalaryStatus {
        PAID, PENDING
    }

    @PrePersist
    @PreUpdate
    protected void calculateNet() {
        BigDecimal basic = basicSalary != null ? basicSalary : BigDecimal.ZERO;
        BigDecimal allow = allowances != null ? allowances : BigDecimal.ZERO;
        BigDecimal ded = deductions != null ? deductions : BigDecimal.ZERO;
        this.netSalary = basic.add(allow).subtract(ded);
    }
}
