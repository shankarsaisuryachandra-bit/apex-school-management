package com.sms.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.core.io.ClassPathResource;
import org.springframework.core.io.Resource;
import org.springframework.http.CacheControl;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;
import org.springframework.web.servlet.resource.PathResourceResolver;

import java.io.IOException;
import java.util.concurrent.TimeUnit;

/**
 * Single Page Application (SPA) Resource Resolver.
 * Enables Spring Boot to serve built React static assets directly from classpath:/static/
 * and fallback to index.html ONLY for client-side SPA routes (e.g., /student/academics, /login).
 * Static assets (.js, .css, images) are served directly and never misrouted to index.html.
 */
@Configuration
public class SpaWebConfig implements WebMvcConfigurer {

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        // 1. Explicitly map /assets/** to classpath:/static/assets/ with long-term caching
        registry.addResourceHandler("/assets/**")
                .addResourceLocations("classpath:/static/assets/")
                .setCacheControl(CacheControl.maxAge(365, TimeUnit.DAYS).cachePublic());

        // 2. Map all root static paths with SPA fallback for client-side routing
        registry.addResourceHandler("/**")
                .addResourceLocations("classpath:/static/")
                .resourceChain(true)
                .addResolver(new PathResourceResolver() {
                    @Override
                    protected Resource getResource(String resourcePath, Resource location) throws IOException {
                        // Do not intercept REST API requests, H2 console, or uploads
                        if (resourcePath.startsWith("api") || resourcePath.startsWith("h2-console") || resourcePath.startsWith("uploads")) {
                            return null;
                        }

                        // Try resolving the static file directly
                        Resource requestedResource = location.createRelative(resourcePath);
                        if (requestedResource.exists() && requestedResource.isReadable()) {
                            return requestedResource;
                        }

                        // If the requested path is an asset file (has an extension), do NOT return index.html
                        if (resourcePath.contains(".")) {
                            return null;
                        }

                        // For extensionless client-side routes (e.g. /login, /student/academics), serve index.html
                        Resource indexResource = new ClassPathResource("/static/index.html");
                        return (indexResource.exists() && indexResource.isReadable()) ? indexResource : null;
                    }
                });
    }
}


