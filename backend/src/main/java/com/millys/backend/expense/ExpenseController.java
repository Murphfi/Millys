package com.millys.backend.expense;

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
@RequestMapping("/api/expenses")
@RequiredArgsConstructor
public class ExpenseController {

    private final ExpenseRepository expenseRepository;
    private final UserRepository    userRepository;

    private User resolveOwner(String requestedName, User fallback) {
        if (requestedName == null || requestedName.isBlank()) return fallback;
        return userRepository.findByNombre(requestedName)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Usuario desconocido: " + requestedName));
    }

    private void applyRequest(Expense e, ExpenseRequest req, User fallbackOwner) {
        e.setUser(resolveOwner(req.userName(), fallbackOwner));
        e.setCategoryCode(req.categoryCode());
        e.setDescription(req.description() != null ? req.description() : "");
        e.setAmount(req.amount());
        e.setDate(LocalDate.parse(req.date()));
    }

    private ExpenseResponse toResponse(Expense e) {
        return new ExpenseResponse(
                e.getId(),
                e.getCategoryCode(),
                e.getDescription(),
                e.getAmount(),
                e.getDate().toString(),
                e.getUser().getNombre()
        );
    }

    @GetMapping
    public List<ExpenseResponse> getAll() {
        return expenseRepository.findAllByOrderByDateDesc()
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @PostMapping
    public ResponseEntity<ExpenseResponse> create(Authentication auth, @Valid @RequestBody ExpenseRequest req) {
        User caller = (User) auth.getPrincipal();
        Expense e   = new Expense();
        applyRequest(e, req, caller);
        return ResponseEntity.status(HttpStatus.CREATED).body(toResponse(expenseRepository.save(e)));
    }

    @PutMapping("/{id}")
    @Transactional
    public ResponseEntity<ExpenseResponse> update(@PathVariable Long id, @Valid @RequestBody ExpenseRequest req) {
        return expenseRepository.findByIdWithUser(id)
                .map(e -> {
                    applyRequest(e, req, e.getUser());
                    return ResponseEntity.ok(toResponse(expenseRepository.save(e)));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        Optional<Expense> existing = expenseRepository.findById(id);
        if (existing.isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        expenseRepository.delete(existing.get());
        return ResponseEntity.noContent().build();
    }
}
