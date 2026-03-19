import { useMutation } from '@tanstack/react-query';
import { getFetchInstance, queryClient } from '@/api/instance';

const patchProfileImagePath = () => `/v1/users/me/profile-image`;

export const usePatchProfileImage = (sellerId?: number | null) => {
  return useMutation({
    throwOnError: false,
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
      if (sellerId != null) {
        queryClient.invalidateQueries({ queryKey: ['sellerProfile', sellerId] });
      } else {
        queryClient.invalidateQueries({ queryKey: ['sellerProfile'] });
      }
    },
  });
};
