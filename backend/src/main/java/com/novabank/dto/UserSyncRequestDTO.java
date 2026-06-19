package com.novabank.dto;

import lombok.Data;

@Data
public class UserSyncRequestDTO {
    private String email;
    private String fullName;
    private String picture;
}
