package com.ssafy.be.search;

import com.ssafy.be.domain.auction.entity.Auction;
import com.ssafy.be.domain.auction.repository.AuctionRepository;
import com.ssafy.be.domain.item.entity.AuctionType;
import com.ssafy.be.domain.item.entity.Item;
import com.ssafy.be.domain.item.repository.ItemRepository;
import com.ssafy.be.domain.search.dto.response.MatchReason;
import com.ssafy.be.domain.search.dto.response.MatchType;
import com.ssafy.be.domain.search.dto.response.StreamSearchResult;
import com.ssafy.be.domain.search.service.SearchService;
import com.ssafy.be.domain.seller.entity.Seller;
import com.ssafy.be.domain.seller.repository.SellerRepository;
import com.ssafy.be.domain.stream.entity.Stream;
import com.ssafy.be.domain.stream.repository.StreamRepository;
import com.ssafy.be.domain.user.entity.User;
import com.ssafy.be.domain.user.repository.UserRepository;
import com.ssafy.be.global.extension.IntegrationTestExtension;
import com.ssafy.be.support.annotation.IntegrationTest;
import com.ssafy.be.support.util.TestFixture;
import org.junit.jupiter.api.*;
import org.junit.jupiter.api.extension.ExtendWith;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.test.context.jdbc.Sql;
import org.springframework.test.context.jdbc.SqlConfig;

import java.util.List;

import static com.ssafy.be.domain.auction.entity.AuctionStatus.READY;
import static org.assertj.core.api.Assertions.assertThat;


@IntegrationTest
@DisplayName("Search 통합 테스트 (Smoke + Step-up)")
@TestClassOrder(ClassOrderer.OrderAnnotation.class)
@Sql(
        statements = {
                "ALTER TABLE stream ADD FULLTEXT INDEX ft_stream_title (title) WITH PARSER ngram",
                "ALTER TABLE item   ADD FULLTEXT INDEX ft_item_name   (name)  WITH PARSER ngram",
                "ALTER TABLE tag    ADD FULLTEXT INDEX ft_tag_name    (name)  WITH PARSER ngram"
        },
        executionPhase = Sql.ExecutionPhase.BEFORE_TEST_CLASS,
        config = @SqlConfig(errorMode = SqlConfig.ErrorMode.CONTINUE_ON_ERROR)
)

class SearchIntegrationTest {

    private static final Logger TEST_LOG = LoggerFactory.getLogger("IT_REPORT");
    private static final long SUITE_START = System.currentTimeMillis();

    @Autowired SearchService     searchService;
    @Autowired UserRepository    userRepository;
    @Autowired SellerRepository  sellerRepository;
    @Autowired StreamRepository  streamRepository;
    @Autowired ItemRepository    itemRepository;
    @Autowired AuctionRepository auctionRepository;

    private User   sellerUser;
    private Seller seller;
    private Stream stream;

    @BeforeAll
    static void suiteStart() {
        TEST_LOG.info("");
        TEST_LOG.info("╔══════════════════════════════════════════════════════════╗");
        TEST_LOG.info("║         Search 통합 테스트 Suite 시작                    ║");
        TEST_LOG.info("║  Layer  : Service → Repository → MySQL (FULLTEXT)        ║");
        TEST_LOG.info("║  Index  : ft_stream_title / ft_item_name / ft_tag_name   ║");
        TEST_LOG.info("║  Parser : ngram (token_size=2)                           ║");
        TEST_LOG.info("║  시나리오: S-1, I-1 ~ I-4  (2 Group / 5 Cases)          ║");
        TEST_LOG.info("╚══════════════════════════════════════════════════════════╝");
    }

    @AfterAll
    static void suiteEnd() {
        long total = System.currentTimeMillis() - SUITE_START;
        TEST_LOG.info("╔══════════════════════════════════════════════════════════╗");
        TEST_LOG.info("║     Suite 종료  |  총 소요: {}ms{}║",
                total, " ".repeat(Math.max(0, 22 - String.valueOf(total).length())));
        TEST_LOG.info("╚══════════════════════════════════════════════════════════╝");
    }

    @BeforeEach
    void setUp() {
        sellerUser = userRepository.save(TestFixture.createUser("판매자"));
        seller     = sellerRepository.save(TestFixture.createSeller(sellerUser));
        stream     = streamRepository.save(TestFixture.createStream("나이키 특가 방송", seller));
    }

    @AfterEach
    void tearDown() {
        auctionRepository.deleteAllInBatch();
        itemRepository.deleteAllInBatch();
        streamRepository.deleteAllInBatch();
        sellerRepository.deleteAllInBatch();
        userRepository.deleteAllInBatch();
    }

    // ═══ Group 1 : Smoke ════════════════════════════════════════
    @Nested @Order(1)
    @DisplayName("Group 1 │ Smoke — 기본 응답 보장")
    @ExtendWith(IntegrationTestExtension.class)
    @TestMethodOrder(MethodOrderer.OrderAnnotation.class)
    class Smoke {

        @BeforeAll static void groupStart() {
            TEST_LOG.info("");
            TEST_LOG.info("┌──────────────────────────────────────────────────────────");
            TEST_LOG.info("│ 🔥 Smoke │ Search 기본 동작 보장");
            TEST_LOG.info("│  검증 목표: 유효 keyword → 예외 없이 List 반환");
            TEST_LOG.info("└──────────────────────────────────────────────────────────");
        }

        @Test @Order(1)
        @DisplayName("S-1. 유효 keyword → 예외 없이 결과 반환")
        void search_validKeyword_noException() {
            TEST_LOG.info("    [요청] keyword = \"나이키\" | stream = \"나이키 특가 방송\" DB 삽입됨");

            List<StreamSearchResult> result = searchService.search("나이키");

            assertThat(result).isNotNull();
            TEST_LOG.info("    [검증] ✔ null 아님 확인 | 건수 = {}", result.size());
            TEST_LOG.info("    [해소] FULLTEXT 검색 전 경로 예외 없이 동작 보장");
        }
    }

    // ═══ Group 2 : Step-up ══════════════════════════════════════
    @Nested @Order(2)
    @DisplayName("Group 2 │ Step-up — FULLTEXT 매칭 · 중복 제거")
    @ExtendWith(IntegrationTestExtension.class)
    @TestMethodOrder(MethodOrderer.OrderAnnotation.class)
    class StepUp {

        @BeforeAll static void groupStart() {
            TEST_LOG.info("");
            TEST_LOG.info("┌──────────────────────────────────────────────────────────");
            TEST_LOG.info("│ 📦 Step-up │ FULLTEXT 매칭 + 중복 제거");
            TEST_LOG.info("│  검증 목표: ngram INDEX 실제 동작 + reason 누적 보장");
            TEST_LOG.info("└──────────────────────────────────────────────────────────");
        }

        @Test @Order(1)
        @DisplayName("I-1. 공백 keyword → early return (DB 미조회)")
        void search_blank_returnsEmpty() {
            TEST_LOG.info("    [요청] keyword = \"   \"");

            assertThat(searchService.search("   ")).isEmpty();
            TEST_LOG.info("    [검증] ✔ 빈 리스트 반환 (early return)");
        }

        @Test @Order(2)
        @DisplayName("I-2. FULLTEXT 특수기호만 → empty (DB 미조회)")
        void search_specialChars_returnsEmpty() {
            TEST_LOG.info("    [요청] keyword = \"+-><()~*\"");

            assertThat(searchService.search("+-><()~*")).isEmpty();
            TEST_LOG.info("    [검증] ✔ 특수기호 제거 후 empty → 빈 리스트");
        }

        @Test @Order(3)
        @DisplayName("I-3. 방송 제목 FULLTEXT 매칭 → 결과 반환 + STREAM_TITLE reason")
        void search_byStreamTitle_matchesAndAddsReason() {
            TEST_LOG.info("    [요청] keyword = \"나이키\" | \"나이키 특가 방송\" DB 존재");

            List<StreamSearchResult> results = searchService.search("나이키");

            assertThat(results).isNotEmpty();
            TEST_LOG.info("    [검증] ✔ 결과 {}건 반환", results.size());
            boolean hasStreamTitle = results.stream()
                    .flatMap(r -> r.matchReasons().stream())
                    .anyMatch(r -> r.type() == MatchType.STREAM_TITLE);
            assertThat(hasStreamTitle).isTrue();
            TEST_LOG.info("    [검증] ✔ STREAM_TITLE reason 포함 확인");
            TEST_LOG.info("    [해소] ft_stream_title ngram FULLTEXT 실제 동작 보장");
        }

        @Test @Order(4)
        @DisplayName("I-4. 방송제목 + 아이템명 동시 매칭 → 1건 병합 + reasons 2개")
        void search_titleAndItemMatch_mergedWithMultipleReasons() {
            Item item = itemRepository.save(TestFixture.createItem("나이키 운동화"));
            auctionRepository.save(TestFixture.createAuction(AuctionType.BOTTOM_UP, READY, stream, item));

            TEST_LOG.info("    [요청] keyword = \"나이키\" | stream title + item name 모두 매칭");

            List<StreamSearchResult> results = searchService.search("나이키");

            assertThat(results).hasSize(1);
            TEST_LOG.info("    [검증] ✔ 결과 1건 (중복 streamId 제거 확인)");
            assertThat(results.get(0).matchReasons())
                    .hasSizeGreaterThanOrEqualTo(2)
                    .extracting(MatchReason::type)
                    .contains(MatchType.STREAM_TITLE, MatchType.ITEM_NAME);
            TEST_LOG.info("    [검증] ✔ STREAM_TITLE + ITEM_NAME reason 모두 포함");
            TEST_LOG.info("    [해소] LinkedHashMap 중복 제거 + reason 누적 실제 동작 보장");
        }
    }
}
