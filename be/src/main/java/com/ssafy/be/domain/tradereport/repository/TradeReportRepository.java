package com.ssafy.be.domain.tradereport.repository;

import com.ssafy.be.domain.tradereport.entity.TradeReport;
import com.ssafy.be.domain.tradereport.entity.TradeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TradeReportRepository extends JpaRepository<TradeReport,Long> {

    List<TradeReport> findByTradeTypeAndUserId(TradeType type, Long userId);
}
