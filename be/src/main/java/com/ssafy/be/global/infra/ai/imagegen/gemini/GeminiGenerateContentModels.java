package com.ssafy.be.global.infra.ai.imagegen.gemini;

import com.fasterxml.jackson.annotation.JsonAlias;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonProperty;

import java.util.List;

@JsonInclude(JsonInclude.Include.NON_NULL)
public final class GeminiGenerateContentModels {

    public record Request(List<Content> contents) {
        public static Request textToImage(String prompt) {
            return new Request(List.of(new Content(List.of(new Part(prompt, null)))));
        }
    }

    public record Content(List<Part> parts) {
    }

    @JsonInclude(JsonInclude.Include.NON_NULL)
    public record Part(
            String text,
            @JsonProperty("inline_data") InlineData inlineData
    ) {
    }

    public record InlineData(
            @JsonProperty("mime_type") String mimeType,
            String data
    ) {
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record Response(
            List<Candidate> candidates
    ) {
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record Candidate(
            ContentOut content
    ) {
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record ContentOut(
            List<PartOut> parts
    ) {
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record PartOut(
            String text,
            @JsonProperty("inline_data")
            @JsonAlias("inlineData")
            InlineDataOut inlineData
    ) {
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record InlineDataOut(
            @JsonProperty("mime_type")
            @JsonAlias("mimeType")
            String mimeType,
            String data
    ) {
    }
}
