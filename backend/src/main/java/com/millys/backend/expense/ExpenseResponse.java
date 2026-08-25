package com.millys.backend.expense;

import java.math.BigDecimal;

public record ExpenseResponse(Long id, String categoryCode, String description, BigDecimal amount, String date, String userName, Long installmentPlanId, boolean shared) {}
