package com.sms.controller;

import com.sms.model.AppNotification;
import com.sms.model.User;
import com.sms.repository.AppNotificationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final AppNotificationRepository notificationRepository;

    @GetMapping
    public ResponseEntity<List<AppNotification>> getNotifications(@AuthenticationPrincipal User user) {
        if (user == null) {
            return ResponseEntity.ok(List.of());
        }
        return ResponseEntity.ok(notificationRepository.findForUser(user.getId(), user.getRole()));
    }

    @GetMapping("/unread-count")
    public ResponseEntity<Map<String, Object>> getUnreadCount(@AuthenticationPrincipal User user) {
        if (user == null) {
            return ResponseEntity.ok(Map.of("unreadCount", 0));
        }
        long count = notificationRepository.countUnreadForUser(user.getId(), user.getRole());
        return ResponseEntity.ok(Map.of("unreadCount", count));
    }

    @PutMapping("/{id}/read")
    public ResponseEntity<Map<String, Object>> markAsRead(@PathVariable Long id) {
        return notificationRepository.findById(id).map(notif -> {
            notif.setIsRead(true);
            notificationRepository.save(notif);
            return ResponseEntity.ok(Map.<String, Object>of("success", true, "id", id));
        }).orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/read-all")
    public ResponseEntity<Map<String, Object>> markAllAsRead(@AuthenticationPrincipal User user) {
        if (user == null) {
            return ResponseEntity.ok(Map.of("updated", 0));
        }
        int updated = notificationRepository.markAllReadForUser(user.getId(), user.getRole());
        return ResponseEntity.ok(Map.of("success", true, "updated", updated));
    }

    @PostMapping
    public ResponseEntity<AppNotification> createNotification(
            @RequestBody AppNotification notification,
            @AuthenticationPrincipal User user) {
        if (notification.getSeverity() == null || notification.getSeverity().isBlank()) {
            notification.setSeverity("INFO");
        }
        if (notification.getType() == null || notification.getType().isBlank()) {
            notification.setType("GENERAL");
        }
        notification.setIsRead(false);
        return ResponseEntity.ok(notificationRepository.save(notification));
    }

    @PostMapping("/simulate-alert")
    public ResponseEntity<AppNotification> simulateAlert(
            @RequestParam(required = false) String category,
            @AuthenticationPrincipal User user) {
        if (user == null) {
            return ResponseEntity.badRequest().build();
        }

        String cat = (category != null && !category.isBlank()) ? category.toUpperCase() : "GENERAL";
        AppNotification.AppNotificationBuilder builder = AppNotification.builder()
                .user(user)
                .isRead(false);

        switch (cat) {
            case "TRANSPORT":
                builder.title("🚌 Fleet Tracking: Bus #12 Geofence Alert")
                       .message("School Bus #12 is 2 stops away (approx. 6 minutes). Prepare for student boarding.")
                       .type("TRANSPORT")
                       .severity("INFO")
                       .link(user.getRole() == User.Role.PARENT ? "/parent/attendance" : "/student/attendance");
                break;
            case "ACADEMIC":
                builder.title("📚 Academic Milestone: Assessment Published")
                       .message("Mid-Term Mathematics & Analytical Science scorecards have been uploaded to the registry.")
                       .type("ACADEMIC")
                       .severity("SUCCESS")
                       .link(user.getRole() == User.Role.PARENT ? "/parent/academics" : (user.getRole() == User.Role.TEACHER ? "/teacher/gradebook" : "/student/academics"));
                break;
            case "FEE":
                builder.title("💳 Bursar Notice: Term II Fee Cleared")
                       .message("Receipt #REC-2026-9042 for $20,000 has been verified. Official tax invoice ready to download.")
                       .type("FEE")
                       .severity("SUCCESS")
                       .link(user.getRole() == User.Role.PARENT ? "/parent/fees" : "/student/fees");
                break;
            case "PTM":
                builder.title("🤝 Parent-Teacher Conference Update")
                       .message("Conference slot confirmed with Faculty Advisor for Friday at 3:30 PM.")
                       .type("PTM")
                       .severity("INFO")
                       .link(user.getRole() == User.Role.PARENT ? "/parent/ptm" : (user.getRole() == User.Role.TEACHER ? "/teacher/ptm" : "/student/ptm"));
                break;
            default:
                builder.title("🔔 Institutional Directive")
                       .message("Annual Founder's Day rehearsal scheduled tomorrow at 09:00 AM in the Grand Quadrangle.")
                       .type("GENERAL")
                       .severity("INFO")
                       .link("/");
                break;
        }

        return ResponseEntity.ok(notificationRepository.save(builder.build()));
    }
}
