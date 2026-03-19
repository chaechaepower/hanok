package com.ssafy.be.domain.stream.service;

import com.ssafy.be.domain.auction.entity.Auction;
import com.ssafy.be.domain.auction.entity.AuctionStatus;
import com.ssafy.be.domain.auction.model.Bid;
import com.ssafy.be.domain.auction.repository.AuctionBidRepository;
import com.ssafy.be.domain.auction.repository.AuctionRepository;
import com.ssafy.be.domain.follow.repository.FollowRepository;
import com.ssafy.be.domain.item.dto.response.ItemSummaryResponse;
import com.ssafy.be.domain.item.entity.Category;
import com.ssafy.be.domain.item.entity.Item;
import com.ssafy.be.domain.item.entity.Tag;
import com.ssafy.be.domain.item.exception.ItemErrorCode;
import com.ssafy.be.domain.item.repository.ItemRepository;
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
import com.ssafy.be.domain.stream.repository.StreamRepository;
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
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.stream.Collectors;
import java.util.stream.IntStream;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

@Service
@RequiredArgsConstructor
public class StreamService {

    private final StreamRepository streamRepository;
    private final SellerRepository sellerRepository;
    private final GcsClient gcsClient;
    private final LiveKitProperties liveKitProperties;
    private final StreamViewerService streamViewerService;
    private final AuctionBidRepository auctionBidRepository;
    private final AuctionRepository auctionRepository;
    private final ItemRepository itemRepository;
    private final FollowRepository followRepository;
    private final UserRepository userRepository;
    private final MacroRedisRepository macroRedisRepository;
    private final StreamPublisher streamPublisher; // 추가

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

                        item.schedule();

                        Auction auction = auctionRepository.save(
                                Auction.builder()
                                        .auctionStatus(AuctionStatus.READY)
                                        .stream(saved)
                                        .item(item)
                                        .build());
                        return new ItemSummaryResponse(
                                item.getId(),
                                item.getName(),
                                item.getDescription(),
                                item.getTags().stream().map(Tag::getName).toList(),
                                java.util.stream.Stream.of(item.getImage1(), item.getImage2(), item.getImage3())
                                        .filter(Objects::nonNull)
                                        .toList(),
                                item.getStartPrice(),
                                item.getBidUnit(),
                                item.getAuctionDuration(),
                                item.getItemCondition(),
                                item.getCategory(),
                                auction.getItem().getAuctionType(),
                                item.getStatus(),
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
                gcsClient.deleteImage(stream.getThumbnail());
            }
            try {
                String url = gcsClient.uploadStreamThumbnail(thumbnail, seller.getId(), streamId);
                stream.updateThumbnail(url);
            } catch (IOException e) {
                throw new GlobalException(StreamErrorCode.THUMBNAIL_UPLOAD_FAILED);
            }
        }

        // auction에서 item + auctionType 함께 매핑
        List<ItemSummaryResponse> items = auctionRepository.findByStreamId(streamId).stream()
                .map(auction -> {
                    Item item = auction.getItem();
                    return new ItemSummaryResponse(
                            item.getId(),
                            item.getName(),
                            item.getDescription(),
                            item.getTags().stream().map(Tag::getName).toList(),
                            java.util.stream.Stream.of(item.getImage1(), item.getImage2(), item.getImage3())
                                    .filter(Objects::nonNull)
                                    .toList(),
                            item.getStartPrice(),
                            item.getBidUnit(),
                            item.getAuctionDuration(),
                            item.getItemCondition(),
                            item.getCategory(),
                            auction.getItem().getAuctionType(),
                            item.getStatus(),
                            item.getCreatedAt());
                })
                .toList();

        return new StreamRegisterResponse(stream.getId(), stream.getTitle(), stream.getStartType(), stream.getThumbnail(), items);
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

        streamRepository.delete(stream);
    }


    @Transactional(readOnly = true)
    public StreamDetailResponse getStream(Long userId, Long streamId) {

        Stream stream = streamRepository.findById(streamId)
                .orElseThrow(() -> new GlobalException(StreamErrorCode.STREAM_NOT_FOUND));

        // auction에서 item + auctionType 함께 매핑
        List<ItemSummaryResponse> items = auctionRepository.findByStreamId(streamId).stream()
                .map(auction -> {
                    Item item = auction.getItem();
                    return new ItemSummaryResponse(
                            item.getId(),
                            item.getName(),
                            item.getDescription(),
                            item.getTags().stream().map(Tag::getName).toList(),
                            java.util.stream.Stream.of(item.getImage1(), item.getImage2(), item.getImage3())
                                    .filter(Objects::nonNull)
                                    .toList(),
                            item.getStartPrice(),
                            item.getBidUnit(),
                            item.getAuctionDuration(),
                            item.getItemCondition(),
                            item.getCategory(),
                            auction.getItem().getAuctionType(),
                            item.getStatus(),
                            item.getCreatedAt());
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
                stream.getStatus() == StreamStatus.LIVE,
                stream.getCreatedAt(),
                items);
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

        // Redis viewer Set 삭제
        streamViewerService.clearViewers(streamId);

        // 시청자들에게 방송 종료 이벤트 전송
        streamPublisher.broadcast(streamId, StreamEventType.SYSTEM_STREAM_END, null);
    }

    @Transactional(readOnly = true)
    public Page<StreamListItemResponse> getStreamList(StreamListRequest request) {
        Category category = request.category();
        boolean isFollowing = request.type() == StreamViewType.FOLLOWING;

        // FOLLOWING 타입일 때만 로그인 사용자로부터 userId를 추출해서 팔로잉한 seller의 stream만 반환한다.
        // API 시그니처 변경 없이 SecurityContext에서 가져온다.
        User loginUser = null;
        if (isFollowing) {
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            if (authentication != null && authentication.getName() != null && !authentication.getName().equals("anonymousUser")) {
                Long loginUserId = Long.parseLong(authentication.getName());
                loginUser = userRepository.findById(loginUserId).orElse(null);
            }
        }

        if (request.sort() == StreamSortType.VIEWER_COUNT) {
            // 전체 가져와서 메모리 정렬
            List<Stream> streams =
                    switch (request.status()) {
                        case LIVE -> streamRepository.findAllLiveStreams(category);
                        case SCHEDULED -> streamRepository.findAllScheduledStreams(category);
                        case ENDED -> List.of();
                        case PAUSED -> List.of();
                    };

            if (isFollowing && loginUser != null) {
                streams = streams.stream()
                        .filter(stream -> followRepository.existsByUserAndSeller(loginUser, stream.getSeller()))
                        .toList();
            } else if (isFollowing) {
                return Page.empty(PageRequest.of(request.page(), request.size()));
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

        if (isFollowing) {
            if (loginUser == null) {
                return Page.empty(PageRequest.of(request.page(), request.size()));
            }

            // FOLLOWING + LATEST 정렬은 팔로잉 조건이 들어가므로 메모리에서 필터/정렬 후 수동 페이지네이션으로 처리한다.
            List<Stream> streams =
                    switch (request.status()) {
                        case LIVE -> streamRepository.findAllLiveStreams(category);
                        case SCHEDULED -> streamRepository.findAllScheduledStreams(category);
                        case ENDED -> List.of();
                        case PAUSED -> List.of();
                    };

            streams = streams.stream()
                    .filter(stream -> followRepository.existsByUserAndSeller(loginUser, stream.getSeller()))
                    .sorted(Comparator.comparing(Stream::getCreatedAt).reversed())
                    .toList();

            List<StreamListItemResponse> mapped =
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
                            .toList();

            int start = request.page() * request.size();
            int end = Math.min(start + request.size(), mapped.size());
            List<StreamListItemResponse> pageContent = mapped.subList(start, end);

            return new PageImpl<>(
                    pageContent,
                    PageRequest.of(request.page(), request.size()),
                    mapped.size());
        } else {
            Pageable pageable =
                    PageRequest.of(request.page(), request.size(), Sort.by("createdAt").descending());
            Page<Stream> streams =
                    switch (request.status()) {
                        case LIVE -> streamRepository.findLiveStreams(category, pageable);
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
                List.of(StreamStatus.LIVE, StreamStatus.SCHEDULED),
                userId,
                pageable
        );

        List<ScheduledStreamResponse> streams = slice.getContent()
                .stream()
                .map(ScheduledStreamResponse::from)
                .toList();

        return new ScheduledStreamListResponse(streams, slice.hasNext());
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

        return new StreamEnterResponse(
                stream.getId(),
                stream.getTitle(),
                stream.getCategory(),
                stream.getStatus(),
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