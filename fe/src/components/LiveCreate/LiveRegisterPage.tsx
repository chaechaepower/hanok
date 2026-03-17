import { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { FaArrowLeft, FaCalendarAlt, FaCamera, FaCircle, FaTimes } from 'react-icons/fa';
import { MdLiveTv } from 'react-icons/md';
import { CATEGORY_MACROS } from '@/constants/macro';
import { useGetItemsByCategory } from '@/api/hooks/useGetItems';
import { useGetStream } from '@/api/hooks/useGetStream';
import { useGetStreamMacros } from '@/api/hooks/useGetStreamMacros';
import { usePatchStream } from '@/api/hooks/usePatchStream';
import { usePostStartStream } from '@/api/hooks/usePostStartStream';
import { usePostStream } from '@/api/hooks/usePostStream';
import { usePostStreamMacros } from '@/api/hooks/usePostStreamMacros';
import { useToast } from '@/components/common/Toast';
import type { LiveStreamItem, Product, StreamRequest } from '@/types';
import { CATEGORIES } from './categories';
import InventorySelectModal from './InventorySelectModal';
import ScheduleModal from './ScheduleModal';
import { normalizeStreamScheduledAt } from './streamDateTime';

const toFallbackProduct = (item: LiveStreamItem): Product => ({
  itemId: item.itemId,
  status: 'READY',
  name: item.name,
  description: '',
  tags: [],
  images: item.image1 ? [item.image1] : [],
  startPrice: item.startPrice,
  bidUnit: 0,
  auctionDuration: 0,
  itemCondition: item.itemCondition,
  category: item.category,
  auctionType: 'BOTTOM_UP',
});

export default function LiveRegisterPage() {
  const [searchParams] = useSearchParams();
  const rawStreamId = Number(searchParams.get('streamId') ?? 0);
  const streamId = Number.isFinite(rawStreamId) ? rawStreamId : 0;
  const isEditMode = streamId > 0;

  const navigate = useNavigate();
  const location = useLocation();
  const thumbnailInputRef = useRef<HTMLInputElement>(null);
  const initializedStreamIdRef = useRef<number | null>(null);
  const initializedItemsStreamIdRef = useRef<number | null>(null);
  const initializedMacroKeyRef = useRef<string | null>(null);

  const createCategoryId = (location.state as { categoryId?: string } | null)?.categoryId ?? CATEGORIES[0]?.id ?? '';

  const { data: streamData, isLoading: streamLoading } = useGetStream(streamId);
  const categoryId = isEditMode ? (streamData?.category ?? '') : createCategoryId;
  const categoryLabel = CATEGORIES.find((category) => category.id === categoryId)?.label ?? streamData?.category ?? '';

  const { data: filteredInventory = [], isLoading: inventoryLoading } = useGetItemsByCategory(categoryId);
  const { data: macroData, isLoading: macroLoading } = useGetStreamMacros(streamId, isEditMode ? categoryId : '');

  const [title, setTitle] = useState('');
  const [notice, setNotice] = useState('');
  const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(null);
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [selectedItems, setSelectedItems] = useState<Product[]>([]);
  const [showInventoryModal, setShowInventoryModal] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [scheduledAt, setScheduledAt] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [macroAnswers, setMacroAnswers] = useState<Record<string, string>>({});

  const { showToast } = useToast();
  const defaultMacros = useMemo(() => CATEGORY_MACROS[categoryLabel] ?? [], [categoryLabel]);

  const macroFields = useMemo(() => {
    if (!isEditMode || !macroData?.macros?.length) {
      return defaultMacros;
    }

    return macroData.macros.map((macro) => ({
      questionType: macro.questionType,
      question: defaultMacros.find((item) => item.questionType === macro.questionType)?.question ?? macro.questionType,
      answer: macro.answer,
    }));
  }, [defaultMacros, isEditMode, macroData]);

  useEffect(() => {
    if (!isEditMode) {
      initializedStreamIdRef.current = null;
      return;
    }

    if (!streamData || initializedStreamIdRef.current === streamId) {
      return;
    }

    setTitle(streamData.title);
    setNotice(streamData.notice ?? '');
    setThumbnailUrl(streamData.thumbnail ?? null);
    setThumbnailFile(null);
    setScheduledAt(normalizeStreamScheduledAt(streamData.scheduledAt));
    initializedStreamIdRef.current = streamId;
  }, [isEditMode, streamData, streamId]);

  useEffect(() => {
    if (!isEditMode) {
      initializedItemsStreamIdRef.current = null;
      return;
    }

    if (!streamData || inventoryLoading || initializedItemsStreamIdRef.current === streamId) {
      return;
    }

    const inventoryById = new Map(filteredInventory.map((item) => [item.itemId, item]));
    const items = (streamData.items ?? []).map((item) => inventoryById.get(item.itemId) ?? toFallbackProduct(item));
    setSelectedItems(items);
    initializedItemsStreamIdRef.current = streamId;
  }, [filteredInventory, inventoryLoading, isEditMode, streamData, streamId]);

  useEffect(() => {
    if (!categoryId) {
      return;
    }

    if (!isEditMode) {
      const createMacroKey = `create:${categoryId}`;
      if (initializedMacroKeyRef.current === createMacroKey) {
        return;
      }

      const initialAnswers: Record<string, string> = {};
      defaultMacros.forEach((macro) => {
        initialAnswers[macro.questionType] = '';
      });
      setMacroAnswers(initialAnswers);
      initializedMacroKeyRef.current = createMacroKey;
      return;
    }

    if (!streamData || macroLoading) {
      return;
    }

    const editMacroKey = `edit:${streamId}`;
    if (initializedMacroKeyRef.current === editMacroKey) {
      return;
    }

    const initialAnswers: Record<string, string> = {};
    if (macroData?.macros?.length) {
      macroData.macros.forEach((macro) => {
        initialAnswers[macro.questionType] = macro.answer ?? '';
      });
    } else {
      defaultMacros.forEach((macro) => {
        initialAnswers[macro.questionType] = '';
      });
    }

    setMacroAnswers(initialAnswers);
    initializedMacroKeyRef.current = editMacroKey;
  }, [categoryId, defaultMacros, isEditMode, macroData, macroLoading, streamData, streamId]);

  const handleThumbnailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) {
      return;
    }

    const url = URL.createObjectURL(file);
    setThumbnailUrl(url);
    setThumbnailFile(file);
  };

  const toggleItem = (item: Product) => {
    setSelectedItems((prev) =>
      prev.some((i) => i.itemId === item.itemId) ? prev.filter((i) => i.itemId !== item.itemId) : [...prev, item],
    );
  };

  const handleSchedule = () => {
    if (!title.trim()) {
      showToast({ message: '방송 제목을 입력해주세요.' });
      return;
    }

    setShowScheduleModal(true);
  };

  const handleEnter = () => {
    if (!title.trim()) {
      showToast({ message: '방송 제목을 입력해주세요.' });
      return;
    }

    void submitReadyEntry();
  };

  const postStream = usePostStream();
  const postStartStream = usePostStartStream();
  const patchStream = usePatchStream(streamId);
  const postMacros = usePostStreamMacros();

  const buildMacrosPayload = () =>
    macroFields.map((macro) => ({
      questionType: macro.questionType,
      answer: macroAnswers[macro.questionType] ?? '',
    }));

  const validateStreamForm = () => {
    if (!title.trim()) {
      showToast({ message: '방송 제목을 입력해주세요.' });
      return false;
    }

    if (selectedItems.length === 0) {
      showToast({ message: '방송에 등록할 물품을 선택해주세요.' });
      return false;
    }

    return true;
  };

  const buildStreamRequest = (startType: 'SCHEDULED' | 'IMMEDIATE', scheduledAtValue?: string): StreamRequest => {
    const resolvedScheduledAt = (scheduledAtValue ?? scheduledAt) || undefined;

    return {
      title,
      category: categoryId,
      itemIds: selectedItems.map((item) => item.itemId),
      startType,
      notice: notice || undefined,
      scheduledAt: startType === 'SCHEDULED' ? resolvedScheduledAt : undefined,
    };
  };

  const submitReadyEntry = async () => {
    if (!categoryId || !validateStreamForm()) {
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        request: buildStreamRequest('SCHEDULED'),
        thumbnail: thumbnailFile ?? undefined,
      };

      const targetStreamId = isEditMode
        ? streamId
        : (
            await postStream.mutateAsync({
              ...payload,
            })
          ).streamId;

      if (isEditMode) {
        await Promise.all([
          patchStream.mutateAsync(payload),
          postMacros.mutateAsync({
            streamId: targetStreamId,
            body: { macros: buildMacrosPayload() },
          }),
        ]);
      } else {
        await postMacros.mutateAsync({
          streamId: targetStreamId,
          body: { macros: buildMacrosPayload() },
        });
      }

      navigate(`/live/${targetStreamId}`, {
        state: { autoOpenStartModal: true },
      });
    } catch (err) {
      console.error('[submitReadyEntry]', err);
      showToast({ message: isEditMode ? '방송 수정에 실패했습니다.' : '방송 등록에 실패했습니다.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const submitStream = async (startType: 'SCHEDULED' | 'IMMEDIATE', scheduledAtValue?: string) => {
    if (!categoryId || !validateStreamForm()) {
      return;
    }

    setIsSubmitting(true);
    try {
      const request = buildStreamRequest(startType, scheduledAtValue);
      const payload = {
        request,
        thumbnail: thumbnailFile ?? undefined,
      };

      if (isEditMode) {
        await Promise.all([
          patchStream.mutateAsync(payload),
          postMacros.mutateAsync({
            streamId,
            body: { macros: buildMacrosPayload() },
          }),
        ]);

        if (startType === 'IMMEDIATE') {
          navigate(`/live/${streamId}`);
        } else {
          showToast({ message: '방송을 수정했습니다.' });
          navigate('/lives');
        }

        return;
      }

      const res = await postStream.mutateAsync({
        ...payload,
      });
      const newStreamId = res.streamId;

      if (startType === 'IMMEDIATE') {
        const startRes = await postStartStream.mutateAsync({
          streamId: newStreamId,
          ...payload,
        });
        console.log('[Stream Start] openviduToken:', startRes.data?.openviduToken);
        showToast({ message: '방송이 시작되었습니다!' });
      } else {
        showToast({ message: '방송이 예약되었습니다!' });
      }

      await postMacros.mutateAsync({
        streamId: newStreamId,
        body: { macros: buildMacrosPayload() },
      });

      if (startType === 'IMMEDIATE') {
        navigate(`/live/${newStreamId}`);
      } else {
        navigate('/lives');
      }
    } catch (err) {
      console.error('[submitStream]', err);
      showToast({ message: isEditMode ? '방송 수정에 실패했습니다.' : '방송 등록에 실패했습니다.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const sellerEntryButtonLabel = isEditMode ? '방송 입장' : '방송 준비';
  const pageTitle = isEditMode ? '라이브 방송 수정' : '라이브 방송 등록';
  const scheduleButtonLabel = isEditMode ? '예약 수정' : '방송 예약';
  const liveButtonLabel = isEditMode ? '즉시 시작' : '방송 시작';

  if (isEditMode && streamLoading) {
    return (
      <div className="w-full max-w-[1400px] mx-auto px-4 py-12 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-[#333] border-t-[#d9b36d] rounded-full animate-spin" />
      </div>
    );
  }

  if (isEditMode && !streamLoading && !streamData) {
    return (
      <div className="w-full max-w-[1400px] mx-auto px-4 py-12">
        <div className="rounded-2xl border border-white/10 bg-[#111] px-6 py-10 text-center text-white/70">
          라이브 정보를 불러오지 못했습니다.
        </div>
      </div>
    );
  }

  return (
    <div className="w-full mx-auto px-6 py-4 flex flex-col gap-3 h-screen overflow-hidden">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate('/lives')}
            className="text-white/60 hover:text-white transition-colors"
          >
            <FaArrowLeft size={16} />
          </button>
          <div className="flex items-center gap-2">
            <FaCircle className="text-[#e74c3c] text-sm" />
            <h1 className="text-xl font-bold text-white">{pageTitle}</h1>{' '}
            <span className="text-[#d9b36d] font-semibold">[{categoryLabel}]</span>
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
            {scheduleButtonLabel}
            {scheduledAt && (
              <span className="text-[#d9b36d] text-xs font-medium ml-1">
                {new Date(scheduledAt).toLocaleDateString('ko-KR', {
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </span>
            )}
          </button>
          <button
            type="button"
            onClick={handleEnter}
            disabled={isSubmitting}
            className="flex items-center gap-2 px-5 py-2 bg-[#e74c3c] text-white text-sm font-semibold rounded-lg hover:bg-[#c0392b] transition-colors disabled:opacity-50"
          >
            <MdLiveTv size={16} />
            {sellerEntryButtonLabel || liveButtonLabel}
          </button>
        </div>
      </div>

      <div className="flex gap-4 flex-1 min-h-0">
        <aside className="w-[340px] shrink-0 flex flex-col rounded-2xl bg-[#050505] px-4 py-6 border-r border-white/5">
          <div className="mb-4 flex items-center justify-between">
            <span className="text-xs font-bold text-[#A1A1AA]">경매 물품 목록</span>
            <span className="text-[11px] font-bold text-[#52525B]">{selectedItems.length}</span>
          </div>

          <div className="flex flex-col gap-2 overflow-y-auto pr-2">
            {selectedItems.map((item) => {
              const conditionLabel =
                { BRAND_NEW: '미개봉 새제품', OPEN_BOX: '개봉된 새상품', REFURBISHED: '리퍼비시', USED: '중고' }[
                  item.itemCondition
                ] ?? item.itemCondition;

              return (
                <div
                  key={item.itemId}
                  className="flex gap-3 rounded-[20px] p-3.5 transition-all duration-200 bg-white/[0.02] border border-white/[0.06]"
                >
                  <div
                    className="h-16 w-16 shrink-0 rounded-[14px] bg-[#27272A]"
                    style={
                      item.images && item.images.length > 0
                        ? {
                            backgroundImage: `url(${item.images[0]})`,
                            backgroundPosition: 'center',
                            backgroundSize: 'cover',
                          }
                        : undefined
                    }
                  />
                  <div className="flex min-w-0 flex-1 flex-col justify-center gap-1">
                    <span className="truncate text-xs font-bold leading-snug text-white">{item.name}</span>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[13px] font-black text-[#C5A059]">
                        {item.startPrice.toLocaleString()}원
                      </span>
                      <span className="rounded-full px-1.5 py-0.5 text-[9px] font-extrabold text-[rgba(255,220,140,0.95)] bg-[rgba(197,160,89,0.08)]">
                        {conditionLabel}
                      </span>
                    </div>
                  </div>
                  <div className="flex shrink-0 flex-col items-end justify-center">
                    <span className="rounded-full px-1.5 py-0.5 text-[9px] font-extrabold text-[#71717A] bg-[rgba(113,113,122,0.15)] border border-[rgba(113,113,122,0.3)]">
                      대기
                    </span>
                    <button
                      type="button"
                      onClick={() => toggleItem(item)}
                      className="mt-1.5 text-[#e74c3c] text-[10px] hover:text-red-400 bg-transparent border-none cursor-pointer"
                    >
                      <FaTimes size={10} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          <button
            type="button"
            onClick={() => setShowInventoryModal(true)}
            className="mt-2 flex w-full items-center justify-center gap-2 rounded-2xl border border-[rgba(255,255,255,0.07)] bg-transparent px-4 py-2.5 text-xs font-bold text-[#71717A] transition-all hover:border-[rgba(255,255,255,0.12)] hover:bg-[#18181B] hover:text-[#D4D4D8]"
          >
            인벤토리에서 물품 선택
          </button>
        </aside>

        <div className="flex-1 min-w-0 relative rounded-2xl overflow-hidden bg-black flex flex-col">
          {notice && (
            <div className="absolute top-4 left-4 right-4 z-10 flex items-center gap-2 bg-[#1a1a1a]/80 rounded-lg px-4 py-2 backdrop-blur-sm">
              <span className="text-[11px] font-bold text-[#A1A1AA] bg-[#2a2a2a] px-2 py-0.5 rounded">공지사항</span>
              <span className="text-sm text-white/80">{notice}</span>
            </div>
          )}

          <div className="flex-1 flex items-center justify-center">
            {thumbnailUrl ? (
              <img src={thumbnailUrl} alt="thumbnail" className="max-w-[60%] max-h-[60%] object-contain" />
            ) : (
              <div className="flex flex-col items-center gap-3 text-white/20">
                <MdLiveTv size={60} />
                <span className="text-sm">방송 미리보기</span>
              </div>
            )}
          </div>
        </div>

        <aside className="w-[300px] shrink-0 flex flex-col rounded-2xl bg-[#050505] overflow-hidden border-l border-white/5">
          <div className="px-4 py-4 border-b border-[rgba(255,255,255,0.05)]">
            <span className="text-xs font-bold text-white">방송 기본 설정</span>
          </div>

          <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold text-[#52525B] uppercase tracking-wider">썸네일 업로드</label>
              <button
                type="button"
                onClick={() => thumbnailInputRef.current?.click()}
                className="w-full h-[100px] border border-[rgba(255,255,255,0.07)] rounded-xl bg-transparent flex flex-col items-center justify-center gap-2 hover:border-[rgba(255,255,255,0.12)] hover:bg-[#18181B] transition-all"
              >
                {thumbnailUrl ? (
                  <img src={thumbnailUrl} alt="thumb" className="w-full h-full object-contain rounded-xl" />
                ) : (
                  <>
                    <FaCamera size={18} className="text-[#52525B]" />
                    <span className="text-[#52525B] text-[11px] font-bold">이미지 첨부</span>
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

            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold text-[#52525B] uppercase tracking-wider">방송 제목</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="제목을 입력하세요."
                className="w-full bg-transparent border border-[rgba(255,255,255,0.07)] rounded-lg px-3 py-2 text-white text-xs placeholder:text-[#3F3F46] outline-none focus:border-[rgba(197,160,89,0.4)] transition-colors"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold text-[#52525B] uppercase tracking-wider">
                상단 고정 공지사항 (선택)
              </label>
              <input
                type="text"
                value={notice}
                onChange={(e) => setNotice(e.target.value)}
                placeholder="공지사항을 입력하세요."
                className="w-full bg-transparent border border-[rgba(255,255,255,0.07)] rounded-lg px-3 py-2 text-white text-xs placeholder:text-[#3F3F46] outline-none focus:border-[rgba(197,160,89,0.4)] transition-colors"
              />
            </div>

            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <label className="text-[10px] font-bold text-[#52525B] uppercase tracking-wider">카테고리 매크로</label>
              </div>
              <div className="flex flex-col gap-2">
                {macroFields.map((macro) => {
                  const command = macro.question.trim();

                  return (
                    <div key={macro.questionType} className="flex items-center gap-2">
                      <button
                        type="button"
                        className={`shrink-0 px-2.5 py-1 rounded-full text-[10px] font-extrabold whitespace-nowrap transition-colors ${
                          macroAnswers[macro.questionType]
                            ? 'bg-[rgba(197,160,89,0.12)] border border-[rgba(197,160,89,0.4)] text-[#C5A059]'
                            : 'bg-transparent border border-[rgba(255,255,255,0.07)] text-[#52525B]'
                        }`}
                        onClick={() => {
                          const cmd = '!' + command;
                          navigator.clipboard?.writeText(cmd).catch(() => {});
                        }}
                        title="클릭하면 커맨드 복사"
                      >
                        !{command}
                      </button>
                      <input
                        type="text"
                        value={macroAnswers[macro.questionType] ?? ''}
                        onChange={(e) => {
                          setMacroAnswers((prev) => ({ ...prev, [macro.questionType]: e.target.value }));
                        }}
                        placeholder="응답을 입력해주세요."
                        className="flex-1 min-w-0 bg-transparent border border-[rgba(255,255,255,0.07)] rounded-lg px-2 py-1.5 text-white text-[11px] placeholder:text-[#3F3F46] outline-none focus:border-[rgba(197,160,89,0.4)] transition-colors"
                      />
                    </div>
                  );
                })}
                {!macroFields.length && (
                  <p className="text-[#52525B] text-xs font-bold">해당 카테고리의 매크로가 없습니다.</p>
                )}
              </div>
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
    </div>
  );
}
