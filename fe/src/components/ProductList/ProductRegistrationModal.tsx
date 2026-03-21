import { useEffect, useMemo, useRef, useState } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import { FaCloudUploadAlt, FaTimes } from 'react-icons/fa';

import { usePatchItem } from '@/api/hooks/usePatchItem';
import { usePostItem } from '@/api/hooks/usePostItem';
import Button from '@/components/common/Button';
import { MAIN_CATEGORY_ITEMS } from '@/components/Main/SideBar';
import { AUCTION_TYPE_SELECT_OPTIONS, DURATION_SELECT_OPTIONS } from '@/constants/auction';
import { ITEM_CONDITION_OPTIONS } from '@/constants/itemCondition';
import type { ItemAuctionType, Product } from '@/types';
import { getUploadErrorMessage } from '@/utils/getUploadErrorMessage';

type SelectOption = {
  value: string;
  label: string;
};

type CustomSelectProps = {
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  disabled?: boolean;
};

const inputClass =
  'w-full h-12 bg-background border border-neutral-800 rounded-lg text-neutral-100 text-sm px-4 outline-none focus:border-primary transition-colors';
const labelClass = 'block text-neutral-100 text-sm font-semibold mb-2';
const helperClass = 'mt-2 text-[12px] text-neutral-500';

const MAX_IMAGES = 3;
const MAX_HASHTAGS = 7;
const MIN_START_PRICE = 1000;
const START_PRICE_STEP = 1000;
const MIN_BID_UNIT = 100;
const BID_UNIT_STEP = 100;

const toDigitsOnly = (value: string) => value.replace(/[^\d]/g, '');

const formatKoreanNumberInput = (value: string) => {
  const digits = toDigitsOnly(value).replace(/^0+(?=\d)/, '');
  return digits.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
};

const formatPriceLabel = (value: number) => `${value.toLocaleString('ko-KR')}P`;

const normalizeStartPriceValue = (value: number) =>
  Math.max(Math.round(value / START_PRICE_STEP) * START_PRICE_STEP, MIN_START_PRICE);

const normalizeBidUnitValue = (value: number, maxValue: number) =>
  Math.min(Math.max(Math.round(value / BID_UNIT_STEP) * BID_UNIT_STEP, MIN_BID_UNIT), maxValue);

const parseHashtags = (value: string) =>
  value
    .split(/\s+/)
    .map((tag) => tag.replace(/^#/, '').trim())
    .filter((tag) => tag.length > 0);

function CustomSelect({ value, onChange, options, placeholder = '선택', disabled = false }: CustomSelectProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const selectedLabel = options.find((option) => option.value === value)?.label;

  useEffect(() => {
    if (!open || disabled) {
      return;
    }

    const handleOutsideClick = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [disabled, open]);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => {
          if (!disabled) {
            setOpen((prev) => !prev);
          }
        }}
        disabled={disabled}
        className={`w-full h-12 bg-background border border-neutral-800 rounded-lg text-sm px-4 text-left flex items-center justify-between transition-colors ${
          disabled ? 'cursor-not-allowed opacity-60' : 'hover:border-primary'
        }`}
      >
        <span className={selectedLabel ? 'text-neutral-100' : 'text-neutral-500'}>{selectedLabel || placeholder}</span>
        <span className={`text-gold text-sm transition-transform ${open ? 'rotate-180' : ''}`}>▾</span>
      </button>

      {open && !disabled ? (
        <div className="absolute z-50 left-0 right-0 top-[calc(100%+4px)] bg-neutral-900 border border-neutral-700 rounded-xl overflow-hidden shadow-lg max-h-[240px] overflow-y-auto custom-scrollbar">
          {options.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => {
                onChange(option.value);
                setOpen(false);
              }}
              className={`w-full text-left px-4 py-2.5 text-[14px] transition-colors ${
                value === option.value
                  ? 'bg-gold/15 text-gold-light font-semibold'
                  : 'text-neutral-300 hover:bg-warm/8 hover:text-neutral-100'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

interface ProductRegistrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  initialData?: Product | null;
}

type ProductRegistrationModalContentProps = Omit<ProductRegistrationModalProps, 'isOpen'>;

const getInitialFormState = (initialData?: Product | null) => {
  if (!initialData) {
    return {
      name: '',
      description: '',
      category: '',
      itemCondition: '',
      startPrice: '',
      shippingFee: '',
      bidUnit: '',
      auctionDuration: '',
      auctionType: '' as ItemAuctionType | '',
      minPrice: '',
      maxPrice: '',
      hashtags: '',
      existingImages: [] as string[],
    };
  }

  const matchedCategory = MAIN_CATEGORY_ITEMS.find(
    (item) => item.label === initialData.category || item.id === initialData.category,
  );

  return {
    name: initialData.name,
    description: initialData.description || '',
    category: matchedCategory ? matchedCategory.id : initialData.category,
    itemCondition: initialData.itemCondition || '',
    startPrice: String(initialData.startPrice ?? ''),
    shippingFee: '0',
    bidUnit: initialData.bidUnit ? String(initialData.bidUnit) : '',
    auctionDuration: initialData.auctionDuration ? String(initialData.auctionDuration) : '',
    auctionType: initialData.auctionType,
    minPrice: initialData.minPrice != null ? String(initialData.minPrice) : '',
    maxPrice: initialData.maxPrice != null ? String(initialData.maxPrice) : '',
    hashtags: initialData.tags?.length ? initialData.tags.map((tag) => `#${tag}`).join(' ') : '',
    existingImages: initialData.images?.length ? initialData.images : [],
  };
};

function ProductRegistrationModalContent({ onClose, onSuccess, initialData }: ProductRegistrationModalContentProps) {
  const initialForm = useMemo(() => getInitialFormState(initialData), [initialData]);
  const { mutateAsync: createItem, isPending: isCreating } = usePostItem();
  const { mutateAsync: updateItem, isPending: isUpdating } = usePatchItem();
  const isPending = isCreating || isUpdating;
  const isEditMode = Boolean(initialData);

  const [name, setName] = useState(initialForm.name);
  const [description, setDescription] = useState(initialForm.description);
  const [category, setCategory] = useState(initialForm.category);
  const [itemCondition, setItemCondition] = useState(initialForm.itemCondition);
  const [startPrice, setStartPrice] = useState(initialForm.startPrice);
  const [shippingFee, setShippingFee] = useState(initialForm.shippingFee);
  const [bidUnit, setBidUnit] = useState(initialForm.bidUnit);
  const [auctionDuration, setAuctionDuration] = useState(initialForm.auctionDuration);
  const [auctionType, setAuctionType] = useState<ItemAuctionType | ''>(initialForm.auctionType);
  const [minPrice, setMinPrice] = useState(initialForm.minPrice);
  const [maxPrice, setMaxPrice] = useState(initialForm.maxPrice);
  const [uniquePriceError, setUniquePriceError] = useState('');
  const [hashtags, setHashtags] = useState(initialForm.hashtags);
  const [images, setImages] = useState<File[]>([]);
  const [existingImages, setExistingImages] = useState<string[]>(initialForm.existingImages);
  const [error, setError] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  const startPriceValue = Number(startPrice || 0);
  const shippingFeeValue = Number(shippingFee || 0);
  const totalStartPrice = startPriceValue + shippingFeeValue;
  const normalizedStartPriceForBid = startPrice ? normalizeStartPriceValue(startPriceValue) : 0;
  const maxBidUnit = Math.floor((normalizedStartPriceForBid * 0.1) / BID_UNIT_STEP) * BID_UNIT_STEP;
  const isBidUnitDisabled = maxBidUnit < MIN_BID_UNIT;
  const isUniqueTopAuction = auctionType === 'UNIQUE_TOP';
  const showBottomUpPricing = isEditMode || auctionType === 'BOTTOM_UP';
  const showUniqueTopPricing = !isEditMode && isUniqueTopAuction;

  const newImagePreviews = useMemo(() => images.map((file) => ({ file, url: URL.createObjectURL(file) })), [images]);

  useEffect(() => {
    return () => {
      newImagePreviews.forEach((preview) => URL.revokeObjectURL(preview.url));
    };
  }, [newImagePreviews]);

  const syncBidUnitForStartPrice = (nextStartPrice: string) => {
    const currentBidUnit = Number(bidUnit || 0);

    if (!currentBidUnit) {
      return;
    }

    if (!nextStartPrice) {
      setBidUnit('');
      return;
    }

    const nextNormalizedStartPrice = normalizeStartPriceValue(Number(nextStartPrice));
    const nextMaxBidUnit = Math.floor((nextNormalizedStartPrice * 0.1) / BID_UNIT_STEP) * BID_UNIT_STEP;

    if (nextMaxBidUnit < MIN_BID_UNIT) {
      setBidUnit('');
      return;
    }

    const normalizedBidUnit = normalizeBidUnitValue(currentBidUnit, nextMaxBidUnit);
    if (normalizedBidUnit !== currentBidUnit) {
      setBidUnit(String(normalizedBidUnit));
    }
  };

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files) {
      return;
    }

    const newFiles = Array.from(event.target.files);

    if (existingImages.length + images.length + newFiles.length > MAX_IMAGES) {
      setError(`이미지는 최대 ${MAX_IMAGES}장까지 업로드할 수 있습니다.`);
      event.target.value = '';
      return;
    }

    setImages((prev) => [...prev, ...newFiles]);
    setError('');
    event.target.value = '';
  };

  const removeNewImage = (index: number) => {
    setImages((prev) => prev.filter((_, fileIndex) => fileIndex !== index));
  };

  const removeExistingImage = (index: number) => {
    setExistingImages((prev) => prev.filter((_, imageIndex) => imageIndex !== index));
  };

  const handleStartPriceChange = (value: string) => {
    const digits = toDigitsOnly(value);

    if (!digits) {
      setStartPrice('');
      syncBidUnitForStartPrice('');
      setError('');
      return;
    }

    setStartPrice(digits);
    syncBidUnitForStartPrice(digits);
    setError('');
  };

  const handleStartPriceBlur = () => {
    if (!startPrice) {
      return;
    }

    const normalizedStartPrice = String(normalizeStartPriceValue(Number(startPrice)));
    setStartPrice(normalizedStartPrice);
    syncBidUnitForStartPrice(normalizedStartPrice);
  };

  const handleShippingFeeChange = (value: string) => {
    setShippingFee(toDigitsOnly(value));
    setError('');
  };

  const handleBidUnitChange = (value: string) => {
    if (isBidUnitDisabled) {
      return;
    }

    const digits = toDigitsOnly(value);

    if (!digits) {
      setBidUnit('');
      setError('');
      return;
    }

    setBidUnit(digits);
    setError('');
  };

  const handleBidUnitBlur = () => {
    if (!bidUnit || isBidUnitDisabled) {
      return;
    }

    setBidUnit(String(normalizeBidUnitValue(Number(bidUnit), maxBidUnit)));
  };

  const handleUniquePriceChange = (setter: (value: string) => void, value: string) => {
    setter(toDigitsOnly(value));
    setError('');
    setUniquePriceError('');
  };

  const getUniquePriceRangeError = (minValue: string, maxValue: string) => {
    if (!minValue || !maxValue) {
      return '';
    }

    return Number(maxValue) < Number(minValue) ? '최고 응찰가는 최저 응찰가보다 크거나 같아야 합니다.' : '';
  };

  const handleUniquePriceBlur = (nextMinPrice = minPrice, nextMaxPrice = maxPrice) => {
    setUniquePriceError(getUniquePriceRangeError(nextMinPrice, nextMaxPrice));
  };

  const handleSubmit = async () => {
    if (!name.trim()) {
      setError('상품명을 입력해주세요.');
      return;
    }

    if (!category) {
      setError('카테고리를 선택해주세요.');
      return;
    }

    if (!itemCondition) {
      setError('상품 상태를 선택해주세요.');
      return;
    }

    if (!auctionDuration) {
      setError('경매 시간을 선택해주세요.');
      return;
    }

    if (!isEditMode && !auctionType) {
      setError('경매 방식을 선택해주세요.');
      return;
    }

    if (!description.trim()) {
      setError('상품 설명을 입력해주세요.');
      return;
    }

    const parsedTags = parseHashtags(hashtags);

    if (parsedTags.length > MAX_HASHTAGS) {
      setError(`해시태그는 최대 ${MAX_HASHTAGS}개까지 입력할 수 있습니다.`);
      return;
    }

    const normalizedStartPrice = startPrice ? normalizeStartPriceValue(startPriceValue) : 0;
    const normalizedTotalStartPrice = normalizedStartPrice + shippingFeeValue;
    const normalizedMaxBidUnit = Math.floor((normalizedStartPrice * 0.1) / BID_UNIT_STEP) * BID_UNIT_STEP;
    const normalizedBidUnit =
      bidUnit && normalizedMaxBidUnit >= MIN_BID_UNIT
        ? normalizeBidUnitValue(Number(bidUnit), normalizedMaxBidUnit)
        : Number(bidUnit || 0);

    if (showBottomUpPricing) {
      if (startPrice === '') {
        setError('시작가를 입력해주세요.');
        return;
      }

      if (shippingFee === '') {
        setError('배송비를 입력해주세요.');
        return;
      }

      if (bidUnit === '') {
        setError('입찰 단가를 입력해주세요.');
        return;
      }

      if (normalizedStartPrice !== startPriceValue) {
        setStartPrice(String(normalizedStartPrice));
      }

      if (normalizedStartPrice < MIN_START_PRICE) {
        setError(`시작가는 최소 ${formatPriceLabel(MIN_START_PRICE)} 이상이어야 합니다.`);
        return;
      }

      if (normalizedMaxBidUnit < MIN_BID_UNIT) {
        setError(`입찰 단가를 설정하려면 시작가는 최소 ${formatPriceLabel(MIN_START_PRICE)} 이상이어야 합니다.`);
        return;
      }

      if (normalizedBidUnit !== Number(bidUnit)) {
        setBidUnit(String(normalizedBidUnit));
      }

      if (normalizedBidUnit < MIN_BID_UNIT) {
        setError(`입찰 단가는 최소 ${formatPriceLabel(MIN_BID_UNIT)} 이상이어야 합니다.`);
        return;
      }

      if (normalizedBidUnit % BID_UNIT_STEP !== 0) {
        setError(`입찰 단가는 ${formatPriceLabel(BID_UNIT_STEP)} 단위로 입력해주세요.`);
        return;
      }

      if (normalizedBidUnit > normalizedMaxBidUnit) {
        setError(`입찰 단가는 시작가의 10% 이하인 ${formatPriceLabel(normalizedMaxBidUnit)}까지 가능합니다.`);
        return;
      }
    }

    if (showUniqueTopPricing) {
      if (!minPrice || !maxPrice) {
        setError('유일최고가 경매는 최저 응찰가와 최고 응찰가를 모두 입력해야 합니다.');
        return;
      }

      const uniqueRangeError = getUniquePriceRangeError(minPrice, maxPrice);
      if (uniqueRangeError) {
        setUniquePriceError(uniqueRangeError);
        return;
      }
    }

    try {
      if (initialData) {
        await updateItem({
          itemId: initialData.itemId,
          payload: {
            name: name.trim(),
            description: description.trim(),
            startPrice: normalizedTotalStartPrice,
            auctionDuration: Number(auctionDuration) || 30,
            bidUnit: normalizedBidUnit,
            category,
            itemCondition,
            tags: parsedTags,
            images: images.length > 0 ? images : undefined,
          },
        });
      } else {
        await createItem({
          name: name.trim(),
          description: description.trim(),
          startPrice: showUniqueTopPricing ? null : normalizedTotalStartPrice,
          minPrice: showUniqueTopPricing ? Number(minPrice) : null,
          maxPrice: showUniqueTopPricing ? Number(maxPrice) : null,
          auctionDuration: Number(auctionDuration) || 30,
          bidUnit: showUniqueTopPricing ? null : normalizedBidUnit,
          category,
          itemCondition,
          auctionType: auctionType || 'BOTTOM_UP',
          tags: parsedTags,
          images: images.length > 0 ? images : undefined,
        });
      }

      onSuccess?.();
      onClose();
    } catch (submitError) {
      console.error(submitError);
      setError(getUploadErrorMessage(submitError, '상품 저장에 실패했습니다. 잠시 후 다시 시도해주세요.'));
    }
  };

  const handleFormSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void handleSubmit();
  };

  const parsedHashtags = parseHashtags(hashtags);

  return (
    <div
      className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/70 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="custom-scrollbar bg-surface-elevated w-[480px] max-h-[90vh] overflow-y-auto rounded-2xl p-8 relative shadow-2xl border border-neutral-800"
        onClick={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute top-6 right-6 bg-transparent border-none text-neutral-500 hover:text-neutral-100 cursor-pointer transition-colors"
        >
          <FaTimes size={20} />
        </button>

        <h2 className="text-neutral-100 text-xl font-bold mt-0 mb-6">{initialData ? '상품 수정' : '상품 등록'}</h2>

        <input
          type="file"
          accept="image/png, image/jpeg"
          multiple
          className="hidden"
          ref={fileInputRef}
          onChange={handleFileChange}
        />

        <form onSubmit={handleFormSubmit}>
          <div
            className="bg-primary-muted rounded-xl min-h-[160px] flex flex-col items-center justify-center mb-6 cursor-pointer border border-dashed border-neutral-600 p-4"
            onClick={() => {
              if (existingImages.length + images.length < MAX_IMAGES) {
                fileInputRef.current?.click();
              }
            }}
          >
            {existingImages.length > 0 || images.length > 0 ? (
              <div
                className="flex gap-3 w-full overflow-x-auto macro-scroll p-2 pb-3"
                onClick={(event) => event.stopPropagation()}
              >
                {existingImages.map((url, index) => (
                  <div key={`existing-${url}-${index}`} className="relative w-[120px] h-[120px] shrink-0">
                    <img src={url} alt="상품 이미지" className="w-full h-full object-cover rounded-lg" />
                    <button
                      type="button"
                      onClick={() => removeExistingImage(index)}
                      className="absolute top-1 right-1 bg-black/50 text-white border-none rounded-full w-6 h-6 cursor-pointer flex items-center justify-center"
                    >
                      <FaTimes size={12} />
                    </button>
                  </div>
                ))}

                {newImagePreviews.map((preview, index) => (
                  <div key={`new-${preview.file.name}-${index}`} className="relative w-[120px] h-[120px] shrink-0">
                    <img src={preview.url} alt="새 이미지 미리보기" className="w-full h-full object-cover rounded-lg" />
                    <button
                      type="button"
                      onClick={() => removeNewImage(index)}
                      className="absolute top-1 right-1 bg-black/50 text-white border-none rounded-full w-6 h-6 cursor-pointer flex items-center justify-center"
                    >
                      <FaTimes size={12} />
                    </button>
                  </div>
                ))}

                {existingImages.length + images.length < MAX_IMAGES ? (
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="w-[120px] h-[120px] border border-dashed border-neutral-600 rounded-lg flex items-center justify-center shrink-0 cursor-pointer"
                  >
                    <FaCloudUploadAlt size={24} className="text-neutral-500" />
                  </div>
                ) : null}
              </div>
            ) : (
              <>
                <FaCloudUploadAlt size={32} className="text-neutral-100 mb-3" />
                <div className="text-neutral-100 text-[15px] font-semibold">
                  상품 이미지를 최대 {MAX_IMAGES}장까지 업로드
                </div>
                <div className="text-neutral-500 text-[13px] mt-1">PNG, JPG, 최대 10MB</div>
              </>
            )}
          </div>

          <div className="flex gap-4 mb-5 items-end">
            <div className="flex-[1.4]">
              <label className={labelClass}>상품명 ({name.length}/20)</label>
              <input
                className={inputClass}
                placeholder="상품명을 입력해주세요"
                value={name}
                onChange={(event) => {
                  setName(event.target.value);
                  setError('');
                }}
                maxLength={20}
              />
            </div>

            <div className="flex-1">
              <label className={labelClass}>카테고리</label>
              <CustomSelect
                value={category}
                onChange={(nextCategory) => {
                  setCategory(nextCategory);
                  setError('');
                }}
                placeholder="선택"
                options={MAIN_CATEGORY_ITEMS.filter((item) => item.id !== 'ALL').map((item) => ({
                  value: item.id,
                  label: item.label,
                }))}
              />
            </div>
          </div>

          <div className="mb-5">
            <label className={labelClass}>상품 상태</label>
            <CustomSelect
              value={itemCondition}
              onChange={(nextCondition) => {
                setItemCondition(nextCondition);
                setError('');
              }}
              placeholder="선택"
              options={ITEM_CONDITION_OPTIONS}
            />
          </div>

          <div className="flex gap-4 mb-5">
            <div className="flex-1">
              <label className={labelClass}>경매 시간</label>
              <CustomSelect
                value={auctionDuration}
                onChange={(nextDuration) => {
                  setAuctionDuration(nextDuration);
                  setError('');
                }}
                placeholder="시간 선택"
                options={DURATION_SELECT_OPTIONS}
              />
            </div>

            <div className="flex-1">
              <label className={labelClass}>경매 방식</label>
              <CustomSelect
                value={auctionType}
                onChange={(value) => {
                  setAuctionType(value as ItemAuctionType | '');
                  setError('');
                  setUniquePriceError('');
                }}
                placeholder="방식 선택"
                options={AUCTION_TYPE_SELECT_OPTIONS}
                disabled={isEditMode}
              />
            </div>
          </div>

          {showBottomUpPricing ? (
            <>
              <div className="flex gap-4 mb-2">
                <div className="flex-1">
                  <label className={labelClass}>시작가</label>
                  <input
                    className={inputClass}
                    placeholder="최소 1,000P"
                    inputMode="numeric"
                    value={formatKoreanNumberInput(startPrice)}
                    onChange={(event) => handleStartPriceChange(event.target.value)}
                    onBlur={handleStartPriceBlur}
                  />
                </div>

                <div className="flex-1">
                  <label className={labelClass}>배송비</label>
                  <input
                    className={inputClass}
                    placeholder="0P"
                    inputMode="numeric"
                    value={formatKoreanNumberInput(shippingFee)}
                    onChange={(event) => handleShippingFeeChange(event.target.value)}
                  />
                </div>
              </div>

              <p className={helperClass}>
                경매 노출 가격은 배송비가 포함된 금액입니다. 현재 총 가격 {formatPriceLabel(totalStartPrice)}
              </p>

              <div className="mb-5 mt-5">
                <label className={labelClass}>입찰 단가</label>
                <input
                  className={`${inputClass} ${isBidUnitDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                  placeholder={
                    isBidUnitDisabled
                      ? `시작가를 ${formatPriceLabel(MIN_START_PRICE)} 이상 입력해주세요`
                      : `${formatPriceLabel(MIN_BID_UNIT)} 이상, ${formatPriceLabel(BID_UNIT_STEP)} 단위`
                  }
                  inputMode="numeric"
                  value={formatKoreanNumberInput(bidUnit)}
                  onChange={(event) => handleBidUnitChange(event.target.value)}
                  onBlur={handleBidUnitBlur}
                  disabled={isBidUnitDisabled}
                />

                <p className={helperClass}>
                  {isBidUnitDisabled
                    ? `입찰 단가는 시작가가 ${formatPriceLabel(MIN_START_PRICE)} 이상일 때 설정할 수 있습니다.`
                    : `입찰 단가는 ${formatPriceLabel(MIN_BID_UNIT)} 이상, ${formatPriceLabel(
                        BID_UNIT_STEP,
                      )} 단위이며 시작가의 10% 이하까지 설정할 수 있습니다.`}
                </p>
              </div>
            </>
          ) : null}

          {showUniqueTopPricing ? (
            <div className="flex gap-4 mb-5">
              <div className="flex-1">
                <label className={labelClass}>최저 응찰가</label>
                <input
                  className={inputClass}
                  placeholder="0P"
                  inputMode="numeric"
                  value={formatKoreanNumberInput(minPrice)}
                  onChange={(event) => handleUniquePriceChange(setMinPrice, event.target.value)}
                  onBlur={(event) => handleUniquePriceBlur(toDigitsOnly(event.target.value), maxPrice)}
                />
              </div>

              <div className="flex-1">
                <label className={labelClass}>최고 응찰가</label>
                <input
                  className={inputClass}
                  placeholder="최고 응찰가 입력"
                  inputMode="numeric"
                  value={formatKoreanNumberInput(maxPrice)}
                  onChange={(event) => handleUniquePriceChange(setMaxPrice, event.target.value)}
                  onBlur={(event) => handleUniquePriceBlur(minPrice, toDigitsOnly(event.target.value))}
                />
              </div>
            </div>
          ) : null}

          {showUniqueTopPricing && uniquePriceError ? (
            <p className="mt-[-8px] mb-5 text-accent-light text-sm">{uniquePriceError}</p>
          ) : null}

          <div className="mb-5">
            <label className={labelClass}>상품 설명 ({description.length}/50)</label>
            <textarea
              className={`${inputClass} !h-[120px] pt-4 resize-none`}
              placeholder="상품의 상태, 구성품, 특이사항 등을 입력해주세요."
              value={description}
              onChange={(event) => {
                if (event.target.value.length <= 50) {
                  setDescription(event.target.value);
                  setError('');
                }
              }}
              maxLength={50}
            />
          </div>

          <div className="mb-8">
            <label className={labelClass}>해시태그 (선택)</label>
            <input
              className={inputClass}
              placeholder="#스니커즈 #한정판 #미개봉"
              value={hashtags}
              onChange={(event) => {
                const nextValue = event.target.value;
                const nextParsedTags = parseHashtags(nextValue);

                if (nextParsedTags.length > MAX_HASHTAGS) {
                  return;
                }

                setHashtags(nextValue);
              }}
            />

            {parsedHashtags.length > 0 ? (
              <div className="flex flex-wrap items-center gap-2 mt-3">
                {parsedHashtags.map((tag, index) => (
                  <span key={`${tag}-${index}`} className="badge-gold-outline text-[13px] font-medium px-3 py-1.5">
                    #{tag}
                  </span>
                ))}
                <span className="text-[12px] text-neutral-500">
                  {parsedHashtags.length}/{MAX_HASHTAGS}
                </span>
              </div>
            ) : null}
          </div>

          {error ? <div className="text-accent-light text-sm mb-4">{error}</div> : null}

          {initialData ? (
            <div className="flex gap-3">
              <Button variant="outline" onClick={onClose} className="!h-12 !text-sm">
                취소
              </Button>
              <Button type="submit" variant="yellow" disabled={isPending} className="!h-12 !text-sm">
                {isPending ? '수정 중...' : '수정하기'}
              </Button>
            </div>
          ) : (
            <Button type="submit" variant="yellow" disabled={isPending} className="!h-12 !text-sm">
              {isPending ? '등록 중...' : '상품 등록'}
            </Button>
          )}
        </form>
      </div>
    </div>
  );
}

export default function ProductRegistrationModal({
  isOpen,
  onClose,
  onSuccess,
  initialData,
}: ProductRegistrationModalProps) {
  if (!isOpen) {
    return null;
  }

  const modalKey = initialData ? `edit-${initialData.itemId}` : 'create';

  return (
    <ProductRegistrationModalContent key={modalKey} onClose={onClose} onSuccess={onSuccess} initialData={initialData} />
  );
}
