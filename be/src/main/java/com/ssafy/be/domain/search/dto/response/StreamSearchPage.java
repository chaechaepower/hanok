package com.ssafy.be.domain.search.dto.response;

import lombok.Builder;

import java.util.List;

@Builder
public record StreamSearchPage(
        List<StreamSearchResult> data,
        int page,
        int size,
        int totalCount
) {}
