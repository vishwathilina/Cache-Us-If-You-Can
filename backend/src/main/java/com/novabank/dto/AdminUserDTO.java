package com.novabank.dto;

import com.novabank.entity.User;
import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.Instant;

@Data
@Builder
public class AdminUserDTO {
    private Long id;
    private String auth0Sub;
    private String email;
    private String fullName;
    private String picture;
    private long accountCount;
    private BigDecimal totalBalance;
    private Instant createdAt;

    public static AdminUserDTO from(User user, long accountCount, BigDecimal totalBalance) {
        return AdminUserDTO.builder()
            .id(user.getId())
            .auth0Sub(user.getAuth0Sub())
            .email(user.getEmail())
            .fullName(user.getFullName())
            .picture(user.getPicture())
            .accountCount(accountCount)
            .totalBalance(totalBalance != null ? totalBalance : BigDecimal.ZERO)
            .createdAt(user.getCreatedAt())
            .build();
    }
}
