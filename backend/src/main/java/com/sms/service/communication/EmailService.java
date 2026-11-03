package com.sms.service.communication;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

/**
 * Email Service using free Gmail SMTP.
 * Sends absence alerts and fee reminders as the primary automated notification channel.
 *
 * Configuration required in application.yml:
 * - Gmail address
 * - Gmail App Password (not regular password — enable 2FA and generate app password)
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class EmailService {

    private final JavaMailSender mailSender;

    @Async
    public void sendAbsenceAlert(String parentEmail, String studentName, String date) {
        String subject = "Absence Alert — " + studentName;
        String body = String.format(
                "Dear Parent,%n%n" +
                "This is to inform you that %s was marked ABSENT on %s.%n%n" +
                "If this is unexpected, please contact the school office.%n%n" +
                "Regards,%nSchool Management System", studentName, date);

        sendEmail(parentEmail, subject, body);
    }

    @Async
    public void sendFeeReminder(String parentEmail, String studentName,
                                 String prevDue, String currentDue, String total) {
        String subject = "Fee Reminder — " + studentName;
        String body = String.format(
                "Dear Parent,%n%n" +
                "Fee reminder for %s:%n" +
                "Previous Year Dues: ₹%s%n" +
                "Current Year Fee: ₹%s%n" +
                "Total Pending: ₹%s%n%n" +
                "Please clear the dues at the earliest.%n%n" +
                "Regards,%nSchool Management System",
                studentName, prevDue, currentDue, total);

        sendEmail(parentEmail, subject, body);
    }

    public void sendEmail(String to, String subject, String body) {
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setTo(to);
            message.setSubject(subject);
            message.setText(body);
            mailSender.send(message);
            log.info("Email sent successfully to: {}", to);
        } catch (Exception e) {
            log.error("Failed to send email to {}: {}", to, e.getMessage());
        }
    }
}
