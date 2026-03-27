package com.ssafy.be.domain.stream.entity;

import lombok.RequiredArgsConstructor;

@RequiredArgsConstructor
public enum StartType {
    SCHEDULED("예약됨"),
    INSTANT("즉시 시작");

    private final String description;
}
