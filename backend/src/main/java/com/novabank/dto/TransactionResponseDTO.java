package com.novabank.dto;

import com.novabank.entity.Transaction;
import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.Instant;

@Data
@Builder
public class TransactionResponseDTO {
    private Long id;
    private String fromAccountNumber;
    private String toAccountNumber;
    private BigDecimal amount;
    private String description;
    private String referenceNumber;
    private String status;
    private String direction;
    private Instant createdAt;

    public static TransactionResponseDTO from(Transaction t) {
        return TransactionResponseDTO.builder()
            .id(t.getId())
            .fromAccountNumber(t.getFromAccount() != null ? t.getFromAccount().getAccountNumber() : null)
            .toAccountNumber(t.getToAccount() != null ? t.getToAccount().getAccountNumber() : null)
            .amount(t.getAmount())
            .description(t.getDescription())
            .referenceNumber(t.getReferenceNumber())
            .status(t.getStatus().name())
            .direction(null)
            .createdAt(t.getCreatedAt())
            .build();
    }

    public static TransactionResponseDTO from(Transaction t, String direction) {
        return TransactionResponseDTO.builder()
            .id(t.getId())
            .fromAccountNumber(t.getFromAccount() != null ? t.getFromAccount().getAccountNumber() : null)
            .toAccountNumber(t.getToAccount() != null ? t.getToAccount().getAccountNumber() : null)
            .amount(t.getAmount())
            .description(t.getDescription())
            .referenceNumber(t.getReferenceNumber())
            .status(t.getStatus().name())
            .direction(direction)
            .createdAt(t.getCreatedAt())
            .build();
    }
}
