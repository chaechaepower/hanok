import { useEffect, useMemo, useRef, useState } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import { FaCloudUploadAlt, FaTimes } from 'react-icons/fa';

import { usePatchItem } from '@/api/hooks/usePatchItem';
import { usePostItem } from '@/api/hooks/usePostItem';
import Button from '@/components/common/Button';
import CustomSelect from '@/components/common/CustomSelect';
import { MAIN_CATEGORY_ITEMS } from '@/components/Main/mainCategoryItems';
import { ITEM_CONDITION_OPTIONS } from '@/constants/itemCondition';
import type { Product } from '@/types';
import { getUploadErrorMessage } from '@/utils/getUploadErrorMessage';

const inputClass =
  'w-full h-12 bg-background border border-neutral-800 rounded-lg text-neutral-100 text-sm px-4 outline-none focus:border-primary transition-colors';
const labelClass = 'block text-neutral-100 text-sm font-semibold mb-2';

const MAX_IMAGES = 3;
const MAX_HASHTAGS = 7;

const parseHashtags = (value: string) =>
  value
    .split(/\s+/)
    .map((tag) => tag.replace(/^#/, '').trim())
    .filter((tag) => tag.length > 0);

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
    hashtags: initialData.tags?.length ? initialData.tags.map((tag) => `#${tag}`).join(' ') : '',
    existingImages: initialData.images?.length ? initialData.images : [],
  };
};

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
            images: images.length > 0 ? images : undefined,
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
