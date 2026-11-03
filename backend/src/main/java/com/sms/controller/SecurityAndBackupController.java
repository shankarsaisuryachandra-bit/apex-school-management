package com.sms.controller;

import com.sms.model.ManagementProfile;
import com.sms.model.User;
import com.sms.repository.ManagementProfileRepository;
import com.sms.repository.UserRepository;
import com.sms.service.AuthService;
import com.sms.service.DatabaseBackupService;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
@Slf4j
public class SecurityAndBackupController {

    private final DatabaseBackupService backupService;
    private final UserRepository userRepository;
    private final ManagementProfileRepository managementProfileRepository;
    private final PasswordEncoder passwordEncoder;
    private final com.fasterxml.jackson.databind.ObjectMapper objectMapper;

    // ═════════════════════════════════════════════════════════════════════════
    // 1. INSTITUTIONAL DATABASE BACKUP & DISASTER RECOVERY
    // ═════════════════════════════════════════════════════════════════════════

    /**
     * 1-Click Institutional Database Export (JSON Download).
     */
    @GetMapping("/backup/export")
    @PreAuthorize("hasRole('MANAGEMENT')")
    public ResponseEntity<byte[]> exportDatabaseBackup() {
        try {
            Map<String, Object> backupData = backupService.generateInstitutionalBackup();
            String json = objectMapper.writerWithDefaultPrettyPrinter().writeValueAsString(backupData);
            byte[] bytes = json.getBytes(StandardCharsets.UTF_8);

            String filename = "apex_academy_backup_" + LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMdd_HHmmss")) + ".json";

            return ResponseEntity.ok()
                    .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename + "\"")
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(bytes);
        } catch (Exception e) {
            log.error("Failed to generate backup export", e);
            return ResponseEntity.internalServerError().build();
        }
    }

    /**
     * Get live database table counts, storage metrics, and health indicators.
     */
    @GetMapping("/backup/stats")
    @PreAuthorize("hasRole('MANAGEMENT')")
    public ResponseEntity<Map<String, Object>> getDatabaseStats() {
        return ResponseEntity.ok(backupService.getSystemHealthAndStats());
    }

    /**
     * Create a server-stored backup snapshot.
     */
    @PostMapping("/backup/create-snapshot")
    @PreAuthorize("hasRole('MANAGEMENT')")
    public ResponseEntity<Map<String, Object>> createSnapshot() {
        return ResponseEntity.ok(backupService.createLocalSnapshot());
    }

    /**
     * List all server-stored snapshots.
     */
    @GetMapping("/backup/snapshots")
    @PreAuthorize("hasRole('MANAGEMENT')")
    public ResponseEntity<List<Map<String, Object>>> listSnapshots() {
        return ResponseEntity.ok(backupService.listLocalSnapshots());
    }

    /**
     * Restore database from uploaded snapshot.
     */
    @PostMapping("/backup/restore")
    @PreAuthorize("hasRole('MANAGEMENT')")
    public ResponseEntity<Map<String, Object>> restoreBackup(@RequestBody Map<String, Object> backupPayload) {
        return ResponseEntity.ok(backupService.restoreFromBackup(backupPayload));
    }

    // ═════════════════════════════════════════════════════════════════════════
    // 2. STAFF ROLES & GRANULAR PERMISSIONS (RBAC)
    // ═════════════════════════════════════════════════════════════════════════

    /**
     * Get all management and administrative staff accounts with assigned roles and permissions.
     */
    @GetMapping("/roles/staff-users")
    @PreAuthorize("hasRole('MANAGEMENT')")
    public ResponseEntity<List<Map<String, Object>>> getStaffUsers() {
        List<User> mgmtUsers = userRepository.findByRole(User.Role.MANAGEMENT);
        List<Map<String, Object>> result = new ArrayList<>();

        for (User u : mgmtUsers) {
            ManagementProfile profile = managementProfileRepository.findByUserId(u.getId()).orElse(null);
            Map<String, Object> item = new HashMap<>();
            item.put("id", u.getId());
            item.put("username", u.getUsername());
            item.put("role", u.getRole().name());
            item.put("staffRole", u.getStaffRole() != null ? u.getStaffRole() : "SUPER_ADMIN");
            item.put("permissions", AuthService.parsePermissions(u));
            item.put("rawPermissions", u.getPermissions());
            item.put("isActive", u.getIsActive());
            item.put("createdAt", u.getCreatedAt());
            item.put("fullName", profile != null ? profile.getFullName() : u.getUsername());
            item.put("designation", profile != null ? profile.getDesignation() : "Staff Member");
            item.put("phone", profile != null ? profile.getPhone() : "");
            item.put("email", profile != null ? profile.getEmail() : "");
            result.add(item);
        }

        return ResponseEntity.ok(result);
    }

    /**
     * Create a new administrative/staff user with granular permissions.
     */
    @PostMapping("/roles/staff-users")
    @PreAuthorize("hasRole('MANAGEMENT')")
    public ResponseEntity<Map<String, Object>> createStaffUser(@RequestBody CreateStaffUserRequest req) {
        if (req.getUsername() == null || req.getUsername().isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("message", "Username is required"));
        }
        if (req.getPassword() == null || req.getPassword().isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("message", "Password is required"));
        }
        if (userRepository.findByUsernameIgnoreCase(req.getUsername().trim()).isPresent()) {
            return ResponseEntity.badRequest().body(Map.of("message", "Username '" + req.getUsername() + "' is already registered"));
        }

        String permissionsStr = req.getPermissions() != null && !req.getPermissions().isEmpty()
                ? String.join(",", req.getPermissions())
                : "*";

        String staffRole = req.getStaffRole() != null && !req.getStaffRole().isBlank()
                ? req.getStaffRole().toUpperCase()
                : "CUSTOM";

        User user = User.builder()
                .username(req.getUsername().trim().toLowerCase())
                .passwordHash(passwordEncoder.encode(req.getPassword()))
                .role(User.Role.MANAGEMENT)
                .staffRole(staffRole)
                .permissions(permissionsStr)
                .isActive(true)
                .build();
        user = userRepository.save(user);

        ManagementProfile profile = ManagementProfile.builder()
                .user(user)
                .fullName(req.getFullName() != null ? req.getFullName() : req.getUsername())
                .designation(req.getDesignation() != null ? req.getDesignation() : "Staff Officer")
                .phone(req.getPhone())
                .email(req.getEmail())
                .build();
        managementProfileRepository.save(profile);

        log.info("Created new staff account: {} with staffRole: {}", user.getUsername(), staffRole);

        return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "Staff account '" + user.getUsername() + "' created successfully with " + AuthService.parsePermissions(user).size() + " module permissions",
                "userId", user.getId()
        ));
    }

    /**
     * Update an existing staff user's role, permissions, status, or credentials.
     */
    @PutMapping("/roles/staff-users/{id}")
    @PreAuthorize("hasRole('MANAGEMENT')")
    public ResponseEntity<Map<String, Object>> updateStaffUser(
            @PathVariable Long id,
            @RequestBody UpdateStaffUserRequest req) {

        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Staff user not found with ID: " + id));

        if (req.getStaffRole() != null) {
            user.setStaffRole(req.getStaffRole().toUpperCase());
        }

        if (req.getPermissions() != null) {
            user.setPermissions(String.join(",", req.getPermissions()));
        }

        if (req.getIsActive() != null) {
            if ("admin".equalsIgnoreCase(user.getUsername()) && !req.getIsActive()) {
                return ResponseEntity.badRequest().body(Map.of("message", "Cannot deactivate the primary root admin account"));
            }
            user.setIsActive(req.getIsActive());
        }

        if (req.getPassword() != null && !req.getPassword().isBlank()) {
            user.setPasswordHash(passwordEncoder.encode(req.getPassword()));
        }

        userRepository.save(user);

        ManagementProfile profile = managementProfileRepository.findByUserId(user.getId()).orElse(null);
        if (profile == null) {
            profile = ManagementProfile.builder().user(user).build();
        }

        if (req.getFullName() != null) profile.setFullName(req.getFullName());
        if (req.getDesignation() != null) profile.setDesignation(req.getDesignation());
        if (req.getPhone() != null) profile.setPhone(req.getPhone());
        if (req.getEmail() != null) profile.setEmail(req.getEmail());
        managementProfileRepository.save(profile);

        log.info("Updated staff account: {}", user.getUsername());

        return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "Staff account '" + user.getUsername() + "' updated successfully"
        ));
    }

    /**
     * Delete/Deactivate staff account.
     */
    @DeleteMapping("/roles/staff-users/{id}")
    @PreAuthorize("hasRole('MANAGEMENT')")
    public ResponseEntity<Map<String, Object>> deleteStaffUser(@PathVariable Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Staff user not found with ID: " + id));

        if ("admin".equalsIgnoreCase(user.getUsername())) {
            return ResponseEntity.badRequest().body(Map.of("message", "Cannot delete the primary root admin account"));
        }

        managementProfileRepository.deleteByUserId(user.getId());
        userRepository.delete(user);

        log.info("Deleted staff account: {}", user.getUsername());
        return ResponseEntity.ok(Map.of("success", true, "message", "Staff account deleted successfully"));
    }

    /**
     * Catalog of all system modules and role templates.
     */
    @GetMapping("/roles/modules")
    @PreAuthorize("hasRole('MANAGEMENT')")
    public ResponseEntity<Map<String, Object>> getModulesCatalog() {
        List<Map<String, String>> modules = List.of(
                Map.of("code", "DASHBOARD", "name", "Executive Dashboard", "category", "Directorate", "description", "Overall metrics, KPIs, and executive summaries"),
                Map.of("code", "AUDIT_LOGS", "name", "System Audit Trail", "category", "Directorate", "description", "Track security actions, user logins, and administrative logs"),
                Map.of("code", "STUDENTS", "name", "Student Directory", "category", "People & Classes", "description", "Student records, profiles, and enrollments"),
                Map.of("code", "TEACHERS", "name", "Faculty Roster & Allocation", "category", "People & Classes", "description", "Teacher profiles, credentials, and subject curriculum mapping"),
                Map.of("code", "CLASSES", "name", "Classes & Subjects", "category", "People & Classes", "description", "Grade structure, section management, and subject catalogs"),
                Map.of("code", "PROMOTIONS", "name", "Batch Promotions", "category", "People & Classes", "description", "Annual academic batch progression and class rollover"),
                Map.of("code", "ASSIGNMENTS", "name", "Assignments Desk", "category", "Academics", "description", "Homework assignments, coursework, and teacher tasks"),
                Map.of("code", "LIBRARY", "name", "Institutional E-Library", "category", "Academics", "description", "Digital book repository, catalog, and reading tracker"),
                Map.of("code", "ADMIT_CARDS", "name", "Exam Admit Cards", "category", "Academics", "description", "Generate and verify official student examination hall passes"),
                Map.of("code", "EVENTS", "name", "Master Calendar", "category", "Academics", "description", "Term dates, holidays, institutional fixtures, and schedules"),
                Map.of("code", "SUBSTITUTIONS", "name", "Daily Cover Manager", "category", "Governance", "description", "Faculty leave coverage, conflict checks, and substitutions"),
                Map.of("code", "LEAVES", "name", "Leave Authorizations", "category", "Governance", "description", "Approve staff and student leave requests"),
                Map.of("code", "PTM", "name", "PTM Conferences", "category", "Governance", "description", "Parent-Teacher meeting scheduling and appointment notes"),
                Map.of("code", "HEALTH", "name", "Health Dispensary", "category", "Governance", "description", "Student medical records, infirmary logs, and wellness alerts"),
                Map.of("code", "FEES", "name", "Fee Accounts Ledger", "category", "Bursar & Finance", "description", "Tuition structures, payments, invoices, and arrears"),
                Map.of("code", "PAYROLL", "name", "Faculty Payroll", "category", "Bursar & Finance", "description", "Teacher salary slips, allowances, and compensation history"),
                Map.of("code", "TRANSPORT", "name", "Fleet & Transport", "category", "Bursar & Finance", "description", "Bus routes, stops, vehicle tracking, and driver rosters"),
                Map.of("code", "INVENTORY", "name", "Campus Inventory", "category", "Bursar & Finance", "description", "School assets, laboratory equipment, and facilities stock"),
                Map.of("code", "CMS", "name", "Website CMS & News", "category", "Outreach", "description", "Public academy website content, banners, and bulletins"),
                Map.of("code", "GALLERY", "name", "Campus Photo Archive", "category", "Outreach", "description", "School photo galleries and media assets"),
                Map.of("code", "ALUMNI", "name", "Alumni Fellowship", "category", "Outreach", "description", "Graduate registry, notable alumni, and donor relations"),
                Map.of("code", "BACKUP", "name", "Database Backup & Recovery", "category", "Security", "description", "1-click full institutional snapshot and disaster recovery"),
                Map.of("code", "RBAC", "name", "Staff Roles & Permissions", "category", "Security", "description", "Granular staff role creation and module access control")
        );

        Map<String, List<String>> roleTemplates = Map.of(
                "SUPER_ADMIN", List.of("*"),
                "ACCOUNTANT", List.of("DASHBOARD", "FEES", "PAYROLL", "INVENTORY", "AUDIT_LOGS"),
                "LIBRARIAN", List.of("DASHBOARD", "LIBRARY", "INVENTORY", "EVENTS"),
                "ACADEMIC_DEAN", List.of("DASHBOARD", "TEACHERS", "CLASSES", "ASSIGNMENTS", "SUBSTITUTIONS", "LEAVES", "ADMIT_CARDS", "EVENTS", "PTM", "LIBRARY"),
                "REGISTRAR", List.of("DASHBOARD", "STUDENTS", "PROMOTIONS", "CLASSES", "ADMIT_CARDS", "EVENTS", "ALUMNI"),
                "TRANSPORT_MANAGER", List.of("DASHBOARD", "TRANSPORT", "INVENTORY", "EVENTS"),
                "HEALTH_OFFICER", List.of("DASHBOARD", "HEALTH", "STUDENTS", "LEAVES"),
                "MEDIA_OFFICER", List.of("DASHBOARD", "CMS", "GALLERY", "ALUMNI", "EVENTS")
        );

        return ResponseEntity.ok(Map.of(
                "modules", modules,
                "roleTemplates", roleTemplates
        ));
    }

    @Data
    public static class CreateStaffUserRequest {
        private String username;
        private String password;
        private String fullName;
        private String designation;
        private String phone;
        private String email;
        private String staffRole;
        private List<String> permissions;
    }

    @Data
    public static class UpdateStaffUserRequest {
        private String password;
        private String fullName;
        private String designation;
        private String phone;
        private String email;
        private String staffRole;
        private List<String> permissions;
        private Boolean isActive;
    }
}
