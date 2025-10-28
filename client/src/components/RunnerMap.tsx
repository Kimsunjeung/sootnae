import { useEffect, useRef } from "react";
import type { Runner } from "@shared/schema";

declare const L: any;

interface RunnerMapProps {
  runner: Runner | null;
}

export function RunnerMap({ runner }: RunnerMapProps) {
  const mapRef = useRef<any>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const markerRef = useRef<any>(null);

  useEffect(() => {
    if (!mapContainerRef.current || typeof L === "undefined") return;

    if (!mapRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: [37.5665, 126.9780],
        zoom: 13,
        zoomControl: true,
      });

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 19,
      }).addTo(map);

      mapRef.current = map;
    }

    return () => {
      if (mapRef.current && !runner) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (!mapRef.current || !runner?.currentPosition) return;

    const { lat, lng } = runner.currentPosition;

    if (markerRef.current) {
      markerRef.current.remove();
    }

    const runnerIcon = L.divIcon({
      className: "custom-runner-marker",
      html: `
        <div class="relative">
          <div class="absolute inset-0 bg-primary rounded-full opacity-30 animate-ping"></div>
          <div class="relative w-10 h-10 bg-primary rounded-full border-4 border-white shadow-lg flex items-center justify-center">
            <svg class="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"/>
            </svg>
          </div>
        </div>
      `,
      iconSize: [40, 40],
      iconAnchor: [20, 20],
    });

    markerRef.current = L.marker([lat, lng], { icon: runnerIcon })
      .addTo(mapRef.current)
      .bindPopup(`
        <div class="p-2">
          <p class="font-bold text-sm mb-1">${runner.name}</p>
          <p class="text-xs text-gray-600">배번: ${runner.bibNumber}</p>
          ${runner.currentCheckpoint ? `<p class="text-xs text-gray-600 mt-1">${runner.currentCheckpoint}</p>` : ""}
        </div>
      `);

    mapRef.current.setView([lat, lng], 15, { animate: true });

  }, [runner]);

  return (
    <div className="relative w-full h-full">
      <div ref={mapContainerRef} className="w-full h-full rounded-lg overflow-hidden" data-testid="map-container" />
      
      {!runner && (
        <div className="absolute inset-0 flex items-center justify-center bg-muted/50 backdrop-blur-sm rounded-lg">
          <div className="text-center space-y-4 p-8">
            <div className="w-16 h-16 mx-auto bg-primary/10 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-semibold text-foreground">배번을 입력하여 시작하세요</h3>
              <p className="text-sm text-muted-foreground max-w-xs mx-auto">
                러너의 배번을 입력하면 풀코스 지도에서 실시간 위치를 확인할 수 있습니다
              </p>
            </div>
          </div>
        </div>
      )}

      {runner && (
        <div className="absolute top-4 right-4 bg-card/95 backdrop-blur-sm px-4 py-3 rounded-md shadow-md border border-card-border">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-primary rounded-full" />
              <span className="text-xs font-medium text-foreground">러너 위치</span>
            </div>
            <div className="text-xs text-muted-foreground">
              <p>Full 코스 (42.195km)</p>
              <p className="font-semibold text-foreground mt-1">2025년 11월 2일</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
