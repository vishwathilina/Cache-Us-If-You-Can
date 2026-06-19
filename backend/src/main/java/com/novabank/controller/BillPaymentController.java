package com.novabank.controller;

import com.novabank.dto.BillPaymentRequestDTO;
import com.novabank.dto.PaymentReceiptDTO;
import com.novabank.service.BillPaymentService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/bill-payments")
@RequiredArgsConstructor
public class BillPaymentController {

    private final BillPaymentService billPaymentService;

    @PostMapping
    public ResponseEntity<PaymentReceiptDTO> payBill(
            @RequestBody @Valid BillPaymentRequestDTO request,
            @AuthenticationPrincipal Jwt jwt) {
        return ResponseEntity.ok(billPaymentService.payBill(request, jwt));
    }
}
