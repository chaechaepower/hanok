package com.ssafy.be.domain.chat.filter;

import org.springframework.stereotype.Component;

@Component
public class SimpleChatFilter implements ChatFilter {

    @Override
    public boolean isFiltered(String content) {
        // 임시 구현 (라이브러리 추가 전)
        return false;
    }
}
