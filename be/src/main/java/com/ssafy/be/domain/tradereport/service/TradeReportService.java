package com.ssafy.be.domain.tradereport.service;

import com.ssafy.be.domain.tradereport.dto.TradeReportListResponse;
import com.ssafy.be.domain.tradereport.entity.TradeType;
import com.ssafy.be.domain.tradereport.repository.TradeReportRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

import static com.ssafy.be.domain.tradereport.entity.TradeType.SETTLEMENT;

@RequiredArgsConstructor
@Service
public class TradeReportService {
    private final TradeReportRepository tradeReportRepository;

    @Transactional(readOnly = true)
    public List<TradeReportListResponse> getAllTradeReports(TradeType type, Long userId) {
        return tradeReportRepository.findByTradeTypeAndUserId(type, userId).stream()
                .map(tradeReport ->
                        TradeReportListResponse.builder()
                                .itemName(type == SETTLEMENT ?
                                        tradeReport.getEscrow().getAuction().getItem().getName() :
                                        null)
                                .amount(tradeReport.getAmount())
                                .createdAt(tradeReport.getCreatedAt())
                                .build()
                ).toList();
    }
}
