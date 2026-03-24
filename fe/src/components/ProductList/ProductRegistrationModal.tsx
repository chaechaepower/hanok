import { useEffect, useMemo, useRef, useState } from 'react';
import type { ChangeEvent, FormEvent } from 'react';

import { usePatchItem } from '@/api/hooks/usePatchItem';
import { usePostItem } from '@/api/hooks/usePostItem';
import CustomSelect from '@/components/common/CustomSelect';
import { ITEM_CONDITION_OPTIONS } from '@/constants/itemCondition';
import type { Product } from '@/types';
import { getUploadErrorMessage } from '@/utils/getUploadErrorMessage';

import ProductImageUploader from './productRegistration/ProductImageUploader';
import ProductSubmitActions from './productRegistration/ProductSubmitActions';
import {
  CATEGORY_OPTIONS,
  inputClass,
  labelClass,
  MAX_HASHTAGS,
  MAX_IMAGES,
} from '../../constants/productRegistration';
import { buildUpdateImagePayload, getInitialFormState, parseHashtags } from '../../utils/productRegistration';

interface ProductRegistrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  initialData?: Product | null;
}

type ProductRegistrationModalContentProps = Omit<ProductRegistrationModalProps, 'isOpen'>;

function ProductRegistrationModalContent({ onClose, onSuccess, initialData }: ProductRegistrationModalContentProps) {
  const initialForm = useMemo(() => getInitialFormState(initialData), [initialData]);
  const { mutateAsync: createItem, isPending: isCreating } = usePostItem();
  const { mutateAsync: updateItem, isPending: isUpdating } = usePatchItem();
  const isPending = isCreating || isUpdating;

  const [name, setName] = useState(initialForm.name);
  const [description, setDescription] = useState(initialForm.description);
  const [category, setCategory] = useState(initialForm.category);
  const [itemCondition, setItemCondition] = useState(initialForm.itemCondition);
  const [hashtags, setHashtags] = useState(initialForm.hashtags);
  const [images, setImages] = useState<File[]>([]);
  const [existingImages, setExistingImages] = useState<string[]>(initialForm.existingImages);
  const [error, setError] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  const newImagePreviews = useMemo(() => images.map((file) => ({ file, url: URL.createObjectURL(file) })), [images]);

  useEffect(() => {
    return () => {
      newImagePreviews.forEach((preview) => URL.revokeObjectURL(preview.url));
    };
  }, [newImagePreviews]);

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

    if (!description.trim()) {
      setError('상품 설명을 입력해주세요.');
      return;
    }

    const parsedTags = parseHashtags(hashtags);

    if (parsedTags.length > MAX_HASHTAGS) {
      setError(`해시태그는 최대 ${MAX_HASHTAGS}개까지 입력할 수 있습니다.`);
      return;
    }

    try {
      if (initialData) {
        await updateItem({
          itemId: initialData.itemId,
          payload: {
            name: name.trim(),
            description: description.trim(),
            category,
            itemCondition,
            tags: parsedTags,
            ...buildUpdateImagePayload(existingImages, images),
          },
        });
      } else {
        await createItem({
          name: name.trim(),
          description: description.trim(),
          category,
          itemCondition,
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
        className="scrollbar-hide relative max-h-[90vh] w-[480px] overflow-y-auto rounded-2xl border border-neutral-800 bg-surface-elevated p-8 shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <h2 className="mb-6 mt-0 text-xl font-bold text-neutral-100">{initialData ? '상품 수정' : '상품 등록'}</h2>

        <form onSubmit={handleFormSubmit}>
          <ProductImageUploader
            fileInputRef={fileInputRef}
            existingImages={existingImages}
            newImagePreviews={newImagePreviews}
            onFileChange={handleFileChange}
            onRemoveExistingImage={removeExistingImage}
            onRemoveNewImage={removeNewImage}
          />

          <div className="mb-5 flex items-end gap-4">
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
                options={CATEGORY_OPTIONS}
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

          <div className="mb-5">
            <label className={labelClass}>상품 설명 ({description.length}/50)</label>
            <textarea
              className={`${inputClass} !h-[120px] resize-none pt-4`}
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
              <div className="mt-3 flex flex-wrap items-center gap-2">
                {parsedHashtags.map((tag, index) => (
                  <span key={`${tag}-${index}`} className="badge-gold-outline px-3 py-1.5 text-[13px] font-medium">
                    #{tag}
                  </span>
                ))}
                <span className="text-[12px] text-neutral-500">
                  {parsedHashtags.length}/{MAX_HASHTAGS}
                </span>
              </div>
            ) : null}
          </div>

          {error ? <div className="mb-4 text-sm text-accent-light">{error}</div> : null}

          <ProductSubmitActions isEditMode={Boolean(initialData)} isPending={isPending} onClose={onClose} />
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
