package com.novabank.controller;

import com.novabank.dto.UserProfileDTO;
import com.novabank.entity.User;
import com.novabank.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    /**
     * Called by the frontend immediately after login to sync the Auth0
     * user profile into our database. Safe to call multiple times (upsert).
     */
    @PostMapping("/me")
    public ResponseEntity<UserProfileDTO> syncProfile(@AuthenticationPrincipal Jwt jwt) {
        User user = userService.upsertFromJwt(jwt);
        return ResponseEntity.ok(UserProfileDTO.from(user));
    }

    @GetMapping("/me")
    public ResponseEntity<UserProfileDTO> getProfile(@AuthenticationPrincipal Jwt jwt) {
        User user = userService.resolveUser(jwt);
        return ResponseEntity.ok(UserProfileDTO.from(user));
    }
}
