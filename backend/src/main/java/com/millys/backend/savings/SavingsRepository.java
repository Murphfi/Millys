package com.millys.backend.savings;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface SavingsRepository extends JpaRepository<SavingsEntry, Long> {

    @Query("SELECT s FROM SavingsEntry s JOIN FETCH s.user ORDER BY s.date DESC")
    List<SavingsEntry> findAllByOrderByDateDesc();

    @Query("SELECT s FROM SavingsEntry s JOIN FETCH s.user WHERE s.id = :id")
    Optional<SavingsEntry> findByIdWithUser(@Param("id") Long id);
}
