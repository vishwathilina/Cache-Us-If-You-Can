package com.novabank.service;

import com.novabank.entity.User;
import com.novabank.exception.ResourceNotFoundException;
import com.novabank.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;

    /**
     * Resolves the current User from the Auth0 JWT.
     * Throws if user record doesn't exist yet (call upsert first).
     */
    public User resolveUser(Jwt jwt) {
        String sub = jwt.getSubject();
        return userRepository.findByAuth0Sub(sub)
            .orElseThrow(() -> new ResourceNotFoundException("User profile not found. Please complete registration."));
    }

    /**
     * Upsert the user record on first login or profile update.
     * Reads: sub, email, name, picture claims from Auth0 ID token claims.
     */
    @Transactional
    public User upsertFromJwt(Jwt jwt) {
        String sub = jwt.getSubject();
        String email = jwt.getClaimAsString("email");
        String name = jwt.getClaimAsString("name");
        String picture = jwt.getClaimAsString("picture");

        return userRepository.findByAuth0Sub(sub).map(existing -> {
            existing.setEmail(email);
            existing.setFullName(name);
            existing.setPicture(picture);
            return userRepository.save(existing);
        }).orElseGet(() -> userRepository.save(
            User.builder()
                .auth0Sub(sub)
                .email(email)
                .fullName(name)
                .picture(picture)
                .build()
        ));
    }
}
