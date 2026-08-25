package com.millys.backend.installment;

import java.math.BigDecimal;

public record InstallmentPlanResponse(
        Long id,
        String description,
        BigDecimal totalAmount,
        BigDecimal monthlyAmount,
        String startDate,
        String userName,
        BigDecimal paidAmount,
        long paidCount,
        BigDecimal initialPaidAmount
) {}
