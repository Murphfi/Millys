package com.millys.backend.expense;

import com.millys.backend.auth.JwtService;
import com.millys.backend.user.User;
import com.millys.backend.user.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/expenses")
@RequiredArgsConstructor
public class ExpenseController {

    private final ExpenseRepository expenseRepository;
    private final UserRepository    userRepository;
    private final JwtService        jwtService;

    private User authenticate(String authHeader) {
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED);
        }
        String username = jwtService.extractUsername(authHeader.substring(7));
        return userRepository.findByNombre(username)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED));
    }

    private User resolveOwner(String requestedName, User fallback) {
        if (requestedName == null || requestedName.isBlank()) return fallback;
        return userRepository.findByNombre(requestedName).orElse(fallback);
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
    public List<ExpenseResponse> getAll(@RequestHeader(value = "Authorization", required = false) String auth) {
        User user = authenticate(auth);
        return expenseRepository.findByUserOrderByDateDesc(user)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @PostMapping
    public ResponseEntity<ExpenseResponse> create(
            @RequestHeader(value = "Authorization", required = false) String auth,
            @RequestBody ExpenseRequest req
    ) {
        User user  = authenticate(auth);
        User owner = resolveOwner(req.userName(), user);
        Expense e  = new Expense();
        e.setUser(owner);
        e.setCategoryCode(req.categoryCode());
        e.setDescription(req.description() != null ? req.description() : "");
        e.setAmount(req.amount());
        e.setDate(LocalDate.parse(req.date()));
        return ResponseEntity.status(HttpStatus.CREATED).body(toResponse(expenseRepository.save(e)));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ExpenseResponse> update(
            @RequestHeader(value = "Authorization", required = false) String auth,
            @PathVariable Long id,
            @RequestBody ExpenseRequest req
    ) {
        User user = authenticate(auth);
        return expenseRepository.findById(id)
                .filter(e -> e.getUser().getId().equals(user.getId()))
                .map(e -> {
                    e.setUser(resolveOwner(req.userName(), e.getUser()));
                    e.setCategoryCode(req.categoryCode());
                    e.setDescription(req.description() != null ? req.description() : "");
                    e.setAmount(req.amount());
                    e.setDate(LocalDate.parse(req.date()));
                    return ResponseEntity.ok(toResponse(expenseRepository.save(e)));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(
            @RequestHeader(value = "Authorization", required = false) String auth,
            @PathVariable Long id
    ) {
        User user = authenticate(auth);
        return expenseRepository.findById(id)
                .filter(e -> e.getUser().getId().equals(user.getId()))
                .map(e -> {
                    expenseRepository.delete(e);
                    return ResponseEntity.<Void>noContent().build();
                })
                .orElse(ResponseEntity.<Void>notFound().build());
    }
}
