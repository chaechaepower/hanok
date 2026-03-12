package com.ssafy.be.domain.stream.dto.request;

import java.util.List;

public record MacroSaveRequest(List<MacroItem> macros) {
    public record MacroItem(String questionType, String answer) {}
}