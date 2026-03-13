package com.ssafy.be.domain.item.repository;

import com.ssafy.be.domain.item.entity.Tag;
import org.springframework.data.jpa.repository.JpaRepository;

public interface TagRepository extends JpaRepository<Tag, Long> {
    void deleteAllByItemId(Long itemId);
}