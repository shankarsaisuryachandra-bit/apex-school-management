package com.sms.service.communication;

/**
 * SMS Service interface.
 * Implemented as MockSmsServiceImpl (logs to console) per zero-cost constraint.
 */
public interface SmsService {

    /**
     * Send an SMS to the given phone number.
     * @param phoneNumber recipient phone number
     * @param message SMS text content
     * @return true if sent successfully
     */
    boolean sendSms(String phoneNumber, String message);
}
