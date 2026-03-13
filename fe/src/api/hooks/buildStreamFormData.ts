import type { StreamMultipartPayload } from '@/types';

export const buildStreamFormData = ({ request, thumbnail }: StreamMultipartPayload) => {
  const formData = new FormData();
  formData.append('request', new Blob([JSON.stringify(request)], { type: 'application/json' }));

  if (thumbnail) {
    formData.append('thumbnail', thumbnail);
  }

  return formData;
};
