package com.millys.backend.installment;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface InstallmentPlanRepository extends JpaRepository<InstallmentPlan, Long> {

    @Query("SELECT p FROM InstallmentPlan p JOIN FETCH p.user ORDER BY p.startDate DESC")
    List<InstallmentPlan> findAllByOrderByStartDateDesc();

    @Query("SELECT p FROM InstallmentPlan p JOIN FETCH p.user WHERE p.id = :id")
    Optional<InstallmentPlan> findByIdWithUser(@Param("id") Long id);
}
