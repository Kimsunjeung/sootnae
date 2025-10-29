import { useEffect, useRef, useState } from "react";
import type { Runner } from "@shared/schema";
// 이미지 기반 코스 사용으로 shared 경로는 사용하지 않습니다.
import { loadNaverMaps } from "../lib/naverLoader";

interface RunnerMapProps { runners: Runner[] }

declare global { interface Window { naver: any } }

export function RunnerMap({ runners }: RunnerMapProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<any>(null);
  const outlineRef = useRef<any>(null);
  const mainlineRef = useRef<any>(null);
  const overlayRef = useRef<any>(null);
  const runnerMarkersRef = useRef<any[]>([]);
  const milestoneMarkersRef = useRef<any[]>([]);

  const [showOverlay, setShowOverlay] = useState(false);
  // 코스 이미지 고정 불투명도(슬라이더 제거)
  const OVERLAY_OPACITY = 0.45;
  const [showCourseLine, setShowCourseLine] = useState(true);
  const [swLat, setSwLat] = useState<number>(() => Number(localStorage.getItem("overlay_sw_lat")) || 37.4550);
  const [swLng, setSwLng] = useState<number>(() => Number(localStorage.getItem("overlay_sw_lng")) || 126.8200);
  const [neLat, setNeLat] = useState<number>(() => Number(localStorage.getItem("overlay_ne_lat")) || 37.6200);
  const [neLng, setNeLng] = useState<number>(() => Number(localStorage.getItem("overlay_ne_lng")) || 127.1800);
  const [nudge, setNudge] = useState<number>(0.0005);
  const [ready, setReady] = useState(false);
  // 모바일에서 컨트롤 패널을 접어서 표시
  const [panelOpen, setPanelOpen] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      // sm(640px) 이상에서는 기본 펼침, 모바일에서는 접음
      setPanelOpen(window.innerWidth >= 640);
      const onResize = () => setPanelOpen(window.innerWidth >= 640 ? true : panelOpen);
      window.addEventListener('resize', onResize);
      return () => window.removeEventListener('resize', onResize);
    }
  }, []);

  useEffect(() => {
    const keyId = (import.meta.env as any).VITE_NAVER_MAP_KEY_ID as string | undefined;
    const clientId = (import.meta.env as any).VITE_NAVER_MAP_CLIENT_ID as string | undefined;
    loadNaverMaps({ keyId, clientId }).then(async (naver) => {
      if (!containerRef.current) return;
      const map = new naver.maps.Map(containerRef.current, {
        center: new naver.maps.LatLng(37.5665, 126.9780),
        zoom: 11,
        zoomControl: true,
        mapTypeControl: true,
        // 제스처가 확실히 동작하도록 옵션 명시
        scrollWheel: true,
        pinchZoom: true,
        draggable: true,
        keyboardShortcuts: true,
        disableKineticPan: false,
      });
      mapRef.current = map;
      // 안전하게 옵션 재확인
      map.setOptions({
        scrollWheel: true,
        pinchZoom: true,
        draggable: true,
        keyboardShortcuts: true,
      } as any);

      // 네이버 맵 내부 엘리먼트에 직접 휠 리스너 부착 (버블링 차단 대비)
      const targetEl = (map.getElement && map.getElement()) || containerRef.current;
      const onWheel = (e: WheelEvent) => {
        if (!mapRef.current || !targetEl) return;
        if (e.ctrlKey) return; // 브라우저 확대 우선
        // 기본 동작(문서 스크롤) 방지 후 수동 확대/축소
        e.preventDefault();
        const cur = mapRef.current.getZoom();
        const next = e.deltaY < 0 ? cur + 1 : cur - 1;
        mapRef.current.setZoom(next, true);
      };
      targetEl?.addEventListener('wheel', onWheel, { passive: false, capture: true });

    
    // 기존 shared 경로/체크포인트 표시는 사용하지 않음 (이미지 기반 경로로 대체)

        // 이전 보간 기반 마일스톤 표시는 제거 (이미지 기반 경로에서 5K 배지를 생성)
    // 기존 polyline 덮어쓰기: 이미지 기반 경로 적용
    try {
      outlineRef.current?.setMap(null);
      mainlineRef.current?.setMap(null);

      // GPX를 불러와 경로를 파싱합니다.
      const gpxUrl = new URL('./jtbc2025_course.gpx', import.meta.url).toString();
      const gpxText = await fetch(gpxUrl).then(r => r.text());
      const xml = new DOMParser().parseFromString(gpxText, 'application/xml');
      let pts: {lat:number;lng:number}[] = [];
      xml.querySelectorAll('trkpt').forEach((pt:any)=>{
        const lat = parseFloat(pt.getAttribute('lat'));
        const lng = parseFloat(pt.getAttribute('lon'));
        if (!Number.isNaN(lat) && !Number.isNaN(lng)) pts.push({lat,lng});
      });
      if (pts.length === 0) {
        xml.querySelectorAll('rtept').forEach((pt:any)=>{
          const lat = parseFloat(pt.getAttribute('lat'));
          const lng = parseFloat(pt.getAttribute('lon'));
          if (!Number.isNaN(lat) && !Number.isNaN(lng)) pts.push({lat,lng});
        });
      }
      if (pts.length < 2) throw new Error('GPX 경로를 파싱할 수 없습니다');
      const pathImg = pts.map(p => new naver.maps.LatLng(p.lat, p.lng));
      outlineRef.current = new naver.maps.Polyline({ map, path: pathImg, strokeWeight: 8, strokeColor: '#ffffff', strokeOpacity: 0.9 });
      mainlineRef.current   = new naver.maps.Polyline({ map, path: pathImg, strokeWeight: 6, strokeColor: '#ff3b30', strokeOpacity: 0.95 });

      // 주요 구간 라벨
      const segmentLabels = [
        { name: '여의도', pos: { lat: 37.5285, lng: 126.9349 } },
        { name: '공덕', pos: { lat: 37.5418, lng: 126.9499 } },
        { name: '광화문', pos: { lat: 37.5720, lng: 126.9769 } },
        { name: '신설동', pos: { lat: 37.5753, lng: 127.0250 } },
        { name: '건대입구', pos: { lat: 37.5403, lng: 127.0697 } },
        { name: '학여울역', pos: { lat: 37.4967, lng: 127.0709 } },
        { name: '수서IC', pos: { lat: 37.4833, lng: 127.0930 } },
        { name: '올림픽공원', pos: { lat: 37.5152, lng: 127.1213 } },
      ];
      segmentLabels.forEach(s => {
        const mk = new naver.maps.Marker({
          map,
          position: new naver.maps.LatLng(s.pos.lat, s.pos.lng),
          zIndex: 28,
          icon: { content: `<div style=\"transform:translate(-50%,-70%);\"><div style=\"background:#111827;color:#fff;border-radius:14px;padding:3px 8px;font-size:11px;font-weight:700;box-shadow:0 1px 2px rgba(0,0,0,.25)\">${s.name}</div></div>` }
        });
        milestoneMarkersRef.current.push(mk);
      });

      // 출발/도착 배지(중복 방지: 5K 리스트에 포함하지 않음)
      const start = pts[0];
      const finish = pts[pts.length - 1];
      const startMk = new naver.maps.Marker({
        map,
        position: new naver.maps.LatLng(start.lat, start.lng),
        zIndex: 32,
        icon: { content: `<div style=\"transform:translate(-50%,-70%);\"><div style=\"background:#10b981;color:#fff;border-radius:18px;padding:4px 8px;font-size:11px;font-weight:700;box-shadow:0 1px 2px rgba(0,0,0,.25)\">출발</div></div>` }
      });
      const finishMk = new naver.maps.Marker({
        map,
        position: new naver.maps.LatLng(finish.lat, finish.lng),
        zIndex: 32,
        icon: { content: `<div style=\"transform:translate(-50%,-70%);\"><div style=\"background:#0ea5e9;color:#fff;border-radius:18px;padding:4px 8px;font-size:11px;font-weight:700;box-shadow:0 1px 2px rgba(0,0,0,.25)\">도착</div></div>` }
      });
      milestoneMarkersRef.current.push(startMk, finishMk);

      // 5K 단위 마커(5K,10K,15K,20K,Half,25K,30K,35K,40K) - 0/42 제외(출발/도착과 중복 방지)
      const kmTargets = [5, 10, 15, 20, 21.0975, 25, 30, 35, 40];
      const labels = ["5K","10K","15K","20K","Half","25K","30K","35K","40K"];
      const toRad = (d:number)=> d*Math.PI/180;
      const hav = (a:number,b:number,c:number,d:number)=>{ const R=6371; const dLat=toRad(c-a), dLng=toRad(d-b); const sa=Math.sin(dLat/2)**2 + Math.cos(toRad(a))*Math.cos(toRad(c))*Math.sin(dLng/2)**2; return 2*R*Math.asin(Math.sqrt(sa)); };
      const src = pts;
      const cum:number[]=[0];
      for(let i=1;i<src.length;i++){ cum[i]=cum[i-1]+hav(src[i-1].lat,src[i-1].lng,src[i].lat,src[i].lng); }
      const totalKm=cum[cum.length-1]||0; const scale = totalKm>0 ? 42.195/totalKm : 1;
      const pointAtKm=(km:number)=>{ const t=km/scale; let i=1; while(i<cum.length && cum[i]<t) i++; if(i>=cum.length) return src[src.length-1]; const a=src[i-1], b=src[i]; const seg=cum[i]-cum[i-1]||1e-6; const r=Math.max(0,Math.min(1,(t-cum[i-1])/seg)); return { lat:a.lat+(b.lat-a.lat)*r, lng:a.lng+(b.lng-a.lng)*r }; };
      kmTargets.forEach((km,idx)=>{
        const p=pointAtKm(km);
        const mk = new naver.maps.Marker({
          map,
          position: new naver.maps.LatLng(p.lat,p.lng),
          zIndex: 30,
          icon: { content: `<div style=\"transform:translate(-50%,-70%);\"><div style=\"background:#0f172a;color:#fff;border-radius:18px;padding:4px 8px;font-size:11px;font-weight:700;box-shadow:0 1px 2px rgba(0,0,0,.25)\">${labels[idx]}</div></div>` }
        });
        milestoneMarkersRef.current.push(mk);
      });

      // 경계 맞춤 (이미지 기반 경로)
      const b = new naver.maps.LatLngBounds();
      pathImg.forEach(pt => b.extend(pt));
      map.fitBounds(b);
      setReady(true);
    } catch {}

    return () => {
      outlineRef.current?.setMap(null);
      mainlineRef.current?.setMap(null);
      overlayRef.current?.setMap(null);
      runnerMarkersRef.current.forEach(m => m.setMap(null));
      runnerMarkersRef.current = [];
      milestoneMarkersRef.current.forEach(m => m.setMap(null));
      milestoneMarkersRef.current = [];
      targetEl?.removeEventListener('wheel', onWheel as any, { capture: true } as any);
    };
    }).catch((e) => console.error("Naver Maps load failed", e));
  }, []);

  // GroundOverlay 토글/불투명도/경계 반영
  useEffect(() => {
    if (!window.naver || !mapRef.current) return;
    // 토글 OFF 시 안전하게 제거
    if (!showOverlay) {
      if (overlayRef.current) {
        try { overlayRef.current.setMap(null); } catch {}
        overlayRef.current = null;
      }
      return;
    }

    const GroundOverlayCtor = (naver.maps as any)?.GroundOverlay;
    if (!GroundOverlayCtor) {
      // 일부 환경/버전에서 미지원일 수 있음: 조용히 무시
      console.warn('[overlay] Naver GroundOverlay is not available in this environment');
      return;
    }

    const bounds = new naver.maps.LatLngBounds(
      new naver.maps.LatLng(swLat, swLng),
      new naver.maps.LatLng(neLat, neLng)
    );

    try {
      if (!overlayRef.current) {
        overlayRef.current = new GroundOverlayCtor('/course-overlay.png', {
          bounds,
          opacity: OVERLAY_OPACITY,
          clickable: false,
        });
      } else {
        overlayRef.current.setBounds(bounds);
        if ((overlayRef.current as any).setOpacity) {
          (overlayRef.current as any).setOpacity(OVERLAY_OPACITY);
        }
      }
      // 생성/업데이트 후에만 setMap 호출
      if (overlayRef.current) {
        overlayRef.current.setMap(mapRef.current);
      }
    } catch (e) {
      console.warn('[overlay] failed to update overlay', e);
    }
  }, [showOverlay, swLat, swLng, neLat, neLng]);

  // 러너 마커 렌더/뷰 조정
  useEffect(() => {
    if (!window.naver || !mapRef.current) return;
    runnerMarkersRef.current.forEach(m => m.setMap(null));
    runnerMarkersRef.current = [];
    const colors = ['#3b82f6','#ef4444','#10b981','#f59e0b','#8b5cf6','#ec4899','#14b8a6','#f97316'];
    const points: any[] = [];
    runners.forEach((r,idx) => {
      if (!r?.currentPosition) return;
      const pos = new naver.maps.LatLng(r.currentPosition.lat, r.currentPosition.lng);
      points.push(pos);
      const color = colors[idx%colors.length];
      const marker = new naver.maps.Marker({
        map: mapRef.current!, position: pos, zIndex: 20,
        icon: {
          content: `<div class=\"relative\"><div class=\"absolute inset-0 rounded-full opacity-30 animate-ping\" style=\"background:${color};width:40px;height:40px\"></div><div class=\"relative w-10 h-10 rounded-full border-4 border-white shadow-lg flex items-center justify-center\" style=\"background:${color}\"><svg width=\"20\" height=\"20\" fill=\"white\" viewBox=\"0 0 20 20\"><path d=\"M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z\"/></svg></div></div>`,
          size: new naver.maps.Size(40,40), anchor: new naver.maps.Point(20,20)
        }
      });
      runnerMarkersRef.current.push(marker);
    });
    if (points.length === 1) { mapRef.current.setZoom(14, true); mapRef.current.setCenter(points[0]); }
    else if (points.length > 1) { const b = new naver.maps.LatLngBounds(); points.forEach(p=>b.extend(p)); mapRef.current.fitBounds(b); }
  }, [runners]);

  // 경계값 저장
  useEffect(()=>{localStorage.setItem('overlay_sw_lat', String(swLat));},[swLat]);
  useEffect(()=>{localStorage.setItem('overlay_sw_lng', String(swLng));},[swLng]);
  useEffect(()=>{localStorage.setItem('overlay_ne_lat', String(neLat));},[neLat]);
  useEffect(()=>{localStorage.setItem('overlay_ne_lng', String(neLng));},[neLng]);

  return (
    <div className="relative w-full h-full min-h-[480px]">
      <div ref={containerRef} className="w-full h-full" />
      {!ready && (
        <div className="absolute inset-0 flex items-center justify-center text-sm text-muted-foreground">
          지도를 불러오는 중...
        </div>
      )}

      {/* 모바일: 옵션 토글 버튼 (우측 상단) */}
      <div className="absolute top-2 right-2 z-20 sm:hidden">
        <button
          className="px-3 py-1.5 rounded-md bg-card/95 backdrop-blur shadow border text-[11px]"
          onClick={()=>setPanelOpen(v=>!v)}
        >
          {panelOpen ? '옵션 닫기' : '옵션'}
        </button>
      </div>

      {/* 컨트롤 + 경계 보정 (투명도 슬라이더 제거) */}
      <div
        className={[
          "absolute z-20 bg-card/95 backdrop-blur rounded-md shadow border",
          "text-[11px] sm:text-xs space-y-2",
          "top-12 right-2 sm:top-3 sm:right-3", // 모바일에서 네이버 줌/레이블과 간격 확보
          panelOpen ? "block" : "hidden sm:block",
          "max-w-[92vw] sm:max-w-[420px]"
        ].join(' ')}
      >
        <div className="px-3 pt-2">
          <div className="flex flex-wrap items-center gap-3">
            <label className="flex items-center gap-1 whitespace-nowrap"><input type="checkbox" checked={showOverlay} onChange={e=>setShowOverlay(e.target.checked)} />코스 이미지</label>
            <label className="flex items-center gap-1 whitespace-nowrap"><input type="checkbox" checked={showCourseLine} onChange={e=>{ setShowCourseLine(e.target.checked); outlineRef.current?.setMap(e.target.checked?mapRef.current:null); mainlineRef.current?.setMap(e.target.checked?mapRef.current:null); }} />코스 라인</label>
          </div>
        </div>
        <div className="px-3 pb-2">
          <div className="grid grid-cols-2 gap-1.5 sm:gap-2">
            <div>
              <div className="font-semibold mb-1">SW</div>
              <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 overflow-x-auto">
                <button className="px-1.5 py-0.5 sm:px-2 sm:py-1 border rounded" onClick={()=>setSwLat(v=>v- nudge)}>-lat</button>
                <button className="px-1.5 py-0.5 sm:px-2 sm:py-1 border rounded" onClick={()=>setSwLat(v=>v+ nudge)}>+lat</button>
                <button className="px-1.5 py-0.5 sm:px-2 sm:py-1 border rounded" onClick={()=>setSwLng(v=>v- nudge)}>-lng</button>
                <button className="px-1.5 py-0.5 sm:px-2 sm:py-1 border rounded" onClick={()=>setSwLng(v=>v+ nudge)}>+lng</button>
              </div>
              <div className="hidden sm:block text-[10px] mt-1">{swLat.toFixed(6)}, {swLng.toFixed(6)}</div>
            </div>
            <div>
              <div className="font-semibold mb-1">NE</div>
              <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 overflow-x-auto">
                <button className="px-1.5 py-0.5 sm:px-2 sm:py-1 border rounded" onClick={()=>setNeLat(v=>v- nudge)}>-lat</button>
                <button className="px-1.5 py-0.5 sm:px-2 sm:py-1 border rounded" onClick={()=>setNeLat(v=>v+ nudge)}>+lat</button>
                <button className="px-1.5 py-0.5 sm:px-2 sm:py-1 border rounded" onClick={()=>setNeLng(v=>v- nudge)}>-lng</button>
                <button className="px-1.5 py-0.5 sm:px-2 sm:py-1 border rounded" onClick={()=>setNeLng(v=>v+ nudge)}>+lng</button>
              </div>
              <div className="hidden sm:block text-[10px] mt-1">{neLat.toFixed(6)}, {neLng.toFixed(6)}</div>
            </div>
          </div>
        </div>
      </div>

      {runners.length === 0 && (
        <div className="absolute bottom-4 left-4 bg-card/90 backdrop-blur px-4 py-3 rounded-md shadow border border-card-border max-w-sm">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center mt-0.5">
              <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
            </div>
            <div className="space-y-1">
              <h3 className="text-sm font-semibold text-foreground">배번을 입력하여 시작하세요</h3>
              <p className="text-xs text-muted-foreground">러너의 배번을 입력하면 지도에서 실시간 위치를 확인할 수 있습니다.</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
