package com.ssafy.be.domain.notification.dto.response;

public record NotificationSettingResponse(
        Boolean notificationSetting
) {
    public static NotificationSettingResponse from(Boolean notificationSetting) {
        return new NotificationSettingResponse(notificationSetting);
    }
}