package com.sms.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LoginResponse {
    private String token;
    private String refreshToken;
    private String role;
    private String staffRole;
    private java.util.List<String> permissions;
    private String fullName;
    private Long userId;
    private Long profileId;
}
