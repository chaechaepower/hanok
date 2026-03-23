package com.ssafy.be.domain.escrow.service;

import com.ssafy.be.domain.escrow.entity.Escrow;
import com.ssafy.be.domain.escrow.exception.EscorwErrorCode;
import com.ssafy.be.domain.escrow.repository.EscrowRepository;
import com.ssafy.be.global.exception.GlobalException;
import jakarta.annotation.PostConstruct;
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
    private Credentials credentials;

    @Value("${blockchain.rpc-url}")
    private String rpcUrl;

    @Value("${blockchain.private-key}")
    private String privateKey;

    @Value("${blockchain.contract-address}")
    private String contractAddress;

    private HanokReceiptContract contract;

    // 서버 시작 시 한 번만 Contract 초기화
    @PostConstruct
    public void initContract() {
        Web3j web3j = Web3j.build(new HttpService(rpcUrl));
        this.credentials = Credentials.create(privateKey);
        this.contract = HanokReceiptContract.load(
                contractAddress,
                web3j,
                this.credentials,
                new DefaultGasProvider()
        );
        log.info("[Blockchain] Contract 초기화 완료 address={}", contractAddress);
    }

    @Async
    public void issueNFTReceiptAsync(Long escrowId) {
        Escrow escrow = escrowRepository.findById(escrowId)
                .orElseThrow(() -> new GlobalException(EscorwErrorCode.ESCROW_NOT_FOUND));

        try {
            String buyerAddress = credentials != null
                    ? credentials.getAddress()
                    : "0x0000000000000000000000000000000000000000";
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

    // 테스트용 Contract 주입
    public void setContract(HanokReceiptContract contract) {
        this.contract = contract;
    }
}