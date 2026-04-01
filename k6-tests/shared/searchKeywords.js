// seed 데이터(stream.title / item.name / tag.name)에 실제로 존재하는 키워드만 사용
// '자전거', '닌텐도' 등 seed 미포함 키워드는 히트율 0 → 측정 왜곡
export const KEYWORDS = [
  '나이키', '한정판', '경매', '롤렉스', '샤넬',
  '아이폰', '조던', '포켓몬', '피규어', '운동화'
];