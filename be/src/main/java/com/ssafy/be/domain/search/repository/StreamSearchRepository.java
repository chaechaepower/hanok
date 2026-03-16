package com.ssafy.be.domain.search.repository;

import com.ssafy.be.domain.stream.entity.Stream;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;


@Repository
public interface StreamSearchRepository {

    //FULLTEXT는 JPA로 안되서 native sql

    @Query(value = """
        SELECT * FROM stream
        WHERE MATCH(title) AGAINST(:keyword IN BOOLEAN MODE)
    """, nativeQuery = true)
    List<Stream> searchByStreamTitle(@Param("keyword") String keyword);

    @Query(value = """
        SELECT DISTINCT s.* FROM auction a
        JOIN stream s ON a.stream_id = s.id
        JOIN item i ON a.item_id = i.id
        WHERE MATCH(i.name) AGAINST(:keyword IN BOOLEAN MODE)
    """, nativeQuery = true)
    List<Stream> searchByItemName(@Param("keyword") String keyword);

    @Query(value = """
        SELECT DISTINCT s.* FROM tag t
        JOIN item i ON t.item_id = i.id
        JOIN auction a ON a.item_id = i.id
        JOIN stream s ON a.stream_id = s.id
        WHERE MATCH(t.name) AGAINST(:keyword IN BOOLEAN MODE)
    """, nativeQuery = true)
    List<Stream> searchByTagName(@Param("keyword") String keyword);
}