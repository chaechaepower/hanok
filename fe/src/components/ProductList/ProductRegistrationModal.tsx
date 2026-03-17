import React, { useRef, useState } from 'react';
import { FaCloudUploadAlt, FaTimes } from 'react-icons/fa';

import { usePatchItem } from '@/api/hooks/usePatchItem';
import { usePostItem } from '@/api/hooks/usePostItem';
import Button from '@/components/common/Button';
import { MAIN_CATEGORY_ITEMS } from '@/components/Main/SideBar';
import type { ItemAuctionType, Product } from '@/types';

interface ProductRegistrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  initialData?: Product | null;
}

const inputClass =
  'w-full h-12 bg-[#0B0C10] border border-[#1C1C1E] rounded-lg text-white text-sm px-4 outline-none';
const selectArrowStyle = {
  backgroundImage:
    `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%238E8E93' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`,
};
const selectClass = `${inputClass} pr-10 cursor-pointer appearance-none bg-no-repeat bg-[position:right_14px_center]`;
const labelClass = 'block text-white text-sm font-semibold mb-2';
const helperClass = 'mt-2 text-[12px] text-[#8E8E93]';
const MIN_START_PRICE = 1000;
const START_PRICE_STEP = 1000;
const MIN_BID_UNIT = 100;
const BID_UNIT_STEP = 100;

const toDigitsOnly = (value: string) => value.replace(/\D/g, '');
const formatKoreanNumberInput = (value: string) => {
  const digits = toDigitsOnly(value).replace(/^0+(?=\d)/, '');
  return digits.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
};
const formatPriceLabel = (value: number) => `${value.toLocaleString('ko-KR')}P`;
const normalizeStartPriceValue = (value: number) =>
  Math.max(Math.round(value / START_PRICE_STEP) * START_PRICE_STEP, MIN_START_PRICE);
const normalizeBidUnitValue = (value: number, maxValue: number) =>
  Math.min(Math.max(Math.round(value / BID_UNIT_STEP) * BID_UNIT_STEP, MIN_BID_UNIT), maxValue);

export default function ProductRegistrationModal({
  isOpen,
  onClose,
  onSuccess,
  initialData,
}: ProductRegistrationModalProps) {
  const { mutateAsync: createItem, isPending: isCreating } = usePostItem();
  const { mutateAsync: updateItem, isPending: isUpdating } = usePatchItem();
  const isPending = isCreating || isUpdating;

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [itemCondition, setItemCondition] = useState('');
  const [startPrice, setStartPrice] = useState('');
  const [shippingFee, setShippingFee] = useState('');
  const [bidUnit, setBidUnit] = useState('');
  const [auctionDuration, setAuctionDuration] = useState('');
  const [auctionType, setAuctionType] = useState<ItemAuctionType | ''>('');
  const [hashtags, setHashtags] = useState('');
  const [images, setImages] = useState<File[]>([]);
  const [existingImages, setExistingImages] = useState<string[]>([]);
  const [error, setError] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  const startPriceValue = Number(startPrice || 0);
  const normalizedStartPriceForBid = startPrice ? normalizeStartPriceValue(startPriceValue) : 0;
  const shippingFeeValue = Number(shippingFee || 0);
  const totalStartPrice = startPriceValue + shippingFeeValue;
  const maxBidUnit = Math.floor((normalizedStartPriceForBid * 0.1) / BID_UNIT_STEP) * BID_UNIT_STEP;
  const isBidUnitDisabled = maxBidUnit < MIN_BID_UNIT;

  React.useEffect(() => {
    if (!isOpen) return;

    setImages([]);
    setError('');

    if (initialData) {
      setName(initialData.name);
      setDescription('');

      const matchedCategory = MAIN_CATEGORY_ITEMS.find(
        (item) => item.label === initialData.category || item.id === initialData.category,
      );

      setCategory(matchedCategory ? matchedCategory.id : '');
      setItemCondition(initialData.itemCondition || '');
      setStartPrice(String(initialData.startPrice));
      setShippingFee('');
      setBidUnit('');
      setAuctionDuration('');
      setAuctionType(initialData.auctionType);
      setHashtags('');
      setExistingImages(initialData.images && initialData.images.length > 0 ? initialData.images : []);
      return;
    }

    setName('');
    setDescription('');
    setCategory('');
    setItemCondition('');
    setStartPrice('');
    setShippingFee('');
    setBidUnit('');
    setAuctionDuration('');
    setAuctionType('');
    setHashtags('');
    setExistingImages([]);
  }, [initialData, isOpen]);

  React.useEffect(() => {
    const currentBidUnit = Number(bidUnit || 0);

    if (!currentBidUnit) return;

    if (isBidUnitDisabled) {
      setBidUnit('');
      return;
    }

    if (currentBidUnit > maxBidUnit) {
      setBidUnit(String(maxBidUnit));
    }
  }, [bidUnit, isBidUnitDisabled, maxBidUnit]);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;

    const newFiles = Array.from(e.target.files);

    if (existingImages.length + images.length + newFiles.length > 3) {
      setError('이미지는 최대 3개까지 업로드 가능합니다.');
      return;
    }

    setImages((prev) => [...prev, ...newFiles]);
    setError('');
  };

  const removeNewImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  const removeExistingImage = (index: number) => {
    setExistingImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleStartPriceChange = (value: string) => {
    const digits = toDigitsOnly(value);

    if (!digits) {
      setStartPrice('');
      setError('');
      return;
    }

    setStartPrice(digits);
    setError('');
  };

  const handleStartPriceBlur = () => {
    if (!startPrice) return;
    setStartPrice(String(normalizeStartPriceValue(Number(startPrice))));
  };

  const handleShippingFeeChange = (value: string) => {
    setShippingFee(toDigitsOnly(value));
    setError('');
  };

  const handleBidUnitChange = (value: string) => {
    if (isBidUnitDisabled) return;

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
    if (!bidUnit || isBidUnitDisabled) return;

    setBidUnit(String(normalizeBidUnitValue(Number(bidUnit), maxBidUnit)));
  };

  const handleSubmit = async () => {
    if (!name) {
      setError('상품명을 입력해주세요.');
      return;
    }

    if (!category) {
      setError('카테고리를 선택해주세요.');
      return;
    }

    const parsedTags = hashtags
      .split(/\s+/)
      .map((tag) => tag.replace(/^#/, '').trim())
      .filter((tag) => tag.length > 0);
    const normalizedBidUnitValue =
      bidUnit && maxBidUnit >= MIN_BID_UNIT ? normalizeBidUnitValue(Number(bidUnit), maxBidUnit) : Number(bidUnit || 0);
    const normalizedStartPriceValue = startPrice
      ? normalizeStartPriceValue(startPriceValue)
      : startPriceValue;
    const normalizedTotalStartPrice = normalizedStartPriceValue + shippingFeeValue;
    const normalizedMaxBidUnit = Math.floor((normalizedStartPriceValue * 0.1) / BID_UNIT_STEP) * BID_UNIT_STEP;

    if (startPrice && normalizedStartPriceValue !== startPriceValue) {
      setStartPrice(String(normalizedStartPriceValue));
    }

    if (bidUnit && normalizedBidUnitValue !== Number(bidUnit)) {
      setBidUnit(String(normalizedBidUnitValue));
    }

    if (normalizedStartPriceValue < MIN_START_PRICE) {
      setError(`시작가는 최소 ${formatPriceLabel(MIN_START_PRICE)}부터 입력할 수 있습니다.`);
      return;
    }

    if (normalizedMaxBidUnit < MIN_BID_UNIT) {
      setError('배송비 제외 시작가가 5,000P 이상이어야 입찰단가를 설정할 수 있습니다.');
      return;
    }

    if (normalizedBidUnitValue < MIN_BID_UNIT) {
      setError(`입찰단가는 최소 ${formatPriceLabel(MIN_BID_UNIT)}부터 입력할 수 있습니다.`);
      return;
    }

    if (normalizedBidUnitValue % BID_UNIT_STEP !== 0) {
      setError('입찰단가는 100P 단위로만 입력할 수 있습니다.');
      return;
    }

    if (normalizedBidUnitValue > normalizedMaxBidUnit) {
      setError(
        `입찰단가는 시작가의 10% 이내인 ${formatPriceLabel(normalizedMaxBidUnit)}까지 입력할 수 있습니다.`,
      );
      return;
    }

    try {
      if (initialData) {
        await updateItem({
          itemId: initialData.itemId,
          payload: {
            name,
            description,
            startPrice: normalizedTotalStartPrice,
            auctionDuration: Number(auctionDuration) || 30,
            bidUnit: normalizedBidUnitValue,
            category,
            itemCondition,
            tags: parsedTags,
            images: images.length > 0 ? images : undefined,
          },
        });
      } else {
        await createItem({
          name,
          description,
          startPrice: normalizedTotalStartPrice,
          auctionDuration: Number(auctionDuration) || 30,
          bidUnit: normalizedBidUnitValue,
          category,
          itemCondition,
          auctionType: auctionType || 'BOTTOM_UP',
          tags: parsedTags,
          images: images.length > 0 ? images : undefined,
        });
      }

      onSuccess?.();
      onClose();
    } catch (err) {
      console.error(err);
      setError('상품 등록에 실패했습니다. 다시 시도해주세요.');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[1000]">
      <div className="custom-scrollbar bg-[#151517] w-[480px] max-h-[90vh] overflow-y-auto rounded-2xl p-8 relative shadow-[0_10px_40px_rgba(0,0,0,0.5)]">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-6 right-6 bg-transparent border-none text-[#8E8E93] cursor-pointer"
        >
          <FaTimes size={20} />
        </button>

        <h2 className="text-white text-xl font-bold mt-0 mb-6">{initialData ? '상품 정보 수정' : '새 상품 등록'}</h2>

        <input
          type="file"
          accept="image/png, image/jpeg"
          multiple
          className="hidden"
          ref={fileInputRef}
          onChange={handleFileChange}
        />

        <div
          className="bg-[#2C2A26] rounded-xl min-h-[160px] flex flex-col items-center justify-center mb-6 cursor-pointer border border-dashed border-[#4A4A4C] p-4"
          onClick={() => {
            if (existingImages.length + images.length < 3) fileInputRef.current?.click();
          }}
        >
          {existingImages.length > 0 || images.length > 0 ? (
            <div className="flex gap-3 w-full overflow-x-auto p-2" onClick={(e) => e.stopPropagation()}>
              {existingImages.map((url, idx) => (
                <div key={`exist-${idx}`} className="relative w-[120px] h-[120px] shrink-0">
                  <img src={url} alt="기존 이미지" className="w-full h-full object-cover rounded-lg" />
                  <button
                    type="button"
                    onClick={() => removeExistingImage(idx)}
                    className="absolute top-1 right-1 bg-black/50 text-white border-none rounded-full w-6 h-6 cursor-pointer flex items-center justify-center"
                  >
                    <FaTimes size={12} />
                  </button>
                </div>
              ))}

              {images.map((file, idx) => (
                <div key={`new-${idx}`} className="relative w-[120px] h-[120px] shrink-0">
                  <img src={URL.createObjectURL(file)} alt="preview" className="w-full h-full object-cover rounded-lg" />
                  <button
                    type="button"
                    onClick={() => removeNewImage(idx)}
                    className="absolute top-1 right-1 bg-black/50 text-white border-none rounded-full w-6 h-6 cursor-pointer flex items-center justify-center"
                  >
                    <FaTimes size={12} />
                  </button>
                </div>
              ))}

              {existingImages.length + images.length < 3 && (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="w-[120px] h-[120px] border border-dashed border-[#4A4A4C] rounded-lg flex items-center justify-center shrink-0 cursor-pointer"
                >
                  <FaCloudUploadAlt size={24} className="text-[#8E8E93]" />
                </div>
              )}
            </div>
          ) : (
            <>
              <FaCloudUploadAlt size={32} className="text-white mb-3" />
              <div className="text-white text-[15px] font-semibold">상품 이미지 업로드 최대 3개</div>
              <div className="text-[#8E8E93] text-[13px] mt-1">PNG, JPG 5MB</div>
            </>
          )}
        </div>

        <div className="mb-5">
          <label className={labelClass}>상품명 등록 ({name.length}/20)</label>
          <input
            className={inputClass}
            placeholder="상품명을 입력해주세요. 최대 20자"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              setError('');
            }}
            maxLength={20}
          />
        </div>

        <div className="flex gap-4 mb-5">
          <div className="flex-1">
            <label className={labelClass}>카테고리</label>
            <select
              className={selectClass}
              value={category}
              onChange={(e) => {
                setCategory(e.target.value);
                setError('');
              }}
              style={selectArrowStyle}
            >
              <option value="" disabled hidden>
                선택
              </option>
              {MAIN_CATEGORY_ITEMS.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.label}
                </option>
              ))}
            </select>
          </div>

          <div className="flex-1">
            <label className={labelClass}>물품 상태</label>
            <select
              className={selectClass}
              value={itemCondition}
              onChange={(e) => setItemCondition(e.target.value)}
              style={selectArrowStyle}
            >
              <option value="" disabled hidden>
                선택
              </option>
              <option value="BRAND_NEW">미개봉/새제품</option>
              <option value="OPEN_BOX">개봉 후 미사용</option>
              <option value="REFURBISHED">리퍼비시</option>
              <option value="USED">중고</option>
            </select>
          </div>
        </div>

        <div className="flex gap-4 mb-2">
          <div className="flex-1">
            <label className={labelClass}>시작가</label>
            <input
              className={inputClass}
              placeholder="최소 1,000P"
              inputMode="numeric"
              value={formatKoreanNumberInput(startPrice)}
              onChange={(e) => handleStartPriceChange(e.target.value)}
              onBlur={handleStartPriceBlur}
            />
          </div>

          <div className="flex-1">
            <label className={labelClass}>배송비 입력</label>
            <input
              className={inputClass}
              placeholder="0P"
              inputMode="numeric"
              value={formatKoreanNumberInput(shippingFee)}
              onChange={(e) => handleShippingFeeChange(e.target.value)}
            />
          </div>
        </div>

        <p className={helperClass}>경매 가격은 배송비 포함된 가격으로 표시됩니다. 현재 총 가격 {formatPriceLabel(totalStartPrice)}</p>

        <div className="mb-5 mt-5">
          <label className={labelClass}>입찰단가</label>
          <input
            className={`${inputClass} ${isBidUnitDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}
            placeholder={isBidUnitDisabled ? '시작가 5,000P 이상부터 입력 가능' : '500P 이상, 100P 단위'}
            inputMode="numeric"
            value={formatKoreanNumberInput(bidUnit)}
            onChange={(e) => handleBidUnitChange(e.target.value)}
            onBlur={handleBidUnitBlur}
            disabled={isBidUnitDisabled}
          />
          <p className={helperClass}>
            {isBidUnitDisabled
              ? '입찰단가는 시작가가 5,000P 이상일 때부터 설정할 수 있습니다.'
              : `입찰단가는 100P 단위이며 최소 ${formatPriceLabel(MIN_BID_UNIT)}, 최대 시작가의 10%까지 가능합니다.`}
          </p>
        </div>

        <div className="flex gap-4 mb-5">
          <div className="flex-1">
            <label className={labelClass}>경매시간</label>
            <select
              className={selectClass}
              value={auctionDuration}
              onChange={(e) => setAuctionDuration(e.target.value)}
              style={selectArrowStyle}
            >
              <option value="" disabled hidden>
                경매시간을 선택하세요
              </option>
              <option value="10">10초</option>
              <option value="30">30초</option>
              <option value="60">1분</option>
            </select>
          </div>

          <div className="flex-1">
            <label className={labelClass}>경매방식</label>
            <select
              className={selectClass}
              value={auctionType}
              onChange={(e) => setAuctionType(e.target.value as ItemAuctionType | '')}
              style={selectArrowStyle}
            >
              <option value="" disabled hidden>
                경매방식을 선택하세요
              </option>
              <option value="BOTTOM_UP">상향식</option>
              <option value="UNIQUE">유일최고가</option>
            </select>
          </div>
        </div>

        <div className="mb-5">
          <label className={labelClass}>상품 설명 ({description.length}/50)</label>
          <textarea
            className={`${inputClass} !h-[120px] pt-4 resize-none`}
            placeholder="상품의 상태 정보를 상세히 적어주세요. 최대 50자"
            value={description}
            onChange={(e) => {
              if (e.target.value.length <= 50) setDescription(e.target.value);
            }}
            maxLength={50}
          />
        </div>

        <div className="mb-8">
          <label className={labelClass}>해시태그(선택)</label>
          <input
            className={inputClass}
            placeholder="#해시태그 #입력 #해주세요"
            value={hashtags}
            onChange={(e) => setHashtags(e.target.value)}
          />
        </div>

        {error && <div className="text-[#FF3B30] text-sm mb-4">{error}</div>}

        {initialData ? (
          <div className="flex gap-3">
            <Button variant="outline" onClick={onClose}>
              닫기
            </Button>
            <Button variant="white" onClick={handleSubmit} disabled={isPending}>
              {isPending ? '처리 중...' : '수정완료'}
            </Button>
          </div>
        ) : (
          <Button variant="white" onClick={handleSubmit} disabled={isPending}>
            {isPending ? '처리 중...' : '인벤토리 추가'}
          </Button>
        )}
      </div>
    </div>
  );
}
