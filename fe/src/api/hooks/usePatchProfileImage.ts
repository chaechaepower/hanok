import { useMutation } from '@tanstack/react-query';
import { getFetchInstance, queryClient } from '@/api/instance';

const patchProfileImagePath = () => `/v1/users/me/profile-image`;

export const usePatchProfileImage = () => {
  return useMutation({
    mutationFn: async (image: File) => {
      const formData = new FormData();
      formData.append('image', image);
      const response = await getFetchInstance().patch(patchProfileImagePath(), formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['me'] });
    },
  });
};
