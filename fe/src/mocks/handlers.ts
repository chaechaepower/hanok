import { http, HttpResponse } from 'msw';

import { BASE_URL } from '@/api/instance';

import { mainHandlers } from './MainHandler';
import { walletHandlers } from './WalletHandler';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let mockItems: any[] = [];

// Follower count mock state
let mockFollowerCount = 342;

export const handlers = [
  ...mainHandlers,
  ...walletHandlers,

  http.get(`${BASE_URL}/v1/items`, async () => {
    return HttpResponse.json(mockItems);
  }),

  http.post(`${BASE_URL}/v1/items`, async ({ request }) => {
    const formData = await request.formData();
    const title = (formData.get('title') as string) || 'Mock Uploaded Item';
    const description = (formData.get('description') as string) || 'Mock Description';
    const startPrice = Number(formData.get('startPrice')) || 0;
    const bidUnit = Number(formData.get('bidUnit'));
    const auctionTime = Number(formData.get('auctionDuration'));
    const category = Number(formData.get('categoryId'));
    const categoryName = category === 1 ? '패션/잡화' : category === 3 ? '수집품' : '전자기기';
    const newImages = formData.getAll('newImages');
    let imageUrls: string[] = [];

    if (newImages.length > 0) {
      imageUrls = newImages.map((file) => URL.createObjectURL(file as Blob));
    } else {
      imageUrls = ['https://via.placeholder.com/160x160?text=Mock+Image'];
    }

    const tags = formData.getAll('tags') as string[];

    const newItem = {
      id: Date.now() + Math.floor(Math.random() * 1000),
      status: 'WAITING',
      title,
      description,
      tags: tags.length > 0 ? tags : ['신규등록', '테스트'],
      imageUrls,
      startPrice,
      bidUnit,
      auctionTime,
      condition: '정상',
      category: categoryName,
      auctionMethod: '경매',
    };

    mockItems.push(newItem);

    return HttpResponse.json({
      itemId: newItem.id,
      title: newItem.title,
      status: newItem.status,
    });
  }),

  http.put(`${BASE_URL}/v1/items/:itemId`, async ({ request, params }) => {
    const id = Number(params.itemId);
    const formData = await request.formData();

    const title = formData.get('title') as string;
    const description = formData.get('description') as string;
    const tags = formData.getAll('tags') as string[];
    const startPrice = formData.get('startPrice') ? Number(formData.get('startPrice')) : undefined;
    const bidUnit = formData.get('bidUnit') ? Number(formData.get('bidUnit')) : undefined;
    const auctionTime = formData.get('auctionDuration') ? Number(formData.get('auctionDuration')) : undefined;
    const category = formData.get('categoryId') ? Number(formData.get('categoryId')) : undefined;
    const conditionRaw = formData.get('condition') as string;
    const auctionMethodRaw = formData.get('auctionMethod') as string;

    const condition =
      conditionRaw === 'new'
        ? '새상품'
        : conditionRaw === 'like-new'
          ? '거의 새것'
          : conditionRaw === 'used'
            ? '사용감 있음'
            : undefined;
    
    const categoryName = category
      ? category === 1
        ? '패션/잡화'
        : category === 3
          ? '수집품'
          : '전자기기'
      : undefined;

    const auctionMethod =
      auctionMethodRaw === 'english' ? '경매' : auctionMethodRaw === 'dutch' ? '네덜란드식' : undefined;

    const itemIndex = mockItems.findIndex(i => i.id === id);
    if (itemIndex > -1) {
      const itemToUpdate = mockItems[itemIndex];
      
      const newImages = formData.getAll('newImages');
      const existingImageUrls = formData.getAll('existingImageUrls') as string[];
      let imageUrls: string[] = existingImageUrls.length > 0 ? [...existingImageUrls] : [];
      
      if (newImages && newImages.length > 0) {
        newImages.forEach(file => {
           imageUrls.push(URL.createObjectURL(file as Blob));
        });
      }
      if (imageUrls.length === 0 && itemToUpdate.imageUrls && itemToUpdate.imageUrls.length > 0) {
          imageUrls = itemToUpdate.imageUrls;
      }

      mockItems[itemIndex] = {
        ...itemToUpdate,
        title: title || itemToUpdate.title,
        description: description || itemToUpdate.description,
        tags: tags.length > 0 ? tags : itemToUpdate.tags,
        imageUrls,
        startPrice: startPrice !== undefined ? startPrice : itemToUpdate.startPrice,
        bidUnit: bidUnit !== undefined ? bidUnit : itemToUpdate.bidUnit,
        auctionTime: auctionTime !== undefined ? auctionTime : itemToUpdate.auctionTime,
        condition: condition !== undefined ? condition : itemToUpdate.condition,
        category: categoryName !== undefined ? categoryName : itemToUpdate.category,
        auctionMethod: auctionMethod !== undefined ? auctionMethod : itemToUpdate.auctionMethod,
      };
    };
    return HttpResponse.json({
      itemId: id,
      title: mockItems[itemIndex].title,
      status: 'ready',
    });
  }),

  http.delete(`${BASE_URL}/v1/items/:itemId`, async ({ params }) => {
    const id = Number(params.itemId);
    mockItems = mockItems.filter((item) => item.id !== id);

    return HttpResponse.json({
      itemId: id,
      status: 'cancelled',
    });
  }),

  http.post(`${BASE_URL}/v1/sellers/register`, async () => {
    return HttpResponse.json(
      {
        sellerId: 101,
        nickname: 'Mock 판매자',
        grade: 'A',
      },
      { status: 200 },
    );
  }),

  http.post(`${BASE_URL}/v1/sellers/account`, async () => {
    return new HttpResponse(null, { status: 200 });
  }),

  http.get(`${BASE_URL}/v1/users/me/seller-status`, async () => {
    return HttpResponse.json({
      isSeller: false,
    });
  }),

  // -- Follow / Unfollow Mock --
  http.patch(`${BASE_URL}/v1/users/:userId/follow`, async () => {
    mockFollowerCount += 1;
    return HttpResponse.json({
      following: true,
      followerCount: mockFollowerCount,
      followingCount: 12
    });
  }),
  http.delete(`${BASE_URL}/v1/users/:userId/unfollow`, async () => {
    mockFollowerCount = Math.max(0, mockFollowerCount - 1);
    return HttpResponse.json({
      following: false,
      followerCount: mockFollowerCount,
      followingCount: 11
    });
  }),

  // -- Seller Reputation Mock --
  http.get(`${BASE_URL}/v1/sellers/:sellerId/reputation`, () => {
    // 임시로, Authorization 헤더나 특정 조건에 따라 본인인지 확인한다고 가정.
    // 여기서는 모든 정보를 반환하도록 하거나 랜덤하게 응답합니다.
    const isOwner = true; // 테스트를 위해 항상 본인 데이터로 내려줍니다 (또는 필요에 따라 수정 가능)
    
    if (isOwner) {
      return HttpResponse.json({
        status: "SUCCESS",
        message: "요청이 성공적으로 처리되었습니다.",
        data: {
          followerCount: mockFollowerCount,
          totalTrades: 50,
          completionRate: 98.5,
          cancelCount: 1,
          avgShipDays: 2.3
        }
      });
    } else {
      return HttpResponse.json({
        status: "SUCCESS",
        message: "요청이 성공적으로 처리되었습니다.",
        data: {
          followerCount: mockFollowerCount
        }
      });
    }
  }),

  // -- Seller Profile Mock --
  http.get(`${BASE_URL}/v1/sellers/:sellerId/profile`, ({ params }) => {
    const sellerId = Number(params.sellerId);
    return HttpResponse.json({
      sellerId,
      nickname: '판매왕',
      intro: '좋은 물건만 팔아요. 소중한 인연을 기다립니다.',
      profile_image: `https://picsum.photos/seed/seller-${sellerId}/120/120`,
      instagramUrl: 'https://instagram.com/seller123',
      youtubeUrl: 'https://youtube.com/@seller_channel',
      tiktokUrl: 'https://tiktok.com/@seller_tok',
      stats: {
        rating: 4.7,
        avgShipDays: 1.8,
        followerCount: 342,
      },
      recentSales: [
        {
          itemId: 10,
          title: '나이키 에어맥스',
          finalPrice: 75000,
          soldAt: '2026-03-01T14:00:00Z',
        },
        {
          itemId: 11,
          title: '빈티지 가죽 자켓',
          finalPrice: 120000,
          soldAt: '2026-02-20T10:30:00Z',
        },
      ],
      posts: [
        {
          postId: 5,
          title: '이번 주 방송 예고',
          context: '이번 주 토요일 오후 3시에 라이브 방송을 진행합니다. 많은 참여 바랍니다!',
          createdAt: '2026-03-03T12:00:00Z',
        },
        {
          postId: 6,
          title: '상점 휴무 및 상담 지연 공지',
          context: '개인 사정으로 인해 해당 기간 동안 상점 운영을 잠시 중단합니다. 경매 진행 건은 휴무 종료 후 순차적으로 발송될 예정입니다. 양해 부탁드립니다.',
          createdAt: '2026-03-02T09:00:00Z',
        },
      ],
    }, { status: 200 });
  }),

  // -- Seller Notice Mock --
  http.get(`${BASE_URL}/v1/sellers/:sellerId/notice`, ({ request }) => {
    const url = new URL(request.url);
    const page = Number(url.searchParams.get('page')) || 1;
    const limit = Number(url.searchParams.get('limit')) || 10;
    
    // 더미 공지사항 데이터 반환
    return HttpResponse.json({
      items: [
        {
          postId: 5,
          title: "이번 주 방송 예고",
          content: "수요일 저녁 8시에 만나요!",
          createdAt: "2026-03-03T12:00:00Z",
          updatedAt: "2026-03-03T12:00:00Z"
        },
        {
          postId: 6,
          title: "상점 휴무 및 상담 지연 공지",
          content: "개인 사정으로 인해 해당 기간 동안 상점 운영을 잠시 중단합니다.",
          createdAt: "2026-03-02T09:00:00Z",
          updatedAt: "2026-03-02T09:00:00Z"
        }
      ].slice((page - 1) * limit, page * limit),
      total: 2
    }, { status: 200 });
  }),

  http.post(`${BASE_URL}/v1/sellers/:sellerId/posts`, async ({ request }) => {
    const body = (await request.json()) as { title: string; content: string };
    return HttpResponse.json({
      postId: Date.now(),
      title: body.title,
      content: body.content,
      createdAt: new Date().toISOString()
    }, { status: 200 });
  }),

  http.patch(`${BASE_URL}/v1/sellers/:sellerId/posts/:postId`, async ({ request, params }) => {
    const postId = Number(params.postId);
    const body = (await request.json()) as { title: string; content: string };
    return HttpResponse.json({
      postId,
      title: body.title,
      content: body.content,
      updatedAt: new Date().toISOString()
    }, { status: 200 });
  }),

  http.delete(`${BASE_URL}/v1/sellers/:sellerId/posts/:postId`, () => {
    return HttpResponse.json({ success: true }, { status: 200 });
  }),

  // -- Escrow Mocks --
  http.get(`${BASE_URL}/v1/escrows`, () => {
    return HttpResponse.json(
      {
        status: 'SUCCESS',
        message: '낙찰 이력 조회 성공',
        data: [
          {
            escrowId: 101,
            imageUrl: 'https://picsum.photos/seed/shoes/140/140',
            itemName: '나이키 에어맥스',
            amount: 75000,
            escrowState: 'INVOICE_SUBMITTED',
            createdAt: '2026-03-01T23:00:00Z',
          },
          {
            escrowId: 102,
            imageUrl: 'https://picsum.photos/seed/jacket/140/140',
            itemName: '빈티지 가죽 자켓',
            amount: 120000,
            escrowState: 'COMPLETED',
            createdAt: '2026-02-20T19:30:00Z',
          },
        ],
      },
      { status: 200 }
    );
  }),

  http.get(`${BASE_URL}/v1/escrows/:escrowId`, ({ params }) => {
    const { escrowId } = params;

    // 모의 상세 데이터 (escrowId에 따라 약간 다르게 응답 가능하도록 구성)
    const isCompleted = escrowId === '102';
    
    return HttpResponse.json(
      {
        status: 'SUCCESS',
        message: '낙찰 상세 조회 성공',
        data: {
          winningInfo: {
            imageUrl: isCompleted ? 'https://picsum.photos/seed/jacket/140/140' : 'https://picsum.photos/seed/candle/140/140',
            itemName: isCompleted ? '빈티지 가죽 자켓' : '트레이딩 카드',
            finalPrice: isCompleted ? 120000 : 2300,
            sellerName: '신재혁상점',
            sellerId: 'asad_1',
            wonAt: isCompleted ? '2026-02-20T19:30:00Z' : '2026-03-01T10:24:00Z',
          },
          shippingAddress: {
            name: '이효은',
            phone: '010-3134-6396',
            postalCode: '03154',
            address: '서울시 종로구 세종대로 1',
            addressDetail: '405동 107호',
          },
          delivery: isCompleted ? {
            courierName: 'CJ대한통운',
            trackingNumber: '120312319124',
          } : null,
        },
      },
      { status: 200 }
    );
  }),
];

