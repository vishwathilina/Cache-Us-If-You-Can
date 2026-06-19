package com.novabank.repository;

import com.novabank.entity.Account;
import com.novabank.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

@Repository
public interface AccountRepository extends JpaRepository<Account, Long> {
    List<Account> findByUser(User user);
    Optional<Account> findByAccountNumber(String accountNumber);
    Optional<Account> findByAccountNumberAndUser(String accountNumber, User user);
    Optional<Account> findByIdAndUser(Long id, User user);
    boolean existsByAccountNumber(String accountNumber);

    @Query("SELECT COALESCE(SUM(a.balance), 0) FROM Account a")
    BigDecimal sumAllBalances();

    @Query("SELECT COUNT(a) FROM Account a WHERE a.user = :user")
    long countByUser(User user);
}
