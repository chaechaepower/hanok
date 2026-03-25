import { MAIN_CATEGORY_ITEMS } from '@/components/Main/mainCategoryItems';
import type { Product } from '@/types';

import { EMPTY_IMAGE_SLOTS, MAX_IMAGES } from '@/constants/productRegistration';

export const parseHashtags = (value: string) =>
  value
    .split(/\s+/)
    .map((tag) => tag.replace(/^#/, '').trim())
    .filter((tag) => tag.length > 0);

export const getInitialFormState = (initialData?: Product | null) => {
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

export const buildUpdateImagePayload = (existingImages: string[], images: File[]) => {
  const combinedImages = [
    ...existingImages.map((url) => ({ kind: 'existing' as const, url })),
    ...images.map((file) => ({ kind: 'new' as const, file })),
  ].slice(0, MAX_IMAGES);

  const imageSlots: [string | null, string | null, string | null] = [...EMPTY_IMAGE_SLOTS];
  const imageFiles: [File | undefined, File | undefined, File | undefined] = [undefined, undefined, undefined];

  combinedImages.forEach((image, index) => {
    if (image.kind === 'existing') {
      imageSlots[index] = image.url;
      return;
    }

    imageFiles[index] = image.file;
  });

  return {
    images: imageSlots,
    image1: imageFiles[0],
    image2: imageFiles[1],
    image3: imageFiles[2],
  };
};
