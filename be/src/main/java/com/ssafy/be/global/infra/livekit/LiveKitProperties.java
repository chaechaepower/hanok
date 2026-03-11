package com.ssafy.be.global.infra.livekit;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "livekit")
public record LiveKitProperties(
        String url,
        String apiKey,
        String apiSecret
) {}