package com.millys.backend.savings;

import com.millys.backend.user.User;
import com.millys.backend.user.UserRepository;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.Set;

@RestController
@RequestMapping("/api/savings")
@RequiredArgsConstructor
public class SavingsController {

    // Mirrors SAVINGS_DESTINATIONS in frontend/app/dashboard/lib/savings.tsx — kept as a
    // fixed list on both sides rather than a database table, since these are just two
    // known destinations today (see project decision: not worth a table for this).
    private static final Set<String> KNOWN_DESTINATIONS = Set.of("trade-republic", "cuenta-conjunta");

    private final SavingsRepository savingsRepository;
    private final UserRepository    userRepository;

    private User resolveOwner(String requestedName, User fallback) {
        if (requestedName == null || requestedName.isBlank()) return fallback;
        return userRepository.findByNombre(requestedName)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Usuario desconocido: " + requestedName));
    }

    private void applyRequest(SavingsEntry s, SavingsRequest req, User fallbackOwner) {
        s.setUser(resolveOwner(req.userName(), fallbackOwner));
        if (!KNOWN_DESTINATIONS.contains(req.destinationCode())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Destino desconocido: " + req.destinationCode());
        }
        s.setDestinationCode(req.destinationCode());
        s.setDescription(req.description() != null ? req.description() : "");
        s.setAmount(req.amount());
        s.setDate(LocalDate.parse(req.date()));
    }

    private SavingsResponse toResponse(SavingsEntry s) {
        return new SavingsResponse(
                s.getId(),
                s.getDestinationCode(),
                s.getDescription(),
                s.getAmount(),
                s.getDate().toString(),
                s.getUser().getNombre()
        );
    }

    @GetMapping
    public List<SavingsResponse> getAll() {
        return savingsRepository.findAllByOrderByDateDesc()
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @PostMapping
    public ResponseEntity<SavingsResponse> create(Authentication auth, @Valid @RequestBody SavingsRequest req) {
        User caller     = (User) auth.getPrincipal();
        SavingsEntry s  = new SavingsEntry();
        applyRequest(s, req, caller);
        return ResponseEntity.status(HttpStatus.CREATED).body(toResponse(savingsRepository.save(s)));
    }

    @PutMapping("/{id}")
    @Transactional
    public ResponseEntity<SavingsResponse> update(@PathVariable Long id, @Valid @RequestBody SavingsRequest req) {
        return savingsRepository.findByIdWithUser(id)
                .map(s -> {
                    applyRequest(s, req, s.getUser());
                    return ResponseEntity.ok(toResponse(savingsRepository.save(s)));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        Optional<SavingsEntry> existing = savingsRepository.findById(id);
        if (existing.isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        savingsRepository.delete(existing.get());
        return ResponseEntity.noContent().build();
    }
}
