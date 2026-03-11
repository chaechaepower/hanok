package com.ssafy.be.domain.user.entity;

import com.ssafy.be.domain.user.exception.UserErrorCode;
import com.ssafy.be.global.exception.GlobalException;
import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum BankCode {
    // 은행
    IBK("003", "기업은행"),
    KB("004", "국민은행"),
    SUHYUP("007", "수협은행"),
    NH("011", "농협은행"),
    LOCAL_NH("012", "지역농·축협"),
    KDB("002", "산업은행"),
    WOORI("020", "우리은행"),
    SC("023", "SC은행"),
    CITI("027", "한국씨티은행"),
    DAEGU("031", "대구은행"),
    BUSAN("032", "부산은행"),
    GWANGJU("034", "광주은행"),
    JEJU("035", "제주은행"),
    JEONBUK("037", "전북은행"),
    GYEONGNAM("039", "경남은행"),
    MG("045", "새마을금고"),
    CU("048", "신협"),
    SAVINGS("050", "저축은행"),
    POST("071", "우체국"),
    HANA("081", "하나은행"),
    KAKAO("090", "카카오뱅크"),
    KBANK("089", "케이뱅크"),
    TOSS("092", "토스뱅크"),
    SHINHAN("088", "신한은행"),
    HSBC("054", "HSBC"),
    DEUTSCHE("055", "도이치"),
    JPMORGAN("057", "JP모간"),
    BOA("060", "BOA"),
    BNP("061", "BNP파리바"),
    ICBC("062", "중국공상"),
    CHINA("063", "중국"),
    FOREST("064", "산림조합"),
    CCB("067", "중국건설"),

    // 증권사
    SHINHAN_INV("278", "신한투자증권"),
    KYOBO("261", "교보증권"),
    DAOL("227", "다올투자증권"),
    DAISHIN("267", "대신증권"),
    MERITZ("287", "메리츠증권"),
    MIRAE("238", "미래에셋증권"),
    BOOKOOK("290", "부국증권"),
    SAMSUNG("240", "삼성증권"),
    SANGSANGIN("221", "상상인증권"),
    SHINYOUNG("291", "신영증권"),
    SK("266", "에스케이증권"),
    YUANTA("209", "유안타증권"),
    EUGENE("280", "유진투자증권"),
    EBEST("265", "이베스트투자증권"),
    KAKAOPAY("288", "카카오페이증권"),
    CAPE("292", "케이프투자증권"),
    KIWOOM("264", "키움증권"),
    TOSS_INV("271", "토스증권"),
    KOPOS("294", "한국포스증권"),
    HANA_INV("270", "하나증권"),
    HI("262", "하이투자증권"),
    KOREA_INV("243", "한국투자증권"),
    HANWHA("269", "한화투자증권"),
    HYUNDAI("263", "현대차증권"),
    BNK("224", "BNK투자증권"),
    DB("279", "DB금융투자"),
    IBK_INV("225", "IBK투자증권"),
    KBS_INV("218", "KB증권"),
    NH_INV("247", "NH투자증권");

    private final String code;
    private final String name;

    public static BankCode fromCode(String code) {
        for (BankCode bank : values()) {
            if (bank.code.equals(code)) {
                return bank;
            }
        }
        throw new GlobalException(UserErrorCode.INVALID_BANK_CODE);
    }
}
