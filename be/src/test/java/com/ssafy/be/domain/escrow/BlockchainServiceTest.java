package com.ssafy.be.domain.escrow;

import com.ssafy.be.domain.auction.entity.Auction;
import com.ssafy.be.domain.escrow.entity.Escrow;
import com.ssafy.be.domain.escrow.repository.EscrowRepository;
import com.ssafy.be.domain.escrow.service.BlockchainService;
import com.ssafy.be.domain.escrow.service.HanokReceiptContract;
import com.ssafy.be.domain.item.entity.Item;
import com.ssafy.be.global.exception.GlobalException;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
import org.web3j.protocol.core.RemoteFunctionCall;
import org.web3j.protocol.core.methods.response.TransactionReceipt;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
@DisplayName("BlockchainService 단위 테스트")
class BlockchainServiceTest {

    @InjectMocks
    private BlockchainService blockchainService;

    @Mock
    private EscrowRepository escrowRepository;

    @Mock
    private HanokReceiptContract hanokReceiptContract;

    private Escrow mockEscrow() {
        Item item = mock(Item.class);
        given(item.getName()).willReturn("테스트 상품");

        Auction auction = mock(Auction.class);
        given(auction.getItem()).willReturn(item);

        Escrow escrow = mock(Escrow.class);
        given(escrow.getId()).willReturn(1L);
        given(escrow.getWinningPrice()).willReturn(10000L);
        given(escrow.getAuction()).willReturn(auction);

        return escrow;
    }

    @Nested
    @DisplayName("issueNFTReceiptAsync()")
    class IssueNFTReceiptAsync {

        @Test
        @DisplayName("민팅 성공 시 completeMinting() 호출 및 저장")
        void success() throws Exception {
            // given
            Escrow escrow = mockEscrow();
            given(escrowRepository.findById(1L)).willReturn(Optional.of(escrow));

            TransactionReceipt receipt = mock(TransactionReceipt.class);
            given(receipt.getTransactionHash()).willReturn("0xabc123");

            RemoteFunctionCall<TransactionReceipt> remoteFunctionCall = mock(RemoteFunctionCall.class);
            given(remoteFunctionCall.send()).willReturn(receipt);
            given(hanokReceiptContract.mintReceipt(any(), any(), any(), any()))
                    .willReturn(remoteFunctionCall);

            blockchainService.setContract(hanokReceiptContract);

            // when
            blockchainService.issueNFTReceiptAsync(1L);

            // then
            verify(escrow).completeMinting("0xabc123");
            verify(escrowRepository).save(escrow);
        }

        @Test
        @DisplayName("민팅 실패 시 failMinting() 호출 및 저장")
        void fail() throws Exception {
            // given
            Escrow escrow = mockEscrow();
            given(escrowRepository.findById(1L)).willReturn(Optional.of(escrow));

            RemoteFunctionCall<TransactionReceipt> remoteFunctionCall = mock(RemoteFunctionCall.class);
            given(remoteFunctionCall.send()).willThrow(new RuntimeException("네트워크 오류"));
            given(hanokReceiptContract.mintReceipt(any(), any(), any(), any()))
                    .willReturn(remoteFunctionCall);

            blockchainService.setContract(hanokReceiptContract);

            // when
            blockchainService.issueNFTReceiptAsync(1L);

            // then
            verify(escrow).failMinting();
            verify(escrowRepository).save(escrow);
        }

        @Test
        @DisplayName("존재하지 않는 escrowId면 GlobalException 발생")
        void escrowNotFound() {
            // given
            given(escrowRepository.findById(999L)).willReturn(Optional.empty());

            // when & then
            assertThrows(GlobalException.class,
                    () -> blockchainService.issueNFTReceiptAsync(999L));
        }
    }
}