package com.ssafy.be.domain.search.dto.response;

import lombok.Builder;

@Builder
public record AutocompleteSuggestion(
        String text,
        String type
) {}
