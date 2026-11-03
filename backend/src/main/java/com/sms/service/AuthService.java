package com.sms.service;

import com.sms.config.JwtTokenProvider;
import com.sms.dto.LoginRequest;
import com.sms.dto.LoginResponse;
import com.sms.model.*;
import com.sms.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final ManagementProfileRepository managementProfileRepository;
    private final TeacherRepository teacherRepository;
    private final StudentRepository studentRepository;
    private final ParentContactRepository parentContactRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider jwtTokenProvider;

    public LoginResponse login(LoginRequest request) {
        String username = request.getUsername() != null ? request.getUsername().trim() : "";
        User user = userRepository.findByUsernameIgnoreCase(username)
                .orElseThrow(() -> new RuntimeException("Invalid username or password"));

        if (!user.getIsActive()) {
            throw new RuntimeException("Account is deactivated");
        }

        if (!passwordEncoder.matches(request.getPassword(), user.getPasswordHash())) {
            throw new RuntimeException("Invalid username or password");
        }

        String token = jwtTokenProvider.generateToken(user.getUsername(), user.getRole().name());
        String refreshToken = jwtTokenProvider.generateRefreshToken(user.getUsername());
        String fullName = resolveFullName(user);

        return LoginResponse.builder()
                .token(token)
                .refreshToken(refreshToken)
                .role(user.getRole().name())
                .staffRole(user.getStaffRole() != null ? user.getStaffRole() : (user.getRole() == User.Role.MANAGEMENT ? "SUPER_ADMIN" : user.getRole().name()))
                .permissions(parsePermissions(user))
                .fullName(fullName)
                .userId(user.getId())
                .profileId(resolveProfileId(user))
                .build();
    }

    public LoginResponse refreshToken(String refreshToken) {
        if (!jwtTokenProvider.validateToken(refreshToken)) {
            throw new RuntimeException("Invalid refresh token");
        }
        String username = jwtTokenProvider.getUsernameFromToken(refreshToken);
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));

        String newToken = jwtTokenProvider.generateToken(username, user.getRole().name());
        String newRefreshToken = jwtTokenProvider.generateRefreshToken(username);

        return LoginResponse.builder()
                .token(newToken)
                .refreshToken(newRefreshToken)
                .role(user.getRole().name())
                .staffRole(user.getStaffRole() != null ? user.getStaffRole() : (user.getRole() == User.Role.MANAGEMENT ? "SUPER_ADMIN" : user.getRole().name()))
                .permissions(parsePermissions(user))
                .fullName(resolveFullName(user))
                .userId(user.getId())
                .profileId(resolveProfileId(user))
                .build();
    }

    public static java.util.List<String> parsePermissions(User user) {
        if (user.getRole() != User.Role.MANAGEMENT) {
            return java.util.Collections.emptyList();
        }
        if (user.getPermissions() == null || user.getPermissions().isBlank() || user.getPermissions().equals("*")) {
            return java.util.List.of(
                "DASHBOARD", "AUDIT_LOGS", "STUDENTS", "TEACHERS", "CLASSES", "PROMOTIONS",
                "ASSIGNMENTS", "LIBRARY", "ADMIT_CARDS", "EVENTS", "SUBSTITUTIONS", "LEAVES",
                "PTM", "HEALTH", "FEES", "PAYROLL", "TRANSPORT", "INVENTORY", "CMS", "GALLERY",
                "ALUMNI", "BACKUP", "RBAC"
            );
        }
        return java.util.Arrays.stream(user.getPermissions().split(","))
                .map(String::trim)
                .filter(s -> !s.isEmpty())
                .collect(java.util.stream.Collectors.toList());
    }

    private String resolveFullName(User user) {
        return switch (user.getRole()) {
            case MANAGEMENT -> managementProfileRepository.findByUserId(user.getId())
                    .map(ManagementProfile::getFullName).orElse(user.getUsername());
            case TEACHER -> teacherRepository.findByUserId(user.getId())
                    .map(Teacher::getFullName).orElse(user.getUsername());
            case STUDENT -> studentRepository.findByUserId(user.getId())
                    .map(Student::getFullName).orElse(user.getUsername());
            case PARENT -> parentContactRepository.findFirstByUserId(user.getId())
                    .map(ParentContact::getName).orElse(user.getUsername());
            case BUS_OPERATOR -> "Bus Operator (" + user.getUsername() + ")";
            default -> user.getUsername();
        };
    }

    private Long resolveProfileId(User user) {
        return switch (user.getRole()) {
            case MANAGEMENT -> managementProfileRepository.findByUserId(user.getId())
                    .map(ManagementProfile::getId).orElse(null);
            case TEACHER -> teacherRepository.findByUserId(user.getId())
                    .map(Teacher::getId).orElse(null);
            case STUDENT -> studentRepository.findByUserId(user.getId())
                    .map(Student::getId).orElse(null);
            case PARENT -> parentContactRepository.findFirstByUserId(user.getId())
                    .map(ParentContact::getId).orElse(user.getId());
            case BUS_OPERATOR -> user.getId();
            default -> user.getId();
        };
    }
}
