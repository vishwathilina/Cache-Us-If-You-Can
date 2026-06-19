package com.novabank.dto;

import com.novabank.entity.Account;
import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.Instant;

@Data
@Builder
public class AccountResponseDTO {
    private Long id;
    private String accountNumber;
    private String accountName;
    private String accountType;
    private BigDecimal balance;
    private Instant createdAt;

    public static AccountResponseDTO from(Account account) {
        return AccountResponseDTO.builder()
            .id(account.getId())
            .accountNumber(account.getAccountNumber())
            .accountName(account.getAccountName())
            .accountType(account.getAccountType().name())
            .balance(account.getBalance())
            .createdAt(account.getCreatedAt())
            .build();
    }
}
