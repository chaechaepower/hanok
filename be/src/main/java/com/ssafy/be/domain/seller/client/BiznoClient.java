package com.ssafy.be.domain.seller.client;

import com.ssafy.be.domain.seller.dto.response.BiznoApiResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

@Component
public class BiznoClient {

    @Value("${bizno.api.key}")
    private String biznoApiKey;

    private final RestClient restClient = RestClient.create();

    public BiznoApiResponse verify(String bizno, int gb) {
        return restClient.get()
                .uri(uriBuilder -> uriBuilder
                        .scheme("https")
                        .host("bizno.net")
                        .path("/api/fapi")
                        .queryParam("key", biznoApiKey)
                        .queryParam("gb", gb)
                        .queryParam("q", bizno)
                        .queryParam("type", "json")
                        .build())
                .retrieve()
                .body(BiznoApiResponse.class);
    }
}