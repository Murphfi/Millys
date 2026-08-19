package com.millys.backend.expense;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface ExpenseRepository extends JpaRepository<Expense, Long> {

    @Query("SELECT e FROM Expense e JOIN FETCH e.user ORDER BY e.date DESC")
    List<Expense> findAllByOrderByDateDesc();

    @Query("SELECT e FROM Expense e JOIN FETCH e.user WHERE e.id = :id")
    Optional<Expense> findByIdWithUser(@Param("id") Long id);
}
