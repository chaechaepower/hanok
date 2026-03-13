package com.ssafy.be.domain.seller.dto.response;

import com.fasterxml.jackson.annotation.JsonProperty;
import java.util.List;

public record BiznoApiResponse(
        @JsonProperty("resultCode") int resultCode,
        @JsonProperty("totalCount") int totalCount,
        @JsonProperty("items") List<BiznoItem> items
) {
    public record BiznoItem(
            @JsonProperty("bstt") String bstt
    ) {}
}