// 브라우저 저장소 읽기/쓰기. 저장소를 쓸 수 없는 환경(사생활 보호 모드 등)에서도 오류 없이 동작한다.
export function load(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw === null ? fallback : JSON.parse(raw);
  } catch {
    return fallback;
  }
}

export function save(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // 저장할 수 없으면 이번 화면에서만 유지된다.
  }
}
