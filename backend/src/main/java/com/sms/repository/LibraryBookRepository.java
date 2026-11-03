package com.sms.repository;

import com.sms.model.LibraryBook;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface LibraryBookRepository extends JpaRepository<LibraryBook, Long> {
    List<LibraryBook> findByCategoryContainingIgnoreCase(String category);
    List<LibraryBook> findByTitleContainingIgnoreCaseOrAuthorContainingIgnoreCase(String title, String author);
}
