package com.millys.backend.income;

import java.math.BigDecimal;

public record IncomeRequest(String description, BigDecimal amount, String date, String userName) {}
