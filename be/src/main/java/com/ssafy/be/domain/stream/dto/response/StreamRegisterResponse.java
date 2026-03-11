package com.ssafy.be.domain.stream.dto.response;

import com.ssafy.be.domain.item.dto.response.ItemSummaryResponse;
import com.ssafy.be.domain.stream.entity.StartType;

import java.util.List;

public record StreamRegisterResponse(
        Long streamId,
        String title,
        StartType status,
        String thumbnail,
        List<ItemSummaryResponse> items) {}