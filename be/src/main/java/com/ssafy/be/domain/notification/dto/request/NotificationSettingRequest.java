package com.ssafy.be.domain.notification.dto.request;

import jakarta.validation.constraints.NotNull;

public record NotificationSettingRequest(
        @NotNull Boolean notificationSetting
) {}