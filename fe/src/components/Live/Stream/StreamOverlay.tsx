import { GoClock } from "react-icons/go";

export default function StreamOverlay() {
    return (
        <div className="absolute top-4 left-4 flex items-center gap-3">
            {/* LIVE 뱃지 */}
            <div className="flex items-center gap-1.5 rounded-full bg-[#dc2626] px-3 py-1">
                <div className="h-2 w-2 animate-pulse rounded-full bg-white" />
                <span className="text-xs font-black text-white">LIVE 3,137</span>
            </div>

            {/* 타이머 */}
            <div className="flex items-center gap-1.5 text-sm font-semibold text-white">
                <GoClock />
                <span className="font-mono">08:45</span>
            </div>
        </div>
    );
}
