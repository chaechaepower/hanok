package com.ssafy.be.global.portone;

import com.fasterxml.jackson.databind.JsonNode;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

// [PortOne API Client]
// PortOne V2 API 호출을 담당하는 컴포넌트
// identityVerificationId로 본인인증 결과 조회
@Component
public class PortOneClient {

    @Value("${portone.api-secret}")
    private String apiSecret;

    private final RestClient restClient;

    private static final String PORTONE_API_URL = "https://api.portone.io";

    public PortOneClient() {
        this.restClient = RestClient.create();
    }

    public JsonNode getIdentityVerification(String identityVerificationId) {
        return restClient.get()
                .uri(PORTONE_API_URL + "/identity-verifications/{id}", identityVerificationId)
                .header("Authorization", "PortOne " + apiSecret)
                .retrieve()
                .body(JsonNode.class);
    }
}