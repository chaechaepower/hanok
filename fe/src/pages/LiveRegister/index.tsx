import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { FaArrowLeft, FaCalendarAlt, FaCircle } from 'react-icons/fa';
import { MdLiveTv } from 'react-icons/md';
import { CATEGORY_MACROS } from '@/constants/macro';
import { useGetItemsByCategory } from '@/api/hooks/useGetItems';
import { useGetStream } from '@/api/hooks/useGetStream';
import { useGetStreamMacros } from '@/api/hooks/useGetStreamMacros';
import { usePatchStream } from '@/api/hooks/usePatchStream';
import { usePostStartStream } from '@/api/hooks/usePostStartStream';
import { usePostStream } from '@/api/hooks/usePostStream';
import { usePostStreamMacros } from '@/api/hooks/usePostStreamMacros';
import type { Product, StreamRequest } from '@/types';
import { getUploadErrorMessage } from '@/utils/getUploadErrorMessage';
import { CATEGORIES } from '@/constants/category';
import { useToast } from '@/hooks/useToast';
import { normalizeStreamScheduledAt } from '@/utils/streamDateTime';
import { LIVE_REGISTER_TUTORIAL_EXAMPLE_ITEM } from '@/constants/live';
import {
  initializeAuctionConfig,
  toFallbackProduct,
  toStreamAuctionItem,
  type AuctionFieldErrors,
  type AuctionNumberField,
  type LiveRegisterMacroField,
} from '@/utils/liveRegister';
import useLiveRegisterCamera from '@/hooks/useLiveRegisterCamera';
import LiveRegisterTutorial from '@/components/LiveCreate/LiveRegisterTutorial';
import LiveRegisterItemsPanel from '@/components/LiveCreate/LiveRegisterItemsPanel';
import LiveRegisterPreviewPanel from '@/components/LiveCreate/LiveRegisterPreviewPanel';
import LiveRegisterSettingsPanel from '@/components/LiveCreate/LiveRegisterSettingsPanel';
import InventorySelectModal from '@/components/LiveCreate/InventorySelectModal';
import ScheduleModal from '@/components/LiveCreate/ScheduleModal';

export default function LiveRegisterPage() {
  const [searchParams] = useSearchParams();
  const rawStreamId = Number(searchParams.get('streamId') ?? 0);
  const streamId = Number.isFinite(rawStreamId) ? rawStreamId : 0;
  const isEditMode = streamId > 0;
  const autoStart = searchParams.get('autoStart') === 'true';

  const navigate = useNavigate();
  const location = useLocation();
  const thumbnailInputRef = useRef<HTMLInputElement>(null);
  const tutorialItemRef = useRef<HTMLDivElement>(null);
  const introduceButtonRef = useRef<HTMLButtonElement>(null);
  const startButtonRef = useRef<HTMLButtonElement>(null);
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
  const [auctionFieldErrors, setAuctionFieldErrors] = useState<AuctionFieldErrors>({});
  const [showInventoryModal, setShowInventoryModal] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [scheduledAt, setScheduledAt] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [macroAnswers, setMacroAnswers] = useState<Record<string, string>>({});
  const { videoPreviewRef, isCameraOn, startCamera, stopCamera } = useLiveRegisterCamera();

  const { showToast } = useToast();
  const defaultMacros = useMemo(() => CATEGORY_MACROS[categoryLabel] ?? [], [categoryLabel]);

  const macroFields = useMemo<LiveRegisterMacroField[]>(() => {
    if (!isEditMode || !macroData?.macros?.length) {
      return defaultMacros;
    }

    return macroData.macros.map((macro) => ({
      questionType: macro.questionType,
      question: defaultMacros.find((item) => item.questionType === macro.questionType)?.question ?? macro.questionType,
      answer: macro.answer,
    }));
  }, [defaultMacros, isEditMode, macroData]);

  const handlePreviewIntroduce = () => {
    showToast({ message: '튜토리얼용 버튼입니다. 실제 설명 시작은 방송 페이지에서 진행됩니다.' });
  };

  const handlePreviewStart = () => {
    showToast({ message: '튜토리얼용 버튼입니다. 실제 경매 시작은 방송 페이지에서 진행됩니다.' });
  };

  const handleMacroAnswerChange = useCallback((questionType: string, value: string) => {
    setMacroAnswers((prev) => ({
      ...prev,
      [questionType]: value,
    }));
  }, []);

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
    const items = (streamData.items ?? []).map((item) => {
      const inventoryItem = inventoryById.get(item.itemId);
      const streamItem = toFallbackProduct(item);

      return inventoryItem
        ? {
            ...inventoryItem,
            ...streamItem,
            images: streamItem.images.length > 0 ? streamItem.images : inventoryItem.images,
            tags: streamItem.tags.length > 0 ? streamItem.tags : inventoryItem.tags,
            description: streamItem.description || inventoryItem.description,
          }
        : streamItem;
    });
    setSelectedItems(items.map(initializeAuctionConfig));
    initializedItemsStreamIdRef.current = streamId;
  }, [filteredInventory, inventoryLoading, isEditMode, streamData, streamId]);

  const updateSelectedItem = useCallback((itemId: number, updater: (item: Product) => Product) => {
    setSelectedItems((prev) => prev.map((item) => (item.itemId === itemId ? updater(item) : item)));
  }, []);

  const setAuctionFieldError = useCallback((itemId: number, field: AuctionNumberField, message: string) => {
    setAuctionFieldErrors((prev) => ({
      ...prev,
      [itemId]: {
        ...prev[itemId],
        [field]: message,
      },
    }));
  }, []);

  const clearAuctionFieldError = useCallback((itemId: number, field: AuctionNumberField) => {
    setAuctionFieldErrors((prev) => {
      const nextItemErrors = { ...(prev[itemId] ?? {}) };
      delete nextItemErrors[field];

      if (Object.keys(nextItemErrors).length === 0) {
        const next = { ...prev };
        delete next[itemId];
        return next;
      }

      return {
        ...prev,
        [itemId]: nextItemErrors,
      };
    });
  }, []);

  const handleAuctionTypeChange = useCallback(
    (itemId: number, nextAuctionType: Product['auctionType']) => {
      if (!nextAuctionType) {
        return;
      }

      clearAuctionFieldError(itemId, 'minPrice');
      clearAuctionFieldError(itemId, 'bidUnit');

      updateSelectedItem(itemId, (item) => {
        if (nextAuctionType === 'UNIQUE_TOP') {
          return {
            ...item,
            auctionType: nextAuctionType,
            auctionDuration: item.auctionDuration ?? 60,
            startPrice: undefined,
            bidUnit: undefined,
            minPrice: item.minPrice ?? item.startPrice ?? null,
            maxPrice: item.maxPrice ?? null,
          };
        }

        return {
          ...item,
          auctionType: nextAuctionType,
          auctionDuration: item.auctionDuration ?? 60,
          startPrice: item.startPrice ?? item.minPrice ?? undefined,
          bidUnit: item.bidUnit,
          minPrice: null,
          maxPrice: null,
        };
      });
    },
    [clearAuctionFieldError, updateSelectedItem],
  );

  const handleAuctionDurationChange = useCallback(
    (itemId: number, duration: number) => {
      updateSelectedItem(itemId, (item) => ({
        ...item,
        auctionDuration: duration,
      }));
    },
    [updateSelectedItem],
  );

  const handleAuctionFieldChange = useCallback(
    (itemId: number, field: AuctionNumberField, rawValue: string) => {
      const digitsOnly = rawValue.replace(/[^0-9]/g, '');
      const parsedValue = digitsOnly ? Number(digitsOnly) : undefined;

      if (field === 'minPrice' || field === 'maxPrice') {
        clearAuctionFieldError(itemId, 'minPrice');
        clearAuctionFieldError(itemId, 'maxPrice');
      } else if (field === 'startPrice' || field === 'bidUnit') {
        clearAuctionFieldError(itemId, 'startPrice');
        clearAuctionFieldError(itemId, 'bidUnit');
      }

      clearAuctionFieldError(itemId, field);

      updateSelectedItem(itemId, (item) => ({
        ...item,
        [field]: field === 'minPrice' || field === 'maxPrice' ? (parsedValue ?? null) : parsedValue,
      }));
    },
    [clearAuctionFieldError, updateSelectedItem],
  );

  const handleAuctionFieldBlur = useCallback(
    (item: Product, field: AuctionNumberField) => {
      if (field === 'minPrice') {
        if (item.minPrice != null && item.maxPrice != null && item.maxPrice < item.minPrice) {
          setAuctionFieldError(item.itemId, 'maxPrice', '최대 입찰가는 최소 입찰가보다 크거나 같아야 합니다');
          return;
        }

        clearAuctionFieldError(item.itemId, 'minPrice');
        clearAuctionFieldError(item.itemId, 'maxPrice');
        return;
      }

      if (field === 'maxPrice') {
        if (item.minPrice != null && item.maxPrice != null && item.maxPrice < item.minPrice) {
          setAuctionFieldError(item.itemId, 'maxPrice', '최대 입찰가는 최소 입찰가보다 크거나 같아야 합니다');
          return;
        }

        clearAuctionFieldError(item.itemId, 'minPrice');
        clearAuctionFieldError(item.itemId, 'maxPrice');
        return;
      }

      if (field === 'startPrice') {
        if (item.startPrice == null) {
          clearAuctionFieldError(item.itemId, 'startPrice');
          return;
        }

        const correctedStartPrice = Math.max(item.startPrice, 1000);
        if (correctedStartPrice !== item.startPrice) {
          updateSelectedItem(item.itemId, (current) => ({
            ...current,
            startPrice: correctedStartPrice,
          }));
          setAuctionFieldError(item.itemId, 'startPrice', '시작가는 1,000원 이상이어야 합니다');
          return;
        }

        clearAuctionFieldError(item.itemId, 'startPrice');
        clearAuctionFieldError(item.itemId, 'bidUnit');
      }

      if (field === 'bidUnit') {
        if (item.bidUnit == null) {
          clearAuctionFieldError(item.itemId, 'bidUnit');
          return;
        }

        const maximumBidUnit = Math.max(100, Math.floor((item.startPrice ?? 0) * 0.1));
        const correctedBidUnit = Math.min(Math.max(item.bidUnit, 100), maximumBidUnit);

        if (correctedBidUnit !== item.bidUnit) {
          updateSelectedItem(item.itemId, (current) => ({
            ...current,
            bidUnit: correctedBidUnit,
          }));
          setAuctionFieldError(item.itemId, 'bidUnit', `입찰 단위는 최소 100원, 최대 시작가의 10%까지입니다`);
          return;
        }

        clearAuctionFieldError(item.itemId, 'bidUnit');
        return;
      }

      if (field === 'startPrice' && item.bidUnit != null) {
        const maximumBidUnit = Math.max(100, Math.floor((item.startPrice ?? 0) * 0.1));
        if (item.bidUnit > maximumBidUnit) {
          updateSelectedItem(item.itemId, (current) => ({
            ...current,
            bidUnit: maximumBidUnit,
          }));
          setAuctionFieldError(item.itemId, 'bidUnit', `입찰 단위는 최소 100원, 최대 시작가의 10%까지입니다`);
          return;
        }
      }
    },
    [clearAuctionFieldError, setAuctionFieldError, updateSelectedItem],
  );

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
      prev.some((i) => i.itemId === item.itemId)
        ? prev.filter((i) => i.itemId !== item.itemId)
        : [...prev, initializeAuctionConfig(item)],
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

  const autoStartTriggeredRef = useRef(false);
  useEffect(() => {
    if (autoStart && isEditMode && !streamLoading && title.trim() && !autoStartTriggeredRef.current) {
      autoStartTriggeredRef.current = true;
      handleEnter();
    }
  });

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

    for (const item of selectedItems) {
      if (!item.auctionType) {
        showToast({ message: `${item.name}의 경매 방식을 선택해주세요.` });
        return false;
      }

      if (!item.auctionDuration || item.auctionDuration <= 0) {
        showToast({ message: `${item.name}의 경매 시간을 입력해주세요.` });
        return false;
      }

      if (item.auctionType === 'BOTTOM_UP') {
        if (!item.startPrice || item.startPrice <= 0) {
          showToast({ message: `${item.name}의 시작가를 입력해주세요.` });
          return false;
        }

        if (item.startPrice < 1000) {
          showToast({ message: `${item.name}의 시작가는 1,000원 이상이어야 합니다.` });
          return false;
        }

        if (!item.bidUnit || item.bidUnit <= 0) {
          showToast({ message: `${item.name}의 입찰 단위를 입력해주세요.` });
          return false;
        }

        if (item.bidUnit < 100) {
          showToast({ message: `${item.name}의 입찰 단위는 100원 이상이어야 합니다.` });
          return false;
        }

        if (item.bidUnit > Math.max(100, Math.floor(item.startPrice * 0.1))) {
          showToast({ message: `${item.name}의 입찰 단위는 시작가의 10% 이하여야 합니다.` });
          return false;
        }
      }

      if (item.auctionType === 'UNIQUE_TOP') {
        if (item.minPrice == null) {
          showToast({ message: `${item.name}의 최소 입찰가를 입력해주세요.` });
          return false;
        }

        if (item.maxPrice == null) {
          showToast({ message: `${item.name}의 최대 입찰가를 입력해주세요.` });
          return false;
        }

        if (item.maxPrice < item.minPrice) {
          showToast({ message: `${item.name}의 최대 입찰가는 최소 입찰가보다 크거나 같아야 합니다.` });
          return false;
        }
      }
    }

    return true;
  };

  const buildStreamRequest = (startType: 'SCHEDULED' | 'INSTANT', scheduledAtValue?: string): StreamRequest => {
    const resolvedScheduledAt = (scheduledAtValue ?? scheduledAt) || undefined;

    return {
      title,
      category: categoryId,
      auctionItems: selectedItems.map(toStreamAuctionItem),
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

  const submitStream = async (startType: 'SCHEDULED' | 'INSTANT', scheduledAtValue?: string) => {
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

        if (startType === 'INSTANT') {
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

      if (startType === 'INSTANT') {
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

      if (startType === 'INSTANT') {
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
          라이브 정보를 불러오지 못했습니다
        </div>
      </div>
    );
  }

  return (
    <LiveRegisterTutorial
      selectedItemsCount={selectedItems.length}
      inventoryTargetRef={tutorialItemRef}
      introduceTargetRef={introduceButtonRef}
      startTargetRef={startButtonRef}
    >
      {({ activeStepId, shouldShowExampleItem, getTargetClassName, reopenTutorial }) => {
        const tutorialVisibleItems = shouldShowExampleItem ? [LIVE_REGISTER_TUTORIAL_EXAMPLE_ITEM] : selectedItems;

        return (
          <div className="relative flex h-[calc(100vh-6.5rem)] w-full flex-col overflow-hidden bg-surface p-3">
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
                  <FaCircle className="text-accent text-base" />
                  <h1 className="text-lg font-bold text-neutral-100">{pageTitle}</h1>
                  <span className="text-sm font-bold text-gold">[{categoryLabel}]</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleSchedule}
                  disabled={isSubmitting}
                  className="flex items-center gap-2 rounded-lg border border-neutral-700 bg-transparent px-3 py-2 text-[13px] font-bold text-neutral-300 transition-colors hover:border-neutral-600 hover:bg-neutral-900 disabled:opacity-50"
                >
                  <FaCalendarAlt size={12} />
                  {scheduleButtonLabel}
                  {scheduledAt && (
                    <span className="ml-1 text-xs font-bold text-gold">
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
                  className="flex items-center gap-2 rounded-lg border border-accent/35 bg-accent/12 px-3 py-2 text-[13px] font-bold text-accent-light transition-colors hover:bg-accent/18 disabled:opacity-50"
                >
                  <MdLiveTv size={14} />
                  {sellerEntryButtonLabel}
                </button>
              </div>
            </div>

            <div className="flex gap-3 flex-1 min-h-0">
              <LiveRegisterItemsPanel
                activeStepId={activeStepId}
                tutorialVisibleItems={tutorialVisibleItems}
                tutorialItemRef={tutorialItemRef}
                getTargetClassName={getTargetClassName}
                auctionFieldErrors={auctionFieldErrors}
                onToggleItem={toggleItem}
                onAuctionTypeChange={handleAuctionTypeChange}
                onAuctionDurationChange={handleAuctionDurationChange}
                onAuctionFieldChange={handleAuctionFieldChange}
                onAuctionFieldBlur={handleAuctionFieldBlur}
                onOpenInventory={() => setShowInventoryModal(true)}
              />

              <LiveRegisterPreviewPanel
                videoPreviewRef={videoPreviewRef}
                isCameraOn={isCameraOn}
                onStartCamera={() => void startCamera()}
                onStopCamera={stopCamera}
                onReopenTutorial={reopenTutorial}
                onPreviewIntroduce={handlePreviewIntroduce}
                onPreviewStart={handlePreviewStart}
                introduceButtonRef={introduceButtonRef}
                startButtonRef={startButtonRef}
                getTargetClassName={getTargetClassName}
              />

              <LiveRegisterSettingsPanel
                thumbnailInputRef={thumbnailInputRef}
                thumbnailUrl={thumbnailUrl}
                onThumbnailChange={handleThumbnailChange}
                title={title}
                notice={notice}
                onTitleChange={setTitle}
                onNoticeChange={setNotice}
                macroFields={macroFields}
                macroAnswers={macroAnswers}
                onMacroAnswerChange={handleMacroAnswerChange}
              />
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
      }}
    </LiveRegisterTutorial>
  );
}
