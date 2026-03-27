package com.ssafy.be.config;

import com.google.cloud.storage.Storage;
import com.ssafy.be.domain.seller.client.BiznoClient;
import com.ssafy.be.global.infra.storage.gcs.GcsClient;
import com.ssafy.be.global.infra.portone.PortoneClient;
import com.ssafy.be.global.sse.service.SseEmitterService;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Primary;

import static org.mockito.Mockito.mock;

@TestConfiguration(proxyBeanMethods = false)
public class ExternalApiMockConfig {

    @Bean
    Storage storage() {
        return mock(Storage.class);
    }

    @Bean
    BiznoClient biznoClient() {
        return mock(BiznoClient.class);
    }

    @Bean
    PortoneClient portoneClient() {
        return mock(PortoneClient.class);
    }

    @Bean
    @Primary
    GcsClient gcsClient() {
        return mock(GcsClient.class);
    }

    @Bean
    @Primary
    public SseEmitterService sseEmitterServiceMock() {
        return mock(SseEmitterService.class);
    }
}
