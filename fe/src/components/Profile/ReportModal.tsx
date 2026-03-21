import { useToast } from '@/hooks/useToast';
import { useState } from 'react';
import { FiTrash2, FiUpload, FiX } from 'react-icons/fi';
const REPORT_REASONS = ['허위 매물 / 사기 의심', '욕설 / 비방', '부적절한 콘텐츠', '스팸 / 광고', '기타'] as const;
type ReportModalProps = {
  sellerNickname: string;
  onClose: () => void;
  onSubmit: (data: { reason: string; detail: string; images: File[] }) => void;
};
export default function ReportModal({ sellerNickname, onClose, onSubmit }: ReportModalProps) {
  const [reason, setReason] = useState('');
  const [detail, setDetail] = useState('');
  const [images, setImages] = useState<File[]>([]);
  const { showToast } = useToast();
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setImages((prev) => [...prev, ...files].slice(0, 3));
    e.target.value = '';
  };
  const handleRemoveImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };
  const handleSubmit = () => {
    if (!reason) {
      showToast({ message: '신고 사유를 선택해주세요.' });
      return;
    }
    if (!detail.trim()) {
      showToast({ message: '상세 설명을 입력해주세요.' });
      return;
    }
    onSubmit({ reason, detail, images });
  };
  return (
    <div
      className="fixed top-0 left-0 w-full h-full bg-black/70 z-[999] flex items-center justify-center"
      onClick={onClose}
    >
      <div
        className="bg-surface border border-neutral-800 rounded-2xl w-[500px] max-h-[90vh] overflow-y-auto p-8 flex flex-col gap-5 shadow-[0_8px_30px_rgba(0,0,0,0.5)]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h2 className="m-0 text-white text-xl font-bold">신고하기</h2>
          <button
            className="bg-transparent border-none text-neutral-600 cursor-pointer hover:text-white transition-colors p-0"
            onClick={onClose}
          >
            <FiX size={22} />
          </button>
        </div>
        <p className="m-0 text-[14px] text-neutral-400">
          <span className="text-gold-light font-bold">{sellerNickname}</span> 스토어를 신고합니다.
        </p>
        <div className="flex flex-col gap-2">
          <label className="text-[14px] text-neutral-300 font-semibold">신고 사유</label>
          <div className="flex flex-col gap-2">
            {REPORT_REASONS.map((r) => (
              <label
                key={r}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg border cursor-pointer transition-colors ${
                  reason === r
                    ? 'border-gold-light bg-gold-muted/30'
                    : 'border-neutral-800 bg-background hover:border-neutral-700'
                }`}
              >
                <input
                  type="radio"
                  name="report-reason"
                  value={r}
                  checked={reason === r}
                  onChange={() => setReason(r)}
                  className="accent-gold-light"
                />
                <span className="text-[14px] text-white">{r}</span>
              </label>
            ))}
          </div>
        </div>
        <div className="flex flex-col gap-2">
          <label className="text-[14px] text-neutral-300 font-semibold">상세 설명</label>
          <textarea
            className="w-full box-border bg-background text-white border border-neutral-800 rounded-lg p-[14px] text-[15px] min-h-[120px] resize-none focus:border-gold-light focus:outline-none transition-colors"
            placeholder="신고 내용을 상세히 작성해주세요."
            value={detail}
            onChange={(e) => setDetail(e.target.value)}
          />
        </div>
        <div className="flex flex-col gap-2">
          <label className="text-[14px] text-neutral-300 font-semibold">
            스크린샷 첨부(10MB 이하) <span className="text-neutral-600 font-normal">({images.length}/3)</span>
          </label>
          {images.length > 0 && (
            <div className="flex gap-3">
              {images.map((img, i) => (
                <div key={i} className="relative w-20 h-20 rounded-lg overflow-hidden border border-neutral-800">
                  <img src={URL.createObjectURL(img)} alt={`screenshot-${i}`} className="w-full h-full object-cover" />
                  <button
                    className="absolute top-1 right-1 bg-black/70 text-white border-none rounded-full w-5 h-5 flex items-center justify-center cursor-pointer p-0"
                    onClick={() => handleRemoveImage(i)}
                  >
                    <FiTrash2 size={12} />
                  </button>
                </div>
              ))}
            </div>
          )}
          {images.length < 3 && (
            <label className="flex items-center justify-center gap-2 py-3 border border-dashed border-neutral-800 rounded-lg text-neutral-600 text-[14px] cursor-pointer hover:border-gold-light hover:text-gold-light transition-colors">
              <FiUpload size={16} />
              이미지 업로드(10MB 이하)
              <input type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
            </label>
          )}
        </div>

        <div className="flex justify-end gap-3 mt-[10px]">
          <button
            className="py-[10px] px-6 bg-neutral-700 text-neutral-200 border-none rounded-lg cursor-pointer text-sm font-semibold hover:bg-neutral-600 transition-colors"
            onClick={onClose}
          >
            취소
          </button>
          <button
            className="py-[10px] px-6 bg-gold-light text-background font-bold border-none rounded-lg cursor-pointer text-sm hover:bg-gold-dark transition-colors"
            onClick={handleSubmit}
          >
            신고하기
          </button>
        </div>
      </div>
    </div>
  );
}
