# ===================================================
# Stage 1: Build React Frontend
# ===================================================
FROM node:20-alpine AS frontend-builder
WORKDIR /app/frontend

COPY frontend/package*.json ./
RUN npm install

COPY frontend/ ./
RUN npm run build

# ===================================================
# Stage 2: Build Spring Boot Backend with embedded UI
# ===================================================
FROM maven:3.9.6-eclipse-temurin-17-alpine AS backend-builder
WORKDIR /app/backend

# Pre-cache dependencies
COPY backend/pom.xml ./
RUN mvn dependency:go-offline -B || true

# Copy source code
COPY backend/src ./src

# Embed compiled React frontend into Spring Boot static resources
COPY --from=frontend-builder /app/frontend/dist ./src/main/resources/static

# Build production JAR (excluding any local scratch or extracted JDK folders)
RUN mvn clean package -DskipTests

# ===================================================
# Stage 3: Minimal Production Runtime
# ===================================================
FROM eclipse-temurin:17-jre-alpine
WORKDIR /app

# Create directory for persistent embedded H2 database & file uploads
RUN mkdir -p /app/data /app/uploads

# Pre-populate production uploads directory with initial media assets & campus imagery
COPY backend/uploads /app/uploads

# Copy executable jar from builder stage
COPY --from=backend-builder /app/backend/target/school-management-system-*.jar app.jar

# Environment defaults (overridable by cloud hosting platforms)
ENV PORT=8080
ENV SPRING_PROFILES_ACTIVE=prod

EXPOSE 8080

CMD ["sh", "-c", "java -XX:+UseG1GC -Xmx512m -jar app.jar --server.port=${PORT}"]

