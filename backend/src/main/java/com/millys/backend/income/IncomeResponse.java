package com.millys.backend.income;

import java.math.BigDecimal;

public record IncomeResponse(Long id, String description, BigDecimal amount, String date, String userName) {}
