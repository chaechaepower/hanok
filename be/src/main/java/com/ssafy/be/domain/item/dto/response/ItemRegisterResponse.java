package com.ssafy.be.domain.item.dto.response;

import com.ssafy.be.domain.item.entity.ItemStatus;

public record ItemRegisterResponse(
        Long itemId,
        String name,
        ItemStatus status
) {}
