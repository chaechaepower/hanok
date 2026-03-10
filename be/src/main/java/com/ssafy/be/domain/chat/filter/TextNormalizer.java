package com.ssafy.be.domain.chat.filter;

import lombok.Builder;

import java.util.Arrays;

public class TextNormalizer {

    @Builder
    public static class NormalizeResult {
        public String normalizeText;
        public int[] originalIdxMap;
    }


    public static NormalizeResult normalize(String original) {
        StringBuilder normalized = new StringBuilder();
        int[] idxMap = new int[original.length()];
        int normalizedIdx = 0;

        for(int i = 0; i < original.length(); i++) {

            // 1. 소문자 처리
            char c = Character.toLowerCase(original.charAt(i));

            // 2. validate 검사
            if (!isValidCharacter(c)) continue;

            normalized.append(c);
            idxMap[normalizedIdx] = i;
            normalizedIdx++;

        }

        return NormalizeResult.builder()
                .normalizeText(normalized.toString())
                .originalIdxMap(Arrays.copyOf(idxMap, normalizedIdx))
                .build();
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