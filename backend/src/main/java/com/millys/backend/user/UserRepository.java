package com.millys.backend.user;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {

    @Query("SELECT u.nombre FROM User u")
    List<String> findAllNombres();

    Optional<User> findByNombre(String nombre);
}
