package com.ssafy.be.domain.chat.filter;

import lombok.Builder;

import java.util.Arrays;

public class TextNormalizer {

    // 자음/모음 결합을 위한 유니코드 기준 문자열 상수
    private static final String CHO = "ㄱㄲㄴㄷㄸㄹㅁㅂㅃㅅㅆㅇㅈㅉㅊㅋㅌㅍㅎ";
    private static final String JUNG = "ㅏㅐㅑㅒㅓㅔㅕㅖㅗㅘㅙㅚㅛㅜㅝㅞㅟㅠㅡㅢㅣ";
    private static final String JONG = " ㄱㄲㄳㄴㄵㄶㄷㄹㄺㄻㄼㄽㄾㄿㅀㅁㅂㅄㅅㅆㅇㅈㅊㅋㅌㅍㅎ"; // 첫 칸은 공백(종성 없음)

    @SuppressWarnings("java:S6218")
    @Builder
    public record NormalizeResult(
            String normalizeText,
            int[] originalIdxMap
    ) {}

    public static NormalizeResult normalize(String original) {
        StringBuilder tempNormalized = new StringBuilder();
        int[] tempIdxMap = new int[original.length()];
        int tempIdx = 0;

        for(int i = 0; i < original.length(); i++) {

            char c = original.charAt(i);

            // 1. 소문자 처리
            c = Character.toLowerCase(c);

            // 2. 모양 비슷한 숫자/알파벳/특수문자 -> 한글 자음으로 1차 변환 (e -> ㅌ, 8 -> ㅂ, @ -> ㅇ 등)
            c = convertLeetSpeak(c);

            // 3. 아직도 남아있는 영어 알파벳이 있다면, 실수로 영타를 친 것으로 간주하고 QWERTY 변환 (q -> ㅂ)
            c = convertQwertyTo(c);

            // 4. validate 검사
            if (!isValidCharacter(c)) continue;

            tempNormalized.append(c);
            tempIdxMap[tempIdx] = i;
            tempIdx++;
        }

        // 4. 추출된 자음/모음을 완성형 한글로 조립하여 최종 반환
        return assembleJamo(tempNormalized.toString(), Arrays.copyOf(tempIdxMap, tempIdx));
    }

    // 자음/모음 결합 (조립 로직)
    // for문에서 i의 순차적 증가, 감소가 아니라면 while을 통해서 수동 조작하라고 해서
    private static NormalizeResult assembleJamo(String text, int[] oldIdxMap) {
        StringBuilder assembledText = new StringBuilder();
        int[] newIdxMap = new int[text.length()];
        int newIdx = 0;

        int i = 0; // for 문 대신 while 문을 위한 외부 변수 선언

        while (i < text.length()) {
            char current = text.charAt(i);
            int choIdx = CHO.indexOf(current);

            // 1. 초성이 발견되고 다음 글자가 있는 경우 (조립 시도)
            if (choIdx != -1 && i + 1 < text.length()) {
                char next = text.charAt(i + 1);
                int jungIdx = JUNG.indexOf(next);

                if (jungIdx != -1) {
                    int jongIdx = getJongIdx(text, i);

                    // 핵심 포인트: while문은 자동 i++가 없으므로 총 흡수할 글자 수를 바로 더해줍니다.
                    // 종성이 있으면 초+중+종 3글자 흡수, 없으면 초+중 2글자 흡수
                    int jump = (jongIdx > 0) ? 3 : 2;

                    char combined = (char) (0xAC00 + (choIdx * 21 * 28) + (jungIdx * 28) + jongIdx);

                    assembledText.append(combined);
                    newIdxMap[newIdx++] = oldIdxMap[i];

                    i += jump; // 흡수한 글자 수만큼 당당하게 점프!
                    continue;
                }
            }

            // 우회용 찌꺼기("시1발"의 '1' 등)로 간주하여 제거
            if (JUNG.indexOf(current) != -1) {
                i++; // 결과 문자열에 담지 않고 인덱스만 1칸 전진하여 버림
                continue;
            }

            // 조립할 수 없는 글자는 1칸만 전진
            assembledText.append(current);
            newIdxMap[newIdx++] = oldIdxMap[i];

            i++; // 여기서 1칸 전진
        }

        return NormalizeResult.builder()
                .normalizeText(assembledText.toString())
                .originalIdxMap(Arrays.copyOf(newIdxMap, newIdx))
                .build();
    }

    //종성 인덱스 계산
    private static int getJongIdx(String text, int currentIndex) {
        // 1. 종성이 들어갈 자리가 없으면 기본값(0) 반환
        if (currentIndex + 2 >= text.length()) {
            return 0;
        }

        char nextNext = text.charAt(currentIndex + 2);
        int tempJongIdx = JONG.indexOf(nextNext);

        // 2. 종성 자리에 올 수 없는 글자면 기본값(0) 반환
        if (tempJongIdx <= 0) {
            return 0;
        }

        // 3. 그 다음 글자가 모음(중성)이라면, 이 자음은 받침이 아니라 다음 글자의 초성임
        if (currentIndex + 3 < text.length()) {
            char nextNextNext = text.charAt(currentIndex + 3);
            if (JUNG.indexOf(nextNextNext) != -1) {
                return 0; // 받침으로 흡수하지 않음
            }
        }

        return tempJongIdx;
    }


    // switch expression
    private static char convertLeetSpeak(char c) {
        return switch (c) {
            case '0', 'o', 'O', '@' -> 'ㅇ'; // [수정된 부분] '@' 기호를 'ㅇ'으로 변환
            case '1', 'l', 'I', 'i' -> 'ㅣ';
            case 'e', 'E', '3' -> 'ㅌ';
            case 'b', 'B', '8' -> 'ㅂ';
            case '7' -> 'ㄱ';
            case 'z', 'Z' -> 'ㅈ';
            case 'v', 'V' -> 'ㅂ';
            case 'c', 'C' -> 'ㅊ';
            default -> c;
        };
    }

    // qwer 키보드 배열 기준
    @SuppressWarnings("java:S1479")
    private static char convertQwertyTo(char c) {
        return switch (c) {
            case 'q' -> 'ㅂ'; case 'Q' -> 'ㅃ';
            case 'w' -> 'ㅈ'; case 'W' -> 'ㅉ';
            case 'e' -> 'ㄷ'; case 'E' -> 'ㄸ';
            case 'r' -> 'ㄱ'; case 'R' -> 'ㄲ';
            case 't' -> 'ㅅ'; case 'T' -> 'ㅆ';
            case 'y' -> 'ㅛ'; case 'u' -> 'ㅕ'; case 'i' -> 'ㅑ';
            case 'o' -> 'ㅐ'; case 'O' -> 'ㅒ';
            case 'p' -> 'ㅔ'; case 'P' -> 'ㅖ';
            case 'a' -> 'ㅁ'; case 's' -> 'ㄴ'; case 'd' -> 'ㅇ';
            case 'f' -> 'ㄹ'; case 'g' -> 'ㅎ'; case 'h' -> 'ㅗ';
            case 'j' -> 'ㅓ'; case 'k' -> 'ㅏ'; case 'l' -> 'ㅣ';
            case 'z' -> 'ㅋ'; case 'x' -> 'ㅌ'; case 'c' -> 'ㅊ';
            case 'v' -> 'ㅍ'; case 'b' -> 'ㅠ'; case 'n' -> 'ㅜ';
            case 'm' -> 'ㅡ';
            default -> c;
        };
    }

    // 유니코드로 비교
    private static boolean isValidCharacter(char c) {
        return (c >= '0' && c <= '9') ||
                (c >= 'a' && c <= 'z') ||
                (c >= 0xAC00 && c <= 0xD7A3) || // 한글 완성형 (가~힣)
                (c >= 0x3131 && c <= 0x318E);   // 한글 자음/모음 (ㄱ~ㅎ, ㅏ~ㅣ)
    }
}