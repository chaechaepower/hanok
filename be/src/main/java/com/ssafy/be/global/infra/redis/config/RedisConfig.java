package com.ssafy.be.global.infra.redis.config;

import lombok.RequiredArgsConstructor;
import org.springframework.boot.autoconfigure.data.redis.RedisProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.redis.connection.RedisConnectionFactory;
import org.springframework.data.redis.connection.RedisPassword;
import org.springframework.data.redis.connection.RedisStandaloneConfiguration;
import org.springframework.data.redis.connection.lettuce.LettuceConnectionFactory;
import org.springframework.data.redis.connection.lettuce.LettucePoolingClientConfiguration;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.listener.RedisMessageListenerContainer;
import org.springframework.scheduling.concurrent.ThreadPoolTaskExecutor;
import org.springframework.util.StringUtils;

@RequiredArgsConstructor
@Configuration
public class RedisConfig {

    private final RedisProperties redisProperties;

    @Bean
    RedisConnectionFactory redisConnectionFactory() {
        RedisStandaloneConfiguration standaloneConfig = new RedisStandaloneConfiguration(
                redisProperties.getHost(), redisProperties.getPort()
        );

        if (StringUtils.hasText(redisProperties.getPassword())) {
            standaloneConfig.setPassword(RedisPassword.of(redisProperties.getPassword()));
        }

        if (!redisProperties.getSsl().isEnabled()) {
            return new LettuceConnectionFactory(standaloneConfig);
        }

        LettucePoolingClientConfiguration clientConfig = LettucePoolingClientConfiguration.builder()
                .useSsl()
                .build();

        return new LettuceConnectionFactory(standaloneConfig, clientConfig);
    }

    @Bean
    public StringRedisTemplate stringRedisTemplate(RedisConnectionFactory factory) {
        return new StringRedisTemplate(factory);
    }

    @Bean
    public RedisMessageListenerContainer redisMessageListenerContainer(RedisConnectionFactory redisConnectionFactory) {
        RedisMessageListenerContainer container = new RedisMessageListenerContainer();
        container.setConnectionFactory(redisConnectionFactory);
        container.setTaskExecutor(redisMessageTaskExecutor());
        return container;
    }

    @Bean
    public ThreadPoolTaskExecutor redisMessageTaskExecutor() {
        ThreadPoolTaskExecutor executor = new ThreadPoolTaskExecutor();

        executor.setCorePoolSize(2);      // 평상시 유지 스레드 수
        executor.setMaxPoolSize(10);      // 동시 경매 종료 최대치 대비
        executor.setQueueCapacity(50);    // 대기 큐
        executor.setKeepAliveSeconds(30); // 유휴 스레드 유지 시간
        executor.setThreadNamePrefix("redis-auction-timer");  // 로그 식별용
        executor.setWaitForTasksToCompleteOnShutdown(true); // 종료 시 처리 중인 작업 완료 대기
        executor.initialize();

        return executor;
    }
}
