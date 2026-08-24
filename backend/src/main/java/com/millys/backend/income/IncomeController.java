package com.millys.backend.income;

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

@RestController
@RequestMapping("/api/incomes")
@RequiredArgsConstructor
public class IncomeController {

    private final IncomeRepository incomeRepository;
    private final UserRepository   userRepository;

    private User resolveOwner(String requestedName, User fallback) {
        if (requestedName == null || requestedName.isBlank()) return fallback;
        return userRepository.findByNombre(requestedName)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Usuario desconocido: " + requestedName));
    }

    private void applyRequest(Income i, IncomeRequest req, User fallbackOwner) {
        i.setUser(resolveOwner(req.userName(), fallbackOwner));
        i.setDescription(req.description() != null ? req.description() : "");
        i.setAmount(req.amount());
        i.setDate(LocalDate.parse(req.date()));
    }

    private IncomeResponse toResponse(Income i) {
        return new IncomeResponse(
                i.getId(),
                i.getDescription(),
                i.getAmount(),
                i.getDate().toString(),
                i.getUser().getNombre()
        );
    }

    @GetMapping
    public List<IncomeResponse> getAll() {
        return incomeRepository.findAllByOrderByDateDesc()
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @PostMapping
    public ResponseEntity<IncomeResponse> create(Authentication auth, @Valid @RequestBody IncomeRequest req) {
        User caller = (User) auth.getPrincipal();
        Income i    = new Income();
        applyRequest(i, req, caller);
        return ResponseEntity.status(HttpStatus.CREATED).body(toResponse(incomeRepository.save(i)));
    }

    @PutMapping("/{id}")
    @Transactional
    public ResponseEntity<IncomeResponse> update(@PathVariable Long id, @Valid @RequestBody IncomeRequest req) {
        return incomeRepository.findByIdWithUser(id)
                .map(i -> {
                    applyRequest(i, req, i.getUser());
                    return ResponseEntity.ok(toResponse(incomeRepository.save(i)));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        Optional<Income> existing = incomeRepository.findById(id);
        if (existing.isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        incomeRepository.delete(existing.get());
        return ResponseEntity.noContent().build();
    }
}
