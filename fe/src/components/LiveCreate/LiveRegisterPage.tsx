import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { FaArrowLeft, FaCalendarAlt, FaCamera, FaCircle, FaTimes, FaVideo, FaVideoSlash } from 'react-icons/fa';
import { MdLiveTv } from 'react-icons/md';
import { AUCTION_TYPE_SELECT_OPTIONS, DURATION_SELECT_OPTIONS } from '@/constants/auction';
import { CATEGORY_MACROS } from '@/constants/macro';
import { getItemConditionLabel } from '@/constants/itemCondition';
import { useGetItemsByCategory } from '@/api/hooks/useGetItems';
import { useGetStream } from '@/api/hooks/useGetStream';
import { useGetStreamMacros } from '@/api/hooks/useGetStreamMacros';
import { usePatchStream } from '@/api/hooks/usePatchStream';
import { usePostStartStream } from '@/api/hooks/usePostStartStream';
import { usePostStream } from '@/api/hooks/usePostStream';
import { usePostStreamMacros } from '@/api/hooks/usePostStreamMacros';
import CustomSelect from '@/components/common/CustomSelect';
import type { AuctionItem, Product, StreamAuctionItem, StreamDetailItem, StreamRequest } from '@/types';
import { getUploadErrorMessage } from '@/utils/getUploadErrorMessage';
import LiveRegisterTutorial from './LiveRegisterTutorial';
import InventorySelectModal from './InventorySelectModal';
import ScheduleModal from './ScheduleModal';
import { CATEGORIES } from '@/constants/category';
import { useToast } from '@/hooks/useToast';
import { normalizeStreamScheduledAt } from '@/utils/streamDateTime';
import SellerActionButtons from '@/components/Live/Stream/SellerActionButtons';
import ActiveItemCard from '@/components/Live/Auction/shared/ActiveItemCard';
import { LIVE_REGISTER_TUTORIAL_EXAMPLE_ITEM } from '@/constants/live';

type AuctionNumberField = 'startPrice' | 'bidUnit' | 'minPrice' | 'maxPrice';
type AuctionFieldErrors = Record<number, Partial<Record<AuctionNumberField, string>>>;

const auctionInputClassName =
  'w-full rounded-lg border border-neutral-800 bg-neutral-950 px-3 py-2 text-sm font-bold tabular-nums text-neutral-100 outline-none placeholder:text-neutral-700 transition-colors focus:border-gold/40';

const toPreviewAuctionItem = (item: Product): AuctionItem => ({
  id: item.itemId,
  name: item.name,
  startPrice: item.auctionType === 'BOTTOM_UP' ? (item.startPrice ?? 0) : null,
  bidUnit: item.auctionType === 'BOTTOM_UP' ? (item.bidUnit ?? 0) : null,
  minPrice: item.auctionType === 'UNIQUE_TOP' ? (item.minPrice ?? item.startPrice ?? 0) : null,
  maxPrice: item.auctionType === 'UNIQUE_TOP' ? (item.maxPrice ?? item.startPrice ?? 0) : null,
  finalPrice: undefined,
  status: 'READY',
  auctionType: item.auctionType ?? 'BOTTOM_UP',
  condition: item.itemCondition as AuctionItem['condition'],
  thumbnailUrl: item.images[0] ?? undefined,
  description: item.description,
  auctionTime: item.auctionDuration ?? 60,
  images: item.images,
});

const initializeAuctionConfig = (item: Product): Product => {
  const auctionType = item.auctionType ?? 'BOTTOM_UP';
  const auctionDuration = item.auctionDuration ?? 60;

  if (auctionType === 'UNIQUE_TOP') {
    return {
      ...item,
      auctionType,
      auctionDuration,
      startPrice: undefined,
      bidUnit: undefined,
      minPrice: item.minPrice ?? null,
      maxPrice: item.maxPrice ?? null,
    };
  }

  return {
    ...item,
    auctionType,
    auctionDuration,
    startPrice: item.startPrice,
    bidUnit: item.bidUnit,
    minPrice: null,
    maxPrice: null,
  };
};

const toFallbackProduct = (item: StreamDetailItem): Product => ({
  itemId: item.itemId,
  status: item.status,
  name: item.name,
  description: item.description,
  tags: item.tags,
  images: item.images,
  startPrice: item.auctionType === 'BOTTOM_UP' ? item.bottomUp.startPrice : item.uniqueTop.minPrice,
  minPrice: item.auctionType === 'UNIQUE_TOP' ? item.uniqueTop.minPrice : null,
  maxPrice: item.auctionType === 'UNIQUE_TOP' ? item.uniqueTop.maxPrice : null,
  bidUnit: item.auctionType === 'BOTTOM_UP' ? item.bottomUp.bidUnit : 0,
  auctionDuration: item.auctionDuration,
  itemCondition: item.itemCondition,
  category: item.category,
  auctionType: item.auctionType,
  createdAt: item.createdAt,
});

const toStreamAuctionItem = (item: Product): StreamAuctionItem =>
  item.auctionType === 'UNIQUE_TOP'
    ? {
        itemId: item.itemId,
        auctionType: 'UNIQUE_TOP',
        auctionDuration: item.auctionDuration ?? 0,
        bottomUp: null,
        uniqueTop: {
          minPrice: item.minPrice ?? item.startPrice ?? 0,
          maxPrice: item.maxPrice ?? item.startPrice ?? 0,
        },
      }
    : {
        itemId: item.itemId,
        auctionType: 'BOTTOM_UP',
        auctionDuration: item.auctionDuration ?? 0,
        bottomUp: {
          startPrice: item.startPrice ?? 0,
          bidUnit: item.bidUnit ?? 0,
        },
        uniqueTop: null,
      };

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

  const handlePreviewIntroduce = () => {
    showToast({ message: '튜토리얼용 버튼입니다. 실제 설명 시작은 방송 페이지에서 진행됩니다.' });
  };

  const handlePreviewStart = () => {
    showToast({ message: '튜토리얼용 버튼입니다. 실제 경매 시작은 방송 페이지에서 진행됩니다.' });
  };

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
          setAuctionFieldError(item.itemId, 'maxPrice', '최대 입찰가는 최소 입찰가보다 크거나 같아야 합니다.');
          return;
        }

        clearAuctionFieldError(item.itemId, 'minPrice');
        clearAuctionFieldError(item.itemId, 'maxPrice');
        return;
      }

      if (field === 'maxPrice') {
        if (item.minPrice != null && item.maxPrice != null && item.maxPrice < item.minPrice) {
          setAuctionFieldError(item.itemId, 'maxPrice', '최대 입찰가는 최소 입찰가보다 크거나 같아야 합니다.');
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
          setAuctionFieldError(item.itemId, 'startPrice', '시작가는 1,000원 이상이어야 합니다.');
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
          setAuctionFieldError(item.itemId, 'bidUnit', `입찰 단위는 최소 100원, 최대 시작가의 10%까지입니다.`);
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
          setAuctionFieldError(item.itemId, 'bidUnit', `입찰 단위는 최소 100원, 최대 시작가의 10%까지입니다.`);
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
    <LiveRegisterTutorial
      selectedItemsCount={selectedItems.length}
      inventoryTargetRef={tutorialItemRef}
      introduceTargetRef={introduceButtonRef}
      startTargetRef={startButtonRef}
    >
      {({ activeStepId, shouldShowExampleItem, getTargetClassName, reopenTutorial }) => {
        const tutorialVisibleItems = shouldShowExampleItem ? [LIVE_REGISTER_TUTORIAL_EXAMPLE_ITEM] : selectedItems;

        return (
          <div className="relative flex h-screen w-full flex-col bg-surface p-3">
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
                  {sellerEntryButtonLabel || liveButtonLabel}
                </button>
              </div>
            </div>

            <div className="flex gap-3 flex-1 min-h-0">
              <aside className="min-w-0 flex-1 flex flex-col rounded-2xl bg-background px-4 py-6 overflow-hidden">
                <div className="mb-4 flex items-center justify-between">
                  <span className="text-sm font-bold text-neutral-400">경매 물품 목록</span>
                  <span className="text-[13px] font-bold text-neutral-600">{tutorialVisibleItems.length}</span>
                </div>

                <div className="scrollbar-hide flex flex-col gap-2 overflow-y-auto pr-2">
                  {tutorialVisibleItems.map((item, index) => {
                    const conditionLabel = getItemConditionLabel(item.itemCondition);
                    const isTutorialFocusItem = activeStepId === 'inventory' && index === 0;
                    const isExampleItem = item.itemId === LIVE_REGISTER_TUTORIAL_EXAMPLE_ITEM.itemId;

                    return (
                      <div
                        key={`${item.itemId}-${index}`}
                        ref={isTutorialFocusItem ? tutorialItemRef : undefined}
                        className={`${isTutorialFocusItem ? getTargetClassName('inventory') : ''}`}
                      >
                        {isExampleItem ? (
                          <ActiveItemCard item={toPreviewAuctionItem(item)} isSelected={false} isSeller={false} />
                        ) : (
                          <div className="flex flex-col gap-3 rounded-2xl border border-neutral-800 bg-white/[0.02] p-3">
                            <div className="flex gap-3">
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
                                <span className="truncate text-sm font-bold leading-snug text-neutral-100">
                                  {item.name}
                                </span>
                                <div className="flex flex-wrap items-center gap-1.5">
                                  <span className="rounded-full bg-gold/10 px-2 py-0.5 text-[11px] font-extrabold text-gold-light">
                                    {conditionLabel}
                                  </span>
                                  <span className="rounded-full border border-neutral-700 bg-neutral-900 px-2 py-0.5 text-[11px] font-extrabold text-neutral-500">
                                    {item.auctionType === 'UNIQUE_TOP' ? '유일 최고가' : '상향식'}
                                  </span>
                                  <span className="rounded-full border border-neutral-700 bg-neutral-900 px-2 py-0.5 text-[11px] font-extrabold text-neutral-500">
                                    {item.auctionDuration ?? 60}초
                                  </span>
                                  {isExampleItem && (
                                    <span className="rounded-full border border-accent/30 bg-accent/10 px-2 py-0.5 text-[11px] font-extrabold text-accent-light">
                                      예시
                                    </span>
                                  )}
                                </div>
                              </div>
                              <div className="flex shrink-0 flex-col items-end justify-center">
                                <span className="rounded-full border border-neutral-700 bg-neutral-900 px-2 py-0.5 text-[11px] font-extrabold text-neutral-500">
                                  설정중
                                </span>
                                {!isExampleItem && (
                                  <button
                                    type="button"
                                    onClick={() => toggleItem(item)}
                                    className="mt-1.5 bg-transparent border-none cursor-pointer text-accent text-xs hover:text-accent-light"
                                  >
                                    <FaTimes size={10} />
                                  </button>
                                )}
                              </div>
                            </div>

                            <div className="rounded-xl border border-neutral-800 bg-neutral-950/70 p-3">
                              <div className="grid gap-3 md:grid-cols-2">
                                <div className="flex flex-col gap-1.5">
                                  <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-500">
                                    경매 방식
                                  </span>
                                  <CustomSelect
                                    value={item.auctionType ?? 'BOTTOM_UP'}
                                    onChange={(value) =>
                                      handleAuctionTypeChange(item.itemId, value as Product['auctionType'])
                                    }
                                    options={AUCTION_TYPE_SELECT_OPTIONS}
                                    descriptionPlacement="right"
                                  />
                                </div>

                                <div className="flex flex-col gap-1.5">
                                  <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-500">
                                    경매 시간
                                  </span>
                                  <CustomSelect
                                    value={String(item.auctionDuration ?? 60)}
                                    onChange={(value) => handleAuctionDurationChange(item.itemId, Number(value))}
                                    options={DURATION_SELECT_OPTIONS}
                                  />
                                </div>
                              </div>

                              {item.auctionType === 'UNIQUE_TOP' ? (
                                <div className="mt-3">
                                  <div className="grid gap-2 md:grid-cols-2">
                                    <div className="flex flex-col gap-1.5">
                                      <label className="text-[11px] font-bold uppercase tracking-wider text-neutral-500">
                                        최소 입찰가
                                      </label>
                                      <input
                                        type="text"
                                        inputMode="numeric"
                                        value={item.minPrice ?? ''}
                                        onChange={(event) =>
                                          handleAuctionFieldChange(item.itemId, 'minPrice', event.target.value)
                                        }
                                        onBlur={() => handleAuctionFieldBlur(item, 'minPrice')}
                                        placeholder="최소 입찰가 입력"
                                        className={auctionInputClassName}
                                      />
                                    </div>
                                    <div className="flex flex-col gap-1.5">
                                      <label className="text-[11px] font-bold uppercase tracking-wider text-neutral-500">
                                        최대 입찰가
                                      </label>
                                      <input
                                        type="text"
                                        inputMode="numeric"
                                        value={item.maxPrice ?? ''}
                                        onChange={(event) =>
                                          handleAuctionFieldChange(item.itemId, 'maxPrice', event.target.value)
                                        }
                                        onBlur={() => handleAuctionFieldBlur(item, 'maxPrice')}
                                        placeholder="최대 입찰가 입력"
                                        className={auctionInputClassName}
                                      />
                                    </div>
                                  </div>
                                  {auctionFieldErrors[item.itemId]?.minPrice ||
                                  auctionFieldErrors[item.itemId]?.maxPrice ? (
                                    <p className="mt-1.5 text-[11px] font-bold text-accent-light">
                                      {auctionFieldErrors[item.itemId]?.minPrice ??
                                        auctionFieldErrors[item.itemId]?.maxPrice}
                                    </p>
                                  ) : null}
                                </div>
                              ) : (
                                <div className="mt-3">
                                  <div className="grid gap-2 md:grid-cols-2">
                                    <div className="flex flex-col gap-1.5">
                                      <label className="text-[11px] font-bold uppercase tracking-wider text-neutral-500">
                                        시작가
                                      </label>
                                      <input
                                        type="text"
                                        inputMode="numeric"
                                        value={item.startPrice ?? ''}
                                        onChange={(event) =>
                                          handleAuctionFieldChange(item.itemId, 'startPrice', event.target.value)
                                        }
                                        onBlur={() => handleAuctionFieldBlur(item, 'startPrice')}
                                        placeholder="시작가 입력"
                                        className={auctionInputClassName}
                                      />
                                    </div>
                                    <div className="flex flex-col gap-1.5">
                                      <label className="text-[11px] font-bold uppercase tracking-wider text-neutral-500">
                                        입찰 단위
                                      </label>
                                      <input
                                        type="text"
                                        inputMode="numeric"
                                        value={item.bidUnit ?? ''}
                                        onChange={(event) =>
                                          handleAuctionFieldChange(item.itemId, 'bidUnit', event.target.value)
                                        }
                                        onBlur={() => handleAuctionFieldBlur(item, 'bidUnit')}
                                        placeholder="입찰 단위 입력"
                                        className={auctionInputClassName}
                                      />
                                    </div>
                                  </div>
                                  {auctionFieldErrors[item.itemId]?.startPrice ||
                                  auctionFieldErrors[item.itemId]?.bidUnit ? (
                                    <p className="mt-1.5 text-[11px] font-bold text-accent-light">
                                      {auctionFieldErrors[item.itemId]?.startPrice ??
                                        auctionFieldErrors[item.itemId]?.bidUnit}
                                    </p>
                                  ) : null}
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                <button
                  type="button"
                  onClick={() => setShowInventoryModal(true)}
                  className="mt-2 flex w-full items-center justify-center gap-2 rounded-2xl border border-neutral-800 bg-transparent px-4 py-3 text-sm font-bold text-neutral-600 transition-all hover:border-neutral-700 hover:bg-neutral-900 hover:text-neutral-300"
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
                      <span className="text-base">카메라가 꺼져 있습니다</span>
                    </div>
                  )}
                </div>
                <div className="absolute top-8 right-4 flex items-center gap-2 rounded-2xl bg-surface/80 px-2.5 py-2">
                  <button
                    type="button"
                    onClick={reopenTutorial}
                    className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-[13px] font-bold text-neutral-400 transition-all hover:text-neutral-200"
                  >
                    튜토리얼
                  </button>
                  <button
                    type="button"
                    onClick={isCameraOn ? stopCamera : startCamera}
                    className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-[13px] font-bold transition-all ${
                      isCameraOn ? 'text-neutral-400 hover:text-neutral-200' : 'text-accent hover:text-accent-light'
                    }`}
                  >
                    {isCameraOn ? <FaVideo size={14} /> : <FaVideoSlash size={14} />}
                    {isCameraOn ? '카메라 끄기' : '카메라 켜기'}
                  </button>
                </div>

                <div className="pointer-events-none absolute bottom-9 flex h-[120px] items-stretch justify-center left-4 right-4">
                  <div className="pointer-events-auto flex max-w-[500px] flex-1 flex-col items-center gap-2 px-4">
                    <SellerActionButtons
                      onIntroduce={handlePreviewIntroduce}
                      onStart={handlePreviewStart}
                      canIntroduce
                      canStart
                      introduceButtonRef={introduceButtonRef}
                      startButtonRef={startButtonRef}
                      introduceButtonClassName={`${getTargetClassName('introduce')} text-base py-3 [&_span]:text-xs`}
                      startButtonClassName={`${getTargetClassName('start')} text-base py-3 [&_span]:text-xs`}
                    />
                  </div>
                </div>
              </div>

              <aside className="min-w-0 flex-1 flex flex-col rounded-2xl bg-background overflow-hidden">
                <div className="px-3 py-2 border-b border-neutral-800">
                  <span className="text-sm font-bold text-neutral-100">방송 기본 설정</span>
                </div>

                <div className="scrollbar-hide flex flex-1 flex-col gap-4 overflow-y-auto px-4 py-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-bold uppercase tracking-wider text-neutral-500">썸네일 업로드</label>
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
                          <span className="text-[13px] font-bold text-neutral-600">이미지 첨부(10MB 이하)</span>
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
                    <label className="text-sm font-bold uppercase tracking-wider text-neutral-500">방송 제목</label>
                    <input
                      type="text"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="제목을 입력하세요."
                      className="w-full rounded-lg border border-neutral-800 bg-transparent px-3 py-2.5 text-sm text-neutral-100 outline-none placeholder:text-neutral-700 transition-colors focus:border-gold/40"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-bold uppercase tracking-wider text-neutral-500">
                      상단 고정 공지사항 (선택)
                    </label>
                    <input
                      type="text"
                      value={notice}
                      onChange={(e) => setNotice(e.target.value)}
                      placeholder="공지사항을 입력하세요."
                      className="w-full rounded-lg border border-neutral-800 bg-transparent px-3 py-2.5 text-sm text-neutral-100 outline-none placeholder:text-neutral-700 transition-colors focus:border-gold/40"
                    />
                  </div>

                  <div className="flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-bold uppercase tracking-wider text-neutral-500">
                        카테고리 매크로
                      </label>
                    </div>
                    <div className="flex flex-col gap-2">
                      {macroFields.map((macro) => {
                        const command = macro.question.trim();

                        return (
                          <div key={macro.questionType} className="flex items-center gap-2">
                            <button
                              type="button"
                              className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-extrabold whitespace-nowrap transition-colors ${
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
                                setMacroAnswers((prev) => ({
                                  ...prev,
                                  [macro.questionType]: e.target.value,
                                }));
                              }}
                              placeholder="응답을 입력해주세요."
                              className="min-w-0 flex-1 rounded-lg border border-neutral-800 bg-transparent px-3 py-2 text-sm text-neutral-100 outline-none placeholder:text-neutral-700 transition-colors focus:border-gold/40"
                            />
                          </div>
                        );
                      })}
                      {!macroFields.length && (
                        <p className="text-sm font-bold text-neutral-600">해당 카테고리의 매크로가 없습니다.</p>
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
      }}
    </LiveRegisterTutorial>
  );
}
