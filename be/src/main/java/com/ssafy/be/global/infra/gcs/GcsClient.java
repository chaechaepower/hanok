package com.ssafy.be.global.infra.gcs;

import com.google.cloud.storage.BlobId;
import com.google.cloud.storage.BlobInfo;
import com.google.cloud.storage.Storage;
import java.io.IOException;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

@Service
@RequiredArgsConstructor
public class GcsClient {

    @Value("${spring.cloud.gcp.storage.bucket}")
    private String bucketName;

    private final Storage storage;

    public static final String DEFAULT_PROFILE_IMAGE_PATH = "profiles/default/default-profile.png";

    // 기본 프로필 이미지 public URL 반환
    public String getDefaultProfileImageUrl() {
        return buildPublicUrl(DEFAULT_PROFILE_IMAGE_PATH);
    }

    // 프로필 이미지 업로드
    public String uploadProfileImage(MultipartFile file, Long userId) throws IOException {
        String fileName = String.format("profiles/%d/%s",
                userId, UUID.randomUUID() + getExtension(file.getOriginalFilename()));
        return upload(file, fileName);
    }

    // 물품 이미지 업로드 (경로 수정: profiles → items)
    public String uploadItemImage(MultipartFile file, Long sellerId, Long itemId) throws IOException {
        String fileName = String.format("items/%d/%d/%s",
                sellerId, itemId, UUID.randomUUID() + getExtension(file.getOriginalFilename()));
        return upload(file, fileName);
    }

    // 스트림 썸네일 업로드 (경로 수정: profiles → streams)
    public String uploadStreamThumbnail(MultipartFile file, Long sellerId, Long streamId) throws IOException {
        String fileName = String.format("streams/%d/%d/%s",
                sellerId, streamId, UUID.randomUUID() + getExtension(file.getOriginalFilename()));
        return upload(file, fileName);
    }

    // 이미지 삭제 (default 이미지는 삭제 안 함)
    public void deleteImage(String imageUrl) {
        if (imageUrl == null || imageUrl.isBlank()) return;
        if (imageUrl.contains(DEFAULT_PROFILE_IMAGE_PATH)) return;

        String fileName = imageUrl.replace(buildPublicUrl(""), "");
        storage.delete(BlobId.of(bucketName, fileName));
    }

    private String upload(MultipartFile file, String fileName) throws IOException {
        BlobInfo blobInfo = BlobInfo.newBuilder(bucketName, fileName)
                .setContentType(file.getContentType())
                .build();
        storage.create(blobInfo, file.getBytes());
        return buildPublicUrl(fileName);
    }

    private String buildPublicUrl(String fileName) {
        return "https://storage.googleapis.com/" + bucketName + "/" + fileName;
    }

    private String getExtension(String originalFilename) {
        if (originalFilename == null || !originalFilename.contains(".")) return ".jpg";
        return originalFilename.substring(originalFilename.lastIndexOf("."));
    }
}