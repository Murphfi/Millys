package com.millys.backend.expense;

import java.math.BigDecimal;

public record ExpenseRequest(String categoryCode, String description, BigDecimal amount, String date, String userName) {}
