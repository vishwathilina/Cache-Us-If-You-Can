package com.novabank.controller;

import com.novabank.dto.AdminStatsDTO;
import com.novabank.dto.AdminUserDTO;
import com.novabank.dto.TransactionResponseDTO;
import com.novabank.service.AdminService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * All endpoints here require the 'admin' role in the JWT.
 * This is enforced at TWO levels:
 *   1. SecurityFilterChain: .requestMatchers("/api/v1/admin/**").hasRole("admin")
 *   2. @PreAuthorize on each method (defence in depth)
 */
@RestController
@RequestMapping("/api/v1/admin")
@RequiredArgsConstructor
@PreAuthorize("hasRole('admin')")
public class AdminController {

    private final AdminService adminService;

    /** Platform-wide KPI stats */
    @GetMapping("/stats")
    public ResponseEntity<AdminStatsDTO> getStats() {
        return ResponseEntity.ok(adminService.getStats());
    }

    /** All registered users with their account & balance summaries */
    @GetMapping("/users")
    public ResponseEntity<List<AdminUserDTO>> getAllUsers() {
        return ResponseEntity.ok(adminService.getAllUsers());
    }

    /** All transactions across all users, newest first */
    @GetMapping("/transactions")
    public ResponseEntity<Page<TransactionResponseDTO>> getAllTransactions(
            @PageableDefault(size = 25, sort = "createdAt") Pageable pageable) {
        return ResponseEntity.ok(adminService.getAllTransactions(pageable));
    }
}
