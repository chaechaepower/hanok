import { FaCamera } from 'react-icons/fa';

import NoItem from '@/components/common/NoItem';
import type { LiveRegisterMacroField } from '../../utils/liveRegister';

type Props = {
  thumbnailInputRef: React.RefObject<HTMLInputElement | null>;
  thumbnailUrl: string | null;
  onThumbnailChange: React.ChangeEventHandler<HTMLInputElement>;
  title: string;
  notice: string;
  onTitleChange: (value: string) => void;
  onNoticeChange: (value: string) => void;
  macroFields: LiveRegisterMacroField[];
  macroAnswers: Record<string, string>;
  onMacroAnswerChange: (questionType: string, value: string) => void;
};

export default function LiveRegisterSettingsPanel({
  thumbnailInputRef,
  thumbnailUrl,
  onThumbnailChange,
  title,
  notice,
  onTitleChange,
  onNoticeChange,
  macroFields,
  macroAnswers,
  onMacroAnswerChange,
}: Props) {
  return (
    <aside className="flex min-w-0 flex-1 flex-col overflow-hidden rounded-2xl bg-background">
      <div className="border-b border-neutral-800 px-3 py-2">
        <span className="text-sm font-bold text-neutral-100">방송 기본 설정</span>
      </div>

      <div className="scrollbar-hide flex flex-1 flex-col gap-3 overflow-y-auto px-3 py-3">
        <div className="flex flex-col gap-1.5 rounded-xl border border-neutral-800 bg-white/[0.02] p-3">
          <label className="text-xs font-bold uppercase tracking-wider text-neutral-500">썸네일 업로드</label>
          <button
            type="button"
            onClick={() => thumbnailInputRef.current?.click()}
            className="flex h-25 w-full flex-col items-center justify-center gap-2 rounded-xl border border-neutral-800 bg-transparent transition-all hover:border-neutral-700 hover:bg-neutral-900"
          >
            {thumbnailUrl ? (
              <img src={thumbnailUrl} alt="thumb" className="h-full w-full rounded-xl object-contain" />
            ) : (
              <>
                <FaCamera size={18} className="text-neutral-600" />
                <span className="text-[13px] font-bold text-neutral-600">이미지 첨부(10MB 이하)</span>
              </>
            )}
          </button>
          <input ref={thumbnailInputRef} type="file" accept="image/*" className="hidden" onChange={onThumbnailChange} />
        </div>

        <div className="flex flex-col gap-1.5 rounded-xl border border-gold/10 bg-gold/[0.03] p-3">
          <label className="text-xs font-bold uppercase tracking-wider text-gold/60">방송 제목</label>
          <input
            type="text"
            value={title}
            onChange={(event) => onTitleChange(event.target.value)}
            placeholder="제목을 입력하세요."
            className="w-full rounded-lg border border-neutral-800 bg-transparent px-3 py-2.5 text-sm text-neutral-100 outline-none placeholder:text-neutral-700 transition-colors focus:border-gold/40"
          />
        </div>

        <div className="flex flex-col gap-1.5 rounded-xl border border-accent/10 bg-accent/[0.03] p-3">
          <label className="text-xs font-bold uppercase tracking-wider text-accent/60">
            상단 고정 공지사항 (선택)
          </label>
          <input
            type="text"
            value={notice}
            onChange={(event) => onNoticeChange(event.target.value)}
            placeholder="공지사항을 입력하세요."
            className="w-full rounded-lg border border-neutral-800 bg-transparent px-3 py-2.5 text-sm text-neutral-100 outline-none placeholder:text-neutral-700 transition-colors focus:border-gold/40"
          />
        </div>

        <div className="flex flex-col gap-2 rounded-xl border border-ember/10 bg-ember/[0.03] p-3">
          <label className="text-xs font-bold uppercase tracking-wider text-ember/60">카테고리 매크로</label>

          <div className="flex flex-col gap-2">
            {macroFields.map((macro) => {
              const command = macro.question.trim();

              return (
                <div key={macro.questionType} className="flex items-center gap-2">
                  <button
                    type="button"
                    className={`shrink-0 whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-extrabold transition-colors ${
                      macroAnswers[macro.questionType]
                        ? 'border border-gold/40 bg-gold/10 text-gold'
                        : 'border border-neutral-800 bg-transparent text-neutral-600'
                    }`}
                    onClick={() => {
                      const cmd = `!${command}`;
                      navigator.clipboard?.writeText(cmd).catch(() => {});
                    }}
                    title="클릭하면 커맨드 복사"
                  >
                    !{command}
                  </button>
                  <input
                    type="text"
                    value={macroAnswers[macro.questionType] ?? ''}
                    onChange={(event) => onMacroAnswerChange(macro.questionType, event.target.value)}
                    placeholder="응답을 입력해주세요."
                    className="min-w-0 flex-1 rounded-lg border border-neutral-800 bg-transparent px-3 py-2 text-sm text-neutral-100 outline-none placeholder:text-neutral-700 transition-colors focus:border-gold/40"
                  />
                </div>
              );
            })}

            {!macroFields.length && <NoItem message="해당 카테고리의 매크로가 없습니다" className="py-6" textClassName="text-sm font-bold text-neutral-600" />}
          </div>
        </div>
      </div>
    </aside>
  );
}
