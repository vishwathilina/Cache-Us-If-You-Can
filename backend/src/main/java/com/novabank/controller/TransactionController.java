package com.novabank.controller;

import com.novabank.dto.TransactionResponseDTO;
import com.novabank.service.TransactionService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/transactions")
@RequiredArgsConstructor
public class TransactionController {

    private final TransactionService transactionService;

    /**
     * Returns paginated transactions across ALL accounts owned by the authenticated user.
     * No account number query param – all data is scoped to the JWT identity.
     */
    @GetMapping
    public ResponseEntity<Page<TransactionResponseDTO>> getMyTransactions(
            @AuthenticationPrincipal Jwt jwt,
            @PageableDefault(size = 20, sort = "createdAt") Pageable pageable) {
        return ResponseEntity.ok(transactionService.getTransactionsForCurrentUser(jwt, pageable));
    }
}
