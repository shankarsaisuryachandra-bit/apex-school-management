package com.sms.config;

import jakarta.servlet.*;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

import java.io.IOException;

@Component
@Order(Ordered.HIGHEST_PRECEDENCE)
public class StaticResourceHeaderFilter implements Filter {

    @Override
    public void doFilter(ServletRequest request, ServletResponse response, FilterChain chain)
            throws IOException, ServletException {
        HttpServletRequest req = (HttpServletRequest) request;
        HttpServletResponse res = (HttpServletResponse) response;

        String path = req.getRequestURI();
        if (path != null && path.startsWith("/uploads/")) {
            res.setHeader("Access-Control-Allow-Origin", "*");
            res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS, HEAD");
            res.setHeader("Access-Control-Allow-Headers", "*");
            res.setHeader("Cache-Control", "public, max-age=86400");
            res.setHeader("Pragma", "cache");
            res.setHeader("Expires", "86400");
            if (path.toLowerCase().endsWith(".pdf")) {
                res.setContentType("application/pdf");
                String filename = path.substring(path.lastIndexOf('/') + 1);
                res.setHeader("Content-Disposition", "inline; filename=\"" + filename + "\"");
            }
        }

        chain.doFilter(request, response);
    }
}
