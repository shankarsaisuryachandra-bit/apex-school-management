package com.sms.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
public class RootController {

    @GetMapping("/")
    public ResponseEntity<Map<String, String>> rootStatus() {
        return ResponseEntity.ok(Map.of(
                "status", "UP",
                "application", "School Management System Backend API",
                "version", "1.0.0",
                "frontendUrl", "http://localhost:5173"
        ));
    }
}
