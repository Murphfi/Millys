package com.millys.backend.installment;

import com.millys.backend.user.User;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDate;

@Entity
@Table(name = "installment_plans")
@Getter
@Setter
@NoArgsConstructor
public class InstallmentPlan {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(nullable = false, length = 200)
    private String description;

    @Column(name = "total_amount", nullable = false, precision = 10, scale = 2)
    private BigDecimal totalAmount;

    @Column(name = "monthly_amount", nullable = false, precision = 10, scale = 2)
    private BigDecimal monthlyAmount;

    @Column(name = "start_date", nullable = false)
    private LocalDate startDate;

    // Manual starting balance for plans that already had payments before this
    // plan existed in Millys (e.g. a car loan started years ago) — added to
    // the sum of linked real expenses instead of requiring the whole payment
    // history to be re-entered as fake expenses just to get an accurate bar.
    @Column(name = "initial_paid_amount", nullable = false, precision = 10, scale = 2)
    private BigDecimal initialPaidAmount = BigDecimal.ZERO;
}
