type LoaderCreds = { keyId?: string; clientId?: string };

export function loadNaverMaps(creds: LoaderCreds | string) {
  return new Promise<any>((resolve, reject) => {
    if (typeof window === "undefined") return reject(new Error("window not available"));
    const w = window as any;
    if (w.naver && w.naver.maps) return resolve(w.naver);

    const keyId = typeof creds === "string" ? undefined : creds.keyId;
    const clientId = typeof creds === "string" ? creds : creds.clientId;
    let candidates: string[] = [];

    candidates = [`https://oapi.map.naver.com/openapi/v3/maps.js?ncpKeyId=${encodeURIComponent(keyId)}`];

    if (candidates.length === 0) return reject(new Error("Naver Maps credentials missing (keyId/clientId)"));

    const existing = document.getElementById("naver-maps-sdk") as HTMLScriptElement | null;
    if (existing && !(w.naver && w.naver.maps)) existing.remove();
    if (existing && w.naver && w.naver.maps) return resolve(w.naver);

    const tryNext = (idx: number) => {
      if (idx >= candidates.length) return reject(new Error("Naver Maps SDK load failed for all credential types"));

      const url = candidates[idx];
      const s = document.createElement("script");
      s.id = "naver-maps-sdk";
      s.async = true;
      s.defer = true;
      s.src = url;
      s.onload = () => {
        const start = Date.now();
        const iv = setInterval(() => {
          if (w.naver && w.naver.maps) {
            clearInterval(iv);
            resolve(w.naver);
          } else if (Date.now() - start > 10000) {
            clearInterval(iv);
            // 다음 후보로 시도
            s.remove();
            tryNext(idx + 1);
          }
        }, 200);
      };
      s.onerror = () => {
        s.remove();
        tryNext(idx + 1);
      };
      document.head.appendChild(s);
    };

    tryNext(0);
  });
}
