package com.ssafy.be.domain.stream.dto.request;

import com.ssafy.be.domain.item.entity.AuctionType;
import com.ssafy.be.domain.item.entity.Category;
import com.ssafy.be.domain.stream.entity.StartType;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.time.LocalDateTime;
import java.util.List;

public record StreamRegisterRequest(
        @NotBlank String title,
        @NotNull Category category,
        @NotNull StartType startType,
        LocalDateTime scheduledAt,
        String notice,
        @Valid List<AuctionItemRequest> auctionItems) {

    public record AuctionItemRequest(
            @NotNull Long itemId,
            @NotNull AuctionType auctionType,
            @NotNull @Min(1) Integer auctionDuration,
            @Valid BottomUpAuctionDetailRequest bottomUp,
            @Valid UniqueBidAuctionDetailRequest uniqueTop
    ) {}

    public record BottomUpAuctionDetailRequest(
            @NotNull @Min(0) Long startPrice,
            @NotNull @Min(1) Long bidUnit
    ) {}

    public record UniqueBidAuctionDetailRequest(
            @NotNull @Min(0) Long minPrice,
            @NotNull @Min(0) Long maxPrice
    ) {}

    public String describe() {
        return String.format("제목: %s, 카테고리: %s, 방송 공지: %s", title(), category().getValue(), notice());
    }
}
