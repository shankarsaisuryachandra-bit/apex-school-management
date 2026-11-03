package com.sms.service.communication;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

/**
 * Mock SMS Service — logs formatted SMS to server console.
 * Demonstrates the SMS architecture without requiring a paid API (Twilio, etc.).
 * Replace this with a real implementation when budget allows.
 */
@Service
@Slf4j
public class MockSmsServiceImpl implements SmsService {

    @Override
    public boolean sendSms(String phoneNumber, String message) {
        log.info("═══════════════════════════════════════════════");
        log.info("  MOCK SMS SERVICE — Message Sent");
        log.info("  To: {}", phoneNumber);
        log.info("  Message: {}", message);
        log.info("  Status: DELIVERED (mock)");
        log.info("  Timestamp: {}", java.time.LocalDateTime.now());
        log.info("═══════════════════════════════════════════════");
        return true;
    }
}
