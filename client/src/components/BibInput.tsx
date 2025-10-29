import { useState } from "react";
import { Search, X, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

interface BibInputProps {
  onSearch: (bibNumber: string) => void;
  isLoading?: boolean;
  recentSearches: string[];
  onClearRecent: () => void;
  buttonText?: string;
}

export function BibInput({ onSearch, isLoading, recentSearches, onClearRecent, buttonText = "러너 위치 확인" }: BibInputProps) {
  const [bibNumber, setBibNumber] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (bibNumber.trim()) {
      onSearch(bibNumber.trim());
      setBibNumber("");
    }
  };

  const handleRecentClick = (bib: string) => {
    onSearch(bib);
  };

  const isAddMode = buttonText.includes("추가");

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <label htmlFor="bib-input" className="text-sm font-medium text-foreground">
            배번 또는 이름 입력
          </label>
          <div className="relative">
            <Input
              id="bib-input"
              data-testid="input-bib-number"
              type="text"
              inputMode="text"
              autoComplete="off"
              placeholder="배번 또는 이름을 입력하세요"
              value={bibNumber}
              onChange={(e) => setBibNumber(e.target.value)}
              className="h-14 text-2xl pr-12 no-native-clear"
              disabled={isLoading}
              autoFocus
            />
          </div>
        </div>

        <Button
          type="submit"
          className="w-full h-12 text-lg font-semibold"
          disabled={!bibNumber.trim() || isLoading}
          data-testid="button-search-runner"
        >
          {isLoading ? (
            <>
              <div className="h-5 w-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin mr-2" />
              검색중...
            </>
          ) : (
            <>
              {isAddMode ? (
                <Plus className="h-5 w-5 mr-2" />
              ) : (
                <Search className="h-5 w-5 mr-2" />
              )}
              {buttonText}
            </>
          )}
        </Button>
      </form>

      {recentSearches.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-muted-foreground">최근 검색</h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClearRecent}
              className="h-8 text-xs"
              data-testid="button-clear-recent"
            >
              지우기
            </Button>
          </div>
          <div className="flex flex-wrap gap-2">
            {recentSearches.map((bib) => (
              <Badge
                key={bib}
                variant="secondary"
                className="cursor-pointer hover-elevate active-elevate-2 px-3 py-1.5 text-sm"
                onClick={() => handleRecentClick(bib)}
                data-testid={`badge-recent-${bib}`}
              >
                {bib}
              </Badge>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
