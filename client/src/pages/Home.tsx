import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { BibInput } from "@/components/BibInput";
import { RunnerInfo } from "@/components/RunnerInfo";
import { RunnerMap } from "@/components/RunnerMap";
import { EmptyState } from "@/components/EmptyState";
import { ErrorState } from "@/components/ErrorState";
import type { Runner } from "@shared/schema";

const RECENT_SEARCHES_KEY = "jtbc-marathon-recent-searches";
const AUTO_REFRESH_INTERVAL = 30000;

export default function Home() {
  const [currentBib, setCurrentBib] = useState<string>("");
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [autoRefreshCountdown, setAutoRefreshCountdown] = useState<number>(30);

  useEffect(() => {
    const stored = localStorage.getItem(RECENT_SEARCHES_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setRecentSearches(parsed.slice(0, 3));
      } catch (e) {
        console.error("Failed to parse recent searches:", e);
      }
    }
  }, []);

  const { data: runner, isLoading, error, refetch } = useQuery<Runner>({
    queryKey: ["/api/runner", currentBib],
    enabled: !!currentBib,
    refetchInterval: AUTO_REFRESH_INTERVAL,
    refetchIntervalInBackground: true,
  });

  useEffect(() => {
    if (runner && currentBib) {
      const interval = setInterval(() => {
        setAutoRefreshCountdown((prev) => {
          if (prev <= 1) {
            return 30;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [runner, currentBib]);

  useEffect(() => {
    if (runner && currentBib) {
      setAutoRefreshCountdown(30);
    }
  }, [runner, currentBib]);

  const handleSearch = (bibNumber: string) => {
    setCurrentBib(bibNumber);
    setAutoRefreshCountdown(30);

    const updated = [bibNumber, ...recentSearches.filter((b) => b !== bibNumber)].slice(0, 3);
    setRecentSearches(updated);
    localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
  };

  const handleClearRecent = () => {
    setRecentSearches([]);
    localStorage.removeItem(RECENT_SEARCHES_KEY);
  };

  const handleRetry = () => {
    refetch();
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 bg-card/95 backdrop-blur-sm border-b border-card-border shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-foreground" data-testid="text-page-title">
                JTBC 마라톤 러너 추적
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                2025년 11월 2일 | Full 코스 (42.195km)
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 space-y-6">
            <BibInput
              onSearch={handleSearch}
              isLoading={isLoading}
              recentSearches={recentSearches}
              onClearRecent={handleClearRecent}
            />

            {runner && (
              <RunnerInfo runner={runner} autoRefreshSeconds={autoRefreshCountdown} />
            )}

            {!currentBib && <EmptyState />}

            {error && !isLoading && (
              <ErrorState
                message="러너 정보를 불러올 수 없습니다. 배번을 확인하고 다시 시도해주세요."
                onRetry={handleRetry}
              />
            )}
          </div>

          <div className="lg:col-span-2">
            <div className="h-[500px] lg:h-[calc(100vh-8rem)] rounded-lg overflow-hidden border border-card-border shadow-md">
              <RunnerMap runner={runner || null} />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
