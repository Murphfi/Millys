package com.millys.backend.category;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/categories")
@RequiredArgsConstructor
public class CategoryController {

    private final CategoryRepository categoryRepository;

    @GetMapping
    public List<Category> getAll() {
        return categoryRepository.findAll();
    }

    @PostMapping
    public Category create(@RequestBody CategoryRequest req) {
        Category cat = new Category();
        cat.setCode(req.code());
        cat.setLabel(req.label());
        cat.setColor(req.color());
        cat.setDefault(false);
        cat.setNoDescription(req.noDescription() != null && req.noDescription());
        return categoryRepository.save(cat);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Category> update(@PathVariable Long id, @RequestBody CategoryRequest req) {
        return categoryRepository.findById(id)
                .map(cat -> {
                    cat.setLabel(req.label());
                    cat.setColor(req.color());
                    if (req.noDescription() != null) cat.setNoDescription(req.noDescription());
                    return ResponseEntity.ok(categoryRepository.save(cat));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        if (!categoryRepository.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        categoryRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}
