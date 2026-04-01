import { useState } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
} from 'recharts';
import { FiTrendingUp, FiTrendingDown, FiAward, FiPackage, FiAlertCircle } from 'react-icons/fi';
import SideBar from '@/components/common/layouts/SideBar';
import { useGetSellerReport } from '@/api/hooks/useGetSellerReport';
import { useGetSellerStatus } from '@/api/hooks/useGetSellerStatus';
import { getCategoryLabel } from '@/constants/category';
import type { TopHotItem } from '@/types';
import { sellerSidebarItems } from '@/constants/sidebar';
import Logo from '@/assets/Logo.png';

const formatPrice = (price: number) => price.toLocaleString('ko-KR') + '원';

const formatAxisValue = (v: number) => {
  const num = Number(v);
  if (num >= 100000000) return `${(num / 100000000).toFixed(num % 100000000 === 0 ? 0 : 1)}억`;
  return `${(num / 10000).toFixed(0)}만`;
};

const AUCTION_COLORS = {
  success: '#C9A96E',
  fail: '#555555',
};

export default function SellerReportPage() {
  const [activeMenu, setActiveMenu] = useState('report');
  const { data: sellerStatus } = useGetSellerStatus();
  const sellerId = sellerStatus?.sellerId ?? 0;
  const { data: report, isLoading } = useGetSellerReport(sellerId);

  if (isLoading || !report) {
    return (
      <div className="w-350 flex mx-auto gap-10 py-10 px-4 min-h-screen text-white">
        <SideBar
          items={sellerSidebarItems}
          activeItemId={activeMenu}
          onItemClick={(item) => setActiveMenu(item.id)}
          className="shrink-0 !pr-4 !pl-0 !py-0 !max-w-none"
        />
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-spin w-8 h-8 border-2 border-gold-light border-t-transparent rounded-full" />
        </div>
      </div>
    );
  }

  const growthPositive = report.trendGraph.growthRate >= 0;

  const auctionPieData = [
    { name: '낙찰 성공', value: report.auctionStats.successfulBids },
    { name: '유찰', value: report.auctionStats.failedBids },
  ];

  const categoryChartData = report.categoryStats.map((c) => ({
    name: getCategoryLabel(c.category),
    매출: c.salesAmount,
    건수: c.salesCount,
  }));

  return (
    <div className="w-350 flex mx-auto gap-10 py-10 px-4 min-h-screen text-white">
      <SideBar
        items={sellerSidebarItems}
        activeItemId={activeMenu}
        onItemClick={(item) => setActiveMenu(item.id)}
        className="shrink-0 !pr-4 !pl-0 !py-0 !max-w-none"
      />
      <div className="flex-1 flex flex-col gap-6 min-w-0 overflow-hidden">
        {/* Header */}
        <div>
          <h2 className="text-[24px] font-semibold text-warm leading-tight m-0 mb-2">판매자 리포트</h2>
          <p className="text-body-md text-neutral-500 m-0">나의 판매 현황을 한눈에 확인하세요</p>
        </div>

        {/* 매출 요약 카드 */}
        <div className="grid grid-cols-4 gap-4">
          <div className="bg-surface-elevated rounded-2xl border border-neutral-800 p-5 flex flex-col gap-2">
            <span className="text-neutral-500 text-sm">총 매출</span>
            <span className="text-xl font-bold text-white">{formatPrice(report.totalSalesAmount)}</span>
          </div>
          <div className="bg-surface-elevated rounded-2xl border border-neutral-800 p-5 flex flex-col gap-2">
            <span className="text-neutral-500 text-sm">총 정산</span>
            <span className="text-xl font-bold text-white">{formatPrice(report.totalSettlementAmount)}</span>
          </div>
          <div className="bg-surface-elevated rounded-2xl border border-neutral-800 p-5 flex flex-col gap-2">
            <span className="text-neutral-500 text-sm">정산 완료</span>
            <span className="text-xl font-bold text-green-400">
              {formatPrice(report.escrowSummary.completedSettlementAmount)}
            </span>
          </div>
          <div className="bg-surface-elevated rounded-2xl border border-neutral-800 p-5 flex flex-col gap-2">
            <span className="text-neutral-500 text-sm">정산 대기</span>
            <span className="text-xl font-bold text-yellow-400">
              {formatPrice(report.escrowSummary.pendingSettlementAmount)}
            </span>
          </div>
        </div>

        {/* 매출 추이 그래프 */}
        <div className="bg-surface-elevated rounded-2xl border border-neutral-800 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-warm m-0">이번 달 매출 추이</h3>
            <div className="flex items-center gap-2">
              {growthPositive ? (
                <FiTrendingUp className="text-green-400" size={18} />
              ) : (
                <FiTrendingDown className="text-red-400" size={18} />
              )}
              <span className={`text-sm font-semibold ${growthPositive ? 'text-green-400' : 'text-red-400'}`}>
                전월 대비 {growthPositive ? '+' : ''}
                {report.trendGraph.growthRate}%
              </span>
            </div>
          </div>
          <div className="flex items-center gap-6 mb-4 text-sm text-neutral-400">
            <span>
              이번 달:{' '}
              <span className="text-white font-semibold">{formatPrice(report.trendGraph.currentMonthTotal)}</span>
            </span>
            <span>
              지난 달: <span className="text-neutral-300">{formatPrice(report.trendGraph.lastMonthTotal)}</span>
            </span>
          </div>
          <div className="w-full h-[260px] overflow-hidden">
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={report.trendGraph.dailySales}>
                <defs>
                  <linearGradient id="salesGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#C9A96E" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#C9A96E" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                <XAxis
                  dataKey="date"
                  stroke="#666"
                  tick={{ fill: '#999', fontSize: 12 }}
                  tickFormatter={(v) => String(v).slice(5)}
                />
                <YAxis
                  stroke="#666"
                  tick={{ fill: '#999', fontSize: 12 }}
                  tickFormatter={(v) => formatAxisValue(Number(v))}
                />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #333', borderRadius: 8 }}
                  labelStyle={{ color: '#999' }}
                  formatter={(value) => [formatPrice(Number(value)), '매출']}
                  labelFormatter={(label) => String(label)}
                />
                <Area type="monotone" dataKey="amount" stroke="#C9A96E" fill="url(#salesGradient)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 중간 2열: 경매 통계 + 거래 지표 */}
        <div className="grid grid-cols-2 gap-4">
          {/* 경매 통계 */}
          <div className="bg-surface-elevated rounded-2xl border border-neutral-800 p-6">
            <h3 className="text-lg font-semibold text-warm m-0 mb-4">경매 통계</h3>
            <div className="flex items-center gap-6">
              <PieChart width={140} height={140}>
                <Pie
                  data={auctionPieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={40}
                  outerRadius={65}
                  dataKey="value"
                  strokeWidth={0}
                >
                  <Cell fill={AUCTION_COLORS.success} />
                  <Cell fill={AUCTION_COLORS.fail} />
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #333', borderRadius: 8 }}
                  formatter={(value, name) => [`${value}건`, String(name)]}
                />
              </PieChart>
              <div className="flex flex-col gap-3 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: AUCTION_COLORS.success }} />
                  <span className="text-neutral-400">낙찰 성공</span>
                  <span className="text-white font-semibold ml-auto">{report.auctionStats.successfulBids}건</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: AUCTION_COLORS.fail }} />
                  <span className="text-neutral-400">유찰</span>
                  <span className="text-white font-semibold ml-auto">{report.auctionStats.failedBids}건</span>
                </div>
                <div className="border-t border-neutral-700 pt-2">
                  <span className="text-neutral-400">총 경매</span>
                  <span className="text-white font-semibold ml-3">{report.auctionStats.totalAuctions}건</span>
                </div>
              </div>
            </div>
          </div>

          {/* 거래 지표 */}
          <div className="bg-surface-elevated rounded-2xl border border-neutral-800 p-6">
            <h3 className="text-lg font-semibold text-warm m-0 mb-4">거래 지표</h3>
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <span className="text-neutral-400 text-sm">거래 성사율</span>
                <span className="text-2xl font-bold text-gold-light">{report.transactionStats.completionRate}%</span>
              </div>
              <div className="relative w-full bg-neutral-800 rounded-full h-3 group cursor-help">
                <div
                  className="h-3 rounded-full transition-all"
                  style={{
                    width: `${report.transactionStats.completionRate}%`,
                    background: 'linear-gradient(90deg, #C9A96E, #E8D5A3)',
                  }}
                />
                <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 px-3 py-2 bg-neutral-900 border border-white/10 rounded-lg shadow-xl text-xs text-neutral-300 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 whitespace-nowrap">
                  <p className="m-0">
                    거래 완료:{' '}
                    <span className="text-white font-semibold">{report.transactionStats.completedTrades}건</span> / 거래
                    취소:{' '}
                    <span className="text-red-400 font-semibold">{report.transactionStats.cancelledTrades}건</span>
                  </p>
                  <p className="m-0 mt-1">
                    성사율:{' '}
                    <span className="text-gold-light font-semibold">{report.transactionStats.completionRate}%</span>
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 mt-2">
                <div className="flex flex-col gap-1">
                  <span className="text-neutral-500 text-xs">거래 완료</span>
                  <span className="text-white font-semibold">{report.transactionStats.completedTrades}건</span>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-neutral-500 text-xs">거래 취소</span>
                  <span className="text-red-400 font-semibold">{report.transactionStats.cancelledTrades}건</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 인기 랭킹 Top 3 */}
        <div className="bg-surface-elevated rounded-2xl border border-neutral-800 p-6">
          <div className="flex items-center gap-2 mb-4">
            <FiAward className="text-gold-light" size={20} />
            <h3 className="text-lg font-semibold text-warm m-0">인기 랭킹 — 입찰이 가장 뜨거웠던 상품</h3>
          </div>
          {report.topHotItems.length > 0 ? (
            <div className="flex flex-col gap-3">
              {report.topHotItems.map((item: TopHotItem, idx: number) => (
                <div
                  key={item.itemId}
                  className="flex items-center gap-4 p-3 rounded-xl bg-neutral-800/50 hover:bg-neutral-800 transition-colors"
                >
                  <span className="text-gold-light font-bold text-lg w-8 text-center">{idx + 1}</span>
                  <img
                    src={item.imageUrl || Logo}
                    alt={item.itemName}
                    loading="lazy"
                    decoding="async"
                    className={`w-14 h-14 rounded-lg bg-neutral-700 ${item.imageUrl ? 'object-cover' : 'object-contain p-2'}`}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm font-medium m-0 truncate">{item.itemName}</p>
                    <p className="text-neutral-500 text-xs m-0 mt-0.5">입찰 {item.bidCount}회</p>
                  </div>
                  <span className="text-white font-semibold text-sm">{formatPrice(item.finalPrice)}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-neutral-500 text-sm m-0">아직 입찰된 상품이 없습니다</p>
          )}
        </div>

        {/* 카테고리별 매출 */}
        <div className="bg-surface-elevated rounded-2xl border border-neutral-800 p-6">
          <h3 className="text-lg font-semibold text-warm m-0 mb-4">카테고리별 매출</h3>
          {categoryChartData.length > 0 ? (
            <div className="w-full h-[220px] overflow-hidden">
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={categoryChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                  <XAxis dataKey="name" stroke="#666" tick={{ fill: '#999', fontSize: 12 }} />
                  <YAxis
                    stroke="#666"
                    tick={{ fill: '#999', fontSize: 12 }}
                    tickFormatter={(v) => formatAxisValue(Number(v))}
                  />
                  <Tooltip
                    cursor={{ fill: 'transparent' }}
                    content={({ active, payload, label }) => {
                      if (!active || !payload?.length) return null;
                      const data = payload[0].payload as { name: string; 매출: number; 건수: number };
                      return (
                        <div
                          style={{
                            backgroundColor: '#1a1a1a',
                            border: '1px solid #333',
                            borderRadius: 8,
                            padding: '8px 12px',
                          }}
                        >
                          <p style={{ color: '#999', margin: 0, marginBottom: 4 }}>{label}</p>
                          <p style={{ color: '#fff', margin: 0 }}>매출: {formatPrice(data.매출)}</p>
                          <p style={{ color: '#fff', margin: 0 }}>판매: {data.건수}건</p>
                        </div>
                      );
                    }}
                  />
                  <Bar dataKey="매출" fill="#C9A96E" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className="text-neutral-500 text-sm m-0">카테고리별 매출 데이터가 없습니다</p>
          )}
        </div>

        {/* 판매자 평판 */}
        <div className="bg-surface-elevated rounded-2xl border border-neutral-800 p-6 mb-8">
          <h3 className="text-lg font-semibold text-warm m-0 mb-4">판매자 평판</h3>
          <div className="grid grid-cols-3 gap-6">
            <div className="flex flex-col items-center gap-2 p-4 rounded-xl bg-neutral-800/50">
              <FiAward className="text-gold-light" size={24} />
              <span className="text-neutral-500 text-xs">평점</span>
              <span className="text-2xl font-bold text-white">{report.reputation.rating}</span>
            </div>
            <div className="flex flex-col items-center gap-2 p-4 rounded-xl bg-neutral-800/50">
              <FiPackage className="text-gold-light" size={24} />
              <span className="text-neutral-500 text-xs">평균 배송</span>
              <span className="text-2xl font-bold text-white">
                {report.reputation.avgShipDays != null ? `${report.reputation.avgShipDays}일` : '-'}
              </span>
            </div>
            <div className="flex flex-col items-center gap-2 p-4 rounded-xl bg-neutral-800/50">
              <FiAlertCircle
                className={report.reputation.penaltyCount > 0 ? 'text-red-400' : 'text-green-400'}
                size={24}
              />
              <span className="text-neutral-500 text-xs">패널티</span>
              <span
                className={`text-2xl font-bold ${report.reputation.penaltyCount > 0 ? 'text-red-400' : 'text-white'}`}
              >
                {report.reputation.penaltyCount}건
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
