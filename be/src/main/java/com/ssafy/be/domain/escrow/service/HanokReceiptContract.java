package com.ssafy.be.domain.escrow.service;

import org.web3j.abi.TypeReference;
import org.web3j.abi.datatypes.Function;
import org.web3j.abi.datatypes.Type;
import org.web3j.abi.datatypes.Utf8String;
import org.web3j.abi.datatypes.generated.Uint256;
import org.web3j.crypto.Credentials;
import org.web3j.protocol.Web3j;
import org.web3j.protocol.core.methods.response.TransactionReceipt;
import org.web3j.tx.Contract;
import org.web3j.tx.TransactionManager;
import org.web3j.tx.gas.ContractGasProvider;

import java.math.BigInteger;
import java.util.Arrays;
import java.util.Collections;

public class HanokReceiptContract extends Contract {

    private static final String BINARY = "0x";  // 배포 시 필요 없음 (이미 배포됨)

    protected HanokReceiptContract(String contractAddress, Web3j web3j,
                                   Credentials credentials, ContractGasProvider gasProvider) {
        super(BINARY, contractAddress, web3j, credentials, gasProvider);
    }

    protected HanokReceiptContract(String contractAddress, Web3j web3j,
                                   TransactionManager transactionManager, ContractGasProvider gasProvider) {
        super(BINARY, contractAddress, web3j, transactionManager, gasProvider);
    }

    public static HanokReceiptContract load(String contractAddress, Web3j web3j,
                                            Credentials credentials, ContractGasProvider gasProvider) {
        return new HanokReceiptContract(contractAddress, web3j, credentials, gasProvider);
    }

    // mintReceipt(address buyer, uint256 escrowId, uint256 price, string itemName)
    public org.web3j.protocol.core.RemoteFunctionCall<TransactionReceipt> mintReceipt(
            String buyer, BigInteger escrowId, BigInteger price, String itemName) {

        Function function = new Function(
                "mintReceipt",
                Arrays.<Type>asList(
                        new org.web3j.abi.datatypes.Address(160, buyer),
                        new Uint256(escrowId),
                        new Uint256(price),
                        new Utf8String(itemName)
                ),
                Collections.<TypeReference<?>>emptyList()
        );
        return executeRemoteCallTransaction(function);
    }
}