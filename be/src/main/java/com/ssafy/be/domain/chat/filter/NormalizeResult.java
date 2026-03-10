package com.ssafy.be.domain.chat.filter;

import lombok.RequiredArgsConstructor;


@RequiredArgsConstructor
public class NormalizeResult {
    public final String normalized;
    public final int[] indexMap;

}
