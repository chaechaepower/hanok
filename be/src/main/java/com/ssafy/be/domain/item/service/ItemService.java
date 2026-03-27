package com.ssafy.be.domain.item.service;

import com.ssafy.be.domain.auction.repository.AuctionRepository;
import com.ssafy.be.domain.item.dto.request.ItemRegisterRequest;
import com.ssafy.be.domain.item.dto.request.ItemUpdateRequest;
import com.ssafy.be.domain.item.dto.response.ItemRegisterResponse;
import com.ssafy.be.domain.item.dto.response.ItemSummaryResponse;
import com.ssafy.be.domain.item.entity.Item;
import com.ssafy.be.domain.item.entity.ItemStatus;
import com.ssafy.be.domain.item.entity.Tag;
import com.ssafy.be.domain.item.exception.ItemErrorCode;
import com.ssafy.be.domain.item.repository.ItemRepository;
import com.ssafy.be.domain.item.repository.TagRepository;
import com.ssafy.be.domain.seller.entity.Seller;
import com.ssafy.be.domain.seller.exception.SellerErrorCode;
import com.ssafy.be.domain.seller.repository.SellerRepository;
import com.ssafy.be.global.exception.GlobalException;
import com.ssafy.be.global.infra.storage.gcs.GcsClient;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;


import java.io.IOException;
import java.util.Arrays;
import java.util.HashSet;
import java.util.List;
import java.util.Objects;
import java.util.Set;
import java.util.stream.Stream;

@Service
@RequiredArgsConstructor
public class ItemService {

    private final ItemRepository itemRepository;
    private final SellerRepository sellerRepository;
    private final TagRepository tagRepository;
    private final GcsClient gcsClient;
    private final AuctionRepository auctionRepository;

    @Transactional
    public ItemRegisterResponse register(Long userId, ItemRegisterRequest request, List<MultipartFile> images) {
        Seller seller = sellerRepository.findByUserId(userId)
                .orElseThrow(() -> new GlobalException(SellerErrorCode.SELLER_NOT_FOUND));

        Item saved = itemRepository.save(buildItem(request, seller));

        if (request.tags() != null && !request.tags().isEmpty()) {
            List<Tag> tags = request.tags().stream()
                    .map(name -> Tag.builder()
                            .name(name)
                            .item(saved)
                            .build())
                    .toList();
            tagRepository.saveAll(tags);
        }

        if (images != null && !images.isEmpty()) {
            try {
                String image1 = getImage(images, 0, seller.getId(), saved.getId());
                String image2 = getImage(images, 1, seller.getId(), saved.getId());
                String image3 = getImage(images, 2, seller.getId(), saved.getId());
                saved.updateImages(image1, image2, image3);
            } catch (IOException e) {
                throw new GlobalException(ItemErrorCode.FILE_UPLOAD_FAILED);
            }
        }

        return new ItemRegisterResponse(saved.getId(), saved.getName(), saved.getStatus());
    }

    private Item buildItem(ItemRegisterRequest request, Seller seller) {
        return Item.builder()
                .name(request.name())
                .description(request.description())
                .category(request.category())
                .status(ItemStatus.READY)
                .itemCondition(request.itemCondition())
                .seller(seller)
                .build();
    }

    private String getImage(List<MultipartFile> images, int index, Long sellerId, Long itemId) throws IOException {
        if (images.size() > index) {
            return gcsClient.uploadItemImage(images.get(index), sellerId, itemId);
        }
        return null;
    }

    @Transactional(readOnly = true)
    public List<ItemSummaryResponse> getItems(Long userId, ItemStatus status) {
        Seller seller = sellerRepository.findByUserId(userId)
                .orElseThrow(() -> new GlobalException(SellerErrorCode.SELLER_NOT_FOUND));

        List<Item> items = status != null
                ? itemRepository.findBySellerIdAndStatusOrderByCreatedAtDesc(seller.getId(), status)
                : itemRepository.findBySellerIdOrderByCreatedAtDesc(seller.getId());

        return items.stream()
                .map(i -> new ItemSummaryResponse(
                        i.getId(),
                        i.getName(),
                        i.getDescription(),
                        i.getTags().stream().map(Tag::getName).toList(),
                        Stream.of(i.getImage1(), i.getImage2(), i.getImage3())
                                .filter(Objects::nonNull)
                                .toList(),
                        i.getItemCondition(),
                        i.getCategory(),
                        i.getStatus(),
                        i.getCreatedAt()
                ))
                .toList();
    }

    @Transactional
    public ItemRegisterResponse updateItem(Long userId, Long itemId, ItemUpdateRequest request, MultipartFile image1, MultipartFile image2, MultipartFile image3) {
        Seller seller = sellerRepository.findByUserId(userId)
                .orElseThrow(() -> new GlobalException(SellerErrorCode.SELLER_NOT_FOUND));

        Item item = itemRepository.findByIdAndSellerId(itemId, seller.getId())
                .orElseThrow(() -> new GlobalException(ItemErrorCode.ITEM_NOT_FOUND));

        item.update(
                request.name(),
                request.description(),
                request.category(),
                request.itemCondition()
        );

        if (request.tags() != null) {
            tagRepository.deleteAllByItemId(itemId);  // 기존 태그 전체 삭제
            List<Tag> tags = request.tags().stream()
                    .map(name -> Tag.builder()
                            .name(name)
                            .item(item)
                            .build())
                    .toList();
            tagRepository.saveAll(tags);
        }

        if (request.images() != null) {
            try {
                applyImageUpdate(item, request, image1, image2, image3, seller.getId(), itemId);
            } catch (IOException e) {
                throw new GlobalException(ItemErrorCode.FILE_UPLOAD_FAILED);
            }
        }

        return new ItemRegisterResponse(item.getId(), item.getName(), item.getStatus());
    }

    /**
     * 슬롯별: multipart가 있으면 새 업로드, 없고 JSON URL이 있으면 그대로, 둘 다 없으면 null(삭제).
     * JSON images는 항상 길이 3 (null 생략 시 images 필드 자체를 보내지 않음).
     */
    private void applyImageUpdate(
            Item item,
            ItemUpdateRequest request,
            MultipartFile image1,
            MultipartFile image2,
            MultipartFile image3,
            Long sellerId,
            Long itemId) throws IOException {
        List<String> urls = request.images();
        if (urls.size() != 3) {
            throw new GlobalException(ItemErrorCode.ITEM_UPDATE_IMAGES_INVALID_SIZE);
        }

        String old1 = item.getImage1();
        String old2 = item.getImage2();
        String old3 = item.getImage3();

        String new1 = resolveImageSlot(image1, urls.get(0), sellerId, itemId);
        String new2 = resolveImageSlot(image2, urls.get(1), sellerId, itemId);
        String new3 = resolveImageSlot(image3, urls.get(2), sellerId, itemId);

        item.updateImages(new1, new2, new3);

        Set<String> kept = new HashSet<>();
        if (new1 != null) {
            kept.add(new1);
        }
        if (new2 != null) {
            kept.add(new2);
        }
        if (new3 != null) {
            kept.add(new3);
        }
        for (String previous : Arrays.asList(old1, old2, old3)) {
            if (previous != null && !previous.isBlank() && !kept.contains(previous)) {
                gcsClient.deleteImage(previous);
            }
        }
    }

    private String resolveImageSlot(MultipartFile file, String jsonUrl, Long sellerId, Long itemId)
            throws IOException {
        if (file != null && !file.isEmpty()) {
            return gcsClient.uploadItemImage(file, sellerId, itemId);
        }
        if (jsonUrl != null && !jsonUrl.isBlank()) {
            return jsonUrl.trim();
        }
        return null;
    }

    @Transactional
    public void deleteItem(Long userId, Long itemId) {
        Seller seller = sellerRepository.findByUserId(userId)
                .orElseThrow(() -> new GlobalException(SellerErrorCode.SELLER_NOT_FOUND));

        Item item = itemRepository.findByIdAndSellerId(itemId, seller.getId())
                .orElseThrow(() -> new GlobalException(ItemErrorCode.ITEM_NOT_FOUND));

        // 상태 가드
        if (item.getStatus() == ItemStatus.PENDING) {
            throw new GlobalException(ItemErrorCode.ITEM_NOT_DELETABLE_LIVE);
        }
        if (item.getStatus() == ItemStatus.SOLD) {
            throw new GlobalException(ItemErrorCode.ITEM_NOT_DELETABLE_SOLD);
        }

        // FK 의존성 먼저 제거
        auctionRepository.deleteByItemId(itemId);

        gcsClient.deleteImage(item.getImage1());
        gcsClient.deleteImage(item.getImage2());
        gcsClient.deleteImage(item.getImage3());
        itemRepository.delete(item);
    }

}
