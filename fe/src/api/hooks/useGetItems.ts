import { useQuery } from '@tanstack/react-query';
import { getFetchInstance } from '@/api/instance';
import type { Product } from '@/types';

const getItemsPath = () => '/v1/items';

export const getItems = async () => {
  const response = await getFetchInstance().get(getItemsPath());
  return response.data;
};

export const useGetItems = () => {
  return useQuery<Product[], Error>({
    queryKey: ['items'],
    queryFn: getItems,
  });
};
