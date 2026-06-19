package com.novabank.controller;

import com.novabank.dto.AccountResponseDTO;
import com.novabank.service.AccountService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/accounts")
@RequiredArgsConstructor
public class AccountController {

    private final AccountService accountService;

    /**
     * Returns ONLY the accounts belonging to the authenticated user.
     * No userId query parameter – ownership is derived from the JWT sub claim.
     */
    @GetMapping
    public ResponseEntity<List<AccountResponseDTO>> getMyAccounts(@AuthenticationPrincipal Jwt jwt) {
        return ResponseEntity.ok(accountService.getAccountsForCurrentUser(jwt));
    }

    /**
     * IDOR protection: accountId is verified against the JWT sub.
     * If the account doesn't belong to this user, 404 is returned (not 403
     * to avoid leaking the existence of other accounts).
     */
    @GetMapping("/{accountId}")
    public ResponseEntity<AccountResponseDTO> getAccount(
            @PathVariable Long accountId,
            @AuthenticationPrincipal Jwt jwt) {
        return ResponseEntity.ok(accountService.getAccountById(accountId, jwt));
    }
}
