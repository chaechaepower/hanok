import { useQuery } from '@tanstack/react-query';
import { getFetchInstance } from '@/api/instance';
import type { Product } from '@/types';

const getItemsPath = (status?: string) =>
  status ? `/v1/items?status=${encodeURIComponent(status)}` : '/v1/items';

export const getItems = async (status?: string) => {
  const response = await getFetchInstance().get<Product[]>(getItemsPath(status));
  return response.data;
};

export const useGetItems = () => {
  return useQuery<Product[], Error>({
    queryKey: ['items'],
    queryFn: () => getItems(),
  });
};

export const useGetItemsByCategory = (category: string) => {
  return useQuery<Product[], Error>({
    queryKey: ['items', category],
    queryFn: () => getItems(),
    enabled: !!category,
    select: (data) => data.filter((item) => item.category === category),
  });
};
