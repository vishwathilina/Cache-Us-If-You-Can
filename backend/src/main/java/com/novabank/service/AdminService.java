package com.novabank.service;

import com.novabank.dto.AdminStatsDTO;
import com.novabank.dto.AdminUserDTO;
import com.novabank.dto.TransactionResponseDTO;
import com.novabank.entity.Transaction;
import com.novabank.repository.AccountRepository;
import com.novabank.repository.TransactionRepository;
import com.novabank.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;

@Service
@RequiredArgsConstructor
public class AdminService {

    private final UserRepository userRepository;
    private final AccountRepository accountRepository;
    private final TransactionRepository transactionRepository;

    @Transactional(readOnly = true)
    public AdminStatsDTO getStats() {
        long totalUsers        = userRepository.count();
        long totalAccounts     = accountRepository.count();
        long totalTransactions = transactionRepository.count();
        BigDecimal totalBalance = accountRepository.sumAllBalances();

        long successful = transactionRepository.countByStatus(Transaction.TransactionStatus.SUCCESS);
        long failed     = transactionRepository.countByStatus(Transaction.TransactionStatus.FAILED);

        return AdminStatsDTO.builder()
            .totalUsers(totalUsers)
            .totalAccounts(totalAccounts)
            .totalTransactions(totalTransactions)
            .totalBalance(totalBalance)
            .successfulTransactions(successful)
            .failedTransactions(failed)
            .build();
    }

    @Transactional(readOnly = true)
    public List<AdminUserDTO> getAllUsers() {
        return userRepository.findAll().stream()
            .map(user -> {
                long count = accountRepository.countByUser(user);
                BigDecimal balance = accountRepository.findByUser(user).stream()
                    .map(a -> a.getBalance())
                    .reduce(BigDecimal.ZERO, BigDecimal::add);
                return AdminUserDTO.from(user, count, balance);
            })
            .toList();
    }

    @Transactional(readOnly = true)
    public Page<TransactionResponseDTO> getAllTransactions(Pageable pageable) {
        return transactionRepository.findAll(pageable)
            .map(TransactionResponseDTO::from);
    }
}
