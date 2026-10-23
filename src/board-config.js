// 게시판(Supabase) 연결 정보. .env.local의 SUPABASE_URL·SUPABASE_ANON_KEY로 만든다.
// 공개 키(publishable)라 사이트에 들어가도 된다: 브라우저가 할 수 있는 일은 글 읽기(posts_public)와
// add_post·delete_post 함수 호출뿐이다 (tools/supabase/board.sql). service_role·secret 키는 절대 넣지 않는다.
export const BOARD = {
  url: "https://xuuppqwzcqauejzonsae.supabase.co",
  key: "sb_publishable_601AbFfHqq7S_Ez5dCGvfA_lOjPgeeJ",
};
