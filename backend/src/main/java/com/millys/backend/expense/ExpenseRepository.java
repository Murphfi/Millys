package com.millys.backend.expense;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

public interface ExpenseRepository extends JpaRepository<Expense, Long> {

    @Query("SELECT e FROM Expense e JOIN FETCH e.user LEFT JOIN FETCH e.installmentPlan ORDER BY e.date DESC")
    List<Expense> findAllByOrderByDateDesc();

    @Query("SELECT e FROM Expense e JOIN FETCH e.user LEFT JOIN FETCH e.installmentPlan WHERE e.id = :id")
    Optional<Expense> findByIdWithUser(@Param("id") Long id);

    @Query("SELECT COALESCE(SUM(e.amount), 0) FROM Expense e WHERE e.installmentPlan.id = :planId")
    BigDecimal sumAmountByInstallmentPlanId(@Param("planId") Long planId);

    @Query("SELECT COUNT(e) FROM Expense e WHERE e.installmentPlan.id = :planId")
    long countByInstallmentPlanId(@Param("planId") Long planId);
}
