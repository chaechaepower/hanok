package com.ssafy.be.domain.item.entity;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum ItemCondition {
    BRAND_NEW("미개봉 세제품"),
    OPEN_BOX("개봉된 새상품"),
    REFURBISHED("리퍼비시"),
    USED("중고");

    private final String value;
}
