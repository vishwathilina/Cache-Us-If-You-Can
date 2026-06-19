package com.novabank.dto;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.Instant;

@Data
@Builder
public class TransferResponseDTO {
    private Long transactionId;
    private String referenceNumber;
    private BigDecimal amount;
    private String fromAccountNumber;
    private String toAccountNumber;
    private BigDecimal newBalance;
    private Instant timestamp;
}
