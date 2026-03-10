import { useState } from "react";
import AuctionReportModal from "./AuctionReportModal";

// ─── Types ───────────────────────────────────────────────────────────────────
export type ItemStatus = "auction" | "explaining" | "waiting" | "done";
export type ItemCondition = "new" | "a" | "b" | "c";

export interface AuctionItem {
    id: number;
    name: string;
    startPrice: number;
    finalPrice?: number;
    status: ItemStatus;
    condition: ItemCondition;
    thumbnailUrl?: string;
}

interface Props {
    isSeller: boolean;
}

// ─── Dummy Data ──────────────────────────────────────────────────────────────
const DUMMY_ITEMS: AuctionItem[] = [
    { id: 1, name: "청자 투각 칠보문 피로", startPrice: 130000, status: "auction", condition: "new" },
    { id: 2, name: "전통 자수 병풍 세트", startPrice: 2450000, status: "explaining", condition: "a" },
    { id: 3, name: "고가구 머릿장", startPrice: 850000, status: "waiting", condition: "b" },
    { id: 4, name: "나전칠기 보석함", startPrice: 320000, status: "waiting", condition: "a" },
    { id: 5, name: "분청사기 연적", startPrice: 1200000, status: "waiting", condition: "c" },
    { id: 6, name: "백자 달항아리", startPrice: 5000000, finalPrice: 5500000, status: "done", condition: "new" },
    { id: 7, name: "고려 동경 거울", startPrice: 780000, finalPrice: 920000, status: "done", condition: "a" },
];

// ─── Badge Config ────────────────────────────────────────────────────────────
const STATUS_BADGE: Record<ItemStatus, { label: string; text: string; bg: string; border: string }> = {
    auction: { label: "경매중", text: "#C5A059", bg: "rgba(197,160,89,0.12)", border: "rgba(197,160,89,0.4)" },
    explaining: { label: "설명중", text: "#93C5FD", bg: "rgba(59,130,246,0.12)", border: "rgba(59,130,246,0.3)" },
    waiting: { label: "대기중", text: "#71717A", bg: "rgba(113,113,122,0.15)", border: "rgba(113,113,122,0.3)" },
    done: { label: "낙찰", text: "#4ade80", bg: "rgba(74,222,128,0.12)", border: "rgba(74,222,128,0.3)" },
};

const CONDITION_BADGE: Record<ItemCondition, { label: string; color: string }> = {
    new: { label: "미개봉", color: "rgba(255,220,140,0.95)" },
    a: { label: "A급", color: "rgba(220,185,120,0.85)" },
    b: { label: "B급", color: "rgba(180,150,100,0.7)" },
    c: { label: "C급", color: "rgba(140,130,115,0.65)" },
};

const PRICE_COLOR: Record<ItemStatus, string> = {
    auction: "#C5A059",
    explaining: "#93C5FD",
    waiting: "#71717A",
    done: "#52525B",
};

const CARD_BORDER: Record<ItemStatus, string> = {
    auction: "rgba(197,160,89,0.5)",
    explaining: "rgba(255,255,255,0.06)",
    waiting: "rgba(255,255,255,0.06)",
    done: "rgba(255,255,255,0.06)",
};

// ─── Helpers ─────────────────────────────────────────────────────────────────
function formatPrice(n: number) {
    return n.toLocaleString("ko-KR") + "원";
}

// ─── Component ───────────────────────────────────────────────────────────────
export default function LeftPanel({ isSeller }: Props) {
    const [selectedId, setSelectedId] = useState<number | null>(null);
    const [modalOpen, setModalOpen] = useState(false);

    const activeItems = DUMMY_ITEMS.filter((i) => i.status !== "done");
    const doneItems = DUMMY_ITEMS.filter((i) => i.status === "done");
    const totalCount = DUMMY_ITEMS.length;

    return (
        <>
            <div className="flex h-full w-full flex-col rounded-2xl bg-[#050505] px-4 py-6" style={{ borderRight: "1px solid rgba(255,255,255,0.05)" }}>
                {/* ── Header ── */}
                <div className="mb-4 flex items-center justify-between">
                    <span className="text-xs font-bold text-[#A1A1AA]">오늘의 출품 목록</span>
                    <span className="text-[11px] font-bold text-[#52525B]">{totalCount}</span>
                </div>

                {/* ── Active Items ── */}
                <div className="left-panel-scroll flex flex-1 flex-col gap-2 overflow-y-auto pr-2">
                    {activeItems.map((item) => {
                        const isSelected = isSeller && selectedId === item.id;
                        const sb = STATUS_BADGE[item.status];
                        const cb = CONDITION_BADGE[item.condition];

                        return (
                            <div
                                key={item.id}
                                className="flex gap-3 rounded-[20px] p-3.5 transition-all duration-200"
                                style={{
                                    background: "rgba(255,255,255,0.02)",
                                    border: `1px solid ${isSelected ? "rgba(197,160,89,0.55)" : CARD_BORDER[item.status]}`,
                                    boxShadow: isSelected
                                        ? "0 0 12px rgba(197,160,89,0.15)"
                                        : item.status === "auction"
                                          ? "0 0 12px rgba(197,160,89,0.1)"
                                          : "none",
                                    cursor: isSeller ? "pointer" : "default",
                                    pointerEvents: isSeller ? "all" : "none",
                                }}
                                onClick={isSeller ? () => setSelectedId(item.id) : undefined}
                            >
                                {/* Thumbnail */}
                                <div className="h-16 w-16 shrink-0 rounded-[14px] bg-[#27272A]" />

                                {/* Info */}
                                <div className="flex min-w-0 flex-1 flex-col justify-center gap-1">
                                    <span className="truncate text-xs font-bold leading-snug text-white">{item.name}</span>
                                    <div className="flex items-center gap-1.5">
                                        <span className="text-[13px] font-black" style={{ color: PRICE_COLOR[item.status] }}>
                                            {formatPrice(item.startPrice)}
                                        </span>
                                        <span
                                            className="rounded-full px-1.5 py-0.5 text-[9px] font-extrabold"
                                            style={{ color: cb.color, background: "rgba(197,160,89,0.08)" }}
                                        >
                                            {cb.label}
                                        </span>
                                    </div>
                                </div>

                                {/* Status Badge */}
                                <div className="flex shrink-0 flex-col items-end justify-center">
                                    <span
                                        className="rounded-full px-1.5 py-0.5 text-[9px] font-extrabold"
                                        style={{ color: sb.text, background: sb.bg, border: `1px solid ${sb.border}` }}
                                    >
                                        {sb.label}
                                    </span>
                                </div>
                            </div>
                        );
                    })}

                    {/* ── Done Section (seller only) ── */}
                    {isSeller && doneItems.length > 0 && (
                        <>
                            <div className="mt-1.5 flex items-center gap-3">
                                <span className="text-[10px] font-bold uppercase tracking-wider text-[#3F3F46]">완료</span>
                                <div className="h-px flex-1" style={{ background: "linear-gradient(to right, rgba(255,255,255,0.06), transparent)" }} />
                            </div>

                            {doneItems.map((item) => {
                                const sb = STATUS_BADGE.done;

                                return (
                                    <div
                                        key={item.id}
                                        className="flex gap-3 rounded-[20px] p-3.5"
                                        style={{
                                            background: "rgba(255,255,255,0.02)",
                                            border: "1px solid rgba(255,255,255,0.06)",
                                            opacity: 0.45,
                                            cursor: "default",
                                            pointerEvents: "none",
                                        }}
                                    >
                                        <div className="h-16 w-16 shrink-0 rounded-[14px] bg-[#27272A] opacity-40" />
                                        <div className="flex min-w-0 flex-1 flex-col justify-center gap-1">
                                            <span className="truncate text-xs font-bold leading-snug text-[#71717A]">{item.name}</span>
                                            <span className="text-[13px] font-black text-[#52525B] line-through">
                                                {formatPrice(item.startPrice)}
                                            </span>
                                            {item.finalPrice && (
                                                <span className="text-xs font-black text-[rgba(197,160,89,0.7)]">
                                                    ↳ 낙찰 {formatPrice(item.finalPrice)}
                                                </span>
                                            )}
                                        </div>
                                        <div className="flex shrink-0 flex-col items-end justify-center">
                                            <span
                                                className="rounded-full px-1.5 py-0.5 text-[9px] font-extrabold"
                                                style={{ color: sb.text, background: sb.bg, border: `1px solid ${sb.border}` }}
                                            >
                                                {sb.label}
                                            </span>
                                        </div>
                                    </div>
                                );
                            })}
                        </>
                    )}
                </div>

                {/* ── View All Button (seller only) ── */}
                {isSeller && (
                    <button
                        className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl border border-[rgba(255,255,255,0.07)] bg-transparent px-4 py-2.5 text-xs font-bold text-[#71717A] transition-all hover:border-[rgba(255,255,255,0.12)] hover:bg-[#18181B] hover:text-[#D4D4D8]"
                        onClick={() => setModalOpen(true)}
                    >
                        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                            <rect x="1" y="1" width="5" height="5" rx="1.5" stroke="currentColor" strokeWidth="1.4" />
                            <rect x="8" y="1" width="5" height="5" rx="1.5" stroke="currentColor" strokeWidth="1.4" />
                            <rect x="1" y="8" width="5" height="5" rx="1.5" stroke="currentColor" strokeWidth="1.4" />
                            <rect x="8" y="8" width="5" height="5" rx="1.5" stroke="currentColor" strokeWidth="1.4" />
                        </svg>
                        전체 보기
                    </button>
                )}
            </div>

            {/* ── Report Modal ── */}
            {isSeller && (
                <AuctionReportModal
                    open={modalOpen}
                    onClose={() => setModalOpen(false)}
                    items={DUMMY_ITEMS}
                />
            )}
        </>
    );
}
