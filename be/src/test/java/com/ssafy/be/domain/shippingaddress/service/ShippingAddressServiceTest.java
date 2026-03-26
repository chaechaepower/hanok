package com.ssafy.be.domain.shippingaddress.service;

import com.ssafy.be.domain.shippingaddress.dto.request.ShippingAddressRequest;
import com.ssafy.be.domain.shippingaddress.dto.response.ShippingAddressResponse;
import com.ssafy.be.domain.shippingaddress.entity.ShippingAddress;
import com.ssafy.be.domain.shippingaddress.exception.ShippingAddressErrorCode;
import com.ssafy.be.domain.shippingaddress.repository.ShippingAddressRepository;
import com.ssafy.be.domain.user.entity.User;
import com.ssafy.be.domain.user.exception.UserErrorCode;
import com.ssafy.be.domain.user.repository.UserRepository;
import com.ssafy.be.global.exception.GlobalException;
import com.ssafy.be.global.extension.IntegrationTestExtension;
import com.ssafy.be.support.annotation.IntegrationTest;
import com.ssafy.be.support.util.TestFixture;
import org.junit.jupiter.api.*;
import org.junit.jupiter.api.extension.ExtendWith;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.junit.jupiter.api.Assertions.assertThrows;

@IntegrationTest
@DisplayName("ShippingAddress 통합 테스트")
@TestClassOrder(ClassOrderer.OrderAnnotation.class)
class ShippingAddressServiceTest {

    private static final Logger IT_LOG = LoggerFactory.getLogger("IT_REPORT");
    private static final long SUITE_START = System.currentTimeMillis();

    @Autowired
    private ShippingAddressService shippingAddressService;
    @Autowired
    private ShippingAddressRepository shippingAddressRepository;
    @Autowired
    private UserRepository userRepository;

    private User user;

    @BeforeAll
    static void suiteStart() {
        IT_LOG.info("");
        IT_LOG.info("╔════════════════════════════════════════════════════════════╗");
        IT_LOG.info("║         ShippingAddress 통합 테스트 Suite 시작              ║");
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
    void setUp() {
        user = userRepository.save(TestFixture.createUser("배송지 유저"));
    }

    @AfterEach
    void cleanup() {
        shippingAddressRepository.deleteAllInBatch();
        userRepository.deleteAllInBatch();
    }

    @Nested
    @Order(1)
    @DisplayName("Section 1 │ 배송지 등록 (addAddress)")
    @ExtendWith(IntegrationTestExtension.class)
    @TestMethodOrder(MethodOrderer.OrderAnnotation.class)
    class AddAddressTest {

        @BeforeEach
        void groupStart() {
            IT_LOG.info("");
            IT_LOG.info("┌──────────────────────────────────────────────────────────");
            IT_LOG.info("│ 📦 Section 1 │ addAddress");
            IT_LOG.info("└──────────────────────────────────────────────────────────");
        }

        @Test
        @Order(1)
        @DisplayName("S-1. 존재하지 않는 userId면 USER_NOT_FOUND")
        void addAddress_whenUserMissing_throws() {
            // given
            long unknownUserId = user.getId() + 1000000;

            ShippingAddressRequest request = new ShippingAddressRequest(
                    "우리집",
                    12345,
                    "서울시 강남구 테헤란로 1",
                    "101호",
                    "010-1234-5678",
                    "홍길동",
                    false);

            // when & then
            GlobalException exception = assertThrows(GlobalException.class,
                    () -> shippingAddressService.addAddress(unknownUserId, request));
            assertThat(exception.getErrorCode()).isEqualTo(UserErrorCode.USER_NOT_FOUND);

            IT_LOG.info("    [검증] ✔ USER_NOT_FOUND");
        }

        @Test
        @Order(2)
        @DisplayName("S-2. 정상 등록 시 응답 필드·DB 저장")
        void addAddress_success() {
            // given
            ShippingAddressRequest request = new ShippingAddressRequest(
                    "우리집",
                    12345,
                    "서울시 강남구 테헤란로 1",
                    "101호",
                    "010-1234-5678",
                    "홍길동",
                    false);

            // when
            ShippingAddressResponse response = shippingAddressService.addAddress(user.getId(), request);

            // then
            assertThat(response.addressName()).isEqualTo("우리집");
            assertThat(response.postalCode()).isEqualTo(12345);
            assertThat(response.address()).isEqualTo("서울시 강남구 테헤란로 1");
            assertThat(response.addressDetail()).isEqualTo("101호");
            assertThat(response.phone()).isEqualTo("010-1234-5678");
            assertThat(response.recipientName()).isEqualTo("홍길동");
            assertThat(response.isDefault()).isFalse();
            assertThat(shippingAddressRepository.findById(response.id())).hasValueSatisfying(saved ->
                    assertThat(saved.getAddressName()).isEqualTo("우리집"));

            IT_LOG.info("    [검증] ✔ 응답 매핑 및 DB 저장");
        }

        @Test
        @Order(3)
        @DisplayName("S-3. 기본 배송지로 등록하면 기존 기본 배송지 isDefault 해제")
        void addAddress_whenNewDefault_unsetsPrevious() {
            // given
            ShippingAddress previous = shippingAddressRepository.save(ShippingAddress.builder()
                    .addressName("이전 기본")
                    .postalCode(11111)
                    .address("주소1")
                    .addressDetail("상세1")
                    .phone("010-1111-1111")
                    .recipientName("A")
                    .isDefault(true)
                    .user(user)
                    .build());

            ShippingAddressRequest request = new ShippingAddressRequest(
                    "우리집",
                    12345,
                    "서울시 강남구 테헤란로 1",
                    "101호",
                    "010-1234-5678",
                    "홍길동",
                    true);

            // when
            shippingAddressService.addAddress(user.getId(), request);

            // then
            ShippingAddress reloadedPrevious = shippingAddressRepository.findById(previous.getId()).orElseThrow();
            assertThat(reloadedPrevious.isDefault()).isFalse();
            assertThat(shippingAddressRepository.findByUserIdAndIsDefaultTrue(user.getId()))
                    .hasValueSatisfying(saved -> assertThat(saved.getAddressName()).isEqualTo("우리집"));
            IT_LOG.info("    [검증] ✔ 기존 기본 배송지 unsetDefault 반영");
        }
    }

    @Nested
    @Order(2)
    @DisplayName("Section 2 │ 배송지 목록 (getAddresses)")
    @ExtendWith(IntegrationTestExtension.class)
    @TestMethodOrder(MethodOrderer.OrderAnnotation.class)
    class GetAddressesTest {

        @BeforeEach
        void groupStart() {
            IT_LOG.info("");
            IT_LOG.info("┌──────────────────────────────────────────────────────────");
            IT_LOG.info("│ 📦 Section 2 │ getAddresses");
            IT_LOG.info("└──────────────────────────────────────────────────────────");
        }

        @Test
        @Order(1)
        @DisplayName("S-4. 사용자별 배송지 목록을 응답 DTO로 반환")
        void getAddresses_mapsAll() {
            // given
            shippingAddressRepository.save(TestFixture.createShippingAddressHome(user));

            ShippingAddress secondAddress = shippingAddressRepository.save(
                    TestFixture.createShippingAddressWoori(user).toBuilder()
                            .addressName("임시")
                            .address("서울시 강남구")
                            .addressDetail("102")
                            .phone("010-0000-0002")
                            .recipientName("B")
                            .build());

            secondAddress.update("회사", null, "서울시 종로구", null, null, null, false);
            shippingAddressRepository.save(secondAddress);

            // when
            List<ShippingAddressResponse> responses = shippingAddressService.getAddresses(user.getId());

            // then
            assertThat(responses).hasSize(2);
            assertThat(responses.stream().filter(ShippingAddressResponse::isDefault)).hasSize(1);
            assertThat(responses.stream().anyMatch(addressResponse ->
                    addressResponse.addressName().equals("회사") && addressResponse.address().equals("서울시 종로구")))
                    .isTrue();

            IT_LOG.info("    [검증] ✔ 목록 크기·필드 매핑");
        }
    }

    @Nested
    @Order(3)
    @DisplayName("Section 3 │ 배송지 수정 (updateAddress)")
    @ExtendWith(IntegrationTestExtension.class)
    @TestMethodOrder(MethodOrderer.OrderAnnotation.class)
    class UpdateAddressTest {

        @BeforeEach
        void groupStart() {
            IT_LOG.info("");
            IT_LOG.info("┌──────────────────────────────────────────────────────────");
            IT_LOG.info("│ 📦 Section 3 │ updateAddress");
            IT_LOG.info("└──────────────────────────────────────────────────────────");
        }

        @Test
        @Order(1)
        @DisplayName("I-1. 본인 소유가 아니거나 없으면 ADDRESS_NOT_FOUND")
        void updateAddress_whenMissing_throws() {
            // given
            ShippingAddressRequest request = new ShippingAddressRequest(
                    "우리집",
                    12345,
                    "서울시 강남구 테헤란로 1",
                    "101호",
                    "010-1234-5678",
                    "홍길동",
                    false);

            // when & then
            assertThatThrownBy(() -> shippingAddressService.updateAddress(user.getId(), 9_999_999L, request))
                    .isInstanceOf(GlobalException.class)
                    .satisfies(exception -> assertThat(((GlobalException) exception).getErrorCode())
                            .isEqualTo(ShippingAddressErrorCode.ADDRESS_NOT_FOUND));

            IT_LOG.info("    [검증] ✔ ADDRESS_NOT_FOUND");
        }

        @Test
        @Order(2)
        @DisplayName("I-2. 정상 수정 시 엔티티 필드 갱신")
        void updateAddress_success() {
            // given
            ShippingAddress existing = shippingAddressRepository.save(TestFixture.createShippingAddressWoori(user));
            ShippingAddressRequest request = new ShippingAddressRequest(
                    "새이름", 99999, "부산시", "상세2", "010-9999-9999", "김철수", false);

            // when
            ShippingAddressResponse response = shippingAddressService.updateAddress(user.getId(), existing.getId(), request);

            // then
            assertThat(response.addressName()).isEqualTo("새이름");
            assertThat(response.postalCode()).isEqualTo(99999);
            assertThat(response.address()).isEqualTo("부산시");
            assertThat(response.addressDetail()).isEqualTo("상세2");
            assertThat(response.phone()).isEqualTo("010-9999-9999");
            assertThat(response.recipientName()).isEqualTo("김철수");
            assertThat(shippingAddressRepository.findById(existing.getId())).hasValueSatisfying(reloaded ->
                    assertThat(reloaded.getAddressName()).isEqualTo("새이름"));

            IT_LOG.info("    [검증] ✔ 엔티티·응답 반영");
        }

        @Test
        @Order(3)
        @DisplayName("I-3. 기본 배송지로 바꾸면 다른 기본 배송지 해제")
        void updateAddress_whenSetDefault_unsetsOther() {
            // given
            ShippingAddress otherDefault = shippingAddressRepository.save(
                    TestFixture.createShippingAddressWoori(user).toBuilder()
                            .addressName("기존기본")
                            .postalCode(10000)
                            .address("addr1")
                            .addressDetail("d1")
                            .phone("010-1111-1111")
                            .recipientName("X")
                            .isDefault(true)
                            .build());

            ShippingAddress target = shippingAddressRepository.save(
                    TestFixture.createShippingAddressWoori(user).toBuilder()
                            .addressName("타겟")
                            .postalCode(20000)
                            .address("addr2")
                            .addressDetail("d2")
                            .phone("010-2222-2222")
                            .recipientName("Y")
                            .build());

            ShippingAddressRequest request = new ShippingAddressRequest(
                    "타겟",
                    20000,
                    "addr2",
                    "d2",
                    "010-2222-2222",
                    "Y",
                    true);

            // when
            shippingAddressService.updateAddress(user.getId(), target.getId(), request);

            // then
            assertThat(shippingAddressRepository.findById(otherDefault.getId()).orElseThrow().isDefault()).isFalse();
            assertThat(shippingAddressRepository.findById(target.getId()).orElseThrow().isDefault()).isTrue();
            IT_LOG.info("    [검증] ✔ 단일 기본 배송지 유지");
        }
    }

    @Nested
    @Order(4)
    @DisplayName("Section 4 │ 배송지 삭제 (deleteAddress)")
    @ExtendWith(IntegrationTestExtension.class)
    @TestMethodOrder(MethodOrderer.OrderAnnotation.class)
    class DeleteAddressTest {

        @BeforeEach
        void groupStart() {
            IT_LOG.info("");
            IT_LOG.info("┌──────────────────────────────────────────────────────────");
            IT_LOG.info("│ 📦 Section 4 │ deleteAddress");
            IT_LOG.info("└──────────────────────────────────────────────────────────");
        }

        @Test
        @Order(1)
        @DisplayName("I-4. 없으면 ADDRESS_NOT_FOUND")
        void deleteAddress_whenMissing_throws() {
            // when & then
            assertThatThrownBy(() -> shippingAddressService.deleteAddress(user.getId(), 9_999_999L))
                    .isInstanceOf(GlobalException.class)
                    .satisfies(exception -> assertThat(((GlobalException) exception).getErrorCode())
                            .isEqualTo(ShippingAddressErrorCode.ADDRESS_NOT_FOUND));
            IT_LOG.info("    [검증] ✔ ADDRESS_NOT_FOUND");
        }

        @Test
        @Order(2)
        @DisplayName("I-5. 정상 삭제 시 DB에서 제거")
        void deleteAddress_success() {
            // given
            ShippingAddress existing = shippingAddressRepository.save(TestFixture.createShippingAddressWoori(user));

            // when
            shippingAddressService.deleteAddress(user.getId(), existing.getId());

            // then
            assertThat(shippingAddressRepository.findById(existing.getId())).isEmpty();
            IT_LOG.info("    [검증] ✔ DB에서 삭제 확인");
        }
    }
}
