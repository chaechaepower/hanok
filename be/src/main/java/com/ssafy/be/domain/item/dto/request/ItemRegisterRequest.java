package com.ssafy.be.domain.item.dto.request;

import com.ssafy.be.domain.item.entity.Category;
import com.ssafy.be.domain.item.entity.ItemCondition;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.util.List;

public record ItemRegisterRequest(
        @NotBlank String name,
        @NotBlank String description,
        @NotNull Category category,
        @NotNull ItemCondition itemCondition,
        List<String> tags
) {}
