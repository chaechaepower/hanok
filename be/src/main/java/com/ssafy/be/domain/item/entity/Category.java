package com.ssafy.be.domain.item.entity;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum Category {
    SNEAKERS_SHOES("스니커즈/신발"),
    CLOTHING("의류"),
    WATCHES("시계"),
    BAGS_FASHION_ACCESSORIES("가방/패션잡화"),
    JEWELRY("주얼리"),
    TRADING_CARDS("트레이딩 카드"),
    FIGURES_ARTTOYS_GOODS("피규어/아트토이/굿즈"),
    ELECTRONICS("전자기기"),
    ART_PRINTS("미술품/판화"),
    ANTIQUES("골동품/앤틱"),
    ETC("기타");

    private final String value;
}
