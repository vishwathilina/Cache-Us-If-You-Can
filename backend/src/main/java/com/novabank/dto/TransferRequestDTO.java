package com.novabank.dto;

import jakarta.validation.constraints.*;
import lombok.Data;

import java.math.BigDecimal;

@Data
public class TransferRequestDTO {

    @NotNull(message = "Source account ID is required")
    private Long fromAccountId;

    @NotBlank(message = "Destination account number is required")
    private String toAccountNumber;

    @NotNull(message = "Amount is required")
    @DecimalMin(value = "0.01", message = "Amount must be greater than zero")
    @Digits(integer = 12, fraction = 2, message = "Invalid amount format")
    private BigDecimal amount;

    @Size(max = 255, message = "Description too long")
    private String description;
}
