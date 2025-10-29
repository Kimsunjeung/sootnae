export function loadKakao(appKey: string, libraries = "services,clusterer") {
  return new Promise<any>((resolve, reject) => {
    if (typeof window === "undefined") return reject(new Error("window not available"));
    const w = window as any;

    // 이미 로드됨
    if (w.kakao && w.kakao.maps) {
      return resolve(w.kakao);
    }

    if (!appKey) {
      return reject(new Error("Kakao app key is missing"));
    }

    // script 태그 체크
    const existing = document.getElementById("kakao-maps-sdk") as HTMLScriptElement | null;
    const onReady = () => {
      // 1) 공식 로더 콜백 우선
      try {
        if (w.kakao && w.kakao.maps && typeof w.kakao.maps.load === "function") {
          w.kakao.maps.load(() => resolve(w.kakao));
          return;
        }
      } catch (_) {}
      // 2) 폴링으로 준비 확인
      const start = Date.now();
      const max = 10000; // 10s 타임아웃
      const iv = setInterval(() => {
        if (w.kakao && w.kakao.maps) {
          clearInterval(iv);
          resolve(w.kakao);
        } else if (Date.now() - start > max) {
          clearInterval(iv);
          reject(new Error("Kakao SDK timed out. Check domain/appkey."));
        }
      }, 200);
    };

    if (existing) {
      existing.addEventListener("load", onReady, { once: true });
      existing.addEventListener("error", (e) => reject(e), { once: true });
      return;
    }

    const createSrc = (scheme: "https" | "http") =>
      `${scheme}://dapi.kakao.com/v2/maps/sdk.js?appkey=${appKey}&autoload=false&libraries=${libraries}`;

    const script = document.createElement("script");
    script.id = "kakao-maps-sdk";
    script.async = true;
    script.defer = true;
    script.src = createSrc("https");
    script.onload = onReady;
    script.onerror = () => {
      // HTTPS 로드 실패 시 HTTP로 1회 재시도 (사내 프록시/필터 이슈 대응)
      try {
        script.onerror = (e) => reject(e);
        script.src = createSrc("http");
      } catch (e) {
        reject(e as any);
      }
    };
    document.head.appendChild(script);
  });
}
