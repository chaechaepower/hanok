import { useMutation } from '@tanstack/react-query';
import { getFetchInstance, queryClient } from '@/api/instance';
import type { UpdateItemPayload, UpdateItemResponse } from '@/types';

const patchItemPath = (itemId: number) => `/v1/items/${itemId}`;

export const usePatchItem = () => {
  return useMutation<UpdateItemResponse, Error, { itemId: number; payload: UpdateItemPayload }>({
    mutationFn: async ({ itemId, payload }) => {
      const response = await getFetchInstance().patch(patchItemPath(itemId), {
        name: payload.name,
        description: payload.description,
        category: payload.category,
        startPrice: payload.startPrice,
        bidUnit: payload.bidUnit,
        auctionDuration: payload.auctionDuration,
        itemCondition: payload.itemCondition,
        tags: payload.tags ?? [],
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['items'] });
    },
  });
};
