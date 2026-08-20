package com.millys.backend.savings;

import java.math.BigDecimal;

public record SavingsResponse(Long id, String destinationCode, String description, BigDecimal amount, String date, String userName) {}
