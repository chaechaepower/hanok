package com.ssafy.be.domain.chat.filter;

import lombok.Builder;

import java.util.Arrays;

public class TextNormalizer {

    // 자음/모음 결합을 위한 유니코드 기준 문자열 상수
    private static final String CHO = "ㄱㄲㄴㄷㄸㄹㅁㅂㅃㅅㅆㅇㅈㅉㅊㅋㅌㅍㅎ";
    private static final String JUNG = "ㅏㅐㅑㅒㅓㅔㅕㅖㅗㅘㅙㅚㅛㅜㅝㅞㅟㅠㅡㅢㅣ";
    private static final String JONG = " ㄱㄲㄳㄴㄵㄶㄷㄹㄺㄻㄼㄽㄾㄿㅀㅁㅂㅄㅅㅆㅇㅈㅊㅋㅌㅍㅎ"; // 첫 칸은 공백(종성 없음)

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

            // 0. 영타 수행 -> 남은 문자 조정
            c = convertQwertyTo(c);

            // 1. 모양 비슷한 영문/ 한글 -> lower하기 전 변환
            c = convertLeetSpeak(c);

            // 2. 소문자 처리
            c = Character.toLowerCase(c);

            // 3. validate 검사
            if (!isValidCharacter(c)) continue;

            tempNormalized.append(c);
            tempIdxMap[tempIdx] = i;
            tempIdx++;
        }

        // 4. 추출된 자음/모음을 완성형 한글로 조립하여 최종 반환
        return assembleJamo(tempNormalized.toString(), Arrays.copyOf(tempIdxMap, tempIdx));
    }

    // 자음/모음 결합 (조립 로직)
    private static NormalizeResult assembleJamo(String text, int[] oldIdxMap) {
        StringBuilder assembledText = new StringBuilder();
        int[] newIdxMap = new int[text.length()];
        int newIdx = 0;

        for (int i = 0; i < text.length(); i++) {
            char current = text.charAt(i);
            int choIdx = CHO.indexOf(current);

            // 현재 글자가 초성(자음)이고, 다음 글자가 중성(모음)이라면 조립 시작
            if (choIdx != -1 && i + 1 < text.length()) {
                char next = text.charAt(i + 1);
                int jungIdx = JUNG.indexOf(next);

                if (jungIdx != -1) {
                    int jongIdx = 0; // 기본은 종성 없음(공백 인덱스 0)
                    int jump = 1;    // 기본적으로 모음 1개 흡수

                    // 그 다음 글자가 종성(받침)으로 들어갈 수 있는지 확인
                    if (i + 2 < text.length()) {
                        char nextNext = text.charAt(i + 2);
                        int tempJongIdx = JONG.indexOf(nextNext);
                        if (tempJongIdx > 0) {
                            // 다음 글자 모음인지 확인
                            boolean isNextVowel = false;
                            if (i + 3 < text.length()) {
                                char nextNextNext = text.charAt(i + 3);
                                if (JUNG.indexOf(nextNextNext) != -1) {
                                    isNextVowel = true; // 뒤에 모음이 오면 얘는 초성이므로 받침으로 먹으면 안된다
                                }
                            }

                            // 뒤에 모음이 없을 때만 받침으로 흡수
                            if (!isNextVowel) {
                                jongIdx = tempJongIdx;
                                jump = 2;
                            }
                        }
                    }

                    // 유니코드 한글 결합 공식
                    char combined = (char) (0xAC00 + (choIdx * 21 * 28) + (jungIdx * 28) + jongIdx);

                    assembledText.append(combined);
                    // 조립된 완성형 글자의 원본 인덱스는 '초성'이 있던 위치로 매핑
                    newIdxMap[newIdx] = oldIdxMap[i];
                    newIdx++;

                    i += jump; // 흡수한 자음/모음 개수만큼 인덱스 점프
                    continue;
                }
            }

            // 조립할 수 없는 단일 자모음이나 영어, 숫자는 그대로 통과
            assembledText.append(current);
            newIdxMap[newIdx] = oldIdxMap[i];
            newIdx++;
        }

        return NormalizeResult.builder()
                .normalizeText(assembledText.toString())
                .originalIdxMap(Arrays.copyOf(newIdxMap, newIdx))
                .build();
    }

    // switch expression
    private static char convertLeetSpeak(char c) {
        return switch (c) {
            case '0', 'o', 'O' -> 'ㅇ';
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
        if (c >= '0' && c <= '9') return true;
        if (c >= 'a' && c <= 'z') return true;
        // 한글 완성형 (가~힣)
        if (c >= 0xAC00 && c <= 0xD7A3) return true;
        // 한글 자음/모음 (ㄱ~ㅎ, ㅏ~ㅣ)
        if (c >= 0x3131 && c <= 0x318E) return true;

        return false;
    }
}