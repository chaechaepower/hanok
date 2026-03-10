package com.ssafy.be.domain.chat.filter;


public interface ChatFilter {
    boolean isFiltered(String content);
}

