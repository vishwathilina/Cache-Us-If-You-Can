package com.novabank.service;

import com.novabank.dto.TransferRequestDTO;
import com.novabank.dto.TransferResponseDTO;
import com.novabank.entity.Account;
import com.novabank.entity.Transaction;
import com.novabank.entity.User;
import com.novabank.exception.ForbiddenException;
import com.novabank.exception.InsufficientFundsException;
import com.novabank.repository.TransactionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class TransferService {

    private final AccountService accountService;
    private final UserService userService;
    private final TransactionRepository transactionRepository;

    /**
     * Executes a fund transfer atomically.
     * If any step fails the entire transaction is rolled back.
     *
     * IDOR protection: verifies the authenticated user owns the source account.
     * Financial validation: amount > 0, balance >= amount, src != dst.
     */
    @Transactional
    public TransferResponseDTO executeTransfer(TransferRequestDTO request, Jwt jwt) {
        User currentUser = userService.resolveUser(jwt);

        // IDOR check – ensures the sender account belongs to the authenticated user
        Account sender = accountService.findOwnedAccount(request.getFromAccountId(), currentUser);
        Account receiver = accountService.findByAccountNumber(request.getToAccountNumber());

        // Prevent self-transfers
        if (sender.getAccountNumber().equals(receiver.getAccountNumber())) {
            throw new IllegalArgumentException("Cannot transfer to the same account");
        }

        // Prevent negative/zero transfers (validated at DTO level too, but double-check here)
        if (request.getAmount().signum() <= 0) {
            throw new IllegalArgumentException("Transfer amount must be positive");
        }

        // Overdraft protection
        if (sender.getBalance().compareTo(request.getAmount()) < 0) {
            throw new InsufficientFundsException(
                String.format("Insufficient funds. Available: %.2f, Requested: %.2f",
                    sender.getBalance(), request.getAmount())
            );
        }

        // ACID: both balance updates happen inside a single transaction
        sender.setBalance(sender.getBalance().subtract(request.getAmount()));
        receiver.setBalance(receiver.getBalance().add(request.getAmount()));

        String ref = "NB-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();

        Transaction transaction = transactionRepository.save(
            Transaction.builder()
                .fromAccount(sender)
                .toAccount(receiver)
                .amount(request.getAmount())
                .description(request.getDescription())
                .referenceNumber(ref)
                .status(Transaction.TransactionStatus.SUCCESS)
                .createdBy(currentUser)
                .build()
        );

        return TransferResponseDTO.builder()
            .transactionId(transaction.getId())
            .referenceNumber(ref)
            .amount(request.getAmount())
            .fromAccountNumber(sender.getAccountNumber())
            .toAccountNumber(receiver.getAccountNumber())
            .newBalance(sender.getBalance())
            .timestamp(Instant.now())
            .build();
    }
}
