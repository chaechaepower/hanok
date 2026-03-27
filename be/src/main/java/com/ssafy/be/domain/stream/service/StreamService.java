package com.ssafy.be.domain.stream.service;

import com.ssafy.be.domain.auction.entity.Auction;
import com.ssafy.be.domain.auction.entity.AuctionStatus;
import com.ssafy.be.domain.bottomupauction.model.Bid;
import com.ssafy.be.domain.bottomupauction.repository.AuctionBidRepository;
import com.ssafy.be.domain.auction.repository.AuctionRepository;
import com.ssafy.be.domain.bottomupauction.entity.BottomUpAuctionDetail;
import com.ssafy.be.domain.bottomupauction.repository.BottomUpAuctionDetailRepository;
import com.ssafy.be.domain.follow.repository.FollowRepository;
import com.ssafy.be.domain.item.entity.Category;
import com.ssafy.be.domain.item.entity.Item;
import com.ssafy.be.domain.item.entity.ItemStatus;
import com.ssafy.be.domain.item.entity.Tag;
import com.ssafy.be.domain.item.exception.ItemErrorCode;
import com.ssafy.be.domain.item.repository.ItemRepository;
import com.ssafy.be.domain.notification.model.NotificationRoutingField;
import com.ssafy.be.domain.notification.service.NotificationService;
import com.ssafy.be.domain.seller.entity.Seller;
import com.ssafy.be.domain.seller.exception.SellerErrorCode;
import com.ssafy.be.domain.seller.repository.SellerRepository;
import com.ssafy.be.domain.stream.dto.request.MacroSaveRequest;
import com.ssafy.be.domain.stream.dto.request.StreamListRequest;
import com.ssafy.be.domain.stream.dto.request.StreamRegisterRequest;
import com.ssafy.be.domain.stream.dto.request.StreamUpdateRequest;
import com.ssafy.be.domain.stream.dto.response.*;
import com.ssafy.be.domain.stream.entity.Stream;
import com.ssafy.be.domain.stream.entity.StreamSortType;
import com.ssafy.be.domain.stream.entity.StreamStatus;
import com.ssafy.be.domain.stream.entity.StreamViewType;
import com.ssafy.be.domain.stream.exception.StreamErrorCode;
import com.ssafy.be.domain.stream.repository.MacroRedisRepository;
import com.ssafy.be.domain.stream.repository.StreamReconnectRedisRepository;
import com.ssafy.be.domain.stream.repository.StreamRepository;
import com.ssafy.be.domain.uniqueaction.entity.UniqueBidAuctionDetail;
import com.ssafy.be.domain.uniqueaction.repository.UniqueBidAuctionDetailRepository;
import com.ssafy.be.domain.user.entity.User;
import com.ssafy.be.domain.user.repository.UserRepository;
import com.ssafy.be.global.exception.GlobalException;
import com.ssafy.be.global.infra.gcs.GcsClient;
import com.ssafy.be.global.infra.livekit.LiveKitProperties;
import com.ssafy.be.global.websocket.enums.StreamEventType;
import com.ssafy.be.global.websocket.publisher.StreamPublisher;
import io.livekit.server.AccessToken;
import io.livekit.server.CanPublish;
import io.livekit.server.CanSubscribe;
import io.livekit.server.RoomJoin;
import io.livekit.server.RoomName;

import java.io.IOException;
import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.stream.Collectors;
import java.util.stream.IntStream;

import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

import static com.ssafy.be.domain.notification.model.NotificationType.STREAM_START;

@Service
@RequiredArgsConstructor
public class StreamService {

    private final NotificationService notificationService;
    private final StreamRepository streamRepository;
    private final SellerRepository sellerRepository;
    private final GcsClient gcsClient;
    private final LiveKitProperties liveKitProperties;
    private final StreamViewerService streamViewerService;
    private final AuctionBidRepository auctionBidRepository;
    private final AuctionRepository auctionRepository;
    private final BottomUpAuctionDetailRepository bottomUpAuctionDetailRepository;
    private final UniqueBidAuctionDetailRepository uniqueBidAuctionDetailRepository;
    private final ItemRepository itemRepository;
    private final FollowRepository followRepository;
    private final UserRepository userRepository;
    private final MacroRedisRepository macroRedisRepository;
    private final StreamReconnectRedisRepository streamReconnectRedisRepository;
    private final StreamPublisher streamPublisher; // 추가

    // TODO: Item 엔티티에서 경매 데이터 분리 시 다른 서비스 메서드도 리팩토링 필요
    @Transactional
    public StreamRegisterResponse register(Long userId, StreamRegisterRequest request, MultipartFile thumbnail) {
        // 판매자 조회
        Seller seller = sellerRepository.findByUserId(userId)
                .orElseThrow(() -> new GlobalException(SellerErrorCode.SELLER_NOT_FOUND));

        // 방송 저장
        Stream savedStream = streamRepository.save(buildStream(request, seller));

        // 썸네일 등록
        if (thumbnail != null && !thumbnail.isEmpty()) {
            try {
                String url = gcsClient.uploadStreamThumbnail(thumbnail, seller.getId(), savedStream.getId());
                savedStream.updateThumbnail(url);
            } catch (IOException e) {
                throw new GlobalException(StreamErrorCode.THUMBNAIL_UPLOAD_FAILED);
            }
        }

        // 물품 상태 변경 및 경매 생성
        if (request.auctionItems() != null && !request.auctionItems().isEmpty()) {
            request.auctionItems().forEach(auctionItemReq -> {

                // 물품 상태를 라이브 예약 상태로 변경
                Item item = itemRepository.findByIdAndSellerId(auctionItemReq.itemId(), seller.getId())
                        .orElseThrow(() -> new GlobalException(ItemErrorCode.ITEM_NOT_FOUND));

                item.schedule();

                // 경매 엔티티 저장
                createAuctionWithDetail(savedStream, item, auctionItemReq);
            });
        }

        return new StreamRegisterResponse(savedStream.getId());
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

    private void createAuctionWithDetail(Stream stream, Item item, StreamRegisterRequest.AuctionItemRequest request) {
        Auction auction = auctionRepository.save(
                Auction.builder()
                        .auctionType(request.auctionType())
                        .auctionDuration(request.auctionDuration())
                        .auctionStatus(AuctionStatus.READY)
                        .stream(stream)
                        .item(item)
                        .build()
        );

        // 경매 방식에 따라 detail 생성 분기

        switch (request.auctionType()) {
            // 상향식
            case BOTTOM_UP -> {
                validateBottomUpRequest(request);

                BottomUpAuctionDetail detail = BottomUpAuctionDetail.builder()
                        .auction(auction)
                        .startPrice(request.bottomUp().startPrice())
                        .bidUnit(request.bottomUp().bidUnit())
                        .build();

                bottomUpAuctionDetailRepository.save(detail);
            }

            // 유일 최고가
            case UNIQUE_TOP -> {
                validateUniqueTopRequest(request);

                UniqueBidAuctionDetail detail = UniqueBidAuctionDetail.builder()
                        .auction(auction)
                        .minPrice(request.uniqueTop().minPrice())
                        .maxPrice(request.uniqueTop().maxPrice())
                        .build();

                detail.validateSetting();

                uniqueBidAuctionDetailRepository.save(detail);
            }

            default -> throw new IllegalArgumentException("지원하지 않는 경매 방식입니다.");
        }

    }

    private void updateAuctionDetail(Auction auction, StreamRegisterRequest.AuctionItemRequest request) {
        switch (request.auctionType()) {
            case BOTTOM_UP -> {
                validateBottomUpRequest(request);
                auction.getBottomUpAuctionDetail()
                        .updateSchedule(request.bottomUp().startPrice(), request.bottomUp().bidUnit());
            }
            case UNIQUE_TOP -> {
                validateUniqueTopRequest(request);
                UniqueBidAuctionDetail detail = auction.getUniqueBidAuctionDetail();
                detail.updateSchedule(request.uniqueTop().minPrice(), request.uniqueTop().maxPrice());
                detail.validateSetting();
            }
            default -> throw new IllegalArgumentException("지원하지 않는 경매 방식입니다.");
        }
    }

    private void syncStreamAuctionItems(
            Stream stream, Seller seller, List<StreamRegisterRequest.AuctionItemRequest> auctionItems) {
        Set<Long> seenItemIds = new HashSet<>();
        for (StreamRegisterRequest.AuctionItemRequest req : auctionItems) {
            if (!seenItemIds.add(req.itemId())) {
                throw new GlobalException(StreamErrorCode.STREAM_AUCTION_ITEM_DUPLICATE);
            }
        }

        List<Auction> existing = auctionRepository.findByStreamId(stream.getId());
        Map<Long, Auction> byItemId =
                existing.stream().collect(Collectors.toMap(a -> a.getItem().getId(), a -> a));

        Set<Long> requestedItemIds =
                auctionItems.stream().map(StreamRegisterRequest.AuctionItemRequest::itemId).collect(Collectors.toSet());

        for (Auction auction : existing) {
            if (!requestedItemIds.contains(auction.getItem().getId())) {
                if (!auction.isReady()) {
                    throw new GlobalException(StreamErrorCode.STREAM_AUCTION_NOT_MODIFIABLE);
                }
                Item item = auction.getItem();
                auctionRepository.delete(auction);
                item.ready();
            }
        }

        for (StreamRegisterRequest.AuctionItemRequest req : auctionItems) {
            Item item = itemRepository
                    .findByIdAndSellerId(req.itemId(), seller.getId())
                    .orElseThrow(() -> new GlobalException(ItemErrorCode.ITEM_NOT_FOUND));

            Auction existingAuction = byItemId.get(req.itemId());
            if (existingAuction == null) {
                item.schedule();
                createAuctionWithDetail(stream, item, req);
                continue;
            }
            if (!existingAuction.isReady()) {
                throw new GlobalException(StreamErrorCode.STREAM_AUCTION_NOT_MODIFIABLE);
            }
            if (existingAuction.getAuctionType() != req.auctionType()) {
                auctionRepository.delete(existingAuction);
                item.schedule();
                createAuctionWithDetail(stream, item, req);
            } else {
                existingAuction.updateScheduleWhenReady(req.auctionType(), req.auctionDuration());
                updateAuctionDetail(existingAuction, req);
            }
        }
    }

    private void validateBottomUpRequest(StreamRegisterRequest.AuctionItemRequest request) {
        if (request.bottomUp() == null) {
            throw new IllegalArgumentException("상향식 경매 상세 정보가 필요합니다.");
        }
        if (request.uniqueTop() != null) {
            throw new IllegalArgumentException("상향식 경매에는 uniqueTop 상세 정보를 보낼 수 없습니다.");
        }
    }

    private void validateUniqueTopRequest(StreamRegisterRequest.AuctionItemRequest request) {
        if (request.uniqueTop() == null) {
            throw new IllegalArgumentException("유일 최고가 경매 상세 정보가 필요합니다.");
        }
        if (request.bottomUp() != null) {
            throw new IllegalArgumentException("유일 최고가 경매에는 bottomUp 상세 정보를 보낼 수 없습니다.");
        }
    }

    private StreamAuctionItemSummaryResponse buildItemSummaryResponse(Item item, Auction auction) {
        return new StreamAuctionItemSummaryResponse(
                item.getId(),
                item.getName(),
                item.getDescription(),
                item.getTags().stream().map(Tag::getName).toList(),
                java.util.stream.Stream.of(item.getImage1(), item.getImage2(), item.getImage3())
                        .filter(Objects::nonNull)
                        .toList(),
                auction.getAuctionType(),
                auction.getAuctionDuration(),
                auction.getBottomUpAuctionDetail() == null
                        ? null
                        : new StreamAuctionItemSummaryResponse.BottomUpAuctionInfo(
                        auction.getBottomUpAuctionDetail().getStartPrice(),
                        auction.getBottomUpAuctionDetail().getBidUnit()
                ),
                auction.getUniqueBidAuctionDetail() == null
                        ? null
                        : new StreamAuctionItemSummaryResponse.UniqueTopAuctionInfo(
                        auction.getUniqueBidAuctionDetail().getMinPrice(),
                        auction.getUniqueBidAuctionDetail().getMaxPrice()
                ),
                item.getItemCondition(),
                item.getCategory(),
                item.getStatus(),
                item.getCreatedAt());
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

        if (request.auctionItems() != null) {
            if (stream.getStatus() != StreamStatus.SCHEDULED) {
                throw new GlobalException(StreamErrorCode.STREAM_AUCTION_UPDATE_NOT_ALLOWED);
            }
            syncStreamAuctionItems(stream, seller, request.auctionItems());
        }

        if (thumbnail != null && !thumbnail.isEmpty()) {
            if (stream.getThumbnail() != null) {
                gcsClient.deleteImage(stream.getThumbnail());
            }
            try {
                String url = gcsClient.uploadStreamThumbnail(thumbnail, seller.getId(), streamId);
                stream.updateThumbnail(url);
            } catch (IOException e) {
                throw new GlobalException(StreamErrorCode.THUMBNAIL_UPLOAD_FAILED);
            }
        }

        return new StreamRegisterResponse(stream.getId());
    }

    @Transactional
    public void deleteStream(Long userId, Long streamId) {
        Seller seller = sellerRepository.findByUserId(userId)
                .orElseThrow(() -> new GlobalException(SellerErrorCode.SELLER_NOT_FOUND));

        Stream stream = streamRepository.findByIdAndSellerId(streamId, seller.getId())
                .orElseThrow(() -> new GlobalException(StreamErrorCode.STREAM_NOT_FOUND));

        if (stream.getStatus() != StreamStatus.SCHEDULED) {
            throw new GlobalException(StreamErrorCode.STREAM_CANNOT_DELETE);
        }

        if (stream.getThumbnail() != null) {
            gcsClient.deleteImage(stream.getThumbnail());
        }

        auctionRepository.deleteByStreamId(streamId);

        streamRepository.delete(stream);
    }


    @Transactional(readOnly = true)
    public StreamDetailResponse getStream(Long userId, Long streamId) {

        Stream stream = streamRepository.findById(streamId)
                .orElseThrow(() -> new GlobalException(StreamErrorCode.STREAM_NOT_FOUND));

        // auction에서 item + auctionType 함께 매핑
        List<StreamAuctionItemSummaryResponse> items = auctionRepository.findByStreamId(streamId).stream()
                .map(auction -> {
                    Item item = auction.getItem();
                    return buildItemSummaryResponse(item, auction);
                })
                .toList();

        return new StreamDetailResponse(
                stream.getId(),
                stream.getTitle(),
                stream.getCategory(),
                stream.getThumbnail(),
                stream.getScheduledAt(),
                stream.getStartType(),
                stream.getNotice(),
                stream.getStatus() == StreamStatus.LIVE || stream.getStatus() == StreamStatus.PAUSED,
                stream.getCreatedAt(),
                items);
    }

    @Transactional
    public void startStream(Long userId, Long streamId) {
        Seller seller = sellerRepository.findByUserId(userId)
                .orElseThrow(() -> new GlobalException(SellerErrorCode.SELLER_NOT_FOUND));

        Stream stream = streamRepository.findByIdAndSellerId(streamId, seller.getId())
                .orElseThrow(() -> new GlobalException(StreamErrorCode.STREAM_NOT_FOUND));

        stream.start();

        // 팔로워들에게 알림 발송
        followRepository.findBySeller(seller).forEach(follow -> {
            notificationService.sendNotification(
                    follow.getUser().getId(),
                    STREAM_START.name(),
                    STREAM_START.getTitle(),
                    STREAM_START.renderBody(seller.getUser().getNickname()),
                    NotificationRoutingField.stream(stream.getId())
            );
        });
    }

    @Transactional
    public void endStream(Long userId, Long streamId) {
        Seller seller = sellerRepository.findByUserId(userId)
                .orElseThrow(() -> new GlobalException(SellerErrorCode.SELLER_NOT_FOUND));

        Stream stream = streamRepository.findByIdAndSellerId(streamId, seller.getId())
                .orElseThrow(() -> new GlobalException(StreamErrorCode.STREAM_NOT_FOUND));

        stream.end();

        // 해당 방송에서 SCHEDULED 상태인 경매 물품을 다시 READY로 상태 변경
        itemRepository.updateScheduledItemsToReadyByStreamId(streamId, ItemStatus.SCHEDULED, ItemStatus.READY);

        // Redis viewer Set 삭제
        streamViewerService.clearViewers(streamId);

        // 시청자들에게 방송 종료 이벤트 전송
        streamPublisher.broadcast(streamId, StreamEventType.SYSTEM_STREAM_END, null);
    }

    @Transactional(readOnly = true)
    public Page<StreamListItemResponse> getStreamList(StreamListRequest request) {
        Category category = request.category();
        boolean isFollowing = request.type() == StreamViewType.FOLLOWING;

        final User loginUser;
        if (isFollowing) {
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            if (authentication != null && authentication.getName() != null && !authentication.getName().equals("anonymousUser")) {
                Long loginUserId = Long.parseLong(authentication.getName());
                loginUser = userRepository.findById(loginUserId).orElse(null);
            } else {
                loginUser = null;
            }
        } else {
            loginUser = null;
        }

        if (request.sort() == StreamSortType.VIEWER_COUNT) {
            List<Stream> allStreams =
                    switch (request.status()) {
                        case LIVE -> streamRepository.findAllActiveStreams(category);
                        case SCHEDULED -> streamRepository.findAllScheduledStreams(category);
                        case ENDED -> List.of();
                        case PAUSED -> List.of();
                    };

            List<Stream> streams;
            if (isFollowing && loginUser != null) {
                streams = allStreams.stream()
                        .filter(stream -> followRepository.existsByUserAndSeller(loginUser, stream.getSeller()))
                        .toList();
            } else if (isFollowing) {
                return Page.empty(PageRequest.of(request.page(), request.size()));
            } else {
                streams = allStreams;
            }

            List<StreamListItemResponse> sorted =
                    streams.stream()
                            .map(stream -> {
                                Seller sel = stream.getSeller();
                                return new StreamListItemResponse(
                                        stream.getId(),
                                        stream.getTitle(),
                                        stream.getCategory(),
                                        stream.getThumbnail(),
                                        stream.getStatus(),
                                        streamViewerService.getViewerCount(stream.getId()),
                                        (stream.getStatus() == StreamStatus.SCHEDULED) ? stream.getScheduledAt() : null,
                                        stream.getStartedAt(),
                                        new StreamSellerResponse(
                                                sel.getId(),
                                                sel.getUser().getNickname(),
                                                sel.getUser().getProfileImage()));
                            })
                            .sorted(Comparator.comparingLong(StreamListItemResponse::viewerCount).reversed())
                            .toList();

            // 수동 페이지네이션
            int start = request.page() * request.size();
            int end = Math.min(start + request.size(), sorted.size());
            List<StreamListItemResponse> pageContent = sorted.subList(start, end);

            return new PageImpl<>(pageContent, PageRequest.of(request.page(), request.size()), sorted.size());
        }

        if (isFollowing) {
            if (loginUser == null) {
                return Page.empty(PageRequest.of(request.page(), request.size()));
            }

            List<Stream> allStreams =
                    switch (request.status()) {
                        case LIVE -> streamRepository.findAllActiveStreams(category);
                        case SCHEDULED -> streamRepository.findAllScheduledStreams(category);
                        case ENDED -> List.of();
                        case PAUSED -> List.of();
                    };

            List<Stream> filtered = allStreams.stream()
                    .filter(stream -> followRepository.existsByUserAndSeller(loginUser, stream.getSeller()))
                    .sorted(Comparator.comparing(Stream::getCreatedAt).reversed())
                    .toList();

            List<StreamListItemResponse> mapped =
                    filtered.stream()
                            .map(stream -> {
                                Seller sel = stream.getSeller();
                                return new StreamListItemResponse(
                                        stream.getId(),
                                        stream.getTitle(),
                                        stream.getCategory(),
                                        stream.getThumbnail(),
                                        stream.getStatus(),
                                        streamViewerService.getViewerCount(stream.getId()),
                                        (stream.getStatus() == StreamStatus.SCHEDULED) ? stream.getScheduledAt() : null,
                                        stream.getStartedAt(),
                                        new StreamSellerResponse(
                                                sel.getId(),
                                                sel.getUser().getNickname(),
                                                sel.getUser().getProfileImage()));
                            })
                            .toList();

            int start = request.page() * request.size();
            int end = Math.min(start + request.size(), mapped.size());
            List<StreamListItemResponse> pageContent = mapped.subList(start, end);

            return new PageImpl<>(pageContent, PageRequest.of(request.page(), request.size()), mapped.size());

        } else {
            Pageable pageable =
                    PageRequest.of(request.page(), request.size(), Sort.by("createdAt").descending());
            Page<Stream> streams =
                    switch (request.status()) {
                        case LIVE -> streamRepository.findActiveStreams(category, pageable);
                        case SCHEDULED -> streamRepository.findScheduledStreams(category, pageable);
                        case ENDED -> Page.empty(pageable);
                        case PAUSED -> Page.empty(pageable);
                    };

            return streams.map(stream -> {
                Seller sel = stream.getSeller();
                return new StreamListItemResponse(
                        stream.getId(),
                        stream.getTitle(),
                        stream.getCategory(),
                        stream.getThumbnail(),
                        stream.getStatus(),
                        streamViewerService.getViewerCount(stream.getId()),
                        (stream.getStatus() == StreamStatus.SCHEDULED) ? stream.getScheduledAt() : null,
                        stream.getStartedAt(),
                        new StreamSellerResponse(
                                sel.getId(),
                                sel.getUser().getNickname(),
                                sel.getUser().getProfileImage()));
            });
        }
    }

    @Transactional(readOnly = true)
    public ScheduledStreamListResponse getScheduledStreamList(Long userId, int page, int size) {
        Pageable pageable = PageRequest.of(page, size);
        Slice<Stream> slice = streamRepository.findByStatusInAndSellerUserId(
                List.of(StreamStatus.LIVE, StreamStatus.SCHEDULED, StreamStatus.PAUSED),
                userId,
                pageable
        );

        List<ScheduledStreamResponse> streams = slice.getContent()
                .stream()
                .map(ScheduledStreamResponse::from)
                .toList();

        return new ScheduledStreamListResponse(streams, slice.hasNext());
    }


    @Transactional(readOnly = true)
    public List<StreamRecommendResponse> getNewSellerLiveStreams(int withinDays, int limit) {
        LocalDateTime since = LocalDateTime.now().minusDays(withinDays);

        return streamRepository.findLiveStreamsByNewSellers(since)
                .stream()
                .map(stream -> {
                    Seller sel = stream.getSeller();
                    return new StreamRecommendResponse(
                            stream.getId(),
                            stream.getTitle(),
                            stream.getCategory(),
                            stream.getThumbnail(),
                            stream.getStatus(),
                            streamViewerService.getViewerCount(stream.getId()),
                            stream.getStartedAt(),
                            new StreamSellerResponse(
                                    sel.getId(),
                                    sel.getUser().getNickname(),
                                    sel.getUser().getProfileImage())
                    );
                })
                .limit(limit)
                .toList();
    }


    @Transactional
    public StreamEnterResponse enterStream(Long userId, Long streamId) {
        Stream stream = streamRepository.findById(streamId)
                .orElseThrow(() -> new GlobalException(StreamErrorCode.STREAM_NOT_FOUND));

        // 시청자 수 증가 (비회원이면 userId null)
        String identity = streamViewerService.enter(streamId, userId);

        Seller seller = stream.getSeller();

        // 현재 진행 중인 경매의 상위 입찰자 3명
        List<StreamEnterResponse.TopBidder> topBidders = auctionRepository
                .findByStreamId(streamId)
                .stream()
                .filter(auction -> auction.getAuctionStatus() == AuctionStatus.LIVE)
                .findFirst()
                .map(auction -> {
                    List<Bid> bids = auctionBidRepository.findAll(auction.getId());
                    return IntStream.range(0, Math.min(3, bids.size()))
                            .mapToObj(i -> new StreamEnterResponse.TopBidder(
                                    i + 1,
                                    bids.get(i).nickname(),
                                    bids.get(i).amount()
                            ))
                            .toList();
                })
                .orElse(List.of());

        // 토큰 발급
        boolean isHost = stream.getSeller().getUser().getId().equals(userId);
        String roomName = String.valueOf(streamId);

        AccessToken accessToken = new AccessToken(liveKitProperties.apiKey(), liveKitProperties.apiSecret());
        accessToken.setName(identity);
        accessToken.setIdentity(identity);
        accessToken.addGrants(
                new RoomJoin(true),
                new RoomName(roomName),
                new CanPublish(isHost),
                new CanSubscribe(true));

        // 팔로우 여부 확인
        boolean isFollowing = userId != null && userRepository.findById(userId)
                .map(user -> followRepository.existsByUserAndSeller(user, seller))
                .orElse(false);

        Long remainingSeconds = null;
        if (stream.getStatus() == StreamStatus.PAUSED) {
            long ttl = streamReconnectRedisRepository.getRemainingSeconds(streamId);
            if (ttl >= 0) {
                remainingSeconds = ttl;
            }
        }

        return new StreamEnterResponse(
                stream.getId(),
                stream.getTitle(),
                stream.getCategory(),
                stream.getStatus(),
                remainingSeconds,
                stream.getNotice(),
                new StreamEnterResponse.SellerInfo(
                        seller.getId(),
                        seller.getUser().getNickname(),
                        seller.getUser().getProfileImage()
                ),
                topBidders,
                accessToken.toJwt(),
                identity,
                isFollowing,
                isHost
        );
    }

    @Transactional(readOnly = true)
    public StreamItemsResponse getStreamItems(Long streamId) {
        streamRepository.findById(streamId)
                .orElseThrow(() -> new GlobalException(StreamErrorCode.STREAM_NOT_FOUND));

        List<StreamItemsResponse.StreamItemResponse> items = auctionRepository
                .findByStreamId(streamId)
                .stream()
                .map(StreamItemsResponse.StreamItemResponse::from)
                .toList();

        return new StreamItemsResponse(items);
    }

    @Transactional
    public void saveMacros(Long userId, Long streamId, MacroSaveRequest request) {
        Seller seller = sellerRepository.findByUserId(userId)
                .orElseThrow(() -> new GlobalException(SellerErrorCode.SELLER_NOT_FOUND));
        streamRepository.findByIdAndSellerId(streamId, seller.getId())
                .orElseThrow(() -> new GlobalException(StreamErrorCode.STREAM_NOT_FOUND));
        Map<String, String> macros = request.macros().stream()
                .collect(Collectors.toMap(
                        MacroSaveRequest.MacroItem::questionType,
                        MacroSaveRequest.MacroItem::answer
                ));
        macroRedisRepository.saveAll(streamId, macros);
    }

    @Transactional(readOnly = true)
    public MacroResponse getMacros(Long streamId, Category category) {
        streamRepository.findById(streamId)
                .orElseThrow(() -> new GlobalException(StreamErrorCode.STREAM_NOT_FOUND));
        Map<Object, Object> entries = macroRedisRepository.findAll(streamId);
        List<MacroResponse.MacroItem> macros = entries.entrySet().stream()
                .map(e -> new MacroResponse.MacroItem(
                        e.getKey().toString(),
                        e.getValue().toString()
                ))
                .toList();
        return new MacroResponse(streamId, category, macros);
    }
}