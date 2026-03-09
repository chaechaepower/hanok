import { BsCameraVideo } from "react-icons/bs";

export default function StreamPlaceholder() {
    return (
        <div className="flex h-full flex-col items-center justify-center gap-4">
            {/* 원 + 카메라 아이콘 */}
            <div className="flex h-16 w-16 items-center justify-center rounded-full border-2 border-[rgba(197,160,89,.3)]">
                <BsCameraVideo size={24} className="text-[#52525b]" />
            </div>

            <span className="text-sm text-[#52525b]">라이브 스트리밍 대기중</span>
        </div>
    );
}
