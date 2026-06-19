package com.novabank.dto;

import com.novabank.entity.User;
import lombok.Builder;
import lombok.Data;

import java.time.Instant;

@Data
@Builder
public class UserProfileDTO {
    private Long id;
    private String email;
    private String fullName;
    private String picture;
    private Instant createdAt;

    private boolean isAdmin;

    public static UserProfileDTO from(User user) {
        return UserProfileDTO.builder()
            .id(user.getId())
            .email(user.getEmail())
            .fullName(user.getFullName())
            .picture(user.getPicture())
            .isAdmin(user.isAdmin())
            .createdAt(user.getCreatedAt())
            .build();
    }
}
