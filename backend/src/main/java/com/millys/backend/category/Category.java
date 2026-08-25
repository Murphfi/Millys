package com.millys.backend.category;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.OffsetDateTime;

@Entity
@Table(name = "categories")
@Getter
@Setter
@NoArgsConstructor
public class Category {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 50)
    private String code;

    @Column(nullable = false, length = 100)
    private String label;

    @Column(nullable = false, length = 7)
    private String color;

    @Column(name = "is_default", nullable = false)
    private boolean isDefault;

    @Column(name = "no_description", nullable = false)
    private boolean noDescription;

    // Marks the category where financing-plan payments live (e.g. Suscripciones/
    // Fijos) — the expense dialog only offers the "Financiación" link when this
    // category is selected, instead of a hardcoded category id/code.
    @Column(name = "financing_category", nullable = false)
    private boolean financingCategory;

    @Column(name = "created_at", nullable = false, insertable = false, updatable = false)
    private OffsetDateTime createdAt;
}
