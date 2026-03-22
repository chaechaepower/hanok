package com.ssafy.be.domain.item.service;

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
import com.ssafy.be.global.infra.gcs.GcsClient;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;


import java.io.IOException;
import java.util.List;
import java.util.Objects;
import java.util.stream.Stream;

@Service
@RequiredArgsConstructor
public class ItemService {

    private final ItemRepository itemRepository;
    private final SellerRepository sellerRepository;
    private final TagRepository tagRepository;
    private final GcsClient gcsClient;

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
    public ItemRegisterResponse updateItem(Long userId, Long itemId, ItemUpdateRequest request, List<MultipartFile> images) {
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

        if (images != null && !images.isEmpty()) {
            // 기존 이미지 삭제
            gcsClient.deleteImage(item.getImage1());
            gcsClient.deleteImage(item.getImage2());
            gcsClient.deleteImage(item.getImage3());

            try {
                String image1 = getImage(images, 0, seller.getId(), itemId);
                String image2 = getImage(images, 1, seller.getId(), itemId);
                String image3 = getImage(images, 2, seller.getId(), itemId);
                item.updateImages(image1, image2, image3);
            } catch (IOException e) {
                throw new GlobalException(ItemErrorCode.FILE_UPLOAD_FAILED);
            }
        }

        return new ItemRegisterResponse(item.getId(), item.getName(), item.getStatus());
    }

    @Transactional
    public void deleteItem(Long userId, Long itemId) {
        Seller seller = sellerRepository.findByUserId(userId)
                .orElseThrow(() -> new GlobalException(SellerErrorCode.SELLER_NOT_FOUND));

        Item item = itemRepository.findByIdAndSellerId(itemId, seller.getId())
                .orElseThrow(() -> new GlobalException(ItemErrorCode.ITEM_NOT_FOUND));

        gcsClient.deleteImage(item.getImage1());
        gcsClient.deleteImage(item.getImage2());
        gcsClient.deleteImage(item.getImage3());

        itemRepository.delete(item);
    }
}
