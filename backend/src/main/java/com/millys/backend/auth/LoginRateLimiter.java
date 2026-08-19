package com.millys.backend.auth;

import org.springframework.stereotype.Component;

import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicInteger;

/**
 * In-memory per-IP lockout for /api/auth/login. Single-instance-appropriate —
 * no shared store needed at this app's scale, and state resets harmlessly on restart.
 */
@Component
public class LoginRateLimiter {

    private static final int MAX_ATTEMPTS = 5;
    private static final long WINDOW_MILLIS = 15 * 60 * 1000;

    private static final class Attempt {
        final AtomicInteger count = new AtomicInteger(1);
        volatile long windowStart = System.currentTimeMillis();
    }

    private final ConcurrentHashMap<String, Attempt> attempts = new ConcurrentHashMap<>();

    public boolean isBlocked(String key) {
        Attempt a = attempts.get(key);
        if (a == null) return false;
        if (System.currentTimeMillis() - a.windowStart > WINDOW_MILLIS) {
            attempts.remove(key);
            return false;
        }
        return a.count.get() >= MAX_ATTEMPTS;
    }

    public void recordFailure(String key) {
        attempts.compute(key, (k, existing) -> {
            long now = System.currentTimeMillis();
            if (existing == null || now - existing.windowStart > WINDOW_MILLIS) {
                return new Attempt();
            }
            existing.count.incrementAndGet();
            return existing;
        });
    }

    public void recordSuccess(String key) {
        attempts.remove(key);
    }
}
