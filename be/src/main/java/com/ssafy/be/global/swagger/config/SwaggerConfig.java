package com.ssafy.be.global.swagger.config;

import io.swagger.v3.oas.models.Components;
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.security.SecurityRequirement;
import io.swagger.v3.oas.models.security.SecurityScheme;
import org.springdoc.core.customizers.OpenApiCustomizer;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class SwaggerConfig {

    @Bean
    public OpenAPI openAPI() {
        // JWT 인증 스키마
        SecurityScheme securityScheme = new SecurityScheme()
                .type(SecurityScheme.Type.HTTP)
                .scheme("bearer")
                .bearerFormat("JWT")
                .in(SecurityScheme.In.HEADER)
                .name("Authorization");

        // 모든 API에 JWT 인증 버튼 추가
        SecurityRequirement securityRequirement = new SecurityRequirement()
                .addList("BearerAuth");

        return new OpenAPI()
                .info(new Info()
                        .title("한옥 API 명세")
                        .version("v1.0")
                        .description("백엔드 API 명세서"))
                .components(new Components()
                        .addSecuritySchemes("BearerAuth", securityScheme))
                .addSecurityItem(securityRequirement);
    }

    @Bean
    public OpenApiCustomizer globalOpenApiCustomizer() {
        return openApi -> openApi.getPaths().values()
                .forEach(pathItem -> pathItem.readOperations()
                        .forEach(operation -> {
                            operation.getResponses()
                                    .addApiResponse("400", new io.swagger.v3.oas.models.responses.ApiResponse()
                                            .description("Bad Request - 잘못된 파라미터"));
                            operation.getResponses()
                                    .addApiResponse("401", new io.swagger.v3.oas.models.responses.ApiResponse()
                                            .description("Unauthorized - 인증 필요"));
                            operation.getResponses()
                                    .addApiResponse("500", new io.swagger.v3.oas.models.responses.ApiResponse()
                                            .description("Internal Server Error"));
                        }));
    }
}
