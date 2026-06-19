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

@Service
@RequiredArgsConstructor
public class TransactionService {

    private final TransactionRepository transactionRepository;
    private final AccountRepository accountRepository;
    private final UserService userService;

    @Transactional(readOnly = true)
    public Page<TransactionResponseDTO> getTransactionsForCurrentUser(Jwt jwt, Pageable pageable) {
        User user = userService.resolveUser(jwt);
        List<Account> userAccounts = accountRepository.findByUser(user);

        if (userAccounts.isEmpty()) {
            return Page.empty(pageable);
        }

        return transactionRepository.findByAccounts(userAccounts, pageable)
            .map(TransactionResponseDTO::from);
    }
}
