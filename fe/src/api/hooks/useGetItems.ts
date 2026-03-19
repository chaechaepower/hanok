import { useQuery } from '@tanstack/react-query';
import { getFetchInstance } from '@/api/instance';
import type { Product, ProductStatus } from '@/types';

const getItemsPath = (status?: ProductStatus) =>
  status ? `/v1/items?status=${encodeURIComponent(status)}` : '/v1/items';

export const getItems = async (status?: ProductStatus) => {
  const response = await getFetchInstance().get<Product[]>(getItemsPath(status));
  return response.data;
};

export const useGetItems = (status?: ProductStatus, enabled = true) => {
  return useQuery<Product[], Error>({
    queryKey: ['items', status ?? 'ALL'],
    queryFn: () => getItems(status),
    enabled,
  });
};

export const useGetItemsByCategory = (category: string) => {
  return useQuery<Product[], Error>({
    queryKey: ['items', 'READY', category],
    queryFn: () => getItems('READY'),
    enabled: !!category,
    select: (data) => data.filter((item) => item.category === category),
  });
};
