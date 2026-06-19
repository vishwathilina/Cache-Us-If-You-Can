package com.novabank.service;

import com.novabank.dto.TransactionResponseDTO;
import com.novabank.entity.Account;
import com.novabank.entity.User;
import com.novabank.repository.AccountRepository;
import com.novabank.repository.TransactionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class TransactionService {

    private final TransactionRepository transactionRepository;
    private final AccountRepository accountRepository;
    private final UserService userService;

    @Transactional
    public Page<TransactionResponseDTO> getTransactionsForCurrentUser(Jwt jwt, Pageable pageable) {
        User user = userService.resolveUser(jwt);
        List<Account> userAccounts = accountRepository.findByUser(user);

        if (userAccounts.isEmpty()) {
            return Page.empty(pageable);
        }

        Set<Long> userAccountIds = userAccounts.stream()
            .map(Account::getId)
            .collect(Collectors.toSet());

        return transactionRepository.findByAccounts(userAccounts, pageable)
            .map(transaction -> TransactionResponseDTO.from(
                transaction,
                resolveDirection(transaction, userAccountIds)
            ));
    }

    private String resolveDirection(com.novabank.entity.Transaction transaction, Set<Long> userAccountIds) {
        if (transaction.getToAccount() != null
            && userAccountIds.contains(transaction.getToAccount().getId())) {
            return "CREDIT";
        }

        return "DEBIT";
    }
}
