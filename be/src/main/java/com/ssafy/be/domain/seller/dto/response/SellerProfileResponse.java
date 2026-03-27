package com.ssafy.be.domain.seller.dto.response;

import com.ssafy.be.domain.stream.dto.response.ScheduledStreamResponse;
import java.util.List;

public record SellerProfileResponse(
        Long sellerId,
        String shopName,
        String intro,
        String profileImage,
        String instagramUrl,
        String youtubeUrl,
        String tiktokUrl,
        SellerStatsResponse stats,
        List<RecentSaleResponse> recentSales,
        List<ScheduledStreamResponse> posts
) {}