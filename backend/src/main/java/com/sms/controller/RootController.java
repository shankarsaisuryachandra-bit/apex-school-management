package com.sms.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api")
public class RootController {

    @GetMapping("/status")
    public ResponseEntity<Map<String, String>> apiStatus() {
        return ResponseEntity.ok(Map.of(
                "status", "UP",
                "application", "School Management System Backend API",
                "version", "1.0.0"
        ));
    }
}

