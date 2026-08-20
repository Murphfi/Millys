package com.millys.backend.income;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface IncomeRepository extends JpaRepository<Income, Long> {

    @Query("SELECT i FROM Income i JOIN FETCH i.user ORDER BY i.date DESC")
    List<Income> findAllByOrderByDateDesc();

    @Query("SELECT i FROM Income i JOIN FETCH i.user WHERE i.id = :id")
    Optional<Income> findByIdWithUser(@Param("id") Long id);
}
