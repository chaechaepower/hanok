package com.ssafy.be.domain.stream.service;

import com.ssafy.be.domain.auction.entity.Auction;
import com.ssafy.be.domain.auction.entity.AuctionStatus;
import com.ssafy.be.domain.auction.repository.AuctionRepository;
import com.ssafy.be.domain.item.dto.response.ItemSummaryResponse;
import com.ssafy.be.domain.item.entity.Category;
import com.ssafy.be.domain.item.entity.Item;
import com.ssafy.be.domain.item.repository.ItemRepository;
import com.ssafy.be.domain.seller.entity.Seller;
import com.ssafy.be.domain.seller.exception.SellerErrorCode;
import com.ssafy.be.domain.seller.repository.SellerRepository;
import com.ssafy.be.domain.stream.dto.request.StreamListRequest;
import com.ssafy.be.domain.stream.dto.request.StreamRegisterRequest;
import com.ssafy.be.domain.stream.dto.request.StreamUpdateRequest;
import com.ssafy.be.domain.stream.dto.response.*;
import com.ssafy.be.domain.stream.entity.Stream;
import com.ssafy.be.domain.stream.entity.StreamSortType;
import com.ssafy.be.domain.stream.entity.StreamStatus;
import com.ssafy.be.domain.stream.exception.StreamErrorCode;
import com.ssafy.be.domain.stream.repository.StreamRepository;
import com.ssafy.be.global.exception.GlobalException;
import com.ssafy.be.global.infra.gcs.GcsClient;
import com.ssafy.be.global.infra.livekit.LiveKitProperties;
import io.livekit.server.AccessToken;
import io.livekit.server.CanPublish;
import io.livekit.server.CanSubscribe;
import io.livekit.server.RoomJoin;
import io.livekit.server.RoomName;
import java.io.IOException;
import java.util.Comparator;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import com.ssafy.be.domain.item.exception.ItemErrorCode;

@Service
@RequiredArgsConstructor
public class StreamService {

    private final StreamRepository streamRepository;
    private final SellerRepository sellerRepository;
    private final GcsClient gcsClient;
    private final LiveKitProperties liveKitProperties;
    private final StreamViewerService streamViewerService;
    private final AuctionRepository auctionRepository;
    private final ItemRepository itemRepository;

    @Transactional
    public StreamRegisterResponse register(
            Long userId, StreamRegisterRequest request, MultipartFile thumbnail) {
        Seller seller =
                sellerRepository
                        .findByUserId(userId)
                        .orElseThrow(() -> new GlobalException(SellerErrorCode.SELLER_NOT_FOUND));

        Stream saved = streamRepository.save(buildStream(request, seller));

        if (thumbnail != null && !thumbnail.isEmpty()) {
            try {
                String url = gcsClient.uploadStreamThumbnail(thumbnail, seller.getId(), saved.getId());
                saved.updateThumbnail(url);
            } catch (IOException e) {
                throw new GlobalException(StreamErrorCode.THUMBNAIL_UPLOAD_FAILED);
            }
        }

        // 경매 등록
        List<ItemSummaryResponse> items = List.of();
        if (request.itemIds() != null && !request.itemIds().isEmpty()) {
            items = request.itemIds().stream()
                    .map(itemId -> {
                        Item item = itemRepository
                                .findByIdAndSellerId(itemId, seller.getId())
                                .orElseThrow(() -> new GlobalException(ItemErrorCode.ITEM_NOT_FOUND));
                        auctionRepository.save(
                                Auction.builder()
                                        .auctionStatus(AuctionStatus.READY)
                                        .stream(saved)
                                        .item(item)
                                        .build());
                        return new ItemSummaryResponse(
                                item.getId(),
                                item.getName(),
                                item.getCategory(),
                                item.getStartPrice(),
                                item.getStatus(),
                                item.getItemCondition(),
                                item.getImage1(),
                                item.getCreatedAt());
                    })
                    .toList();
        }

        return new StreamRegisterResponse(saved.getId(), saved.getTitle(), saved.getStartType(), saved.getThumbnail(), items);
    }

    private Stream buildStream(StreamRegisterRequest request, Seller seller) {
        return Stream.builder()
                .title(request.title())
                .category(request.category())
                .startType(request.startType())
                .scheduledAt(request.scheduledAt())
                .notice(request.notice())
                .status(StreamStatus.SCHEDULED)
                .seller(seller)
                .build();
    }

    @Transactional
    public StreamRegisterResponse updateStream(
            Long userId, Long streamId, StreamUpdateRequest request, MultipartFile thumbnail) {
        Seller seller =
                sellerRepository
                        .findByUserId(userId)
                        .orElseThrow(() -> new GlobalException(SellerErrorCode.SELLER_NOT_FOUND));

        Stream stream =
                streamRepository
                        .findByIdAndSellerId(streamId, seller.getId())
                        .orElseThrow(() -> new GlobalException(StreamErrorCode.STREAM_NOT_FOUND));

        stream.update(
                request.title(),
                request.category(),
                request.startType(),
                request.scheduledAt(),
                request.notice());

        if (thumbnail != null && !thumbnail.isEmpty()) {
            if (stream.getThumbnail() != null) {
                gcsClient.deleteStreamThumbnail(stream.getThumbnail());
            }
            try {
                String url = gcsClient.uploadStreamThumbnail(thumbnail, seller.getId(), streamId);
                stream.updateThumbnail(url);
            } catch (IOException e) {
                throw new GlobalException(StreamErrorCode.THUMBNAIL_UPLOAD_FAILED);
            }
        }

        List<ItemSummaryResponse> items = auctionRepository.findByStreamId(streamId).stream()
                .map(auction -> {
                    Item item = auction.getItem();
                    return new ItemSummaryResponse(
                            item.getId(),
                            item.getName(),
                            item.getCategory(),
                            item.getStartPrice(),
                            item.getStatus(),
                            item.getItemCondition(),
                            item.getImage1(),
                            item.getCreatedAt());
                })
                .toList();

        return new StreamRegisterResponse(stream.getId(), stream.getTitle(), stream.getStartType(), stream.getThumbnail(), items);
    }

    @Transactional
    public void deleteStream(Long userId, Long streamId) {
        Seller seller =
                sellerRepository
                        .findByUserId(userId)
                        .orElseThrow(() -> new GlobalException(SellerErrorCode.SELLER_NOT_FOUND));

        Stream stream =
                streamRepository
                        .findByIdAndSellerId(streamId, seller.getId())
                        .orElseThrow(() -> new GlobalException(StreamErrorCode.STREAM_NOT_FOUND));

        if (stream.getThumbnail() != null) {
            gcsClient.deleteStreamThumbnail(stream.getThumbnail());
        }

        streamRepository.delete(stream);
    }

    @Transactional(readOnly = true)
    public StreamTokenResponse generateToken(Long userId, Long streamId) {
        Stream stream =
                streamRepository
                        .findById(streamId)
                        .orElseThrow(() -> new GlobalException(StreamErrorCode.STREAM_NOT_FOUND));

        boolean isHost = stream.getSeller().getUser().getId().equals(userId);
        String participantIdentity = String.valueOf(userId);
        String roomName = String.valueOf(streamId);

        AccessToken token =
                new AccessToken(liveKitProperties.apiKey(), liveKitProperties.apiSecret());
        token.setName(participantIdentity);
        token.setIdentity(participantIdentity);
        token.addGrants(
                new RoomJoin(true),
                new RoomName(roomName),
                new CanPublish(isHost),
                new CanSubscribe(true));

        return new StreamTokenResponse(token.toJwt());
    }

    @Transactional(readOnly = true)
    public StreamDetailResponse getStream(Long userId, Long streamId) {
        Seller seller =
                sellerRepository
                        .findByUserId(userId)
                        .orElseThrow(() -> new GlobalException(SellerErrorCode.SELLER_NOT_FOUND));

        Stream stream =
                streamRepository
                        .findByIdAndSellerId(streamId, seller.getId())
                        .orElseThrow(() -> new GlobalException(StreamErrorCode.STREAM_NOT_FOUND));

        return new StreamDetailResponse(
                stream.getId(),
                stream.getTitle(),
                stream.getCategory(),
                stream.getThumbnail(),
                stream.getScheduledAt(),
                stream.getStartType(),
                stream.getNotice(),
                stream.getStatus() == StreamStatus.LIVE,
                stream.getCreatedAt());
    }

    @Transactional
    public void startStream(Long userId, Long streamId) {
        Seller seller =
                sellerRepository
                        .findByUserId(userId)
                        .orElseThrow(() -> new GlobalException(SellerErrorCode.SELLER_NOT_FOUND));

        Stream stream =
                streamRepository
                        .findByIdAndSellerId(streamId, seller.getId())
                        .orElseThrow(() -> new GlobalException(StreamErrorCode.STREAM_NOT_FOUND));

        stream.start();
    }

    @Transactional
    public void endStream(Long userId, Long streamId) {
        Seller seller =
                sellerRepository
                        .findByUserId(userId)
                        .orElseThrow(() -> new GlobalException(SellerErrorCode.SELLER_NOT_FOUND));

        Stream stream =
                streamRepository
                        .findByIdAndSellerId(streamId, seller.getId())
                        .orElseThrow(() -> new GlobalException(StreamErrorCode.STREAM_NOT_FOUND));

        stream.end();
    }

    @Transactional(readOnly = true)
    public Page<StreamListItemResponse> getStreamList(StreamListRequest request) {
        Category category = request.category();

        if (request.sort() == StreamSortType.VIEWER_COUNT) {
            // 전체 가져와서 메모리 정렬
            List<Stream> streams =
                    switch (request.status()) {
                        case LIVE -> streamRepository.findAllLiveStreams(category);
                        case SCHEDULED -> streamRepository.findAllScheduledStreams(category);
                    };

            List<StreamListItemResponse> sorted =
                    streams.stream()
                            // 228번째 줄 - VIEWER_COUNT 정렬 map 부분
                            .map(stream -> {
                                Seller sel = stream.getSeller();
                                return new StreamListItemResponse(
                                        stream.getId(),
                                        stream.getTitle(),
                                        stream.getCategory(),
                                        stream.getThumbnail(),
                                        stream.getStatus() == StreamStatus.LIVE,
                                        streamViewerService.getViewerCount(stream.getId()),
                                        stream.getScheduledAt(),
                                        stream.getStartedAt(),
                                        new StreamSellerResponse(
                                                sel.getId(),
                                                sel.getUser().getNickname(),
                                                sel.getUser().getProfileImage()));
                            })
                            .sorted(
                                    Comparator.comparingLong(StreamListItemResponse::viewerCount)
                                            .reversed())
                            .toList();

            // 수동 페이지네이션
            int start = request.page() * request.size();
            int end = Math.min(start + request.size(), sorted.size());
            List<StreamListItemResponse> pageContent = sorted.subList(start, end);

            return new PageImpl<>(
                    pageContent, PageRequest.of(request.page(), request.size()), sorted.size());
        }

        Pageable pageable =
                PageRequest.of(request.page(), request.size(), Sort.by("createdAt").descending());
        Page<Stream> streams =
                switch (request.status()) {
                    case LIVE -> streamRepository.findLiveStreams(category, pageable);
                    case SCHEDULED -> streamRepository.findScheduledStreams(category, pageable);
                };

        return streams.map(stream -> {
            Seller sel = stream.getSeller();
            return new StreamListItemResponse(
                    stream.getId(),
                    stream.getTitle(),
                    stream.getCategory(),
                    stream.getThumbnail(),
                    stream.getStatus() == StreamStatus.LIVE,  // isLive() → status 비교
                    streamViewerService.getViewerCount(stream.getId()),
                    stream.getScheduledAt(),
                    stream.getStartedAt(),
                    new StreamSellerResponse(
                            sel.getId(),
                            sel.getUser().getNickname(),
                            sel.getUser().getProfileImage()));
        });
    }

    @Transactional(readOnly = true)
    public ScheduledStreamListResponse getScheduledStreamList(int page, int size) {
        Pageable pageable = PageRequest.of(page, size);
        Slice<Stream> slice = streamRepository.findByStatusIn(
                List.of(StreamStatus.LIVE, StreamStatus.SCHEDULED),
                pageable
        );

        List<ScheduledStreamResponse> streams = slice.getContent()
                .stream()
                .map(ScheduledStreamResponse::from)
                .toList();

        return new ScheduledStreamListResponse(streams, slice.hasNext());
    }
}
