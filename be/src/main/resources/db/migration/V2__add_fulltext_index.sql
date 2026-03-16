ALTER TABLE stream ADD FULLTEXT INDEX ft_stream_title (title) WITH PARSER ngram;
ALTER TABLE item ADD FULLTEXT INDEX ft_item_name (name) WITH PARSER ngram;
ALTER TABLE tag ADD FULLTEXT INDEX ft_tag_name (name) WITH PARSER ngram;
