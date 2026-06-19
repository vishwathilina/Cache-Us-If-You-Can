package com.novabank.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.math.BigDecimal;

@Data
public class BillPaymentRequestDTO {
    @NotNull(message = "Source account ID is required")
    private Long fromAccountId;

    @NotBlank(message = "Biller ID is required")
    @Size(max = 80, message = "Biller ID is too long")
    private String billerId;

    @NotBlank(message = "Biller name is required")
    @Size(max = 120, message = "Biller name is too long")
    private String billerName;

    @NotBlank(message = "Customer reference is required")
    @Size(max = 120, message = "Customer reference is too long")
    private String customerReference;

    @NotNull(message = "Amount is required")
    @DecimalMin(value = "0.01", message = "Amount must be greater than zero")
    @Digits(integer = 12, fraction = 2, message = "Invalid amount format")
    private BigDecimal amount;
}
