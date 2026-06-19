package com.novabank.dto;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;

@Data
@Builder
public class AdminStatsDTO {
    private long totalUsers;
    private long totalAccounts;
    private long totalTransactions;
    private BigDecimal totalBalance;
    private long successfulTransactions;
    private long failedTransactions;
}
