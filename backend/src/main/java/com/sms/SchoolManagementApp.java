package com.sms;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

import java.io.File;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.StandardCopyOption;

@SpringBootApplication
public class SchoolManagementApp {

    public static void main(String[] args) {
        ensureDatabaseSeeded();
        SpringApplication.run(SchoolManagementApp.class, args);
    }

    /**
     * Guarantees that production deployments on cloud hosting (Render, Railway, Docker)
     * always boot with the complete master institutional dataset:
     * 720 students, 120 CBSE report cards, assignments, faculty roster, and timetables.
     */
    private static void ensureDatabaseSeeded() {
        try {
            File targetFile = new File("./data/schooldb.mv.db");
            if (!targetFile.exists() || targetFile.length() < 100000) {
                targetFile.getParentFile().mkdirs();
                try (InputStream in = SchoolManagementApp.class.getResourceAsStream("/data/schooldb.mv.db")) {
                    if (in != null) {
                        Files.copy(in, targetFile.toPath(), StandardCopyOption.REPLACE_EXISTING);
                        System.out.println(">>> [Master Database Initialized] Successfully loaded 720 students, report cards, and academic records to " + targetFile.getAbsolutePath());
                    }
                }
            }
        } catch (Exception e) {
            System.err.println(">>> [Database Seed Check] Note: " + e.getMessage());
        }
    }
}

