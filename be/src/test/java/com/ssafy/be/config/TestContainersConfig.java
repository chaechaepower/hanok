package com.ssafy.be.config;

import com.redis.testcontainers.RedisContainer;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.boot.testcontainers.service.connection.ServiceConnection;
import org.springframework.context.annotation.Bean;
import org.testcontainers.mysql.MySQLContainer;
import org.testcontainers.utility.DockerImageName;


@TestConfiguration(proxyBeanMethods = false)
public class TestContainersConfig {
    private static final String REDIS_DOCKER_IMAGE = "redis:7.2.0-alpine";
    private static final int REDIS_PORT = 6379;

    @ServiceConnection
    @Bean
    MySQLContainer mysqlContainer() {
        return new MySQLContainer(
                DockerImageName.parse("mysql:8.0.34").asCompatibleSubstituteFor("mysql"));
    }

    @Bean
    RedisContainer redisContainer() {
        RedisContainer container = new RedisContainer(DockerImageName.parse(REDIS_DOCKER_IMAGE))
                .withExposedPorts(REDIS_PORT);

        container.start();

        System.setProperty("spring.data.redis.host", container.getHost());
        System.setProperty("spring.data.redis.port", String.valueOf(container.getMappedPort(REDIS_PORT)));
        System.setProperty("spring.data.redis.password", "");
        return container;
    }
}