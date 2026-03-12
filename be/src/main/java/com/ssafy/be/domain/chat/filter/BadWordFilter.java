package com.ssafy.be.domain.chat.filter;

import jakarta.annotation.PostConstruct;
import lombok.extern.slf4j.Slf4j;
import org.ahocorasick.trie.Emit;
import org.ahocorasick.trie.Trie;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Component;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.Collection;
import java.util.List;

@Slf4j
@Component
public class BadWordFilter {

    private Trie bannedTrie;  // 욕설/금칙어 사전
    private Trie allowedTrie; // 예외 허용어 사전

    @PostConstruct
    public void initTries() {
        // 1. 외부 파일에서 단어 목록 로드
        List<String> bannedWords = loadWordsFromFile("banned_words.txt");
        List<String> allowedWords = loadWordsFromFile("allowed_words.txt");

        // 2. 로드된 단어들로 Trie 빌드
        this.bannedTrie = Trie.builder()
                .ignoreCase()
                .ignoreOverlaps()
                .addKeywords(bannedWords)
                .build();

        this.allowedTrie = Trie.builder()
                .ignoreCase()
                .addKeywords(allowedWords)
                .build();

        // 3. 부트업 시 로딩된 단어 개수 확인 로그
        log.info("✅ 금칙어 필터 초기화 완료 (금칙어: {}개, 허용어: {}개)", bannedWords.size(), allowedWords.size());
    }

    public ChatFilterResult filter(String original) {
        // 1. 정규화
        TextNormalizer.NormalizeResult result = TextNormalizer.normalize(original);
        String normText = result.normalizeText();

        // 2. 금칙어 사전 탐색
        Collection<Emit> bannedEmits = bannedTrie.parseText(normText);

        // 애초에 금칙어가 없으면 빠른 통과
        if (bannedEmits.isEmpty()) {
            return buildResult(false, original);
        }

        // 3. 허용어 사전 탐색
        Collection<Emit> allowedEmits = allowedTrie.parseText(normText);

        // 4. 감지된 금칙어 중 진짜 욕설인지 확인
        for (Emit banned : bannedEmits) {
            boolean isAllowed = false;

            for (Emit allowed : allowedEmits) {
                // 금칙어가 허용어에 완전히 포함되는지 검사 (예: '발'이 '발가락'에 포함되는지)
                if (allowed.getStart() <= banned.getStart() && banned.getEnd() <= allowed.getEnd()) {
                    isAllowed = true;
                    break;
                }
            }

            //  허용어가 아닌 '진짜 욕설'이 하나라도 발견되면 즉시 "금칙어" 반환
            if (!isAllowed) {
                return buildResult(true, "금칙어");
            }
        }

        // 5. 발견된 금칙어가 모두 허용어였다면 안전한 텍스트로 간주
        return buildResult(false, original);
    }

    private ChatFilterResult buildResult(boolean isDetected, String text) {
        return ChatFilterResult.builder()
                .isDetected(isDetected)
                .maskedText(text)
                .build();
    }

    // 파일 로드 전용 헬퍼 메서드
    private List<String> loadWordsFromFile(String fileName) {
        List<String> words = new ArrayList<>();
        try {
            ClassPathResource resource = new ClassPathResource(fileName);
            try (BufferedReader br = new BufferedReader(
                    new InputStreamReader(resource.getInputStream(), StandardCharsets.UTF_8))) {

                String line;
                while ((line = br.readLine()) != null) {
                    line = line.trim();
                    // 빈 줄이거나 주석(#)인 경우 무시
                    if (!line.isEmpty() && !line.startsWith("#")) {
                        words.add(line);
                    }
                }
            }
        } catch (Exception e) {
            log.error("❌ 사전 파일 로드 실패: {}", fileName, e);
        }
        return words;
    }
}