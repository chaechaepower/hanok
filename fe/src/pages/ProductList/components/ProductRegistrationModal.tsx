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

export default function ProductRegistrationModal({ isOpen, onClose, onSuccess, initialData }: ProductRegistrationModalProps) {
  const { mutateAsync: createItem, isPending: isCreating } = usePostItem();
  const { mutateAsync: updateItem, isPending: isUpdating } = usePatchItem();
  
  const isPending = isCreating || isUpdating;
  
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [condition, setCondition] = useState('');
  const [startPrice, setStartPrice] = useState('');
  const [bidUnit, setBidUnit] = useState('');
  const [auctionTime, setAuctionTime] = useState('');
  const [auctionMethod, setAuctionMethod] = useState('');
  const [hashtags, setHashtags] = useState('');
  
  const [images, setImages] = useState<File[]>([]);
  const [existingImages, setExistingImages] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState('');

  React.useEffect(() => {
    if (isOpen) {
      setImages([]);
      if (initialData) {
        setTitle(initialData.title);
        setDescription(initialData.description);
        
        const matchedCategory = MAIN_CATEGORY_ITEMS.find(c => c.label === initialData.category || c.id === initialData.category);
        setCategory(matchedCategory ? matchedCategory.id : '');
        
        setCondition(initialData.condition === '미개봉' ? 'new' : initialData.condition === '거의 새것' ? 'like-new' : 'used');
        
        setStartPrice(initialData.startPrice.toString());
        setBidUnit(initialData.bidUnit.toString());
        setAuctionTime(initialData.auctionTime.toString());
        setAuctionMethod(initialData.auctionMethod === '내림차순' ? 'dutch' : 'english');
        setHashtags(initialData.tags ? initialData.tags.map(t => `#${t}`).join(' ') : '');
        
        if (initialData.imageUrls && initialData.imageUrls.length > 0) {
          setExistingImages(initialData.imageUrls);
        } else {
          setExistingImages([]);
        }
      } else {
        setTitle(''); setDescription(''); setCategory(''); setCondition('');
        setStartPrice(''); setBidUnit(''); setAuctionTime(''); setAuctionMethod('');
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
    if (!title) { setError('상품명을 입력해주세요'); return; }
    if (!category) { setError('카테고리를 선택해주세요'); return; }
    const parsedTags = hashtags
      .split(/\s+/)
      .map(tag => tag.replace(/^#/, '').trim())
      .filter(tag => tag.length > 0);

    try {
      if (initialData) {
        await updateItem({
          itemId: initialData.id,
          payload: {
            title,
            description,
            existingImageUrls: existingImages,
            newImages: images,
            startPrice: Number(startPrice.replace(/\D/g, '')) || 0,
            auctionDuration: Number(auctionTime) || 30,
            bidUnit: Number(bidUnit.replace(/\D/g, '')) || 1000,
            categoryId: MAIN_CATEGORY_ITEMS.findIndex(c => c.id === category) + 1 || 1,
            condition,
            auctionMethod,
            tags: parsedTags,
          }
        });
        console.log('상품 수정 완료');
      } else {
        await createItem({
          title,
          description,
          newImages: images,
          startPrice: Number(startPrice.replace(/\D/g, '')) || 0,
          auctionDuration: Number(auctionTime) || 30,
          bidUnit: Number(bidUnit.replace(/\D/g, '')) || 1000,
          categoryId: MAIN_CATEGORY_ITEMS.findIndex(c => c.id === category) + 1 || 1,
          tags: parsedTags,
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

  const inputStyle = {
    width: '100%',
    height: '48px',
    backgroundColor: '#0B0C10',
    border: '1px solid #1C1C1E',
    borderRadius: '8px',
    color: 'white',
    fontSize: '14px',
    padding: '0 16px',
    outline: 'none',
  };

  const selectStyle = {
    ...inputStyle,
    appearance: 'none',
    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%238E8E93' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`,
    backgroundRepeat: 'no-repeat',
    backgroundPosition: 'right 14px center',
  } as React.CSSProperties;

  const labelStyle = {
    display: 'block',
    color: 'white',
    fontSize: '14px',
    fontWeight: '600',
    marginBottom: '8px',
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.7)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
    }}>
      <div className="custom-scrollbar" style={{
        backgroundColor: '#151517',
        width: '480px',
        maxHeight: '90vh',
        overflowY: 'auto',
        borderRadius: '16px',
        padding: '32px',
        position: 'relative',
        boxShadow: '0 10px 40px rgba(0,0,0,0.5)',
      }}>
        <button
          onClick={onClose}
          style={{ position: 'absolute', top: '24px', right: '24px', background: 'none', border: 'none', color: '#8E8E93', cursor: 'pointer' }}
        >
          <FaTimes size={20} />
        </button>

        <h2 style={{ color: 'white', fontSize: '20px', fontWeight: '700', marginTop: 0, marginBottom: '24px' }}>
          {initialData ? '상품 정보 수정' : '새 상품 등록'}
        </h2>

        {/* 이미지 업로드 영역 */}
        <input
          type="file"
          accept="image/png, image/jpeg"
          multiple
          style={{ display: 'none' }}
          ref={fileInputRef}
          onChange={handleFileChange}
        />
        <div style={{
          backgroundColor: '#2C2A26',
          borderRadius: '12px',
          minHeight: '160px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '24px',
          cursor: 'pointer',
          border: '1px dashed #4A4A4C',
          padding: '16px'
        }}
        onClick={() => {
          if (existingImages.length + images.length < 3) fileInputRef.current?.click();
        }}>
          {existingImages.length > 0 || images.length > 0 ? (
            <div style={{ display: 'flex', gap: '12px', width: '100%', overflowX: 'auto', padding: '8px' }} onClick={(e) => e.stopPropagation()}>
              {/* 기존 이미지 */}
              {existingImages.map((url, idx) => (
                <div key={`exist-${idx}`} style={{ position: 'relative', width: '120px', height: '120px', flexShrink: 0 }}>
                  <img src={url} alt="기존 이미지" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '8px' }} />
                  <button
                    onClick={() => removeExistingImage(idx)}
                    style={{ position: 'absolute', top: '4px', right: '4px', background: 'rgba(0,0,0,0.5)', color: 'white', border: 'none', borderRadius: '50%', width: '24px', height: '24px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                  >
                    <FaTimes size={12} />
                  </button>
                </div>
              ))}
              
              {/* 새로 추가된 이미지 */}
              {images.map((file, idx) => (
                <div key={`new-${idx}`} style={{ position: 'relative', width: '120px', height: '120px', flexShrink: 0 }}>
                  <img src={URL.createObjectURL(file)} alt="preview" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '8px' }} />
                  <button
                    onClick={() => removeNewImage(idx)}
                    style={{ position: 'absolute', top: '4px', right: '4px', background: 'rgba(0,0,0,0.5)', color: 'white', border: 'none', borderRadius: '50%', width: '24px', height: '24px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                  >
                    <FaTimes size={12} />
                  </button>
                </div>
              ))}
              
              {existingImages.length + images.length < 3 && (
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  style={{ width: '120px', height: '120px', border: '1px dashed #4A4A4C', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, cursor: 'pointer' }}
                >
                  <FaCloudUploadAlt size={24} color="#8E8E93" />
                </div>
              )}
            </div>
          ) : (
            <>
              <FaCloudUploadAlt size={32} color="white" style={{ marginBottom: '12px' }} />
              <div style={{ color: 'white', fontSize: '15px', fontWeight: '600' }}>상품 이미지 업로드(최대 3장)</div>
              <div style={{ color: '#8E8E93', fontSize: '13px', marginTop: '4px' }}>PNG, JPG 5MB</div>
            </>
          )}
        </div>

        {/* 상품명 */}
        <div style={{ marginBottom: '20px' }}>
          <label style={labelStyle}>상품명 등록</label>
          <input
            style={inputStyle}
            placeholder="상품명을 입력하세요(최대 20자)"
            value={title}
            onChange={(e) => { setTitle(e.target.value); setError(''); }}
            maxLength={20}
          />
        </div>

        {/* 2단 그리드 1 */}
        <div style={{ display: 'flex', gap: '16px', marginBottom: '20px' }}>
          <div style={{ flex: 1 }}>
            <label style={labelStyle}>카테고리</label>
            <select style={selectStyle} value={category} onChange={(e) => { setCategory(e.target.value); setError(''); }}>
              <option value="" disabled hidden>선택</option>
              {MAIN_CATEGORY_ITEMS.map(item => (
                <option key={item.id} value={item.id}>{item.label}</option>
              ))}
            </select>
          </div>
          <div style={{ flex: 1 }}>
            <label style={labelStyle}>물품 상태</label>
            <select style={selectStyle} value={condition} onChange={(e) => setCondition(e.target.value)}>
              <option value="" disabled hidden>선택</option>
              <option value="new">미개봉</option>
              <option value="like-new">거의 새것</option>
              <option value="used">사용감 있음</option>
            </select>
          </div>
        </div>

        {/* 2단 그리드 2 */}
        <div style={{ display: 'flex', gap: '16px', marginBottom: '20px' }}>
          <div style={{ flex: 1 }}>
            <label style={labelStyle}>시작가</label>
            <input
              style={inputStyle}
              placeholder="0P"
              value={startPrice}
              onChange={(e) => setStartPrice(e.target.value.replace(/\D/g, ''))}
            />
          </div>
          <div style={{ flex: 1 }}>
            <label style={labelStyle}>입찰단가</label>
            <input
              style={inputStyle}
              placeholder="1,000P"
              value={bidUnit}
              onChange={(e) => setBidUnit(e.target.value.replace(/\D/g, ''))}
            />
          </div>
        </div>

        {/* 2단 그리드 3 */}
        <div style={{ display: 'flex', gap: '16px', marginBottom: '20px' }}>
          <div style={{ flex: 1 }}>
            <label style={labelStyle}>경매시간</label>
            <select style={selectStyle} value={auctionTime} onChange={(e) => setAuctionTime(e.target.value)}>
              <option value="" disabled hidden>경매시간을 선택하세요</option>
              <option value="10">10초</option>
              <option value="30">30초</option>
              <option value="60">1분</option>
            </select>
          </div>
          <div style={{ flex: 1 }}>
            <label style={labelStyle}>경매방식</label>
            <select style={selectStyle} value={auctionMethod} onChange={(e) => setAuctionMethod(e.target.value)}>
              <option value="" disabled hidden>경매방식을 선택하세요</option>
              <option value="english">영국식 오름차순</option>
              <option value="dutch">내림차순</option>
            </select>
          </div>
        </div>

        {/* 상품 설명 */}
        <div style={{ marginBottom: '20px' }}>
          <label style={labelStyle}>상품 설명</label>
          <textarea
            style={{ ...inputStyle, height: '120px', paddingTop: '16px', resize: 'none' }}
            placeholder="상품의 상태 정보를 상세히 적어주세요"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>

        {/* 해시 태그 */}
        <div style={{ marginBottom: '32px' }}>
          <label style={labelStyle}>해시 태그(선택)</label>
          <input
            style={inputStyle}
            placeholder="#해시태그 #입력 #해주세요"
            value={hashtags}
            onChange={(e) => setHashtags(e.target.value)}
          />
        </div>

        {error && <div style={{ color: '#FF3B30', fontSize: '14px', marginBottom: '16px' }}>{error}</div>}

        {/* 하단 버튼 */}
        <Button variant="white" onClick={handleSubmit} disabled={isPending}>
          {isPending ? '처리 중...' : (initialData ? '수정 완료' : '인벤토리에 추가')}
        </Button>
      </div>
    </div>
  );
}
