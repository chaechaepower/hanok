package com.ssafy.be.global.infra.storage.gcs;

import com.google.cloud.storage.BlobId;
import com.google.cloud.storage.BlobInfo;
import com.google.cloud.storage.Storage;
import java.io.IOException;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
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

    /** 바이트 배열 스트림 썸네일 업로드 */
    public String uploadStreamThumbnailBytes(byte[] data, String contentType, Long sellerId, Long streamId) {
        String fileName = String.format(
                "streams/%d/%d/%s%s", sellerId, streamId, UUID.randomUUID(), extensionFromContentType(contentType));
        return uploadBytes(data, contentType, fileName);
    }

    // 이미지 삭제 (default 이미지는 삭제 안 함)
    public void deleteImage(String imageUrl) {
        if (imageUrl == null || imageUrl.isBlank()) return;
        if (imageUrl.contains(DEFAULT_PROFILE_IMAGE_PATH)) return;

        String fileName = imageUrl.replace(buildPublicUrl(""), "");
        storage.delete(BlobId.of(bucketName, fileName));
    }

     String upload(MultipartFile file, String fileName) throws IOException {
        return uploadBytes(file.getBytes(), file.getContentType(), fileName);
    }

    public String upload(byte[] data, String fileName) {
        BlobInfo blobInfo = BlobInfo.newBuilder(bucketName, fileName).build();
        storage.create(blobInfo, data);
        return buildPublicUrl(fileName);
    }

    private String uploadBytes(byte[] data, String contentType, String fileName) {
        String resolvedType =
                StringUtils.hasText(contentType) ? contentType : MediaType.APPLICATION_OCTET_STREAM_VALUE;

        BlobInfo blobInfo =
                BlobInfo.newBuilder(bucketName, fileName).setContentType(resolvedType).build();

        storage.create(blobInfo, data);
        return buildPublicUrl(fileName);
    }

    private String buildPublicUrl(String fileName) {
        return "https://storage.googleapis.com/" + bucketName + "/" + fileName;
    }

    private String getExtension(String originalFilename) {
        if (originalFilename == null || !originalFilename.contains(".")) return ".jpg";
        return originalFilename.substring(originalFilename.lastIndexOf("."));
    }

    private static String extensionFromContentType(String contentType) {
        if (!StringUtils.hasText(contentType)) {
            return ".png";
        }
        return switch (contentType.toLowerCase()) {
            case MediaType.IMAGE_PNG_VALUE -> ".png";
            case "image/jpg", MediaType.IMAGE_JPEG_VALUE -> ".jpg";
            case "image/webp" -> ".webp";
            case MediaType.IMAGE_GIF_VALUE -> ".gif";
            default -> ".png";
        };
    }
}