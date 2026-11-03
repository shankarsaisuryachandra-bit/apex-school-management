package com.sms.repository;

import com.sms.model.ChatMessage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ChatMessageRepository extends JpaRepository<ChatMessage, Long> {
    List<ChatMessage> findByChannelIdOrderByCreatedAtAsc(String channelId);
    long countByChannelIdAndIsReadFalse(String channelId);
    List<ChatMessage> findTop50ByOrderByCreatedAtDesc();
}
