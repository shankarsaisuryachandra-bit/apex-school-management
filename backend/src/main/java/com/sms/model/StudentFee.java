package com.sms.model;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;

@Entity
@Table(name = "student_fees",
       uniqueConstraints = @UniqueConstraint(columnNames = {"student_id", "academic_year"}))
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class StudentFee {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "student_id", nullable = false)
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
    private Student student;

    @Column(name = "academic_year", nullable = false, length = 9)
    private String academicYear;

    @Column(name = "current_year_due", nullable = false, precision = 10, scale = 2)
    @Builder.Default
    private BigDecimal currentYearDue = BigDecimal.ZERO;

    @Column(name = "previous_year_pending", nullable = false, precision = 10, scale = 2)
    @Builder.Default
    private BigDecimal previousYearPending = BigDecimal.ZERO;

    @Column(name = "total_paid", nullable = false, precision = 10, scale = 2)
    @Builder.Default
    private BigDecimal totalPaid = BigDecimal.ZERO;

    @Column(name = "grand_total", insertable = false, updatable = false, precision = 10, scale = 2)
    private BigDecimal grandTotal;

    @Column(name = "balance_due", insertable = false, updatable = false, precision = 10, scale = 2)
    private BigDecimal balanceDue;

    public BigDecimal getGrandTotal() {
        if (grandTotal != null) return grandTotal;
        BigDecimal current = currentYearDue != null ? currentYearDue : BigDecimal.ZERO;
        BigDecimal previous = previousYearPending != null ? previousYearPending : BigDecimal.ZERO;
        return current.add(previous);
    }

    public BigDecimal getBalanceDue() {
        if (balanceDue != null) return balanceDue;
        BigDecimal grand = getGrandTotal();
        BigDecimal paid = totalPaid != null ? totalPaid : BigDecimal.ZERO;
        BigDecimal diff = grand.subtract(paid);
        return diff.compareTo(BigDecimal.ZERO) < 0 ? BigDecimal.ZERO : diff;
    }

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private FeeStatus status = FeeStatus.UNPAID;

    public enum FeeStatus {
        PAID, PARTIAL, UNPAID
    }

    /**
     * Recalculate status based on current payment state.
     * Called by service layer after recording a payment.
     */
    public void recalculateStatus() {
        BigDecimal total = getGrandTotal();
        BigDecimal paid = totalPaid != null ? totalPaid : BigDecimal.ZERO;
        if (paid.compareTo(total) >= 0 && total.compareTo(BigDecimal.ZERO) > 0) {
            this.status = FeeStatus.PAID;
        } else if (paid.compareTo(BigDecimal.ZERO) > 0) {
            this.status = FeeStatus.PARTIAL;
        } else if (total.compareTo(BigDecimal.ZERO) == 0) {
            this.status = FeeStatus.PAID;
        } else {
            this.status = FeeStatus.UNPAID;
        }
    }
}
