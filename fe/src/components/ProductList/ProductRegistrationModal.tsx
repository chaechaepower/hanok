import React, { useState, useRef } from 'react';
import { FaTimes, FaCloudUploadAlt } from 'react-icons/fa';
import Button from '@/components/common/Button';
import { usePostItem } from '@/api/hooks/usePostItem';
import { usePatchItem } from '@/api/hooks/usePatchItem';
import { MAIN_CATEGORY_ITEMS } from '@/components/Main/SideBar';
import type { Product } from '@/types';

interface ProductRegistrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  initialData?: Product | null;
}

const inputClass = 'w-full h-12 bg-[#0B0C10] border border-[#1C1C1E] rounded-lg text-white text-sm px-4 outline-none';
const selectClass = `${inputClass} pr-10 cursor-pointer`;
const labelClass = 'block text-white text-sm font-semibold mb-2';

export default function ProductRegistrationModal({ isOpen, onClose, onSuccess, initialData }: ProductRegistrationModalProps) {
  const { mutateAsync: createItem, isPending: isCreating } = usePostItem();
  const { mutateAsync: updateItem, isPending: isUpdating } = usePatchItem();

  const isPending = isCreating || isUpdating;

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [itemCondition, setItemCondition] = useState('');
  const [startPrice, setStartPrice] = useState('');
  const [bidUnit, setBidUnit] = useState('');
  const [auctionDuration, setAuctionDuration] = useState('');
  const [auctionType, setAuctionType] = useState('');
  const [hashtags, setHashtags] = useState('');

  const [images, setImages] = useState<File[]>([]);
  const [existingImages, setExistingImages] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState('');

  React.useEffect(() => {
    if (isOpen) {
      setImages([]);
      if (initialData) {
        setName(initialData.name);
        setDescription('');

        const matchedCategory = MAIN_CATEGORY_ITEMS.find(c => c.label === initialData.category || c.id === initialData.category);
        setCategory(matchedCategory ? matchedCategory.id : '');

        setItemCondition(initialData.itemCondition || '');

        setStartPrice(initialData.startPrice.toString());
        setBidUnit('');
        setAuctionDuration('');
        setAuctionType('');
        setHashtags('');

        if (initialData.images && initialData.images.length > 0) {
          setExistingImages(initialData.images);
        } else {
          setExistingImages([]);
        }
      } else {
        setName(''); setDescription(''); setCategory(''); setItemCondition('');
        setStartPrice(''); setBidUnit(''); setAuctionDuration(''); setAuctionType('');
        setHashtags(''); setExistingImages([]);
      }
      setError('');
    }
  }, [isOpen, initialData]);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      if (existingImages.length + images.length + newFiles.length > 3) {
        setError('이미지는 최대 3장까지 업로드 가능합니다.');
        return;
      }
      setImages(prev => [...prev, ...newFiles]);
      setError('');
    }
  };

  const removeNewImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const removeExistingImage = (index: number) => {
    setExistingImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!name) { setError('상품명을 입력해주세요'); return; }
    if (!category) { setError('카테고리를 선택해주세요'); return; }
    const parsedTags = hashtags
      .split(/\s+/)
      .map(tag => tag.replace(/^#/, '').trim())
      .filter(tag => tag.length > 0);

    try {
      if (initialData) {
        await updateItem({
          itemId: initialData.itemId,
          payload: {
            name,
            description,
            startPrice: Number(startPrice.replace(/\D/g, '')) || 0,
            auctionDuration: Number(auctionDuration) || 30,
            bidUnit: Number(bidUnit.replace(/\D/g, '')) || 1000,
            category,
            itemCondition,
            tags: parsedTags,
            images: images.length > 0 ? images : undefined,
          }
        });
        console.log('상품 수정 완료');
      } else {
        await createItem({
          name,
          description,
          startPrice: Number(startPrice.replace(/\D/g, '')) || 0,
          auctionDuration: Number(auctionDuration) || 30,
          bidUnit: Number(bidUnit.replace(/\D/g, '')) || 1000,
          category,
          itemCondition,
          auctionType: auctionType || 'ENGLISH',
          tags: parsedTags,
          images: images.length > 0 ? images : undefined,
        });
        console.log('상품 등록 완료');
      }
      if (onSuccess) onSuccess();
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
          onClick={onClose}
          className="absolute top-6 right-6 bg-transparent border-none text-[#8E8E93] cursor-pointer"
        >
          <FaTimes size={20} />
        </button>

        <h2 className="text-white text-xl font-bold mt-0 mb-6">
          {initialData ? '상품 정보 수정' : '새 상품 등록'}
        </h2>

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
              <div className="text-white text-[15px] font-semibold">상품 이미지 업로드(최대 3장)</div>
              <div className="text-[#8E8E93] text-[13px] mt-1">PNG, JPG 5MB</div>
            </>
          )}
        </div>

        <div className="mb-5">
          <label className={labelClass}>상품명 등록 ({name.length}/20)</label>
          <input
            className={inputClass}
            placeholder="상품명을 입력하세요(최대 20자)"
            value={name}
            onChange={(e) => { setName(e.target.value); setError(''); }}
            maxLength={20}
          />
        </div>

        <div className="flex gap-4 mb-5">
          <div className="flex-1">
            <label className={labelClass}>카테고리</label>
            <select className={selectClass} value={category} onChange={(e) => { setCategory(e.target.value); setError(''); }} style={{ appearance: 'none', backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%238E8E93' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 14px center' }}>
              <option value="" disabled hidden>선택</option>
              {MAIN_CATEGORY_ITEMS.map(item => (
                <option key={item.id} value={item.id}>{item.label}</option>
              ))}
            </select>
          </div>
          <div className="flex-1">
            <label className={labelClass}>물품 상태</label>
            <select className={selectClass} value={itemCondition} onChange={(e) => setItemCondition(e.target.value)} style={{ appearance: 'none', backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%238E8E93' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 14px center' }}>
              <option value="" disabled hidden>선택</option>
              <option value="BRAND_NEW">미개봉 새제품</option>
              <option value="OPEN_BOX">개봉된 새상품</option>
              <option value="REFURBISHED">리퍼비시</option>
              <option value="USED">중고</option>
            </select>
          </div>
        </div>

        <div className="flex gap-4 mb-5">
          <div className="flex-1">
            <label className={labelClass}>시작가</label>
            <input
              className={inputClass}
              placeholder="0P"
              value={startPrice}
              onChange={(e) => setStartPrice(e.target.value.replace(/\D/g, ''))}
            />
          </div>
          <div className="flex-1">
            <label className={labelClass}>입찰단가</label>
            <input
              className={inputClass}
              placeholder="1,000P"
              value={bidUnit}
              onChange={(e) => setBidUnit(e.target.value.replace(/\D/g, ''))}
            />
          </div>
        </div>

        <div className="flex gap-4 mb-5">
          <div className="flex-1">
            <label className={labelClass}>경매시간</label>
            <select className={selectClass} value={auctionDuration} onChange={(e) => setAuctionDuration(e.target.value)} style={{ appearance: 'none', backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%238E8E93' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 14px center' }}>
              <option value="" disabled hidden>경매시간을 선택하세요</option>
              <option value="10">10초</option>
              <option value="30">30초</option>
              <option value="60">1분</option>
            </select>
          </div>
          <div className="flex-1">
            <label className={labelClass}>경매방식</label>
            <select className={selectClass} value={auctionType} onChange={(e) => setAuctionType(e.target.value)} style={{ appearance: 'none', backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%238E8E93' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 14px center' }}>
              <option value="" disabled hidden>경매방식을 선택하세요</option>
              <option value="ENGLISH">영국식 오름차순</option>
              <option value="DUTCH">내림차순</option>
            </select>
          </div>
        </div>

        <div className="mb-5">
          <label className={labelClass}>상품 설명 ({description.length}/50)</label>
          <textarea
            className={`${inputClass} !h-[120px] pt-4 resize-none`}
            placeholder="상품의 상태 정보를 상세히 적어주세요 (최대 50자)"
            value={description}
            onChange={(e) => { if (e.target.value.length <= 50) setDescription(e.target.value); }}
            maxLength={50}
          />
        </div>

        <div className="mb-8">
          <label className={labelClass}>해시 태그(선택)</label>
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
            {isPending ? '처리 중...' : '인벤토리에 추가'}
          </Button>
        )}
      </div>
    </div>
  );
}
