package com.millys.backend.savings;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;

public record SavingsRequest(
        @NotBlank(message = "El destino es obligatorio") String destinationCode,
        @Size(max = 200, message = "La descripción es demasiado larga") String description,
        @NotNull @DecimalMin(value = "0.01", message = "El importe debe ser mayor que 0") BigDecimal amount,
        @NotBlank(message = "La fecha es obligatoria") String date,
        String userName
) {}
