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
      <div className="border-b border-neutral-700 px-3 py-2">
        <span className="text-sm font-bold text-white">방송 기본 설정</span>
      </div>

      <div className="scrollbar-hide flex flex-1 flex-col gap-3 overflow-y-auto px-3 py-3">
        <div className="flex flex-col gap-1.5 rounded-xl bg-white/[0.06] p-3">
          <label className="text-sm font-bold tracking-wider text-neutral-300">썸네일 업로드 (선택)</label>
          <button
            type="button"
            onClick={() => thumbnailInputRef.current?.click()}
            className="flex h-25 w-full flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-neutral-600 bg-white/[0.04] transition-all hover:border-neutral-500 hover:bg-white/[0.08]"
          >
            {thumbnailUrl ? (
              <img src={thumbnailUrl} alt="thumb" className="h-full w-full rounded-xl object-contain" />
            ) : (
              <>
                <FaCamera size={18} className="text-neutral-500" />
                <span className="text-[13px] font-bold text-neutral-500">이미지 첨부(10MB 이하)</span>
              </>
            )}
          </button>
          <input ref={thumbnailInputRef} type="file" accept="image/*" className="hidden" onChange={onThumbnailChange} />
          <p className="mt-1 text-[14px] leading-5 text-neutral-400">
            썸네일 미등록시, AI 썸네일을 자동으로 생성합니다!
          </p>
        </div>

        <div className="flex flex-col gap-1.5 rounded-xl bg-gold/[0.06] p-3">
          <label className="text-sm font-bold tracking-wider text-gold">방송 제목</label>
          <input
            type="text"
            value={title}
            onChange={(event) => onTitleChange(event.target.value)}
            placeholder="제목을 입력하세요."
            className="w-full rounded-lg border border-neutral-700 bg-transparent px-3 py-2.5 text-sm text-neutral-100 outline-none placeholder:text-neutral-500 transition-colors focus:border-gold/40"
          />
        </div>

        <div className="flex flex-col gap-1.5 rounded-xl bg-accent/[0.06] p-3">
          <label className="text-sm font-bold tracking-wider text-accent">상단 고정 공지사항 (선택)</label>
          <input
            type="text"
            value={notice}
            onChange={(event) => onNoticeChange(event.target.value)}
            placeholder="공지사항을 입력하세요."
            className="w-full rounded-lg border border-neutral-700 bg-transparent px-3 py-2.5 text-sm text-neutral-100 outline-none placeholder:text-neutral-500 transition-colors focus:border-gold/40"
          />
        </div>

        <div className="flex flex-col gap-2 rounded-xl bg-ember/[0.06] p-3">
          <label className="text-sm font-bold tracking-wider text-ember">카테고리 매크로 (선택)</label>

          <div className="flex flex-col gap-2">
            {macroFields.map((macro) => {
              const command = macro.question.trim();

              return (
                <div key={macro.questionType} className="flex items-center gap-2">
                  <button
                    type="button"
                    className={`w-20 shrink-0 whitespace-nowrap rounded-full py-2 text-center text-xs font-extrabold transition-colors ${
                      macroAnswers[macro.questionType]
                        ? 'bg-ember/15 text-ember-light'
                        : 'bg-white/[0.08] text-neutral-500'
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
                    className="min-w-0 flex-1 rounded-lg border border-neutral-700 bg-transparent px-3 py-2 text-sm text-neutral-100 outline-none placeholder:text-neutral-500 transition-colors focus:border-ember/40"
                  />
                </div>
              );
            })}

            {!macroFields.length && (
              <NoItem
                message="해당 카테고리의 매크로가 없습니다"
                className="py-6"
                textClassName="text-sm font-bold text-neutral-600"
              />
            )}
          </div>
        </div>
      </div>
    </aside>
  );
}
