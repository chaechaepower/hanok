package com.ssafy.be.domain.escrow.service;

import com.ssafy.be.domain.escrow.entity.Escrow;
import com.ssafy.be.domain.escrow.exception.EscorwErrorCode;
import com.ssafy.be.domain.escrow.repository.EscrowRepository;
import com.ssafy.be.global.exception.GlobalException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.web3j.crypto.Credentials;
import org.web3j.protocol.Web3j;
import org.web3j.protocol.core.methods.response.TransactionReceipt;
import org.web3j.protocol.http.HttpService;
import org.web3j.tx.gas.DefaultGasProvider;

import java.math.BigInteger;

@Slf4j
@RequiredArgsConstructor
@Service
public class BlockchainService {

    private final EscrowRepository escrowRepository;

    @Value("${blockchain.rpc-url}")
    private String rpcUrl;

    @Value("${blockchain.private-key}")
    private String privateKey;

    @Value("${blockchain.contract-address}")
    private String contractAddress;

    @Async
    public void issueNFTReceiptAsync(Long escrowId) {
        Escrow escrow = escrowRepository.findById(escrowId)
                .orElseThrow(() -> new GlobalException(EscorwErrorCode.ESCROW_NOT_FOUND));

        try {
            Web3j web3j = Web3j.build(new HttpService(rpcUrl));
            Credentials credentials = Credentials.create(privateKey);

            HanokReceiptContract contract = HanokReceiptContract.load(
                    contractAddress,
                    web3j,
                    credentials,
                    new DefaultGasProvider()
            );

            String buyerAddress = credentials.getAddress(); // 임시: 서버 지갑 주소 사용
            BigInteger escrowIdBig = BigInteger.valueOf(escrowId);
            BigInteger price = BigInteger.valueOf(escrow.getWinningPrice());
            String itemName = escrow.getAuction().getItem().getName();

            TransactionReceipt receipt = contract.mintReceipt(
                    buyerAddress,
                    escrowIdBig,
                    price,
                    itemName
            ).send();

            escrow.completeMinting(receipt.getTransactionHash());
            log.info("[Blockchain] NFT 민팅 성공 escrowId={} txHash={}", escrowId, receipt.getTransactionHash());

        } catch (Exception e) {
            escrow.failMinting();
            log.error("[Blockchain] NFT 민팅 실패 escrowId={} error={}", escrowId, e.getMessage());
        }

        escrowRepository.save(escrow);
    }
}