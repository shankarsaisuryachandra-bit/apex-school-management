package com.sms.controller;

import com.sms.model.Notice;
import com.sms.model.User;
import com.sms.repository.NoticeRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/notices")
@RequiredArgsConstructor
public class NoticeController {

    private final NoticeRepository noticeRepository;

    /**
     * Get notices for current user's role.
     */
    @GetMapping
    public ResponseEntity<List<Notice>> getNotices(@AuthenticationPrincipal User user) {
        if (user == null) {
            return ResponseEntity.ok(noticeRepository.findByAudienceInOrderByCreatedAtDesc(
                    List.of(Notice.Audience.ALL)));
        }

        Notice.Audience roleAudience = switch (user.getRole()) {
            case MANAGEMENT -> Notice.Audience.MANAGEMENT;
            case TEACHER -> Notice.Audience.TEACHERS;
            case STUDENT -> Notice.Audience.STUDENTS;
            case PARENT -> Notice.Audience.PARENTS;
            default -> Notice.Audience.ALL;
        };

        return ResponseEntity.ok(noticeRepository.findByAudienceInOrderByCreatedAtDesc(
                List.of(Notice.Audience.ALL, roleAudience)));
    }

    /**
     * Create notice (Admin/Teacher only).
     */
    @PostMapping
    @PreAuthorize("hasAnyRole('MANAGEMENT', 'TEACHER')")
    public ResponseEntity<Notice> createNotice(
            @RequestBody Notice notice,
            @AuthenticationPrincipal User user) {
        notice.setPostedBy(user);
        return ResponseEntity.ok(noticeRepository.save(notice));
    }

    /**
     * Delete notice.
     */
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('MANAGEMENT')")
    public ResponseEntity<Map<String, String>> deleteNotice(@PathVariable Long id) {
        noticeRepository.deleteById(id);
        return ResponseEntity.ok(Map.of("message", "Notice deleted successfully"));
    }
}
