package com.millys.backend.installment;

import com.millys.backend.expense.ExpenseRepository;
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

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/installment-plans")
@RequiredArgsConstructor
public class InstallmentPlanController {

    private final InstallmentPlanRepository installmentPlanRepository;
    private final ExpenseRepository         expenseRepository;
    private final UserRepository            userRepository;

    private User resolveOwner(String requestedName, User fallback) {
        if (requestedName == null || requestedName.isBlank()) return fallback;
        return userRepository.findByNombre(requestedName)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Usuario desconocido: " + requestedName));
    }

    private void applyRequest(InstallmentPlan p, InstallmentPlanRequest req, User fallbackOwner) {
        p.setUser(resolveOwner(req.userName(), fallbackOwner));
        p.setDescription(req.description());
        p.setTotalAmount(req.totalAmount());
        p.setMonthlyAmount(req.monthlyAmount());
        p.setStartDate(LocalDate.parse(req.startDate()));
        p.setInitialPaidAmount(req.initialPaidAmount() != null ? req.initialPaidAmount() : BigDecimal.ZERO);
    }

    private InstallmentPlanResponse toResponse(InstallmentPlan p) {
        BigDecimal paidFromExpenses = expenseRepository.sumAmountByInstallmentPlanId(p.getId());
        return new InstallmentPlanResponse(
                p.getId(),
                p.getDescription(),
                p.getTotalAmount(),
                p.getMonthlyAmount(),
                p.getStartDate().toString(),
                p.getUser().getNombre(),
                p.getInitialPaidAmount().add(paidFromExpenses),
                expenseRepository.countByInstallmentPlanId(p.getId()),
                p.getInitialPaidAmount()
        );
    }

    @GetMapping
    public List<InstallmentPlanResponse> getAll() {
        return installmentPlanRepository.findAllByOrderByStartDateDesc()
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @PostMapping
    public ResponseEntity<InstallmentPlanResponse> create(Authentication auth, @Valid @RequestBody InstallmentPlanRequest req) {
        User caller       = (User) auth.getPrincipal();
        InstallmentPlan p = new InstallmentPlan();
        applyRequest(p, req, caller);
        return ResponseEntity.status(HttpStatus.CREATED).body(toResponse(installmentPlanRepository.save(p)));
    }

    @PutMapping("/{id}")
    @Transactional
    public ResponseEntity<InstallmentPlanResponse> update(@PathVariable Long id, @Valid @RequestBody InstallmentPlanRequest req) {
        return installmentPlanRepository.findByIdWithUser(id)
                .map(p -> {
                    applyRequest(p, req, p.getUser());
                    return ResponseEntity.ok(toResponse(installmentPlanRepository.save(p)));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        Optional<InstallmentPlan> existing = installmentPlanRepository.findById(id);
        if (existing.isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        installmentPlanRepository.delete(existing.get());
        return ResponseEntity.noContent().build();
    }
}
