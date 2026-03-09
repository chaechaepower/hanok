package com.ssafy.be.global.infra.portone;

import com.fasterxml.jackson.databind.JsonNode;
import io.portone.sdk.server.common.Currency;
import io.portone.sdk.server.errors.WebhookVerificationException;
import io.portone.sdk.server.payment.Payment;
import io.portone.sdk.server.payment.PaymentClient;
import io.portone.sdk.server.webhook.Webhook;
import io.portone.sdk.server.webhook.WebhookTransaction;
import io.portone.sdk.server.webhook.WebhookVerifier;
import lombok.extern.slf4j.Slf4j;
import org.apache.http.HttpHeaders;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

@Slf4j
@Component
public class PortoneClient {
    private static final String IDENTITY_VERIFICATION_URL = "/identity-verifications/{id}";
    private final PaymentClient paymentClient;
    private final WebhookVerifier portoneWebhook;
    private final RestClient restClient;

    public PortoneClient(
            @Value("${portone.base-url}") String portoneBaseUrl,
            @Value("${portone.secret.key}") String paymentSecretKey,
            @Value("${portone.secret.webhook}") String paymentSecretWebhook
    ) {
        this.paymentClient = new PaymentClient(paymentSecretKey, portoneBaseUrl, null);
        this.portoneWebhook = new WebhookVerifier(paymentSecretWebhook);
        this.restClient = RestClient.builder()
                .baseUrl(portoneBaseUrl)
                .defaultHeader(HttpHeaders.AUTHORIZATION,"PortOne " + paymentSecretKey)
                .build();
    }

    public void preRegisterPayment(String paymentId, Long totalAmount) {
        paymentClient.preRegisterPayment(paymentId, totalAmount, 0L, Currency.Krw.INSTANCE);
    }

    public Payment getPayment(String paymentId) {
        return paymentClient.getPayment(paymentId).join();
    }

    public String handleWebhook(String body, String webhookId, String webhookTimestamp, String webhookSignature) {
        try {
            Webhook webhook = portoneWebhook.verify(body, webhookId, webhookSignature, webhookTimestamp);

            if (webhook instanceof WebhookTransaction transaction) {
                log.info("포트원 웹훅 수신 - paymentId: {}", transaction.getData().getPaymentId());
                return transaction.getData().getPaymentId();
            }

        } catch (WebhookVerificationException e) {
            log.warn("webhook 검증에 실패했습니다. {}", e.getMessage());
        }

        return "";
    }

    public JsonNode getIdentityVerification(String identityVerificationId) {
        return restClient.get()
                .uri(IDENTITY_VERIFICATION_URL, identityVerificationId)
                .retrieve()
                .body(JsonNode.class);
    }
}
