package com.sms.repository;

import com.sms.model.AppNotification;
import com.sms.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Repository
public interface AppNotificationRepository extends JpaRepository<AppNotification, Long> {

    @Query("SELECT n FROM AppNotification n WHERE n.user.id = :userId OR (n.user IS NULL AND (n.targetRole IS NULL OR n.targetRole = :role)) ORDER BY n.createdAt DESC")
    List<AppNotification> findForUser(@Param("userId") Long userId, @Param("role") User.Role role);

    @Query("SELECT COUNT(n) FROM AppNotification n WHERE (n.user.id = :userId OR (n.user IS NULL AND (n.targetRole IS NULL OR n.targetRole = :role))) AND n.isRead = false")
    long countUnreadForUser(@Param("userId") Long userId, @Param("role") User.Role role);

    @Modifying
    @Transactional
    @Query("UPDATE AppNotification n SET n.isRead = true WHERE (n.user.id = :userId OR (n.user IS NULL AND (n.targetRole IS NULL OR n.targetRole = :role))) AND n.isRead = false")
    int markAllReadForUser(@Param("userId") Long userId, @Param("role") User.Role role);

    List<AppNotification> findTop50ByOrderByCreatedAtDesc();
}
