import { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import {
  FaArrowLeft,
  FaBroadcastTower,
  FaCalendarAlt,
  FaCamera,
  FaCircle,
  FaList,
  FaSave,
  FaTimes,
} from 'react-icons/fa';
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
  image1: item.image1 ? item.image1 : '',
  startPrice: item.startPrice,
  bidUnit: 0,
  auctionDuration: 0,
  itemCondition: item.itemCondition,
  category: item.category,
  auctionType: '',
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
    const items = streamData.items.map((item) => inventoryById.get(item.itemId) ?? toFallbackProduct(item));
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

  const handleSaveMacros = () => {
    if (!isEditMode) {
      showToast({ message: '매크로는 방송 예약 또는 시작 시 함께 저장됩니다.' });
      return;
    }

    postMacros.mutate(
      { streamId, body: { macros: buildMacrosPayload() } },
      {
        onSuccess: () => showToast({ message: '매크로가 저장되었습니다.' }),
        onError: () => showToast({ message: '매크로 저장에 실패하였습니다.' }),
      },
    );
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
        await patchStream.mutateAsync(payload);
      }

      await postMacros.mutateAsync({
        streamId: targetStreamId,
        body: { macros: buildMacrosPayload() },
      });

      navigate(`/live/${targetStreamId}`, {
        state: { autoOpenStartModal: true },
      });
    } catch {
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
        await patchStream.mutateAsync(payload);

        await postMacros.mutateAsync({
          streamId,
          body: { macros: buildMacrosPayload() },
        });

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
    } catch {
      showToast({ message: '방송 등록에 실패했습니다.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const currentItem = selectedItems[0] ?? null;
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
    <div className="w-full max-w-[1400px] mx-auto px-4 py-6 flex flex-col gap-4">
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

      <div className="flex gap-4" style={{ minHeight: '600px' }}>
        <aside className="w-[190px] shrink-0 flex flex-col gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <FaList className="text-[#e74c3c] text-sm" />
              <h2 className="text-white font-bold text-base">경매 물품 리스트</h2>
            </div>
            <p className="text-[#888] text-xs leading-relaxed">방송 중 순서대로 표시됩니다.</p>
          </div>

          <div className="flex flex-col gap-2 flex-1">
            {selectedItems.map((item, idx) => (
              <div
                key={item.itemId}
                className="flex items-center gap-2 border border-white/10 rounded-lg p-2 bg-[#111]"
              >
                <span className="text-[#888] text-xs w-4">{idx + 1}</span>
                <div className="w-8 h-8 rounded bg-[#222] flex items-center justify-center shrink-0">
                  <FaBroadcastTower size={12} className="text-white/30" />
                </div>
                <span className="text-white text-xs truncate flex-1">{item.name}</span>
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
                <p className="text-white font-bold text-base">{currentItem.name}</p>
                <p className="text-white/60 text-sm">{currentItem.description}</p>
              </div>
              <p className="text-white font-bold text-lg">{currentItem.startPrice.toLocaleString()}원</p>
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
            <label className="text-[#888] text-xs">방송 제목</label>
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
                onClick={handleSaveMacros}
                className="flex items-center gap-1 text-[#d9b36d] text-xs hover:text-[#f0e6c8] transition-colors"
              >
                <FaSave size={11} />
                저장
              </button>
            </div>
            <div className="flex flex-col gap-2">
              {macroFields.map((macro) => {
                const command = macro.question.trim();

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
                      onChange={(e) => setMacroAnswers((prev) => ({ ...prev, [macro.questionType]: e.target.value }))}
                      placeholder="응답을 입력해주세요."
                      className="flex-1 min-w-0 bg-transparent border border-white/15 rounded-lg px-2 py-1.5 text-white text-xs placeholder:text-white/25 outline-none focus:border-white/40"
                    />
                  </div>
                );
              })}
              {!macroFields.length && <p className="text-[#888] text-xs">해당 카테고리의 매크로가 없습니다.</p>}
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
