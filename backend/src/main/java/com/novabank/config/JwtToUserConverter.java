package com.novabank.config;

import com.novabank.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.core.convert.converter.Converter;
import org.springframework.security.authentication.AbstractAuthenticationToken;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.stereotype.Component;

import java.util.List;

/**
 * Converts the incoming Auth0 JWT into a Spring Authentication token.
 *
 * After the JWT signature is verified, this looks up the user in OUR database
 * by their auth0_sub. If the DB row has is_admin=true, we grant ROLE_admin.
 *
 * This means admin status is controlled entirely by your own database —
 * no Auth0 paid RBAC features are needed.
 *
 * To make someone an admin, run in your Neon DB:
 *   UPDATE users SET is_admin = true WHERE email = 'admin@example.com';
 */
@Component
@RequiredArgsConstructor
public class JwtToUserConverter implements Converter<Jwt, AbstractAuthenticationToken> {

    private final UserRepository userRepository;

    @Override
    public AbstractAuthenticationToken convert(Jwt jwt) {
        String sub = jwt.getSubject();

        List<SimpleGrantedAuthority> authorities = userRepository
            .findByAuth0Sub(sub)
            .filter(user -> user.isAdmin())
            .map(user -> List.of(new SimpleGrantedAuthority("ROLE_admin")))
            .orElse(List.of());

        return new JwtAuthenticationToken(jwt, authorities, sub);
    }
}
