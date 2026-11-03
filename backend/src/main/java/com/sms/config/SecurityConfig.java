package com.sms.config;

import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.Arrays;
import java.util.List;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtAuthFilter jwtAuthFilter;

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
            .cors(cors -> cors.configurationSource(corsConfigurationSource()))
            .csrf(csrf -> csrf.disable())
            .headers(headers -> headers
                .frameOptions(frame -> frame.disable())
                .cacheControl(cache -> cache.disable())
            )
            .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .authorizeHttpRequests(auth -> auth
                // Static assets & SPA frontend routes for production deployment
                .requestMatchers("/", "/index.html", "/favicon.ico", "/assets/**", "/*.js", "/*.css", "/*.svg", "/*.png", "/*.ico", "/*.json").permitAll()
                .requestMatchers(HttpMethod.GET, "/login", "/academics/**", "/student/**", "/teacher/**", "/management/**", "/parent/**", "/calendar", "/careers", "/admissions", "/library/**").permitAll()

                // Public backend endpoints
                .requestMatchers("/h2-console/**").permitAll()
                .requestMatchers("/api/auth/**", "/api/status").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/cms/**").permitAll()
                .requestMatchers("/api/admissions/apply").permitAll()
                .requestMatchers("/api/alumni/public").permitAll()
                .requestMatchers("/uploads/**").permitAll()

                // Management-only endpoints
                .requestMatchers("/api/admin/**").hasRole("MANAGEMENT")
                .requestMatchers("/api/fees/dashboard/**").hasRole("MANAGEMENT")
                .requestMatchers("/api/fees/export/**").hasRole("MANAGEMENT")
                .requestMatchers("/api/fees/components/**").hasRole("MANAGEMENT")
                .requestMatchers("/api/promotions/**").hasRole("MANAGEMENT")
                .requestMatchers("/api/alumni/**").hasRole("MANAGEMENT")
                .requestMatchers("/api/admissions/applications/**").hasRole("MANAGEMENT")

                // Parent Portal endpoints
                .requestMatchers("/api/parent/**").hasAnyRole("PARENT", "MANAGEMENT")

                // Notifications
                .requestMatchers("/api/notifications/**").authenticated()

                // Teacher + Management + Student + Parent endpoints
                .requestMatchers("/api/fees/payment/**").hasAnyRole("MANAGEMENT", "STUDENT", "PARENT")
                .requestMatchers("/api/fees/my-fees").hasAnyRole("STUDENT", "PARENT")
                .requestMatchers("/api/attendance/mark/**").hasAnyRole("TEACHER", "MANAGEMENT")
                .requestMatchers("/api/academics/assessments/**").hasAnyRole("TEACHER", "MANAGEMENT")
                .requestMatchers("/api/academics/grades/**").hasAnyRole("TEACHER", "MANAGEMENT", "STUDENT", "PARENT")
                .requestMatchers("/api/ptm/**").hasAnyRole("TEACHER", "MANAGEMENT", "STUDENT", "PARENT")
                .requestMatchers("/api/ai/**").hasAnyRole("TEACHER", "MANAGEMENT", "STUDENT")
                .requestMatchers("/api/leaderboard/**").hasAnyRole("TEACHER", "MANAGEMENT", "STUDENT", "PARENT")
                .requestMatchers("/api/library/e-books/**").hasAnyRole("TEACHER", "MANAGEMENT", "STUDENT")
                .requestMatchers("/api/dashboard/alerts").hasAnyRole("TEACHER", "MANAGEMENT", "STUDENT", "PARENT")
                .requestMatchers("/api/hostel/**").hasAnyRole("TEACHER", "MANAGEMENT", "STUDENT")
                .requestMatchers("/api/substitutions/**").hasAnyRole("TEACHER", "MANAGEMENT", "STUDENT")
                .requestMatchers("/api/certificates/**").hasAnyRole("TEACHER", "MANAGEMENT", "STUDENT", "PARENT")
                .requestMatchers("/api/chat/**").hasAnyRole("MANAGEMENT", "TEACHER", "STUDENT", "PARENT", "BUS_OPERATOR")
                .requestMatchers("/api/assignments/**").hasAnyRole("TEACHER", "MANAGEMENT", "STUDENT", "PARENT")
                .requestMatchers("/api/timetable/**").hasAnyRole("MANAGEMENT", "TEACHER", "STUDENT", "PARENT")
                .requestMatchers(HttpMethod.GET, "/api/announcements/**").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/careers/**").permitAll()
                .requestMatchers(HttpMethod.POST, "/api/careers/apply").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/news/**").permitAll()
                .requestMatchers(HttpMethod.POST, "/api/faq/**").permitAll()
                .requestMatchers("/api/transport/hardware-gps-stream").permitAll()
                .requestMatchers("/api/transport/**").hasAnyRole("MANAGEMENT", "ADMIN", "TEACHER", "STUDENT", "BUS_OPERATOR", "PARENT")

                // Any authenticated user
                .anyRequest().authenticated()
            )
            .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        configuration.setAllowedOriginPatterns(List.of("*"));
        configuration.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "DELETE", "OPTIONS"));
        configuration.setAllowedHeaders(List.of("*"));
        configuration.setAllowCredentials(true);
        return new UrlBasedCorsConfigurationSource() {{
            registerCorsConfiguration("/**", configuration);
        }};
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration config) throws Exception {
        return config.getAuthenticationManager();
    }
}
