package com.ssafy.be.domain.seller.service;

import com.ssafy.be.domain.follow.repository.FollowRepository;
import com.ssafy.be.domain.seller.dto.request.SellerRegisterRequest;
import com.ssafy.be.domain.seller.dto.response.SellerRegisterResponse;
import com.ssafy.be.domain.seller.entity.Seller;
import com.ssafy.be.domain.seller.entity.SellerType;
import com.ssafy.be.domain.seller.exception.SellerErrorCode;
import com.ssafy.be.domain.seller.repository.SellerRepository;
import com.ssafy.be.domain.stream.dto.response.SellerRankingResponse;
import com.ssafy.be.domain.user.entity.User;
import com.ssafy.be.domain.user.exception.UserErrorCode;
import com.ssafy.be.domain.user.repository.UserRepository;
import com.ssafy.be.global.exception.GlobalException;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.BDDMockito.given;
import static org.mockito.BDDMockito.then;
import static org.mockito.Mockito.never;

@ExtendWith(MockitoExtension.class)
class SellerServiceTest {

    @InjectMocks
    private SellerService sellerService;

    @Mock
    private SellerRepository sellerRepository;

    @Mock
    private UserRepository userRepository;

    @Mock private FollowRepository followRepository;

    @Test
    @DisplayName("이미 판매자 등록된 유저는 GlobalException 발생")
    void register_AlreadyExists_ThrowsGlobalException() {
        // given
        given(sellerRepository.existsByUserId(1L)).willReturn(true);

        SellerRegisterRequest request = new SellerRegisterRequest(
                SellerType.INDIVIDUAL, null, "경매왕", "안녕하세요!", "", "", "", null, null, null
        );

        // when & then
        assertThatThrownBy(() -> sellerService.register(1L, request))
                .isInstanceOf(GlobalException.class)
                .satisfies(e -> {
                    GlobalException ge = (GlobalException) e;
                    assertThat(ge.getErrorCode()).isEqualTo(SellerErrorCode.SELLER_ALREADY_EXISTS);
                });
    }

    @Test
    @DisplayName("존재하지 않는 유저로 판매자 등록 시 GlobalException 발생")
    void register_UserNotFound_ThrowsGlobalException() {
        // given
        given(sellerRepository.existsByUserId(1L)).willReturn(false);
        given(userRepository.findById(1L)).willReturn(Optional.empty());

        SellerRegisterRequest request = new SellerRegisterRequest(
                SellerType.INDIVIDUAL, null, "경매왕", "안녕하세요!", "", "", "", null, null, null
        );

        // when & then
        assertThatThrownBy(() -> sellerService.register(1L, request))
                .isInstanceOf(GlobalException.class)
                .satisfies(e -> {
                    GlobalException ge = (GlobalException) e;
                    assertThat(ge.getErrorCode()).isEqualTo(UserErrorCode.USER_NOT_FOUND);
                });
    }

    @Test
    @DisplayName("정상 판매자 등록 시 sellerId와 nickname 반환")
    void register_ValidRequest_Success() {
        // given
        User mockUser = User.createUser("test@test.com", "encodedPw", "경매왕", "01012345678");
        Seller mockSeller = Seller.builder()
                .intro("안녕하세요!")
                .type(SellerType.INDIVIDUAL)
                .penaltyCount(0)
                .user(mockUser)
                .build();

        given(sellerRepository.existsByUserId(1L)).willReturn(false);
        given(userRepository.findById(1L)).willReturn(Optional.of(mockUser));
        given(sellerRepository.save(any(Seller.class))).willReturn(mockSeller);

        SellerRegisterRequest request = new SellerRegisterRequest(
                SellerType.INDIVIDUAL, null, "경매왕", "안녕하세요!", "", "", "", null, null, null
        );

        // when
        SellerRegisterResponse response = sellerService.register(1L, request);

        // then
        assertThat(response.nickname()).isEqualTo("경매왕");
    }

    @Test
    @DisplayName("팔로워 수 기준 상위 5명 rank 순서대로 반환")
    void getTopSellers_success() {
        User mockUser = User.createUser("top@test.com", "pw", "스니커즈마켓", "01012345678");
        Seller mockSeller = Seller.builder()
                .intro("인기 셀러").type(SellerType.INDIVIDUAL).penaltyCount(0).user(mockUser).build();


        ReflectionTestUtils.setField(mockSeller, "id", 1L);

        List<Object[]> mockRows = new ArrayList<>();
        mockRows.add(new Object[]{1L, 1024L});

        given(followRepository.findTopSellerIdsByFollowerCount(any())).willReturn(mockRows);
        given(sellerRepository.findAllByIdInWithUser(List.of(1L))).willReturn(List.of(mockSeller));

        List<SellerRankingResponse> result = sellerService.getTopSellers();

        assertThat(result).hasSize(1);
        assertThat(result.get(0).rank()).isEqualTo(1);
        assertThat(result.get(0).followerCount()).isEqualTo(1024L);
        assertThat(result.get(0).nickname()).isEqualTo("스니커즈마켓");
    }


    @Test
        @DisplayName("팔로우 데이터 없을 시 빈 리스트 반환")
        void getTopSellers_empty() {
            // given
            given(followRepository.findTopSellerIdsByFollowerCount(any()))
                    .willReturn(List.of());

            // when
            List<SellerRankingResponse> result = sellerService.getTopSellers();

            // then
            assertThat(result).isEmpty();
            then(sellerRepository).should(never()).findAllByIdInWithUser(any());
        }
    }
