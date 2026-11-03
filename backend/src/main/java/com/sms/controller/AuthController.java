package com.sms.controller;

import com.sms.dto.LoginRequest;
import com.sms.dto.LoginResponse;
import com.sms.service.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @PostMapping("/login")
    public ResponseEntity<LoginResponse> login(@Valid @RequestBody LoginRequest request) {
        LoginResponse response = authService.login(request);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/refresh")
    public ResponseEntity<LoginResponse> refresh(@RequestBody Map<String, String> body) {
        String refreshToken = body.get("refreshToken");
        LoginResponse response = authService.refreshToken(refreshToken);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/me")
    public ResponseEntity<Map<String, Object>> me(
            @org.springframework.security.core.annotation.AuthenticationPrincipal
            com.sms.model.User user) {
        java.util.Map<String, Object> profile = new java.util.HashMap<>();
        profile.put("userId", user.getId());
        profile.put("username", user.getUsername());
        profile.put("role", user.getRole().name());
        profile.put("staffRole", user.getStaffRole() != null ? user.getStaffRole() : (user.getRole() == com.sms.model.User.Role.MANAGEMENT ? "SUPER_ADMIN" : user.getRole().name()));
        profile.put("permissions", com.sms.service.AuthService.parsePermissions(user));
        return ResponseEntity.ok(profile);
    }
}
