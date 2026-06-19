package com.novabank.dto;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.Instant;

@Data
@Builder
public class PaymentReceiptDTO {
    private Long transactionId;
    private String referenceNumber;
    private String type;
    private String status;
    private BigDecimal amount;
    private String fromAccountNumber;
    private String toAccountNumber;
    private String payeeName;
    private String customerReference;
    private String description;
    private BigDecimal newBalance;
    private Instant timestamp;
}
