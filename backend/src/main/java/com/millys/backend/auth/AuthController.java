package com.millys.backend.auth;

import com.millys.backend.user.UserRepository;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final LoginRateLimiter rateLimiter;

    @PostMapping("/login")
    public ResponseEntity<?> login(HttpServletRequest httpRequest, @RequestBody LoginRequest request) {
        String ip = httpRequest.getRemoteAddr();

        if (rateLimiter.isBlocked(ip)) {
            return ResponseEntity.status(HttpStatus.TOO_MANY_REQUESTS)
                    .body(Map.of("error", "Demasiados intentos. Inténtalo de nuevo en unos minutos."));
        }

        return userRepository.findByNombre(request.username())
                .filter(user -> passwordEncoder.matches(request.password(), user.getPasswordHash()))
                .map(user -> {
                    rateLimiter.recordSuccess(ip);
                    return ResponseEntity.ok((Object) new LoginResponse(jwtService.generateToken(user.getNombre())));
                })
                .orElseGet(() -> {
                    rateLimiter.recordFailure(ip);
                    return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                            .body(Map.of("error", "Usuario o contraseña incorrectos"));
                });
    }
}
