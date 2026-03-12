package com.ssafy.be.domain.stream.dto.response;

import com.ssafy.be.domain.item.entity.Category;
import java.util.List;

public record MacroResponse(
        Long streamId,
        Category category,
        List<MacroItem> macros
) {
    public record MacroItem(String questionType, String answer) {}
}