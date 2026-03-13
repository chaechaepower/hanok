import { useMutation } from '@tanstack/react-query';
import { getFetchInstance, queryClient } from '@/api/instance';
import type { CreateItemPayload, CreateItemResponse } from '@/types';

const postItemPath = () => '/v1/items';

export const usePostItem = () => {
  return useMutation<CreateItemResponse, Error, CreateItemPayload>({
    mutationFn: async (payload) => {
      const response = await getFetchInstance().post(postItemPath(), {
        name: payload.name,
        description: payload.description,
        category: payload.category,
        startPrice: payload.startPrice,
        bidUnit: payload.bidUnit,
        auctionDuration: payload.auctionDuration,
        itemCondition: payload.itemCondition,
        auctionType: payload.auctionType,
        tags: payload.tags ?? [],
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['items'] });
    },
  });
};
