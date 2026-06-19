package com.novabank.service;

import com.novabank.dto.BillPaymentRequestDTO;
import com.novabank.dto.PaymentReceiptDTO;
import com.novabank.entity.Account;
import com.novabank.entity.Transaction;
import com.novabank.entity.User;
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
public class BillPaymentService {

    private final AccountService accountService;
    private final UserService userService;
    private final TransactionRepository transactionRepository;

    @Transactional
    public PaymentReceiptDTO payBill(BillPaymentRequestDTO request, Jwt jwt) {
        User currentUser = userService.resolveUser(jwt);
        Account source = accountService.findOwnedAccount(request.getFromAccountId(), currentUser);

        if (source.getBalance().compareTo(request.getAmount()) < 0) {
            throw new InsufficientFundsException(
                String.format("Insufficient funds. Available: %.2f, Requested: %.2f",
                    source.getBalance(), request.getAmount())
            );
        }

        source.setBalance(source.getBalance().subtract(request.getAmount()));

        String ref = "BP-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
        String description = "Bill Payment - " + request.getBillerName()
            + " (" + request.getCustomerReference() + ")";

        Transaction transaction = transactionRepository.save(
            Transaction.builder()
                .fromAccount(source)
                .amount(request.getAmount())
                .description(description)
                .referenceNumber(ref)
                .status(Transaction.TransactionStatus.SUCCESS)
                .createdBy(currentUser)
                .build()
        );

        return PaymentReceiptDTO.builder()
            .transactionId(transaction.getId())
            .referenceNumber(ref)
            .type("BILL_PAYMENT")
            .status(transaction.getStatus().name())
            .amount(request.getAmount())
            .fromAccountNumber(source.getAccountNumber())
            .payeeName(request.getBillerName())
            .customerReference(request.getCustomerReference())
            .description(description)
            .newBalance(source.getBalance())
            .timestamp(Instant.now())
            .build();
    }
}
