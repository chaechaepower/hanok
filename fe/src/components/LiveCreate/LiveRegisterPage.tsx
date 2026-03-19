import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { FaArrowLeft, FaCalendarAlt, FaCamera, FaCircle, FaTimes, FaVideo, FaVideoSlash } from 'react-icons/fa';
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
import { getUploadErrorMessage } from '@/utils/getUploadErrorMessage';
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

  const videoPreviewRef = useRef<HTMLVideoElement>(null);
  const cameraStreamRef = useRef<MediaStream | null>(null);
  const [isCameraOn, setIsCameraOn] = useState(false);

  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      });
      cameraStreamRef.current = stream;
      if (videoPreviewRef.current) {
        videoPreviewRef.current.srcObject = stream;
      }
      setIsCameraOn(true);
    } catch {
      setIsCameraOn(false);
    }
  }, []);

  const stopCamera = useCallback(() => {
    cameraStreamRef.current?.getTracks().forEach((track) => track.stop());
    cameraStreamRef.current = null;
    if (videoPreviewRef.current) {
      videoPreviewRef.current.srcObject = null;
    }
    setIsCameraOn(false);
  }, []);

  useEffect(() => {
    startCamera();
    return () => {
      cameraStreamRef.current?.getTracks().forEach((track) => track.stop());
    };
  }, [startCamera]);

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
      showToast({
        message: getUploadErrorMessage(err, isEditMode ? '방송 수정에 실패했습니다.' : '방송 등록에 실패했습니다.'),
      });
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
      showToast({
        message: getUploadErrorMessage(err, isEditMode ? '방송 수정에 실패했습니다.' : '방송 등록에 실패했습니다.'),
      });
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
    <div className="flex h-screen w-full flex-col bg-surface p-3">
      <div className="flex items-center justify-between pb-2">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate('/lives')}
            className="rounded-lg px-2 py-1.5 text-neutral-500 transition-colors hover:bg-warm/5 hover:text-neutral-400"
          >
            <FaArrowLeft size={16} />
          </button>
          <div className="flex items-center gap-2">
            <FaCircle className="text-accent text-sm" />
            <h1 className="text-sm font-bold text-neutral-100">{pageTitle}</h1>
            <span className="text-xs font-bold text-gold">[{categoryLabel}]</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleSchedule}
            disabled={isSubmitting}
            className="flex items-center gap-2 rounded-lg border border-neutral-700 bg-transparent px-3 py-1.5 text-[11px] font-bold text-neutral-300 transition-colors hover:border-neutral-600 hover:bg-neutral-900 disabled:opacity-50"
          >
            <FaCalendarAlt size={12} />
            {scheduleButtonLabel}
            {scheduledAt && (
              <span className="ml-1 text-[10px] font-bold text-gold">
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
            className="flex items-center gap-2 rounded-lg border border-accent/35 bg-accent/12 px-3 py-1.5 text-[11px] font-bold text-accent-light transition-colors hover:bg-accent/18 disabled:opacity-50"
          >
            <MdLiveTv size={14} />
            {sellerEntryButtonLabel || liveButtonLabel}
          </button>
        </div>
      </div>

      <div className="flex gap-3 flex-1 min-h-0">
        <aside className="min-w-0 flex-1 flex flex-col rounded-2xl bg-background px-4 py-6 overflow-hidden">
          <div className="mb-4 flex items-center justify-between">
            <span className="text-xs font-bold text-neutral-400">경매 물품 목록</span>
            <span className="text-[11px] font-bold text-neutral-600">{selectedItems.length}</span>
          </div>

          <div className="flex flex-col gap-2 overflow-y-auto pr-2">
            {selectedItems.map((item) => {
              const conditionLabel =
                { BRAND_NEW: '미개봉', OPEN_BOX: '개봉된 새상품', REFURBISHED: '리퍼비시', USED: '중고' }[
                  item.itemCondition
                ] ?? item.itemCondition;

              return (
                <div
                  key={item.itemId}
                  className="flex gap-3 rounded-2xl border border-neutral-800 bg-white/[0.02] p-3"
                >
                  <div
                    className="h-14 w-14 shrink-0 rounded-xl bg-neutral-800"
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
                    <span className="truncate text-xs font-bold leading-snug text-neutral-100">{item.name}</span>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[11px] font-black text-gold">
                        {item.startPrice.toLocaleString()}원
                      </span>
                      <span className="rounded-full bg-gold/10 px-1.5 py-0.5 text-[9px] font-extrabold text-gold-light">
                        {conditionLabel}
                      </span>
                    </div>
                  </div>
                  <div className="flex shrink-0 flex-col items-end justify-center">
                    <span className="rounded-full border border-neutral-700 bg-neutral-900 px-1.5 py-0.5 text-[9px] font-extrabold text-neutral-500">
                      대기
                    </span>
                    <button
                      type="button"
                      onClick={() => toggleItem(item)}
                      className="mt-1.5 bg-transparent border-none cursor-pointer text-accent text-[10px] hover:text-accent-light"
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
            className="mt-2 flex w-full items-center justify-center gap-2 rounded-2xl border border-neutral-800 bg-transparent px-4 py-2.5 text-xs font-bold text-neutral-600 transition-all hover:border-neutral-700 hover:bg-neutral-900 hover:text-neutral-300"
          >
            인벤토리에서 물품 선택
          </button>
        </aside>

        <div className="min-w-0 flex-2 relative rounded-2xl overflow-hidden bg-background flex flex-col">
          <div className="flex-1 flex items-center justify-center">
            <video
              ref={videoPreviewRef}
              autoPlay
              muted
              playsInline
              className={`h-full w-full object-contain ${isCameraOn ? '' : 'hidden'}`}
              style={{ transform: 'scaleX(-1)' }}
            />
            {!isCameraOn && (
              <div className="flex flex-col items-center gap-3 text-white/20">
                <MdLiveTv size={60} />
                <span className="text-sm">카메라가 꺼져 있습니다</span>
              </div>
            )}
          </div>
          <div className="absolute bottom-4 right-4 flex items-center gap-2 rounded-2xl bg-surface/80 px-2.5 py-2">
            <button
              type="button"
              onClick={isCameraOn ? stopCamera : startCamera}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[11px] font-bold transition-all ${
                isCameraOn
                  ? 'text-neutral-400 hover:text-neutral-200'
                  : 'text-accent hover:text-accent-light'
              }`}
            >
              {isCameraOn ? <FaVideo size={14} /> : <FaVideoSlash size={14} />}
              {isCameraOn ? '카메라 끄기' : '카메라 켜기'}
            </button>
          </div>
        </div>

        <aside className="min-w-0 flex-1 flex flex-col rounded-2xl bg-background overflow-hidden">
          <div className="px-3 py-2 border-b border-neutral-800">
            <span className="text-xs font-bold text-neutral-100">방송 기본 설정</span>
          </div>

          <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold uppercase tracking-wider text-neutral-500">썸네일 업로드</label>
              <button
                type="button"
                onClick={() => thumbnailInputRef.current?.click()}
                className="w-full h-[100px] rounded-xl border border-neutral-800 bg-transparent flex flex-col items-center justify-center gap-2 transition-all hover:border-neutral-700 hover:bg-neutral-900"
              >
                {thumbnailUrl ? (
                  <img src={thumbnailUrl} alt="thumb" className="w-full h-full object-contain rounded-xl" />
                ) : (
                  <>
                    <FaCamera size={18} className="text-neutral-600" />
                    <span className="text-[11px] font-bold text-neutral-600">이미지 첨부</span>
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
              <label className="text-[10px] font-bold uppercase tracking-wider text-neutral-500">방송 제목</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="제목을 입력하세요."
                className="w-full rounded-lg border border-neutral-800 bg-transparent px-3 py-2 text-xs text-neutral-100 outline-none placeholder:text-neutral-700 transition-colors focus:border-gold/40"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold uppercase tracking-wider text-neutral-500">
                상단 고정 공지사항 (선택)
              </label>
              <input
                type="text"
                value={notice}
                onChange={(e) => setNotice(e.target.value)}
                placeholder="공지사항을 입력하세요."
                className="w-full rounded-lg border border-neutral-800 bg-transparent px-3 py-2 text-xs text-neutral-100 outline-none placeholder:text-neutral-700 transition-colors focus:border-gold/40"
              />
            </div>

            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <label className="text-[10px] font-bold uppercase tracking-wider text-neutral-500">카테고리 매크로</label>
              </div>
              <div className="flex flex-col gap-2">
                {macroFields.map((macro) => {
                  const command = macro.question.trim();

                  return (
                    <div key={macro.questionType} className="flex items-center gap-2">
                      <button
                        type="button"
                        className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-extrabold whitespace-nowrap transition-colors ${
                          macroAnswers[macro.questionType]
                            ? 'border border-gold/40 bg-gold/10 text-gold'
                            : 'border border-neutral-800 bg-transparent text-neutral-600'
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
                        className="min-w-0 flex-1 rounded-lg border border-neutral-800 bg-transparent px-2 py-1.5 text-[11px] text-neutral-100 outline-none placeholder:text-neutral-700 transition-colors focus:border-gold/40"
                      />
                    </div>
                  );
                })}
                {!macroFields.length && (
                  <p className="text-xs font-bold text-neutral-600">해당 카테고리의 매크로가 없습니다.</p>
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
