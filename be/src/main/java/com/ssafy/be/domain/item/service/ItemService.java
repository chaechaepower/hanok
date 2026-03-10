package com.ssafy.be.domain.item.service;

import com.ssafy.be.domain.item.dto.request.ItemRegisterRequest;
import com.ssafy.be.domain.item.dto.request.ItemUpdateRequest;
import com.ssafy.be.domain.item.dto.response.ItemRegisterResponse;
import com.ssafy.be.domain.item.dto.response.ItemSummaryResponse;
import com.ssafy.be.domain.item.entity.Item;
import com.ssafy.be.domain.item.entity.ItemStatus;
import com.ssafy.be.domain.item.exception.ItemErrorCode;
import com.ssafy.be.domain.item.repository.ItemRepository;
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

@Service
@RequiredArgsConstructor
public class ItemService {

    private final ItemRepository itemRepository;
    private final SellerRepository sellerRepository;
    private final GcsClient gcsClient;

    @Transactional
    public ItemRegisterResponse register(Long userId, ItemRegisterRequest request, List<MultipartFile> images) {
        Seller seller = sellerRepository.findByUserId(userId)
                .orElseThrow(() -> new GlobalException(SellerErrorCode.SELLER_NOT_FOUND));

        Item item = Item.builder()
                .name(request.name())
                .description(request.description())
                .category(request.category())
                .startPrice(request.startPrice())
                .bidUnit(request.bidUnit())
                .auctionDuration(request.auctionDuration())
                .status(ItemStatus.READY)
                .condition(request.itemCondition())
                .seller(seller)
                .build();

        Item saved = itemRepository.save(item);

        // 이미지 업로드
        if (images != null && !images.isEmpty()) {
            try {
                String image1 = images.size() > 0 ? gcsClient.uploadItemImage(images.get(0), seller.getId(), saved.getId()) : null;
                String image2 = images.size() > 1 ? gcsClient.uploadItemImage(images.get(1), seller.getId(), saved.getId()) : null;
                String image3 = images.size() > 2 ? gcsClient.uploadItemImage(images.get(2), seller.getId(), saved.getId()) : null;
                saved.updateImages(image1, image2, image3);
            } catch (IOException e) {
                throw new GlobalException(ItemErrorCode.FILE_UPLOAD_FAILED);
            }
        }

        return new ItemRegisterResponse(saved.getId(), saved.getName(), saved.getStatus());
    }

    @Transactional(readOnly = true)
    public List<ItemSummaryResponse> getItems(Long userId, ItemStatus status) {
        Seller seller = sellerRepository.findByUserId(userId)
                .orElseThrow(() -> new GlobalException(SellerErrorCode.SELLER_NOT_FOUND));

        List<Item> items = status != null
                ? itemRepository.findBySellerIdAndStatus(seller.getId(), status)
                : itemRepository.findBySellerId(seller.getId());

        return items.stream()
                .map(i -> new ItemSummaryResponse(
                        i.getId(),
                        i.getName(),
                        i.getCategory(),
                        i.getStartPrice(),
                        i.getStatus(),
                        i.getItemCondition(),
                        i.getImage1(),
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

        item.update(request);

        if (images != null && !images.isEmpty()) {
            // 기존 이미지 삭제
            gcsClient.deleteItemImage(item.getImage1());
            gcsClient.deleteItemImage(item.getImage2());
            gcsClient.deleteItemImage(item.getImage3());

            try {
                String image1 = images.size() > 0 ? gcsClient.uploadItemImage(images.get(0), seller.getId(), itemId) : null;
                String image2 = images.size() > 1 ? gcsClient.uploadItemImage(images.get(1), seller.getId(), itemId) : null;
                String image3 = images.size() > 2 ? gcsClient.uploadItemImage(images.get(2), seller.getId(), itemId) : null;
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

        gcsClient.deleteItemImage(item.getImage1());
        gcsClient.deleteItemImage(item.getImage2());
        gcsClient.deleteItemImage(item.getImage3());

        itemRepository.delete(item);
    }
}