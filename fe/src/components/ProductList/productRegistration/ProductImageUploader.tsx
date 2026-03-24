import { FaCloudUploadAlt, FaTimes } from 'react-icons/fa';
import type { ChangeEventHandler, RefObject } from 'react';

import { MAX_IMAGES } from '@/constants/productRegistration';

type ImagePreview = {
  file: File;
  url: string;
};

type Props = {
  fileInputRef: RefObject<HTMLInputElement | null>;
  existingImages: string[];
  newImagePreviews: ImagePreview[];
  onFileChange: ChangeEventHandler<HTMLInputElement>;
  onRemoveExistingImage: (index: number) => void;
  onRemoveNewImage: (index: number) => void;
};

export default function ProductImageUploader({
  fileInputRef,
  existingImages,
  newImagePreviews,
  onFileChange,
  onRemoveExistingImage,
  onRemoveNewImage,
}: Props) {
  const totalImages = existingImages.length + newImagePreviews.length;
  const canAddImage = totalImages < MAX_IMAGES;

  return (
    <>
      <input
        type="file"
        accept="image/png, image/jpeg"
        multiple
        className="hidden"
        ref={fileInputRef}
        onChange={onFileChange}
      />

      <div
        className="mb-6 flex min-h-[160px] cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-neutral-600 bg-primary-muted p-4"
        onClick={() => {
          if (canAddImage) {
            fileInputRef.current?.click();
          }
        }}
      >
        {totalImages > 0 ? (
          <div
            className="macro-scroll flex w-full gap-3 overflow-x-auto p-2 pb-3"
            onClick={(event) => event.stopPropagation()}
          >
            {existingImages.map((url, index) => (
              <div key={`existing-${url}-${index}`} className="relative h-[120px] w-[120px] shrink-0">
                <img src={url} alt="상품 이미지" className="h-full w-full rounded-lg object-cover" />
                <button
                  type="button"
                  onClick={() => onRemoveExistingImage(index)}
                  className="absolute right-1 top-1 flex h-6 w-6 cursor-pointer items-center justify-center rounded-full border-none bg-black/50 text-white"
                >
                  <FaTimes size={12} />
                </button>
              </div>
            ))}

            {newImagePreviews.map((preview, index) => (
              <div key={`new-${preview.file.name}-${index}`} className="relative h-[120px] w-[120px] shrink-0">
                <img src={preview.url} alt="새 이미지 미리보기" className="h-full w-full rounded-lg object-cover" />
                <button
                  type="button"
                  onClick={() => onRemoveNewImage(index)}
                  className="absolute right-1 top-1 flex h-6 w-6 cursor-pointer items-center justify-center rounded-full border-none bg-black/50 text-white"
                >
                  <FaTimes size={12} />
                </button>
              </div>
            ))}

            {canAddImage ? (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="flex h-[120px] w-[120px] shrink-0 cursor-pointer items-center justify-center rounded-lg border border-dashed border-neutral-600"
              >
                <FaCloudUploadAlt size={24} className="text-neutral-500" />
              </div>
            ) : null}
          </div>
        ) : (
          <>
            <FaCloudUploadAlt size={32} className="mb-3 text-neutral-100" />
            <div className="text-[15px] font-semibold text-neutral-100">
              상품 이미지를 최대 {MAX_IMAGES}장까지 업로드
            </div>
            <div className="mt-1 text-[13px] text-neutral-500">PNG, JPG, 최대 10MB</div>
          </>
        )}
      </div>
    </>
  );
}
