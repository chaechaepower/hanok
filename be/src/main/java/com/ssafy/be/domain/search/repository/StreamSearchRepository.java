package com.ssafy.be.domain.search.repository;

import com.ssafy.be.domain.stream.entity.Stream;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;


@Repository
public interface StreamSearchRepository {

    // 방송 이름 매칭
    @Query("SELECT s FROM Stream s WHERE s.title LIKE %:keyword%")
    List<Stream> searchByStreamTitle(@Param("keyword") String keyword);

    // 아이템 명 매칭
    @Query("""
        SELECT DISTINCT s FROM Auction a
        JOIN a.stream s
        JOIN a.item i
        WHERE i.name LIKE %:keyword%
    """)
    List<Stream> searchByItemName(@Param("keyword") String keyword);


    // 태그 - 아이템 매핑
    @Query("""
        SELECT DISTINCT s FROM Tag t
        JOIN t.item i
        JOIN Auction a ON a.item = i
        JOIN a.stream s
        WHERE t.name LIKE %:keyword%
    """)
    List<Stream> searchByTagName(@Param("keyword") String keyword);
}
