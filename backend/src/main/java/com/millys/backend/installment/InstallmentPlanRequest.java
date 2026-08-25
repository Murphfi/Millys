package com.millys.backend.installment;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;

public record InstallmentPlanRequest(
        @NotBlank(message = "La descripción es obligatoria") @Size(max = 200, message = "La descripción es demasiado larga") String description,
        @NotNull @DecimalMin(value = "0.01", message = "El importe total debe ser mayor que 0") BigDecimal totalAmount,
        @NotNull @DecimalMin(value = "0.01", message = "La cuota mensual debe ser mayor que 0") BigDecimal monthlyAmount,
        @NotBlank(message = "La fecha de inicio es obligatoria") String startDate,
        String userName,
        @DecimalMin(value = "0", message = "El importe ya pagado no puede ser negativo") BigDecimal initialPaidAmount
) {}
