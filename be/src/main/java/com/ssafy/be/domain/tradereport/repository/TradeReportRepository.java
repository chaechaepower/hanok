package com.ssafy.be.domain.tradereport.repository;

import com.ssafy.be.domain.tradereport.entity.TradeReport;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface TradeReportRepository extends JpaRepository<TradeReport,Long> {
}
