import { http, HttpResponse, delay } from "msw";
import { BASE_URL } from "@/api/instance";

let mockItems: any[] = [];

export const handlers = [
  http.get("/api/health", () => {
    return HttpResponse.json({ ok: true });
  }),

  // -- Item CRUD Mocks --
  http.get(`${BASE_URL}/v1/items`, async () => {
    await delay(300);
    return HttpResponse.json(mockItems);
  }),

  http.post(`${BASE_URL}/v1/items`, async ({ request }) => {
    await delay(500);
    // Simulate getting form data
    const formData = await request.formData();
    const title = formData.get('title') as string || 'Mock Uploaded Item';
    const description = formData.get('description') as string || 'Mock Description';
    const startPrice = Number(formData.get('startPrice')) || 0;
    const bidUnit = Number(formData.get('bidUnit'));
    const auctionTime = Number(formData.get('auctionDuration'));
    const category = Number(formData.get('categoryId'));
    const categoryName = category === 1 ? '패션/잡화' : category === 3 ? '수집품' : '전자기기';
    
    // Check if there are newImages
    const newImages = formData.getAll('newImages');
    let imageUrls: string[] = [];
    if (newImages.length > 0) {
      imageUrls = newImages.map(file => URL.createObjectURL(file as Blob));
    } else {
      imageUrls = ['https://via.placeholder.com/160x160?text=Mock+Image'];
    }

    const tags = formData.getAll('tags') as string[];

    const newItem = {
      id: Date.now() + Math.floor(Math.random() * 1000),
      status: 'WAITING', // default status
      title,
      description,
      tags: tags.length > 0 ? tags : ['신규등록', '테스트'], // default if empty
      imageUrls,
      startPrice,
      bidUnit,
      auctionTime,
      condition: '새상품',
      category: categoryName,
      auctionMethod: '영국식',
    };
    
    mockItems.push(newItem);

    return HttpResponse.json({
      itemId: newItem.id,
      title: newItem.title,
      status: newItem.status
    });
  }),
  
  http.put(`${BASE_URL}/v1/items/:itemId`, async ({ request, params }) => {
    await delay(500);
    const id = Number(params.itemId);
    const formData = await request.formData();
    
    const title = formData.get('title') as string;
    const description = formData.get('description') as string;
    const tags = formData.getAll('tags') as string[];
    
    // Additional editable fields
    const startPrice = formData.get('startPrice') ? Number(formData.get('startPrice')) : undefined;
    const bidUnit = formData.get('bidUnit') ? Number(formData.get('bidUnit')) : undefined;
    const auctionTime = formData.get('auctionDuration') ? Number(formData.get('auctionDuration')) : undefined;
    const category = formData.get('categoryId') ? Number(formData.get('categoryId')) : undefined;
    const conditionRaw = formData.get('condition') as string;
    const auctionMethodRaw = formData.get('auctionMethod') as string;

    const condition = conditionRaw === 'new' ? '새상품' : conditionRaw === 'like-new' ? '거의 새것' : conditionRaw === 'used' ? '사용감 있음' : undefined;
    const auctionMethod = auctionMethodRaw === 'english' ? '영국식' : auctionMethodRaw === 'dutch' ? '내림차순' : undefined;
    const categoryName = category ? (category === 1 ? '패션/잡화' : category === 3 ? '수집품' : '전자기기') : undefined;

    const itemIndex = mockItems.findIndex(i => i.id === id);
    if (itemIndex > -1) {
      const itemToUpdate = mockItems[itemIndex];
      // Keep existing logic for images but add it here if need be...
      
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
        tags: tags.length > 0 ? tags : itemToUpdate.tags, // override tags or keep old
        imageUrls: imageUrls,
        startPrice: startPrice !== undefined ? startPrice : itemToUpdate.startPrice,
        bidUnit: bidUnit !== undefined ? bidUnit : itemToUpdate.bidUnit,
        auctionTime: auctionTime !== undefined ? auctionTime : itemToUpdate.auctionTime,
        condition: condition !== undefined ? condition : itemToUpdate.condition,
        category: categoryName !== undefined ? categoryName : itemToUpdate.category,
        auctionMethod: auctionMethod !== undefined ? auctionMethod : itemToUpdate.auctionMethod,
      };
      
      return HttpResponse.json({
        itemId: id,
        title: mockItems[itemIndex].title,
        status: "ready"
      });
    }

    return HttpResponse.json({ error: "Item not found" }, { status: 404 });
  }),

  http.delete(`${BASE_URL}/v1/items/:itemId`, async ({ params }) => {
    await delay(500);
    const id = Number(params.itemId);
    mockItems = mockItems.filter(i => i.id !== id);
    return HttpResponse.json({
      itemId: id,
      status: "cancelled"
    });
  }),

  http.post(`${BASE_URL}/v1/sellers/register`, async () => {
    // API 명세서에 맞는 응답값 반환
    return HttpResponse.json({
      sellerId: 101,
      nickname: "Mock 판매자",
      grade: "A"
    }, { status: 200 });
  }),
  http.post(`${BASE_URL}/v1/sellers/account`, async () => {
    // API 명세서에 맞는 응답값 반환 (200 OK without body content)
    return new HttpResponse(null, { status: 200 });
  }),
  http.get(`${BASE_URL}/v1/users/me/seller-status`, async () => {
    return HttpResponse.json({
      isSeller: false
    });
  }),
];
