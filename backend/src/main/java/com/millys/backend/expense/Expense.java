package com.millys.backend.expense;

import com.millys.backend.installment.InstallmentPlan;
import com.millys.backend.user.User;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDate;

@Entity
@Table(name = "expenses")
@Getter
@Setter
@NoArgsConstructor
public class Expense {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "category_code", nullable = false, length = 50)
    private String categoryCode;

    @Column(nullable = false, length = 200)
    private String description;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal amount;

    @Column(nullable = false)
    private LocalDate date;

    // Whether this expense counts toward the couple's shared ledger. Defaults
    // to true so every expense already on record keeps behaving exactly as
    // before. A personal expense (shared = false) counts only in its owner's
    // own total and is excluded from per-person split/comparison math.
    @Column(nullable = false)
    private boolean shared = true;

    // Optional link to a financing plan (e.g. car, mattress) — set when this
    // expense is one of its monthly payments. Progress on the plan is counted
    // from these real linked expenses rather than a calendar formula.
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "installment_plan_id", nullable = true)
    private InstallmentPlan installmentPlan;
}
