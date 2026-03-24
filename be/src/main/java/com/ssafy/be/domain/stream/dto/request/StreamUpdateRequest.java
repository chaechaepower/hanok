package com.ssafy.be.domain.stream.dto.request;

import com.ssafy.be.domain.item.entity.Category;
import com.ssafy.be.domain.stream.entity.StartType;
import jakarta.validation.Valid;
import java.time.LocalDateTime;
import java.util.List;

public record StreamUpdateRequest(
        String title,
        Category category,
        StartType startType,
        LocalDateTime scheduledAt,
        String notice,
        @Valid List<StreamRegisterRequest.AuctionItemRequest> auctionItems) {}
