package com.millys.backend.savings;

import java.math.BigDecimal;

public record SavingsRequest(String destinationCode, String description, BigDecimal amount, String date, String userName) {}
