# =============================================
# 1단계: Build Stage
# =============================================
FROM eclipse-temurin:21-jdk-alpine AS builder

WORKDIR /app

# Gradle Wrapper 및 빌드 설정 파일 먼저 복사 (레이어 캐싱 활용)
COPY gradlew .
COPY gradle gradle
COPY build.gradle .
COPY settings.gradle .

# Gradle Wrapper 실행 권한 부여
RUN chmod +x gradlew

# 의존성 먼저 다운로드 (소스 변경 시 의존성 재다운로드 방지)
RUN ./gradlew dependencies --no-daemon || true

# 소스 코드 복사
COPY src src

# 빌드 실행 (테스트 제외)
RUN ./gradlew bootJar -x test --no-daemon

# =============================================
# 2단계: Run Stage
# =============================================
FROM eclipse-temurin:21-jre-alpine

WORKDIR /app

# 타임존 설정
RUN apk add --no-cache tzdata && \
    cp /usr/share/zoneinfo/Asia/Seoul /etc/localtime && \
    echo "Asia/Seoul" > /etc/timezone && \
    apk del tzdata

# 보안을 위한 non-root 유저 생성
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

# 1단계에서 빌드된 .jar 파일만 복사
COPY --from=builder /app/build/libs/*.jar app.jar

# 파일 소유권 변경
RUN chown appuser:appgroup app.jar

# non-root 유저로 실행
USER appuser

# 포트 노출 (dev: 8081, prod: 8080 → docker-compose에서 매핑)
EXPOSE 8080

# 실행 시 Spring 프로파일 환경변수로 주입
ENTRYPOINT ["java", "-jar", "-Dspring.profiles.active=${SPRING_PROFILES_ACTIVE}", "app.jar"]