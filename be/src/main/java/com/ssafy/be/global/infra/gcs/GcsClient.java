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

    // 프로필 이미지 업로드
    public String uploadProfileImage(MultipartFile file, Long userId) throws IOException {
        String uniqueId = UUID.randomUUID() + getExtension(file.getOriginalFilename());
        String fileName = String.format("profiles/%d/%s", userId, uniqueId);

        BlobInfo blobInfo =
                BlobInfo.newBuilder(bucketName, fileName)
                        .setContentType(file.getContentType())
                        .build();

        storage.create(blobInfo, file.getBytes());

        return buildPublicUrl(fileName);
    }

    // 프로필 이미지 삭제
    public void deleteImage(String imageUrl) {
        if (imageUrl == null || imageUrl.isBlank()) return;

        String fileName = imageUrl.replace(buildPublicUrl(""), "");
        storage.delete(BlobId.of(bucketName, fileName));
    }

    // GCS 공개 URL 생성
    private String buildPublicUrl(String fileName) {
        return "https://storage.googleapis.com/" + bucketName + "/" + fileName;
    }

    // 파일 확장자 추출
    private String getExtension(String originalFilename) {
        if (originalFilename == null || !originalFilename.contains(".")) return ".jpg";
        return originalFilename.substring(originalFilename.lastIndexOf("."));
    }

    // 물품 이미지 업로드
    public String uploadItemImage(MultipartFile file, Long sellerId, Long itemId) throws IOException {
        String uniqueId = UUID.randomUUID() + getExtension(file.getOriginalFilename());
        String fileName = String.format("profiles/%d/%d/%s", sellerId, itemId , uniqueId);

        BlobInfo blobInfo = BlobInfo.newBuilder(bucketName, fileName)
                .setContentType(file.getContentType())
                .build();

        storage.create(blobInfo, file.getBytes());
        return buildPublicUrl(fileName);
    }


    // 스트림 썸네일 업로드
    public String uploadStreamThumbnail(MultipartFile file, Long sellerId, Long streamId) throws IOException {
        String uniqueId = UUID.randomUUID() + getExtension(file.getOriginalFilename());
        String fileName = String.format("profiles/%d/%d/%s", sellerId, streamId , uniqueId);

        BlobInfo blobInfo = BlobInfo.newBuilder(bucketName, fileName)
                .setContentType(file.getContentType())
                .build();

        storage.create(blobInfo, file.getBytes());
        return buildPublicUrl(fileName);
    }

}