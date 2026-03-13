package com.ssafy.be.domain.item.dto.request;

import com.ssafy.be.domain.auction.entity.AuctionType;
import com.ssafy.be.domain.item.entity.Category;
import com.ssafy.be.domain.item.entity.ItemCondition;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.util.List;

public record ItemRegisterRequest(
        @NotBlank String name,
        @NotBlank String description,
        @NotNull Category category,
        @NotNull @Min(0) Long startPrice,
        @NotNull @Min(1) Long bidUnit,
        @NotNull @Min(1) Integer auctionDuration,
        @NotNull ItemCondition itemCondition,
        @NotNull AuctionType auctionType,
        List<String> tags
) {}
