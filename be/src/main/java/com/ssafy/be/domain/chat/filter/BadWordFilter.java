package com.ssafy.be.domain.chat.filter;

import jakarta.annotation.PostConstruct;
import org.ahocorasick.trie.Emit;
import org.ahocorasick.trie.Trie;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.Collection;
import java.util.List;

@Component
public class BadWordFilter {

    private Trie bannedTrie;  // 욕설/금칙어 사전
    private Trie allowedTrie; // 예외 허용어 사전

    @PostConstruct
    public void initTries() {
        // 금칙어 사전
        String[] bannedWords = {"씨발", "개새끼", "바보"};
        this.bannedTrie = Trie.builder()
                .ignoreCase()
                .ignoreOverlaps()
                .addKeywords(bannedWords)
                .build();

        // 예외 허용어 사전
        String[] allowedWords = {"씨발점", "개새", "바보야"};
        this.allowedTrie = Trie.builder()
                .ignoreCase()
                .addKeywords(allowedWords)
                .build();
    }

    public ChatFilterResult filter(String original) {
        // 정규화
        TextNormalizer.NormalizeResult result = TextNormalizer.normalize(original);

        String normText = result.normalizeText;

        // 두 개의 사전에서 각각 Emit
        Collection<Emit> bannedEmits = bannedTrie.parseText(normText);

        if (bannedEmits.isEmpty()) {
            return buildResult(false, original);
        }

        Collection<Emit> allowedEmits = allowedTrie.parseText(normText);

        // 금칙어 중 예외 허용어에 포함되는 것 걸러내기
        List<Emit> validBannedEmits = new ArrayList<>();

        for (Emit banned : bannedEmits) {
            boolean isAllowed = false;

            for (Emit allowed : allowedEmits) {
                if (allowed.getStart() <= banned.getStart() && banned.getEnd() <= allowed.getEnd()) {
                    isAllowed = true;
                    break;
                }
            }

            if (!isAllowed) {
                validBannedEmits.add(banned);
            }
        }

        if (validBannedEmits.isEmpty()) {
            return buildResult(false, original);
        }

        // 진짜 욕설만 원본 인덱스에 맞춰 마스킹 처리
        char[] maskedChars = original.toCharArray();


        int[] idxMap = result.originalIdxMap;

        for (Emit emit : validBannedEmits) {
            int startOriginalIdx = idxMap[emit.getStart()];
            int endOriginalIdx = idxMap[emit.getEnd()];

            for (int i = startOriginalIdx; i <= endOriginalIdx; i++) {
                maskedChars[i] = '*';
            }
        }

        return buildResult(true, new String(maskedChars));
    }

    private ChatFilterResult buildResult(boolean isDetected, String text) {
        return ChatFilterResult.builder()
                .isDetected(isDetected)
                .maskedText(text)
                .build();
    }
}