import { BsCameraVideo } from "react-icons/bs";

export default function StreamPlaceholder() {
    return (
        <div className="flex h-full flex-col items-center justify-center gap-4">
            {/* 원 + 카메라 아이콘 */}
            <div className="flex h-16 w-16 items-center justify-center rounded-full border-2 border-gold/30">
                <BsCameraVideo size={24} className="text-neutral-600" />
            </div>

            <span className="text-sm text-neutral-600">라이브 스트리밍 대기중</span>
        </div>
    );
}
