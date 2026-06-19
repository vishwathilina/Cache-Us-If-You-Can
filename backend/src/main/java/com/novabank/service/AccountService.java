package com.novabank.service;

import com.novabank.dto.AccountResponseDTO;
import com.novabank.entity.Account;
import com.novabank.entity.User;
import com.novabank.exception.ResourceNotFoundException;
import com.novabank.repository.AccountRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class AccountService {

    private final AccountRepository accountRepository;
    private final UserService userService;

    @Transactional
    public List<AccountResponseDTO> getAccountsForCurrentUser(Jwt jwt) {
        User user = userService.upsertFromJwt(jwt);
        return accountRepository.findByUser(user).stream()
            .map(AccountResponseDTO::from)
            .toList();
    }

    @Transactional(readOnly = true)
    public AccountResponseDTO getAccountById(Long accountId, Jwt jwt) {
        User user = userService.resolveUser(jwt);
        Account account = accountRepository.findByIdAndUser(accountId, user)
            .orElseThrow(() -> new ResourceNotFoundException("Account not found"));
        return AccountResponseDTO.from(account);
    }

    /** Internal lookup used by TransferService – does NOT do IDOR check itself. */
    @Transactional(readOnly = true)
    public Account findByAccountNumber(String accountNumber) {
        return accountRepository.findByAccountNumber(accountNumber)
            .orElseThrow(() -> new ResourceNotFoundException("Destination account not found: " + accountNumber));
    }

    /** Internal lookup with ownership check. */
    @Transactional(readOnly = true)
    public Account findOwnedAccount(Long accountId, User owner) {
        return accountRepository.findByIdAndUser(accountId, owner)
            .orElseThrow(() -> new ResourceNotFoundException("Account not found or access denied"));
    }
}
