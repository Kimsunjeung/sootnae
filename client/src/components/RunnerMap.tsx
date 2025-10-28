import { useEffect, useRef } from "react";
import type { Runner } from "@shared/schema";

declare const L: any;

interface RunnerMapProps {
  runners: Runner[];
}

const RUNNER_COLORS = [
  { bg: "#3b82f6", label: "파랑" },
  { bg: "#ef4444", label: "빨강" },
  { bg: "#10b981", label: "초록" },
  { bg: "#f59e0b", label: "주황" },
  { bg: "#8b5cf6", label: "보라" },
  { bg: "#ec4899", label: "분홍" },
  { bg: "#14b8a6", label: "청록" },
  { bg: "#f97316", label: "오렌지" },
];

export function RunnerMap({ runners }: RunnerMapProps) {
  const mapRef = useRef<any>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const markersRef = useRef<any[]>([]);

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
      if (mapRef.current && runners.length === 0) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (!mapRef.current) return;

    markersRef.current.forEach((marker) => marker.remove());
    markersRef.current = [];

    if (runners.length === 0) return;

    const bounds: [number, number][] = [];

    runners.forEach((runner, index) => {
      if (!runner?.currentPosition) return;

      const { lat, lng } = runner.currentPosition;
      const color = RUNNER_COLORS[index % RUNNER_COLORS.length];

      const runnerIcon = L.divIcon({
        className: "custom-runner-marker",
        html: `
          <div class="relative">
            <div class="absolute inset-0 rounded-full opacity-30 animate-ping" style="background-color: ${color.bg}"></div>
            <div class="relative w-10 h-10 rounded-full border-4 border-white shadow-lg flex items-center justify-center" style="background-color: ${color.bg}">
              <svg class="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"/>
              </svg>
            </div>
          </div>
        `,
        iconSize: [40, 40],
        iconAnchor: [20, 20],
      });

      const marker = L.marker([lat, lng], { icon: runnerIcon })
        .addTo(mapRef.current)
        .bindPopup(`
          <div class="p-2">
            <p class="font-bold text-sm mb-1">${runner.name}</p>
            <p class="text-xs text-gray-600">배번: ${runner.bibNumber}</p>
            ${runner.currentCheckpoint ? `<p class="text-xs text-gray-600 mt-1">${runner.currentCheckpoint}</p>` : ""}
            <div class="mt-2 flex items-center gap-1">
              <div class="w-3 h-3 rounded-full" style="background-color: ${color.bg}"></div>
              <span class="text-xs font-medium" style="color: ${color.bg}">${color.label}</span>
            </div>
          </div>
        `);

      markersRef.current.push(marker);
      bounds.push([lat, lng]);
    });

    if (bounds.length === 1) {
      mapRef.current.setView(bounds[0], 15, { animate: true });
    } else if (bounds.length > 1) {
      mapRef.current.fitBounds(bounds, {
        padding: [50, 50],
        maxZoom: 14,
        animate: true,
      });
    }
  }, [runners]);

  return (
    <div className="relative w-full h-full">
      <div ref={mapContainerRef} className="w-full h-full rounded-lg overflow-hidden" data-testid="map-container" />
      
      {runners.length === 0 && (
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

      {runners.length > 0 && (
        <div className="absolute top-4 right-4 bg-card/95 backdrop-blur-sm px-4 py-3 rounded-md shadow-md border border-card-border">
          <div className="space-y-3">
            <div className="text-xs text-muted-foreground">
              <p>Full 코스 (42.195km)</p>
              <p className="font-semibold text-foreground mt-1">2025년 11월 2일</p>
            </div>
            <div className="space-y-2 pt-2 border-t border-card-border">
              <p className="text-xs font-medium text-muted-foreground mb-2">
                추적 중인 러너 ({runners.length})
              </p>
              {runners.map((runner, index) => {
                const color = RUNNER_COLORS[index % RUNNER_COLORS.length];
                return (
                  <div key={runner.bibNumber} className="flex items-center gap-2">
                    <div 
                      className="w-3 h-3 rounded-full flex-shrink-0" 
                      style={{ backgroundColor: color.bg }}
                    />
                    <span className="text-xs font-medium text-foreground truncate">
                      {runner.name} (#{runner.bibNumber})
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
