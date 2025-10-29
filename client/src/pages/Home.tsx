import { useState, useEffect } from "react";
import { useQueries } from "@tanstack/react-query";
import { BibInput } from "@/components/BibInput";
import { RunnerInfo } from "@/components/RunnerInfo";
import { RunnerMap } from "@/components/RunnerMap";
import { EmptyState } from "@/components/EmptyState";
import type { Runner } from "@shared/schema";
import { X, AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";

const RECENT_SEARCHES_KEY = "jtbc-marathon-recent-searches";
const TRACKED_BIBS_KEY = "jtbc-marathon-tracked-bibs";
const AUTO_REFRESH_INTERVAL = 30000;

export default function Home() {
  const [trackedBibs, setTrackedBibs] = useState<string[]>([]);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [autoRefreshCountdown, setAutoRefreshCountdown] = useState<number>(30);
  const { toast } = useToast();

  // JTBC 2025 대회 시간 (KST)
  const EVENT_DATE_START = new Date("2025-11-02T08:00:00+09:00");
  const EVENT_DATE_GATE = new Date("2025-11-02T07:30:00+09:00");

  useEffect(() => {
    const storedRecent = localStorage.getItem(RECENT_SEARCHES_KEY);
    if (storedRecent) {
      try {
        const parsed = JSON.parse(storedRecent);
        setRecentSearches(parsed.slice(0, 3));
      } catch (e) {
        console.error("Failed to parse recent searches:", e);
      }
    }

    const storedTracked = localStorage.getItem(TRACKED_BIBS_KEY);
    if (storedTracked) {
      try {
        const parsed = JSON.parse(storedTracked);
        setTrackedBibs(parsed);
      } catch (e) {
        console.error("Failed to parse tracked bibs:", e);
      }
    }
  }, []);

  const runnerQueries = useQueries({
    queries: trackedBibs.map((bibNumber) => ({
      queryKey: ["/api/runner", bibNumber],
      enabled: !!bibNumber,
      refetchInterval: AUTO_REFRESH_INTERVAL,
      refetchIntervalInBackground: true,
      retry: 1,
    })),
  });

  const runners = runnerQueries.map((query, index) => ({
    bib: trackedBibs[index],
    data: query.data as Runner | undefined,
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  }));

  const validRunners = runners.filter((r) => r.data);
  const hasValidRunners = validRunners.length > 0;
  const hasAnyRunners = trackedBibs.length > 0;

  useEffect(() => {
    if (hasValidRunners) {
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
  }, [hasValidRunners]);

  useEffect(() => {
    if (hasValidRunners) {
      setAutoRefreshCountdown(30);
    }
  }, [validRunners.length]);

  const handleAddRunner = (bibNumber: string) => {
    const now = new Date();
    if (now < EVENT_DATE_GATE) {
      toast({
        title: "대회 시작 전",
        description: "11월 2일 오전 8시 이후에 추적 가능합니다.",
      });
      return;
    } else if (now >= EVENT_DATE_GATE && now < EVENT_DATE_START) {
      toast({
        title: "대회 시작 전",
        description: "시작 전에는 기록이 없을 수 있습니다. 시작 후 자동으로 반영됩니다.",
      });
    }

    if (trackedBibs.includes(bibNumber)) {
      return;
    }

    const updated = [...trackedBibs, bibNumber];
    setTrackedBibs(updated);
    localStorage.setItem(TRACKED_BIBS_KEY, JSON.stringify(updated));

    const updatedRecent = [bibNumber, ...recentSearches.filter((b) => b !== bibNumber)].slice(0, 3);
    setRecentSearches(updatedRecent);
    localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updatedRecent));
  };

  const handleRemoveRunner = (bibNumber: string) => {
    const updated = trackedBibs.filter((b) => b !== bibNumber);
    setTrackedBibs(updated);
    localStorage.setItem(TRACKED_BIBS_KEY, JSON.stringify(updated));
  };

  const handleClearRecent = () => {
    setRecentSearches([]);
    localStorage.removeItem(RECENT_SEARCHES_KEY);
  };

  const handleClearAll = () => {
    setTrackedBibs([]);
    localStorage.removeItem(TRACKED_BIBS_KEY);
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 bg-card/95 backdrop-blur-sm border-b border-card-border shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-foreground" data-testid="text-page-title">
                SOOTNAE 마라톤 러너 추적
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                2025년 11월 2일 | Full 코스 (42.195km)
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-1 space-y-6">
            <BibInput
              onSearch={handleAddRunner}
              isLoading={false}
              recentSearches={recentSearches}
              onClearRecent={handleClearRecent}
              buttonText="러너 추가"
            />

            {hasAnyRunners && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-medium text-muted-foreground">
                    추적 중인 러너 ({trackedBibs.length})
                  </h3>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleClearAll}
                    className="h-8 text-xs"
                    data-testid="button-clear-all"
                  >
                    모두 삭제
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {trackedBibs.map((bib) => (
                    <Badge
                      key={bib}
                      variant="outline"
                      className="px-3 py-1.5 text-sm font-mono gap-2"
                      data-testid={`badge-tracked-${bib}`}
                    >
                      #{bib}
                      <button
                        onClick={() => handleRemoveRunner(bib)}
                        className="hover-elevate active-elevate-2 rounded-full p-0.5"
                        data-testid={`button-remove-${bib}`}
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {hasAnyRunners ? (
              <div className="space-y-4 max-h-[calc(100vh-24rem)] overflow-y-auto pr-2">
                {runners.map(({ bib, data, isLoading, error, refetch }) => {
                  if (isLoading) {
                    return (
                      <Card key={bib} className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                          <div>
                            <p className="text-sm font-semibold text-foreground">
                              배번 #{bib} 로딩 중...
                            </p>
                            <p className="text-xs text-muted-foreground">
                              러너 정보를 가져오는 중입니다
                            </p>
                          </div>
                        </div>
                      </Card>
                    );
                  }

                  if (error) {
                    const msg = (error instanceof Error ? error.message : "").toString();
                    const isNoDataYet =
                      msg.includes("아직 체크포인트") ||
                      msg.includes("찾을 수 없습니다") ||
                      msg.includes("404") ||
                      msg.includes("no data") ||
                      msg.includes("not found");
                    const now = new Date();
                    const beforeStart = now < EVENT_DATE_START;
                    return (
                      <Card key={bib} className={`p-4 ${isNoDataYet || beforeStart ? "bg-muted/30 border-muted" : "border-destructive/50 bg-destructive/5"}`}>
                        <div className="space-y-3">
                          <div className="flex items-start gap-3">
                            <AlertCircle className={`h-5 w-5 flex-shrink-0 mt-0.5 ${isNoDataYet || beforeStart ? "text-muted-foreground" : "text-destructive"}`} />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-semibold text-foreground">
                                {isNoDataYet || beforeStart ? `배번/이름 ${bib}` : `배번 ${bib} 오류`}
                              </p>
                              <p className="text-xs text-muted-foreground mt-1">
                                {beforeStart
                                  ? "대회 시작 전입니다. 11월 2일 오전 8시 이후에 기록이 반영됩니다."
                                  : isNoDataYet
                                    ? "아직 기록이 없습니다. 체크포인트 통과 후 데이터가 표시됩니다."
                                    : (error instanceof Error && error.message) || "러너 정보를 불러올 수 없습니다"}
                              </p>
                            </div>
                            <button
                              onClick={() => handleRemoveRunner(bib)}
                              className="hover-elevate active-elevate-2 rounded-full p-1 flex-shrink-0"
                              data-testid={`button-error-remove-${bib}`}
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => refetch()}
                              className="flex-1"
                              data-testid={`button-retry-${bib}`}
                            >
                              <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
                              재시도
                            </Button>
                          </div>
                        </div>
                      </Card>
                    );
                  }

                  if (data) {
                    return (
                      <RunnerInfo
                        key={bib}
                        runner={data}
                        autoRefreshSeconds={autoRefreshCountdown}
                        onRemove={() => handleRemoveRunner(bib)}
                        isCompact={runners.length > 1}
                      />
                    );
                  }

                  return null;
                })}
              </div>
            ) : (
              <EmptyState />
            )}
          </div>

          <div className="lg:col-span-3">
            <div className="h-[520px] lg:h-[calc(100vh-6rem)] rounded-lg overflow-hidden border border-card-border shadow-md">
              <RunnerMap runners={validRunners.map(r => r.data!)} />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
