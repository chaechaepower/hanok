import { useState, useRef, useEffect, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { FaArrowLeft, FaBroadcastTower, FaCalendarAlt, FaCamera, FaSave, FaCircle, FaList, FaTimes } from 'react-icons/fa';
import { MdLiveTv } from 'react-icons/md';
import { CATEGORY_MACROS } from '@/constants/macro';
import { CATEGORIES } from './categories';
import { useGetItemsByCategory } from '@/api/hooks/useGetItems';
import { usePostStream } from '@/api/hooks/usePostStream';
import { usePostStartStream } from '@/api/hooks/usePostStartStream';
import { usePostStreamMacros } from '@/api/hooks/usePostStreamMacros';
import type { Product, StartStreamRequest } from '@/types';
import InventorySelectModal from './InventorySelectModal';
import ScheduleModal from './ScheduleModal';


export default function LiveRegisterPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const thumbnailInputRef = useRef<HTMLInputElement>(null);

  const initialCategoryId: string = (location.state as { categoryId?: string })?.categoryId ?? CATEGORIES[0]?.id ?? '';
  const categoryLabel = CATEGORIES.find((c) => c.id === initialCategoryId)?.label ?? '';

  const { data: filteredInventory = [], isLoading: inventoryLoading } = useGetItemsByCategory(initialCategoryId);

  const [title, setTitle] = useState('');
  const [notice, setNotice] = useState('');
  const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(null);
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [selectedItems, setSelectedItems] = useState<Product[]>([]);
  const [showInventoryModal, setShowInventoryModal] = useState(false);
  const [showStartConfirm, setShowStartConfirm] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [scheduledAt, setScheduledAt] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const defaultMacros = useMemo(() => CATEGORY_MACROS[categoryLabel] ?? [], [categoryLabel]);
  const [macroAnswers, setMacroAnswers] = useState<Record<string, string>>({});

  useEffect(() => {
    const initial: Record<string, string> = {};
    defaultMacros.forEach((m) => { initial[m.questionType] = ''; });
    setMacroAnswers(initial);
  }, [categoryLabel, defaultMacros]);

  const handleThumbnailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setThumbnailUrl(url);
      setThumbnailFile(file);
    }
  };

  const toggleItem = (item: Product) => {
    setSelectedItems((prev) =>
      prev.some((i) => i.id === item.id)
        ? prev.filter((i) => i.id !== item.id)
        : [...prev, item],
    );
  };

  const handleSchedule = () => {
    if (!title.trim()) { alert('방송 제목을 입력해주세요.'); return; }
    setShowScheduleModal(true);
  };

  const handleStart = () => {
    if (!title.trim()) { alert('방송 제목을 입력해주세요.'); return; }
    setShowStartConfirm(true);
  };

  const postStream = usePostStream();
  const postStartStream = usePostStartStream();
  const postMacros = usePostStreamMacros();

  const submitStream = async (startType: 'SCHEDULED' | 'IMMEDIATE', scheduledAtValue?: string) => {
    setIsSubmitting(true);
    try {
      const payload: StartStreamRequest = {
        title,
        category: initialCategoryId,
        itemIds: selectedItems.map((i) => i.id),
        startType,
        notice: notice || undefined,
        scheduledAt: startType === 'SCHEDULED' ? (scheduledAtValue ?? scheduledAt) : undefined,
      };

      const res = await postStream.mutateAsync({
        request: payload,
        thumbnail: thumbnailFile ?? undefined,
      });
      const newStreamId = res.streamId;

      if (startType === 'IMMEDIATE') {
        const startRes = await postStartStream.mutateAsync({
          streamId: newStreamId,
          body: payload,
        });
        const token = startRes.data?.openviduToken;
        console.log('[Stream Start] openviduToken:', token);
        alert(`방송이 시작되었습니다! (ID: ${newStreamId})`);
      } else {
        alert(`방송이 예약되었습니다! (ID: ${newStreamId})`);
      }

      const macros = defaultMacros.map((m) => ({
        questionType: m.questionType,
        answer: macroAnswers[m.questionType] ?? '',
      }));
      await postMacros.mutateAsync({
        streamId: newStreamId,
        body: { macros },
      });

      if (startType === 'IMMEDIATE') {
        navigate(`/live/${newStreamId}`);
      } else {
        navigate('/live/new');
      }
    } catch {
      alert('방송 등록에 실패했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const currentItem = selectedItems[0] ?? null;

  return (
    <div className="w-full max-w-[1400px] mx-auto px-4 py-6 flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate('/live/new')}
            className="text-white/60 hover:text-white transition-colors"
          >
            <FaArrowLeft size={16} />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <FaCircle className="text-[#e74c3c] text-sm" />
              <h1 className="text-xl font-bold text-white">라이브 방송 등록</h1>
            </div>
            <p className="text-[#888] text-sm mt-0.5">경매 방송을 기획하세요. · 카테고리: <span className="text-[#d9b36d] font-semibold">{categoryLabel}</span></p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleSchedule}
            disabled={isSubmitting}
            className="flex items-center gap-2 px-5 py-2 bg-transparent border border-white/50 text-white text-sm rounded-lg hover:bg-white/10 transition-colors disabled:opacity-50"
          >
            <FaCalendarAlt size={14} />
            방송 예약
            {scheduledAt && (
              <span className="text-[#d9b36d] text-xs font-medium ml-1">
                {new Date(scheduledAt).toLocaleDateString('ko-KR', { month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
              </span>
            )}
          </button>
          <button
            type="button"
            onClick={handleStart}
            disabled={isSubmitting}
            className="flex items-center gap-2 px-5 py-2 bg-[#e74c3c] text-white text-sm font-semibold rounded-lg hover:bg-[#c0392b] transition-colors disabled:opacity-50"
          >
            <MdLiveTv size={16} />
            방송 시작
          </button>
        </div>
      </div>

      <div className="flex gap-4" style={{ minHeight: '600px' }}>
        <aside className="w-[190px] shrink-0 flex flex-col gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <FaList className="text-[#e74c3c] text-sm" />
              <h2 className="text-white font-bold text-base">경매 물품 리스트</h2>
            </div>
            <p className="text-[#888] text-xs leading-relaxed">
              방송 중 아래 순서대로 화면에 표시 됩니다.
            </p>
          </div>

          <div className="flex flex-col gap-2 flex-1">
            {selectedItems.map((item, idx) => (
              <div
                key={item.id}
                className="flex items-center gap-2 border border-white/10 rounded-lg p-2 bg-[#111]"
              >
                <span className="text-[#888] text-xs w-4">{idx + 1}</span>
                <div className="w-8 h-8 rounded bg-[#222] flex items-center justify-center shrink-0">
                  <FaBroadcastTower size={12} className="text-white/30" />
                </div>
                <span className="text-white text-xs truncate flex-1">{item.title}</span>
                <button
                  type="button"
                  onClick={() => toggleItem(item)}
                  className="text-[#e74c3c] text-xs hover:text-red-400"
                >
                  <FaTimes />
                </button>
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={() => setShowInventoryModal(true)}
            className="w-full py-2 px-3 bg-[#1a1a1a] border border-white/20 text-white text-sm rounded-full hover:bg-white/10 transition-colors"
          >
            인벤토리에서 물품 선택
          </button>
        </aside>

        <div className="flex-1 min-w-0 relative rounded-2xl overflow-hidden bg-black flex flex-col">
          <div className="flex-1 flex items-center justify-center">
            {thumbnailUrl ? (
              <img src={thumbnailUrl} alt="thumbnail" className="w-full h-full object-cover" />
            ) : (
              <div className="flex flex-col items-center gap-3 text-white/20">
                <MdLiveTv size={60} />
                <span className="text-sm">방송 미리보기</span>
              </div>
            )}
          </div>

          {currentItem && (
            <div className="absolute bottom-0 left-0 right-0 flex items-center gap-4 px-5 py-4 bg-gradient-to-t from-black/90 to-transparent">
              <div className="w-16 h-16 rounded-xl bg-[#222] flex items-center justify-center shrink-0">
                <FaBroadcastTower size={24} className="text-white/30" />
              </div>
              <div className="flex-1">
                <p className="text-white font-bold text-base">{currentItem.title}</p>
                <p className="text-white/60 text-sm">{currentItem.description}</p>
              </div>
              <p className="text-white font-bold text-lg">
                {currentItem.startPrice.toLocaleString()}원
              </p>
            </div>
          )}
        </div>

        <aside className="w-[220px] shrink-0 flex flex-col gap-4">
          <h2 className="text-white font-bold text-base">방송 기본 설정</h2>

          <div className="flex flex-col gap-1">
            <label className="text-[#888] text-xs">썸네일 업로드</label>
            <button
              type="button"
              onClick={() => thumbnailInputRef.current?.click()}
              className="w-full h-[100px] border border-white/15 rounded-xl bg-[#111] flex flex-col items-center justify-center gap-2 hover:bg-white/5 transition-colors"
            >
              {thumbnailUrl ? (
                <img src={thumbnailUrl} alt="thumb" className="w-full h-full object-cover rounded-xl" />
              ) : (
                <>
                  <FaCamera size={20} className="text-white/40" />
                  <span className="text-[#888] text-xs">이미지 첨부</span>
                </>
              )}
            </button>
            <input
              ref={thumbnailInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleThumbnailChange}
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[#888] text-xs">방송제목</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="제목을 입력하세요."
              className="w-full bg-transparent border border-white/15 rounded-lg px-3 py-2 text-white text-sm placeholder:text-white/25 outline-none focus:border-white/40"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[#888] text-xs">상단 고정 공지사항 (선택)</label>
            <input
              type="text"
              value={notice}
              onChange={(e) => setNotice(e.target.value)}
              placeholder="공지사항을 입력하세요."
              className="w-full bg-transparent border border-white/15 rounded-lg px-3 py-2 text-white text-sm placeholder:text-white/25 outline-none focus:border-white/40"
            />
          </div>

          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <label className="text-[#888] text-xs">카테고리 매크로</label>
              <button
                type="button"
                onClick={() => alert('매크로가 저장되었습니다. 방송 시작/예약 시 반영됩니다.')}
                className="flex items-center gap-1 text-[#d9b36d] text-xs hover:text-[#f0e6c8] transition-colors"
              >
                <FaSave size={11} />
                저장
              </button>
            </div>
            <div className="flex flex-col gap-2">
              {defaultMacros.map((macro) => {
                const cleanCmd = macro.question.replace('?', '').replace('은', '').replace('는', '').replace('가', '').trim();

                return (
                  <div key={macro.questionType} className="flex items-center gap-2">
                    <button
                      type="button"
                      className={`shrink-0 px-3 py-1.5 rounded-full border bg-[#111] text-xs whitespace-nowrap transition-colors ${
                        macroAnswers[macro.questionType]
                          ? 'border-white/20 text-white hover:bg-white/10'
                          : 'border-white/15 text-white/25 hover:bg-white/5'
                      }`}
                      onClick={() => {
                        const cmd = '!' + cleanCmd;
                        navigator.clipboard?.writeText(cmd).catch(() => {});
                      }}
                      title="클릭하면 커맨드 복사"
                    >
                      !{cleanCmd}
                    </button>
                  <input
                    type="text"
                    value={macroAnswers[macro.questionType] ?? ''}
                    onChange={(e) =>
                      setMacroAnswers((prev) => ({ ...prev, [macro.questionType]: e.target.value }))
                    }
                    placeholder="응답을 입력해주세요."
                    className="flex-1 min-w-0 bg-transparent border border-white/15 rounded-lg px-2 py-1.5 text-white text-xs placeholder:text-white/25 outline-none focus:border-white/40"
                  />
                  </div>
                );
              })}
              {!defaultMacros.length && (
                <p className="text-[#888] text-xs">해당 카테고리의 매크로가 없습니다.</p>
              )}
            </div>
          </div>
        </aside>
      </div>

      {showInventoryModal && (
        <InventorySelectModal
          categoryLabel={categoryLabel}
          items={filteredInventory}
          isLoading={inventoryLoading}
          selectedItems={selectedItems}
          onToggle={toggleItem}
          onConfirm={() => setShowInventoryModal(false)}
          onClose={() => setShowInventoryModal(false)}
        />
      )}

      {showScheduleModal && (
        <ScheduleModal
          onConfirm={async (iso) => {
            setScheduledAt(iso);
            setShowScheduleModal(false);
            await submitStream('SCHEDULED', iso);
          }}
          onClose={() => setShowScheduleModal(false)}
        />
      )}

      {showStartConfirm && (
        <>
          <div className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm" onClick={() => setShowStartConfirm(false)} />
          <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
            <div className="w-full max-w-[400px] bg-[#0f0f13] rounded-2xl p-8 shadow-2xl border border-white/10 flex flex-col gap-6">
              <div className="flex flex-col items-center gap-3 text-center">
                <div className="w-16 h-16 rounded-full bg-[#e74c3c]/15 flex items-center justify-center">
                  <MdLiveTv size={32} className="text-[#e74c3c]" />
                </div>
                <h2 className="text-white text-xl font-bold">방송을 시작할까요?</h2>
                <p className="text-[#888] text-sm leading-relaxed">
                  지금 바로 라이브 방송을 시작합니다.<br />
                  시작 후에는 취소할 수 없습니다.
                </p>
              </div>

              <div className="bg-white/5 rounded-xl px-4 py-3 flex flex-col gap-1.5">
                <div className="flex justify-between text-sm">
                  <span className="text-[#888]">방송 제목</span>
                  <span className="text-white font-medium truncate max-w-[180px]">{title || '(제목 없음)'}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-[#888]">카테고리</span>
                  <span className="text-[#d9b36d] font-medium">{categoryLabel}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-[#888]">경매 물품</span>
                  <span className="text-white font-medium">{selectedItems.length}개</span>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowStartConfirm(false)}
                  disabled={isSubmitting}
                  className="flex-1 py-3.5 rounded-xl border border-white/20 text-white font-semibold hover:bg-white/10 transition-colors disabled:opacity-50"
                >
                  취소
                </button>
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={async () => {
                    setShowStartConfirm(false);
                    await submitStream('IMMEDIATE');
                  }}
                  className="flex-1 py-3.5 rounded-xl bg-[#e74c3c] text-white font-bold hover:bg-[#c0392b] transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <MdLiveTv size={18} />
                  방송 시작
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
