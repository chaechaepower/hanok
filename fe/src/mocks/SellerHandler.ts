import { http, HttpResponse } from 'msw';

import { BASE_URL } from '@/api/instance';

import { getCurrentMockUser, setCurrentMockUser } from './mockState';

export const sellerHandlers = [
  http.post(`${BASE_URL}/v1/sellers/register`, async () => {
    const currentUser = getCurrentMockUser();

    if (currentUser) {
      setCurrentMockUser({
        ...currentUser,
        isSeller: true,
      });
    }

    return HttpResponse.json(
      {
        sellerId: 101,
        nickname: 'Mock Seller',
      },
      { status: 201 },
    );
  }),


  http.get(`${BASE_URL}/v1/sellers/verify-bizno`, async ({ request }) => {
    const url = new URL(request.url);
    const bizno = url.searchParams.get('bizno');

    if (!bizno || (bizno.length !== 10 && bizno.length !== 13)) {
      return HttpResponse.json(
        {
          status: 'SUCCESS',
          message: 'Business number verification completed.',
          data: {
            valid: false,
          },
        },
        { status: 200 },
      );
    }

    return HttpResponse.json(
      {
        status: 'SUCCESS',
        message: 'Business number verification completed.',
        data: {
          valid: true,
        },
      },
      { status: 200 },
    );
  }),

  http.get(`${BASE_URL}/v1/users/me/seller-status`, async () => {
    const user = getCurrentMockUser();
    const isSeller = user?.isSeller ?? false;
    return HttpResponse.json(
      {
        status: 'SUCCESS',
        message: 'Seller status fetched successfully.',
        data: {
          isSeller,
          sellerId: isSeller ? 1 : null,
        },
      },
      { status: 200 },
    );
  }),
];
