package com.ssafy.be.domain.stream.dto.request;

import com.ssafy.be.domain.auction.dto.request.AuctionItemRequest;
import com.ssafy.be.domain.item.entity.Category;
import com.ssafy.be.domain.stream.entity.StartType;
import jakarta.validation.Valid;
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
        List<Long> itemIds) {}
