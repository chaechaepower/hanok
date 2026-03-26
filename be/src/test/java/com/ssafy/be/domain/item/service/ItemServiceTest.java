package com.ssafy.be.domain.item.service;

import com.ssafy.be.domain.auction.repository.AuctionRepository;
import com.ssafy.be.domain.item.dto.request.ItemRegisterRequest;
import com.ssafy.be.domain.item.dto.request.ItemUpdateRequest;
import com.ssafy.be.domain.item.dto.response.ItemRegisterResponse;
import com.ssafy.be.domain.item.dto.response.ItemSummaryResponse;
import com.ssafy.be.domain.item.entity.Item;
import com.ssafy.be.domain.item.entity.ItemCondition;
import com.ssafy.be.domain.item.entity.ItemStatus;
import com.ssafy.be.domain.item.exception.ItemErrorCode;
import com.ssafy.be.domain.item.repository.ItemRepository;
import com.ssafy.be.domain.item.repository.TagRepository;
import com.ssafy.be.domain.seller.entity.Seller;
import com.ssafy.be.domain.seller.exception.SellerErrorCode;
import com.ssafy.be.domain.seller.repository.SellerRepository;
import com.ssafy.be.domain.user.entity.User;
import com.ssafy.be.domain.user.repository.UserRepository;
import com.ssafy.be.global.exception.GlobalException;
import com.ssafy.be.global.extension.IntegrationTestExtension;
import com.ssafy.be.global.infra.gcs.GcsClient;
import com.ssafy.be.support.annotation.IntegrationTest;
import com.ssafy.be.support.util.TestFixture;
import org.junit.jupiter.api.*;
import org.junit.jupiter.api.extension.ExtendWith;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;

import static com.ssafy.be.domain.item.entity.Category.CLOTHING;
import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.Mockito.atLeastOnce;
import static org.mockito.Mockito.doNothing;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.reset;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@IntegrationTest
@DisplayName("Item 통합 테스트")
@TestClassOrder(ClassOrderer.OrderAnnotation.class)
class ItemServiceTest {

    private static final Logger IT_LOG = LoggerFactory.getLogger("IT_REPORT");
    private static final long SUITE_START = System.currentTimeMillis();

    @Autowired
    private ItemService itemService;
    @Autowired
    private ItemRepository itemRepository;
    @Autowired
    private SellerRepository sellerRepository;
    @Autowired
    private UserRepository userRepository;
    @Autowired
    private TagRepository tagRepository;
    @Autowired
    private AuctionRepository auctionRepository;

    @Autowired
    private GcsClient gcsClient;

    private User user;
    private Seller seller;

    @BeforeAll
    static void suiteStart() {
        IT_LOG.info("");
        IT_LOG.info("╔════════════════════════════════════════════════════════════╗");
        IT_LOG.info("║              Item 통합 테스트 Suite 시작                   ║");
        IT_LOG.info("║              Layer  : Service → DB                       ║");
        IT_LOG.info("╚════════════════════════════════════════════════════════════╝");
    }

    @AfterAll
    static void suiteEnd() {
        long total = System.currentTimeMillis() - SUITE_START;
        IT_LOG.info("╔════════════════════════════════════════════════════════════╗");
        IT_LOG.info("║     Suite 종료  |  총 소요: {}ms{}",
                total, " ".repeat(Math.max(0, 22 - String.valueOf(total).length())));
        IT_LOG.info("╚════════════════════════════════════════════════════════════╝");
    }

    @BeforeEach
    void setUp() throws IOException {
        // S-5 등 doThrow 스텁이 남으면, 다음 테스트 setUp의 when(upload...)가 목 호출 시 그 예외가 터짐
        reset(gcsClient);
        when(gcsClient.uploadItemImage(any(), anyLong(), anyLong())).thenReturn("https://test.example/item.jpg");
        doNothing().when(gcsClient).deleteImage(any());

        user = userRepository.save(TestFixture.createUser("물품 판매자"));
        seller = sellerRepository.save(TestFixture.createBusinessSeller(user));
    }

    @AfterEach
    void cleanup() {
        auctionRepository.deleteAllInBatch();
        tagRepository.deleteAllInBatch();
        itemRepository.deleteAllInBatch();
        sellerRepository.deleteAllInBatch();
        userRepository.deleteAllInBatch();
    }

    @Nested
    @Order(1)
    @DisplayName("Section 1 │ 물품 등록 (register)")
    @ExtendWith(IntegrationTestExtension.class)
    @TestMethodOrder(MethodOrderer.OrderAnnotation.class)
    class RegisterTest {

        @BeforeEach
        void groupStart() {
            IT_LOG.info("");
            IT_LOG.info("┌──────────────────────────────────────────────────────────");
            IT_LOG.info("│ 📦 Section 1 │ register");
            IT_LOG.info("└──────────────────────────────────────────────────────────");
        }

        @Test
        @Order(1)
        @DisplayName("S-1. 판매자 등록이 없으면 상품을 등록할 수 없다.")
        void register_whenSellerMissing_throws() {
            // given
            User buyerOnly = userRepository.save(TestFixture.createUser("판매자 아님"));
            ItemRegisterRequest request = new ItemRegisterRequest(
                    "상품", "설명", CLOTHING, ItemCondition.BRAND_NEW, null);

            // when & then
            GlobalException exception = assertThrows(GlobalException.class,
                    () -> itemService.register(buyerOnly.getId(), request, null));
            assertThat(exception.getErrorCode()).isEqualTo(SellerErrorCode.SELLER_NOT_FOUND);
            IT_LOG.info("    [검증] ✔ SELLER_NOT_FOUND");
        }

        @Test
        @Order(2)
        @DisplayName("S-2. 태그 없이 등록할 수 있다.")
        void register_withoutTags_persists() {
            // given
            ItemRegisterRequest request = new ItemRegisterRequest(
                    "노태그상품", "설명", CLOTHING, ItemCondition.OPEN_BOX, null);

            // when
            ItemRegisterResponse response = itemService.register(user.getId(), request, null);

            // then
            assertThat(response.status()).isEqualTo(ItemStatus.READY);
            assertThat(itemRepository.findById(response.itemId())).hasValueSatisfying(saved ->
                    assertThat(saved.getName()).isEqualTo("노태그상품"));
            IT_LOG.info("    [검증] ✔ READY 저장");
        }

        @Test
        @Order(3)
        @DisplayName("S-3. 태그와 함께 등록하면 조회 시 태그명이 노출된다.")
        void register_withTags_persistsTags() {
            // given
            ItemRegisterRequest request = new ItemRegisterRequest(
                    "태그상품", "설명", CLOTHING, ItemCondition.BRAND_NEW, List.of("빈티지", "한정"));

            // when
            itemService.register(user.getId(), request, null);

            // then
            List<ItemSummaryResponse> summaries = itemService.getItems(user.getId(), null);
            assertThat(summaries).hasSize(1);
            assertThat(summaries.getFirst().tags()).containsExactlyInAnyOrder("빈티지", "한정");
            IT_LOG.info("    [검증] ✔ 태그 저장·조회");
        }

        @Test
        @Order(4)
        @DisplayName("S-4. 이미지 첨부 시 GCS 업로드 URL이 요약에 포함")
        void register_withImages_uploadsViaGcs() throws Exception {
            // given
            ItemRegisterRequest request = new ItemRegisterRequest(
                    "이미지상품", "설명", CLOTHING, ItemCondition.BRAND_NEW, null);

            List<MultipartFile> images = List.of(
                    new MockMultipartFile("img", "a.jpg", "image/jpeg", new byte[]{1, 2, 3}));

            // when
            itemService.register(user.getId(), request, images);

            // then
            verify(gcsClient).uploadItemImage(any(), anyLong(), anyLong());
            List<ItemSummaryResponse> summaries = itemService.getItems(user.getId(), null);
            assertThat(summaries.getFirst().images()).contains("https://test.example/item.jpg");

            IT_LOG.info("    [검증] ✔ GCS 업로드·이미지 URL");
        }

        @Test
        @Order(5)
        @DisplayName("S-5. GCS 업로드 실패 시 FILE_UPLOAD_FAILED")
        void register_whenGcsFails_throws() throws Exception {
            // given
            doThrow(new IOException("network")).when(gcsClient).uploadItemImage(any(), anyLong(), anyLong());

            ItemRegisterRequest request = new ItemRegisterRequest(
                    "실패상품", "설명", CLOTHING, ItemCondition.BRAND_NEW, null);

            List<MultipartFile> images = List.of(
                    new MockMultipartFile("img", "a.jpg", "image/jpeg", new byte[]{1}));

            // when & then
            assertThatThrownBy(() -> itemService.register(user.getId(), request, images))
                    .isInstanceOf(GlobalException.class)
                    .satisfies(exception ->
                            assertThat(((GlobalException) exception).getErrorCode()).isEqualTo(ItemErrorCode.FILE_UPLOAD_FAILED));

            IT_LOG.info("    [검증] ✔ FILE_UPLOAD_FAILED");
        }
    }

    @Nested
    @Order(2)
    @DisplayName("Section 2 │ 물품 목록 (getItems)")
    @ExtendWith(IntegrationTestExtension.class)
    @TestMethodOrder(MethodOrderer.OrderAnnotation.class)
    class GetItemsTest {

        @BeforeEach
        void groupStart() {
            IT_LOG.info("");
            IT_LOG.info("┌──────────────────────────────────────────────────────────");
            IT_LOG.info("│ 📦 Section 2 │ getItems");
            IT_LOG.info("└──────────────────────────────────────────────────────────");
        }

        @Test
        @Order(1)
        @DisplayName("S-6. 등록 물품이 없으면 빈 목록")
        void getItems_whenEmpty_returnsEmpty() {
            // when
            List<ItemSummaryResponse> summaries = itemService.getItems(user.getId(), null);

            // then
            assertThat(summaries).isEmpty();

            IT_LOG.info("    [검증] ✔ 빈 목록");
        }

        @Test
        @Order(2)
        @DisplayName("S-7. status null이면 판매자 물품 전부")
        void getItems_whenStatusNull_returnsAll() {
            // given
            itemService.register(user.getId(), new ItemRegisterRequest(
                    "A", "d", CLOTHING, ItemCondition.BRAND_NEW, null), null);
            itemService.register(user.getId(), new ItemRegisterRequest(
                    "B", "d", CLOTHING, ItemCondition.USED, null), null);

            // when
            List<ItemSummaryResponse> summaries = itemService.getItems(user.getId(), null);

            // then
            assertThat(summaries).hasSize(2);
            assertThat(summaries.stream().map(ItemSummaryResponse::name)).containsExactlyInAnyOrder("A", "B");

            IT_LOG.info("    [검증] ✔ 2건 조회");
        }

        @Test
        @Order(3)
        @DisplayName("S-8. READY만 필터")
        void getItems_whenReady_filters() {
            // given
            itemService.register(user.getId(), new ItemRegisterRequest(
                    "판매대기", "d", CLOTHING, ItemCondition.BRAND_NEW, null), null);

            itemRepository.save(TestFixture.createItemSold(seller));

            // when
            List<ItemSummaryResponse> readyOnly = itemService.getItems(user.getId(), ItemStatus.READY);

            // then
            assertThat(readyOnly).hasSize(1);
            assertThat(readyOnly.getFirst().name()).isEqualTo("판매대기");

            IT_LOG.info("    [검증] ✔ READY 필터");
        }
    }

    @Nested
    @Order(3)
    @DisplayName("Section 3 │ 물품 수정 (updateItem)")
    @ExtendWith(IntegrationTestExtension.class)
    @TestMethodOrder(MethodOrderer.OrderAnnotation.class)
    class UpdateItemTest {

        @BeforeEach
        void groupStart() {
            IT_LOG.info("");
            IT_LOG.info("┌──────────────────────────────────────────────────────────");
            IT_LOG.info("│ 📦 Section 3 │ updateItem");
            IT_LOG.info("└──────────────────────────────────────────────────────────");
        }

        @Test
        @Order(1)
        @DisplayName("I-1. 소유 물품이 아니면 ITEM_NOT_FOUND")
        void updateItem_whenNotOwned_throws() {
            // given
            ItemRegisterResponse created = itemService.register(user.getId(), new ItemRegisterRequest(
                    "내상품", "d", CLOTHING, ItemCondition.BRAND_NEW, null), null);

            ItemUpdateRequest request = new ItemUpdateRequest("해킹", null, null, null, null, null);

            // when & then
            assertThatThrownBy(() -> itemService.updateItem(user.getId(), created.itemId() + 99_999L, request, null, null, null))
                    .isInstanceOf(GlobalException.class)
                    .satisfies(exception ->
                            assertThat(((GlobalException) exception).getErrorCode()).isEqualTo(ItemErrorCode.ITEM_NOT_FOUND));

            IT_LOG.info("    [검증] ✔ ITEM_NOT_FOUND");
        }

        @Test
        @Order(2)
        @DisplayName("I-2. 이름·설명 갱신 후 조회에 반영")
        void updateItem_fieldsReflected() {
            // given
            ItemRegisterResponse created = itemService.register(user.getId(), new ItemRegisterRequest(
                    "옛이름", "옛설명", CLOTHING, ItemCondition.BRAND_NEW, null), null);
            ItemUpdateRequest request = new ItemUpdateRequest("새이름", "새설명", CLOTHING, ItemCondition.USED, null, null);

            // when
            itemService.updateItem(user.getId(), created.itemId(), request, null, null, null);

            // then
            ItemSummaryResponse row = itemService.getItems(user.getId(), null).getFirst();
            assertThat(row.name()).isEqualTo("새이름");
            assertThat(row.description()).isEqualTo("새설명");
            assertThat(row.itemCondition()).isEqualTo(ItemCondition.USED);
            IT_LOG.info("    [검증] ✔ 필드 갱신");
        }

        @Test
        @Order(3)
        @DisplayName("I-3. tags 지정 시 기존 태그가 교체")
        void updateItem_replacesTags() {
            // given
            ItemRegisterResponse created = itemService.register(user.getId(), new ItemRegisterRequest(
                    "상품", "d", CLOTHING, ItemCondition.BRAND_NEW, List.of("구태그")), null);
            ItemUpdateRequest request = new ItemUpdateRequest(null, null, null, null, List.of("신태그1", "신태그2"), null);

            // when
            itemService.updateItem(user.getId(), created.itemId(), request, null, null, null);

            // then
            assertThat(itemService.getItems(user.getId(), null).getFirst().tags())
                    .containsExactlyInAnyOrder("신태그1", "신태그2");
            IT_LOG.info("    [검증] ✔ 태그 교체");
        }

        @Test
        @Order(4)
        @DisplayName("I-4. images 길이가 3이 아니면 ITEM_UPDATE_IMAGES_INVALID_SIZE")
        void updateItem_whenImagesSizeInvalid_throws() {
            // given
            ItemRegisterResponse created = itemService.register(user.getId(), new ItemRegisterRequest(
                    "상품", "d", CLOTHING, ItemCondition.BRAND_NEW, null), null);
            ItemUpdateRequest request = new ItemUpdateRequest(null, null, null, null, null, List.of("a", "b"));

            // when & then
            assertThatThrownBy(() -> itemService.updateItem(user.getId(), created.itemId(), request, null, null, null))
                    .isInstanceOf(GlobalException.class)
                    .satisfies(exception ->
                            assertThat(((GlobalException) exception).getErrorCode())
                                    .isEqualTo(ItemErrorCode.ITEM_UPDATE_IMAGES_INVALID_SIZE));
            IT_LOG.info("    [검증] ✔ ITEM_UPDATE_IMAGES_INVALID_SIZE");
        }

        @Test
        @Order(5)
        @DisplayName("I-5. images 3슬롯(URL만) 반영")
        void updateItem_withImageUrls() {
            // given
            ItemRegisterResponse created = itemService.register(user.getId(), new ItemRegisterRequest(
                    "상품", "d", CLOTHING, ItemCondition.BRAND_NEW, null), null);
            ItemUpdateRequest request = new ItemUpdateRequest(
                    null, null, null, null, null, List.of("https://cdn/1.png", "https://cdn/2.png", ""));

            // when
            itemService.updateItem(user.getId(), created.itemId(), request, null, null, null);

            // then
            List<String> images = itemService.getItems(user.getId(), null).getFirst().images();
            assertThat(images).contains("https://cdn/1.png", "https://cdn/2.png");
            IT_LOG.info("    [검증] ✔ 이미지 URL 반영");
        }
    }

    @Nested
    @Order(4)
    @DisplayName("Section 4 │ 물품 삭제 (deleteItem)")
    @ExtendWith(IntegrationTestExtension.class)
    @TestMethodOrder(MethodOrderer.OrderAnnotation.class)
    class DeleteItemTest {

        @BeforeEach
        void groupStart() {
            IT_LOG.info("");
            IT_LOG.info("┌──────────────────────────────────────────────────────────");
            IT_LOG.info("│ 📦 Section 4 │ deleteItem");
            IT_LOG.info("└──────────────────────────────────────────────────────────");
        }

        @Test
        @Order(1)
        @DisplayName("I-6. PENDING이면 ITEM_NOT_DELETABLE_LIVE")
        void deleteItem_whenPending_throws() {
            // given
            Item live = itemRepository.save(
                    TestFixture.createItemSold(seller).toBuilder()
                            .name("라이브중")
                            .status(ItemStatus.PENDING)
                            .build());

            // when & then
            assertThatThrownBy(() -> itemService.deleteItem(user.getId(), live.getId()))
                    .isInstanceOf(GlobalException.class)
                    .satisfies(exception ->
                            assertThat(((GlobalException) exception).getErrorCode())
                                    .isEqualTo(ItemErrorCode.ITEM_NOT_DELETABLE_LIVE));
            IT_LOG.info("    [검증] ✔ ITEM_NOT_DELETABLE_LIVE");
        }

        @Test
        @Order(2)
        @DisplayName("I-7. SOLD면 ITEM_NOT_DELETABLE_SOLD")
        void deleteItem_whenSold_throws() {
            // given
            Item sold = itemRepository.save(TestFixture.createItemSold(seller));

            // when & then
            assertThatThrownBy(() -> itemService.deleteItem(user.getId(), sold.getId()))
                    .isInstanceOf(GlobalException.class)
                    .satisfies(exception ->
                            assertThat(((GlobalException) exception).getErrorCode())
                                    .isEqualTo(ItemErrorCode.ITEM_NOT_DELETABLE_SOLD));
            IT_LOG.info("    [검증] ✔ ITEM_NOT_DELETABLE_SOLD");
        }

        @Test
        @Order(3)
        @DisplayName("I-8. READY면 삭제 후 조회 불가")
        void deleteItem_whenReady_removesRow() {
            // given
            ItemRegisterResponse created = itemService.register(user.getId(), new ItemRegisterRequest(
                    "삭제대상", "d", CLOTHING, ItemCondition.BRAND_NEW, null), null);

            // when
            itemService.deleteItem(user.getId(), created.itemId());

            // then
            assertThat(itemRepository.findById(created.itemId())).isEmpty();
            verify(gcsClient, atLeastOnce()).deleteImage(any());
            IT_LOG.info("    [검증] ✔ DB 삭제");
        }
    }
}
