package com.sms.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.core.io.ClassPathResource;
import org.springframework.core.io.Resource;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;
import org.springframework.web.servlet.resource.PathResourceResolver;

import java.io.IOException;

/**
 * Single Page Application (SPA) Resource Resolver.
 * Enables Spring Boot to serve built React static assets directly from classpath:/static/
 * and fallback to index.html for all client-side routes (e.g., /student/academics, /login).
 */
@Configuration
public class SpaWebConfig implements WebMvcConfigurer {

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        registry.addResourceHandler("/**")
                .addResourceLocations("classpath:/static/")
                .resourceChain(true)
                .addResolver(new PathResourceResolver() {
                    @Override
                    protected Resource getResource(String resourcePath, Resource location) throws IOException {
                        // Do not intercept REST API requests or H2 console
                        if (resourcePath.startsWith("api/") || resourcePath.startsWith("api") || resourcePath.startsWith("h2-console")) {
                            return null;
                        }

                        Resource requestedResource = location.createRelative(resourcePath);
                        if (requestedResource.exists() && requestedResource.isReadable()) {
                            return requestedResource;
                        }

                        // Fallback to React index.html for client-side routing
                        Resource indexResource = new ClassPathResource("/static/index.html");
                        return (indexResource.exists() && indexResource.isReadable()) ? indexResource : null;
                    }
                });
    }
}

