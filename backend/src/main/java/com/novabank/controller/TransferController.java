package com.novabank.controller;

import com.novabank.dto.TransferRequestDTO;
import com.novabank.dto.TransferResponseDTO;
import com.novabank.service.TransferService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/transfers")
@RequiredArgsConstructor
public class TransferController {

    private final TransferService transferService;

    /**
     * Executes an atomic fund transfer.
     * The @Valid annotation triggers DTO constraints (amount > 0, required fields).
     * The service layer additionally enforces: IDOR, overdraft protection, self-transfer prevention.
     */
    @PostMapping
    public ResponseEntity<TransferResponseDTO> transfer(
            @RequestBody @Valid TransferRequestDTO request,
            @AuthenticationPrincipal Jwt jwt) {
        return ResponseEntity.ok(transferService.executeTransfer(request, jwt));
    }
}
