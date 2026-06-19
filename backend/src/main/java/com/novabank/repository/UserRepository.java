package com.novabank.repository;

import com.novabank.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByAuth0Sub(String auth0Sub);
    boolean existsByAuth0Sub(String auth0Sub);
}
