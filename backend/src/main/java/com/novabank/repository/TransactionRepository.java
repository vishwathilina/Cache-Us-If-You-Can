package com.novabank.repository;

import com.novabank.entity.Account;
import com.novabank.entity.Transaction;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TransactionRepository extends JpaRepository<Transaction, Long> {

    @Query("SELECT t FROM Transaction t WHERE t.fromAccount = :account OR t.toAccount = :account ORDER BY t.createdAt DESC")
    List<Transaction> findByAccount(@Param("account") Account account, Pageable pageable);

    @Query("SELECT t FROM Transaction t WHERE t.fromAccount IN :accounts OR t.toAccount IN :accounts ORDER BY t.createdAt DESC")
    Page<Transaction> findByAccounts(@Param("accounts") List<Account> accounts, Pageable pageable);

    long countByStatus(Transaction.TransactionStatus status);
}
