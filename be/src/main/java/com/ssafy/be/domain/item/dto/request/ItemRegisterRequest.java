package com.ssafy.be.domain.item.dto.request;

import com.ssafy.be.domain.item.entity.Category;
import com.ssafy.be.domain.item.entity.Condition;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record ItemRegisterRequest(
        @NotBlank String name,
        @NotBlank String description,
        @NotNull Category category,
        @NotNull @Min(0) Long startPrice,
        @NotNull @Min(1) Integer bidUnit,
        @NotNull @Min(1) Integer auctionDuration,
        @NotNull Condition itemCondition
) {}