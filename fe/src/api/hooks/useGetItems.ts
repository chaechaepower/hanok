import { useQuery } from '@tanstack/react-query';
import { getFetchInstance } from '@/api/instance';
import type { Product } from '@/types';

const getItemsPath = (category?: string) =>
  category ? `/v1/items?category=${encodeURIComponent(category)}` : '/v1/items';

export const getItems = async (category?: string) => {
  const response = await getFetchInstance().get<Product[]>(getItemsPath(category));
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
    queryFn: () => getItems(category),
    enabled: !!category,
  });
};

