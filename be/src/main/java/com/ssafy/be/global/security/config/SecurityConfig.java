package com.ssafy.be.global.security.config;

import static com.google.common.net.HttpHeaders.SET_COOKIE;
import static org.springframework.http.HttpHeaders.AUTHORIZATION;
import static org.springframework.web.bind.annotation.RequestMethod.*;

import com.ssafy.be.global.security.filter.JwtAuthenticationFilter;
import com.ssafy.be.global.security.handler.CustomAccessDeniedHandler;
import com.ssafy.be.global.security.handler.CustomAuthenticationEntryPoint;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

@Configuration
@EnableWebSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtAuthenticationFilter;
    private final CustomAuthenticationEntryPoint authenticationEntryPoint;
    private final CustomAccessDeniedHandler accessDeniedHandler;

    @Value("${was.cors-allow-origins}")
    private List<String> corsOrigins;

    // 비밀번호 암호화 빈 등록
    // - BCrypt 해시 알고리즘 사용
    // - Service에서 @Autowired로 주입받아 사용
    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        configuration.setAllowedOrigins(corsOrigins);
        configuration.setAllowedMethods(
                List.of(
                        GET.name(),
                        POST.name(),
                        PUT.name(),
                        PATCH.name(),
                        DELETE.name(),
                        OPTIONS.name()));
        configuration.setAllowedHeaders(List.of("*"));
        configuration.setMaxAge(3600L); // Cache preflight
        configuration.setExposedHeaders(List.of(SET_COOKIE, AUTHORIZATION));
        configuration.setAllowCredentials(true);
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http.cors(cors -> cors.configurationSource(corsConfigurationSource()))
                .csrf(csrf -> csrf.disable())
                .httpBasic(basic -> basic.disable())
                .formLogin(form -> form.disable())
                .sessionManagement(
                        session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))

                // URL별 인증 규칙
                .authorizeHttpRequests(
                        auth ->
                                auth.requestMatchers(
                                                "/api/v1/auth/**",
                                                "/api/v1/streams/**",
                                                "/swagger-ui/**",
                                                "/swagger-ui.html",
                                                "/v3/api-docs",
                                                "/v3/api-docs/**",
                                                "/error",
                                                "/api/v1/wallet/charges/webhook",
                                                "/api/v1/streams/webhook")
                                        .permitAll()
                                        .anyRequest()
                                        .authenticated())

                // 401/403 에러 핸들러 등록
                .exceptionHandling(
                        ex ->
                                ex.authenticationEntryPoint(authenticationEntryPoint)
                                        .accessDeniedHandler(accessDeniedHandler))

                // 폼 로그인 앞에 처리
                .addFilterBefore(
                        jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }
}
