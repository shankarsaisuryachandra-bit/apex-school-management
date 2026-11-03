package com.sms.controller;

import com.sms.model.ChatMessage;
import com.sms.model.User;
import com.sms.repository.ChatMessageRepository;
import com.sms.repository.UserRepository;
import jakarta.annotation.PostConstruct;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.*;

@Slf4j
@RestController
@RequestMapping("/api/chat")
@RequiredArgsConstructor
public class ChatController {

    private final ChatMessageRepository chatMessageRepository;
    private final UserRepository userRepository;

    @PostConstruct
    public void seedInitialMessages() {
        if (chatMessageRepository.count() == 0) {
            log.info("Seeding realistic academic and parent-teacher chat channels...");

            List<ChatMessage> sampleMessages = List.of(
                // Channel 1: Class 6-A General Announcements
                ChatMessage.builder()
                    .channelId("CLASS_6A")
                    .channelType("CLASS_CHANNEL")
                    .channelName("Class 6-A Academic Forum")
                    .senderId(101L)
                    .senderUsername("teacher_sunita")
                    .senderName("Ms. Sunita Rao (Class Teacher)")
                    .senderRole("TEACHER")
                    .content("Good morning class! Don't forget that the Ancient Indus Valley Civilization research report and dioramas are due today. Please ensure your solution PDFs are submitted on the portal.")
                    .isRead(true)
                    .createdAt(LocalDateTime.now().minusHours(4))
                    .build(),
                ChatMessage.builder()
                    .channelId("CLASS_6A")
                    .channelType("CLASS_CHANNEL")
                    .channelName("Class 6-A Academic Forum")
                    .senderId(201L)
                    .senderUsername("student_raghav")
                    .senderName("Raghav Prasad (Roll 1)")
                    .senderRole("STUDENT")
                    .content("Good morning Ma'am! I have uploaded my complete solution dossier covering Harappan drainage systems, granaries, and terracotta seals. The PDF is attached.")
                    .attachmentUrl("/uploads/solutions/indus_valley_civilization_report_solution.pdf")
                    .attachmentName("Indus_Valley_Solution_Dossier.pdf")
                    .isRead(true)
                    .createdAt(LocalDateTime.now().minusHours(3).plusMinutes(15))
                    .build(),
                ChatMessage.builder()
                    .channelId("CLASS_6A")
                    .channelType("CLASS_CHANNEL")
                    .channelName("Class 6-A Academic Forum")
                    .senderId(101L)
                    .senderUsername("teacher_sunita")
                    .senderName("Ms. Sunita Rao (Class Teacher)")
                    .senderRole("TEACHER")
                    .content("Excellent work, Raghav! I have reviewed your submission in the Gradebook. The archaeological data table is exceptionally well prepared.")
                    .isRead(true)
                    .createdAt(LocalDateTime.now().minusHours(2))
                    .build(),

                // Channel 2: Institutional Faculty Staff Room
                ChatMessage.builder()
                    .channelId("STAFF_ROOM")
                    .channelType("STAFF_ROOM")
                    .channelName("Institutional Faculty Directorate")
                    .senderId(1L)
                    .senderUsername("admin")
                    .senderName("Dr. Alistair Sterling (Principal)")
                    .senderRole("MANAGEMENT")
                    .content("Good morning esteemed colleagues. Mid-Term Academic Progress audits commence next week. Please verify that all class gradebooks, attendance rosters, and substitution logs are finalized.")
                    .isRead(true)
                    .createdAt(LocalDateTime.now().minusHours(6))
                    .build(),
                ChatMessage.builder()
                    .channelId("STAFF_ROOM")
                    .channelType("STAFF_ROOM")
                    .channelName("Institutional Faculty Directorate")
                    .senderId(102L)
                    .senderUsername("teacher_arvind")
                    .senderName("Mr. Arvind Sharma (Senior Math)")
                    .senderRole("TEACHER")
                    .content("Good morning Principal Sterling. Grade 10 and 12 mathematics marks and analytical rubrics have been 100% recorded in the system.")
                    .isRead(true)
                    .createdAt(LocalDateTime.now().minusHours(5))
                    .build(),

                // Channel 3: Parent Consultation - Raghav Prasad
                ChatMessage.builder()
                    .channelId("PARENT_RAGHAV")
                    .channelType("DIRECT")
                    .channelName("Raghav Prasad • Parent Consultation")
                    .senderId(301L)
                    .senderUsername("parent_rakesh")
                    .senderName("Mr. Rakesh Prasad (Parent of Raghav)")
                    .senderRole("PARENT")
                    .content("Good evening Ms. Rao, I wanted to thank you for guiding Raghav on his Indus Valley project. He was truly fascinated by the Harappan urban planning lessons.")
                    .isRead(true)
                    .createdAt(LocalDateTime.now().minusHours(12))
                    .build(),
                ChatMessage.builder()
                    .channelId("PARENT_RAGHAV")
                    .channelType("DIRECT")
                    .channelName("Raghav Prasad • Parent Consultation")
                    .senderId(101L)
                    .senderUsername("teacher_sunita")
                    .senderName("Ms. Sunita Rao (Class Teacher)")
                    .senderRole("TEACHER")
                    .content("Good evening Mr. Prasad! It is an absolute pleasure having Raghav in class. His diligence, attendance, and project execution have been exemplary. His report received top marks.")
                    .isRead(true)
                    .createdAt(LocalDateTime.now().minusHours(10))
                    .build(),

                // Channel 4: STEM Doubt Clearing - Mr. Sharma & Atharv
                ChatMessage.builder()
                    .channelId("DOUBT_MATH_ATHARV")
                    .channelType("DIRECT")
                    .channelName("Math Academic Guidance • Atharv Pillai")
                    .senderId(202L)
                    .senderUsername("student_atharv")
                    .senderName("Atharv Pillai (Class 2-A)")
                    .senderRole("STUDENT")
                    .content("Sir, could you please explain how number bonds help in two-digit subtraction?")
                    .isRead(true)
                    .createdAt(LocalDateTime.now().minusHours(8))
                    .build(),
                ChatMessage.builder()
                    .channelId("DOUBT_MATH_ATHARV")
                    .channelType("DIRECT")
                    .channelName("Math Academic Guidance • Atharv Pillai")
                    .senderId(102L)
                    .senderUsername("teacher_arvind")
                    .senderName("Mr. Arvind Sharma (Math Faculty)")
                    .senderRole("TEACHER")
                    .content("Great question Atharv! Number bonds break down larger numbers into friendly parts, like making tens (e.g., 52 - 8 = 52 - 2 - 6 = 50 - 6 = 44). Check page 14 of your math workbook for extra practice!")
                    .isRead(true)
                    .createdAt(LocalDateTime.now().minusHours(7))
                    .build()
            );

            chatMessageRepository.saveAll(sampleMessages);
            log.info("Initialized {} chat messages across 4 active channels.", sampleMessages.size());
        }
    }

    @GetMapping("/channels")
    public ResponseEntity<List<Map<String, Object>>> getChannels(@AuthenticationPrincipal User user) {
        String role = user != null ? user.getRole().name() : "STUDENT";

        // Define channel catalog
        List<Map<String, Object>> catalog = new ArrayList<>();

        catalog.add(Map.of(
            "channelId", "CLASS_6A",
            "channelName", "Class 6-A Academic Forum",
            "channelType", "CLASS_CHANNEL",
            "description", "Official announcements & homework discussion for Grade 6 Section A",
            "badge", "Class 6-A",
            "avatar", "🏛️"
        ));

        if ("MANAGEMENT".equals(role) || "TEACHER".equals(role)) {
            catalog.add(Map.of(
                "channelId", "STAFF_ROOM",
                "channelName", "Institutional Faculty Directorate",
                "channelType", "STAFF_ROOM",
                "description", "Senior leadership & teaching staff collaborative lounge",
                "badge", "Faculty Only",
                "avatar", "🎓"
            ));
        }

        catalog.add(Map.of(
            "channelId", "PARENT_RAGHAV",
            "channelName", "Raghav Prasad • Parent Consultation",
            "channelType", "DIRECT",
            "description", "Direct communication channel between Guardian and Class Teacher",
            "badge", "Parent-Teacher",
            "avatar", "👨‍👦"
        ));

        catalog.add(Map.of(
            "channelId", "DOUBT_MATH_ATHARV",
            "channelName", "Math Academic Guidance • Atharv Pillai",
            "channelType", "DIRECT",
            "description", "Curriculum questions, homework tips & conceptual doubts",
            "badge", "Academic Doubts",
            "avatar", "📐"
        ));

        List<Map<String, Object>> result = new ArrayList<>();
        for (Map<String, Object> ch : catalog) {
            String chId = (String) ch.get("channelId");
            List<ChatMessage> msgs = chatMessageRepository.findByChannelIdOrderByCreatedAtAsc(chId);
            ChatMessage lastMsg = msgs.isEmpty() ? null : msgs.get(msgs.size() - 1);
            long unread = chatMessageRepository.countByChannelIdAndIsReadFalse(chId);

            Map<String, Object> item = new HashMap<>(ch);
            item.put("messageCount", msgs.size());
            item.put("unreadCount", unread);
            item.put("lastMessage", lastMsg != null ? lastMsg.getContent() : "No messages yet");
            item.put("lastSender", lastMsg != null ? lastMsg.getSenderName() : "");
            item.put("lastTimestamp", lastMsg != null && lastMsg.getCreatedAt() != null ? lastMsg.getCreatedAt().toString() : "");
            result.add(item);
        }

        return ResponseEntity.ok(result);
    }

    @GetMapping("/messages")
    public ResponseEntity<List<ChatMessage>> getMessages(@RequestParam(defaultValue = "CLASS_6A") String channelId) {
        List<ChatMessage> messages = chatMessageRepository.findByChannelIdOrderByCreatedAtAsc(channelId);
        return ResponseEntity.ok(messages);
    }

    @PostMapping("/send")
    public ResponseEntity<ChatMessage> sendMessage(
            @RequestBody SendMessageRequest req,
            @AuthenticationPrincipal User authUser) {

        String username = authUser != null ? authUser.getUsername() : "guest_user";
        String role = authUser != null ? authUser.getRole().name() : "STUDENT";
        Long userId = authUser != null ? authUser.getId() : 999L;

        String senderDisplayName = username;
        if ("admin".equalsIgnoreCase(username)) senderDisplayName = "Dr. Alistair Sterling (Principal)";
        else if (username.contains("teacher")) senderDisplayName = "Faculty Member (" + username + ")";
        else if (username.contains("parent")) senderDisplayName = "Parent / Guardian (" + username + ")";
        else if (username.contains("student")) senderDisplayName = "Student (" + username + ")";

        ChatMessage msg = ChatMessage.builder()
                .channelId(req.getChannelId())
                .channelType(req.getChannelType() != null ? req.getChannelType() : "CLASS_CHANNEL")
                .channelName(req.getChannelName() != null ? req.getChannelName() : "Apex Channel")
                .senderId(userId)
                .senderUsername(username)
                .senderName(senderDisplayName)
                .senderRole(role)
                .content(req.getContent())
                .attachmentUrl(req.getAttachmentUrl())
                .attachmentName(req.getAttachmentName())
                .isRead(true)
                .createdAt(LocalDateTime.now())
                .build();

        ChatMessage saved = chatMessageRepository.save(msg);

        // Smart simulated teacher acknowledgment for interactive delight
        if (("STUDENT".equals(role) || "PARENT".equals(role)) && req.getContent().length() > 5) {
            triggerAutomatedTeacherAck(req.getChannelId(), req.getChannelName(), req.getContent(), senderDisplayName);
        }

        return ResponseEntity.ok(saved);
    }

    @PutMapping("/read")
    public ResponseEntity<Map<String, Object>> markAsRead(@RequestParam String channelId) {
        List<ChatMessage> msgs = chatMessageRepository.findByChannelIdOrderByCreatedAtAsc(channelId);
        for (ChatMessage m : msgs) {
            if (!Boolean.TRUE.equals(m.getIsRead())) {
                m.setIsRead(true);
            }
        }
        chatMessageRepository.saveAll(msgs);
        return ResponseEntity.ok(Map.of("status", "SUCCESS", "channelId", channelId));
    }

    private void triggerAutomatedTeacherAck(String channelId, String channelName, String userContent, String senderName) {
        new Thread(() -> {
            try {
                Thread.sleep(1200); // 1.2s realistic typing pause
                String reply = "Thank you " + senderName + "! Your message has been received. I will review this thoroughly and coordinate with you during consultation hours.";
                if (userContent.toLowerCase().contains("homework") || userContent.toLowerCase().contains("assignment")) {
                    reply = "Thank you for the update on the assignment. I will review the submitted solution dossier and record marks in the official Gradebook.";
                } else if (userContent.toLowerCase().contains("leave") || userContent.toLowerCase().contains("absence")) {
                    reply = "Acknowledged. The leave note has been noted in the daily attendance register. Wishing a speedy recovery!";
                }

                ChatMessage ack = ChatMessage.builder()
                        .channelId(channelId)
                        .channelType("DIRECT")
                        .channelName(channelName != null ? channelName : "Channel")
                        .senderId(101L)
                        .senderUsername("teacher_desk")
                        .senderName("Ms. Sunita Rao (Faculty Liaison)")
                        .senderRole("TEACHER")
                        .content(reply)
                        .isRead(false)
                        .createdAt(LocalDateTime.now())
                        .build();

                chatMessageRepository.save(ack);
            } catch (Exception ignored) {}
        }).start();
    }

    @Data
    public static class SendMessageRequest {
        private String channelId;
        private String channelType;
        private String channelName;
        private String content;
        private String attachmentUrl;
        private String attachmentName;
    }
}
