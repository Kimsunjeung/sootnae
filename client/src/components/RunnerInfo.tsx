import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Clock, MapPin, Activity, Timer, TrendingUp, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Runner } from "@shared/schema";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

interface RunnerInfoProps {
  runner: Runner;
  autoRefreshSeconds?: number;
  onRemove?: () => void;
  isCompact?: boolean;
}

export function RunnerInfo({ runner, autoRefreshSeconds, onRemove, isCompact = false }: RunnerInfoProps) {
  if (isCompact) {
    return (
      <Card className="p-4 space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-bold text-foreground mb-1 truncate" data-testid="text-runner-name">
              {runner.name}
            </h3>
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant="outline" className="font-mono text-sm" data-testid="badge-bib-number">
                #{runner.bibNumber}
              </Badge>
              <div className="flex items-center gap-1.5 bg-primary/10 px-2 py-1 rounded-md">
                <div className="h-1.5 w-1.5 bg-primary rounded-full animate-pulse-slow" />
                <span className="text-xs font-semibold text-primary" data-testid="text-live-status">
                  추적중
                </span>
              </div>
            </div>
          </div>
          {onRemove && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onRemove}
              className="flex-shrink-0"
              data-testid={`button-remove-runner-${runner.bibNumber}`}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>

        {runner.currentCheckpoint && (
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <MapPin className="h-3.5 w-3.5" />
              <span className="text-xs font-medium">현재 위치</span>
            </div>
            <p className="text-sm font-semibold text-foreground" data-testid="text-current-checkpoint">
              {runner.currentCheckpoint}
            </p>
          </div>
        )}

        {runner.progressPercentage !== undefined && (
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">진행률</span>
              <span className="font-mono font-semibold text-foreground" data-testid="text-progress-percentage">
                {runner.progressPercentage.toFixed(1)}%
              </span>
            </div>
            <Progress value={runner.progressPercentage} className="h-1.5" />
          </div>
        )}

        <div className="grid grid-cols-2 gap-2 text-xs">
          {runner.elapsedTime && (
            <div className="space-y-1">
              <p className="text-muted-foreground">경과 시간</p>
              <p className="font-mono font-bold text-foreground" data-testid="text-elapsed-time">
                {runner.elapsedTime}
              </p>
            </div>
          )}
          {runner.pace && (
            <div className="space-y-1">
              <p className="text-muted-foreground">페이스</p>
              <p className="font-mono font-bold text-foreground" data-testid="text-pace">
                {runner.pace}
              </p>
            </div>
          )}
        </div>

        {runner.checkpoints && runner.checkpoints.length > 0 && (
          <Accordion type="single" collapsible>
            <AccordionItem value="checkpoints" className="border-0">
              <AccordionTrigger className="py-2 text-sm font-semibold hover:no-underline">
                체크포인트 ({runner.checkpoints.filter(cp => cp.passed).length}/{runner.checkpoints.length})
              </AccordionTrigger>
              <AccordionContent className="pt-2">
                <div className="space-y-2">
                  {runner.checkpoints.map((checkpoint, index) => (
                    <div
                      key={index}
                      className={`flex items-center gap-2 p-2 rounded-md text-xs ${
                        checkpoint.passed
                          ? "bg-primary/10 border border-primary/20"
                          : "bg-muted/30"
                      }`}
                      data-testid={`checkpoint-${index}`}
                    >
                      <div
                        className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center font-semibold text-xs ${
                          checkpoint.passed
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted-foreground/20 text-muted-foreground"
                        }`}
                      >
                        {index + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`font-medium truncate ${
                          checkpoint.passed ? "text-foreground" : "text-muted-foreground"
                        }`}>
                          {checkpoint.name}
                        </p>
                      </div>
                      <div className="text-right">
                        {checkpoint.time ? (
                          <p className="font-mono text-xs font-semibold text-foreground">
                            {checkpoint.time}
                          </p>
                        ) : (
                          <Badge variant="outline" className="text-xs px-1.5 py-0">
                            예정
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        )}
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="p-6 space-y-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <h2 className="text-2xl font-bold text-foreground mb-2 truncate" data-testid="text-runner-name">
              {runner.name}
            </h2>
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant="outline" className="font-mono text-base" data-testid="badge-bib-number">
                #{runner.bibNumber}
              </Badge>
              {runner.category && (
                <Badge variant="secondary" data-testid="badge-category">
                  {runner.category}
                </Badge>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2 bg-primary/10 px-3 py-2 rounded-md border border-primary/20">
            <div className="h-2 w-2 bg-primary rounded-full animate-pulse-slow" />
            <span className="text-xs font-semibold text-primary whitespace-nowrap" data-testid="text-live-status">
              실시간 추적중
            </span>
          </div>
        </div>

        {runner.currentCheckpoint && (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-muted-foreground">
              <MapPin className="h-4 w-4" />
              <span className="text-sm font-medium">현재 위치</span>
            </div>
            <p className="text-lg font-semibold text-foreground" data-testid="text-current-checkpoint">
              {runner.currentCheckpoint}
            </p>
          </div>
        )}

        {runner.progressPercentage !== undefined && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">진행률</span>
              <span className="font-mono font-semibold text-foreground" data-testid="text-progress-percentage">
                {runner.progressPercentage.toFixed(1)}%
              </span>
            </div>
            <Progress value={runner.progressPercentage} className="h-2" />
          </div>
        )}

        {runner.elapsedTime && (
          <div className="flex items-center gap-3 p-4 bg-muted/50 rounded-md">
            <div className="p-2 bg-background rounded-md">
              <Clock className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1">
              <p className="text-xs text-muted-foreground mb-1">경과 시간</p>
              <p className="text-xl font-mono font-bold text-foreground" data-testid="text-elapsed-time">
                {runner.elapsedTime}
              </p>
            </div>
          </div>
        )}

        {(runner.totalDistance || runner.pace || runner.estimatedFinish) && (
          <div className="grid grid-cols-3 gap-3">
            {runner.totalDistance && (
              <div className="space-y-2 text-center">
                <div className="flex items-center justify-center">
                  <Activity className="h-4 w-4 text-muted-foreground" />
                </div>
                <p className="text-xs text-muted-foreground">주행 거리</p>
                <p className="text-sm font-semibold text-foreground font-mono" data-testid="text-total-distance">
                  {runner.totalDistance}
                </p>
              </div>
            )}
            {runner.pace && (
              <div className="space-y-2 text-center">
                <div className="flex items-center justify-center">
                  <Timer className="h-4 w-4 text-muted-foreground" />
                </div>
                <p className="text-xs text-muted-foreground">현재 페이스</p>
                <p className="text-sm font-semibold text-foreground font-mono" data-testid="text-pace">
                  {runner.pace}
                </p>
              </div>
            )}
            {runner.estimatedFinish && (
              <div className="space-y-2 text-center">
                <div className="flex items-center justify-center">
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </div>
                <p className="text-xs text-muted-foreground">예상 완주</p>
                <p className="text-sm font-semibold text-foreground font-mono" data-testid="text-estimated-finish">
                  {runner.estimatedFinish}
                </p>
              </div>
            )}
          </div>
        )}

        {autoRefreshSeconds !== undefined && (
          <div className="flex items-center justify-center gap-2 pt-4 border-t text-xs text-muted-foreground">
            <div className="h-1.5 w-1.5 bg-muted-foreground rounded-full animate-pulse" />
            <span data-testid="text-auto-refresh">
              {autoRefreshSeconds}초 후 자동 새로고침
            </span>
          </div>
        )}
      </Card>

      {runner.checkpoints && runner.checkpoints.length > 0 && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-foreground mb-4">체크포인트</h3>
          <div className="space-y-3">
            {runner.checkpoints.map((checkpoint, index) => (
              <div
                key={index}
                className={`flex items-center gap-4 p-3 rounded-md transition-colors ${
                  checkpoint.passed
                    ? "bg-primary/10 border border-primary/20"
                    : "bg-muted/30"
                }`}
                data-testid={`checkpoint-${index}`}
              >
                <div
                  className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center font-semibold text-sm ${
                    checkpoint.passed
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted-foreground/20 text-muted-foreground"
                  }`}
                >
                  {index + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`font-medium truncate ${
                    checkpoint.passed ? "text-foreground" : "text-muted-foreground"
                  }`}>
                    {checkpoint.name}
                  </p>
                  <p className="text-xs text-muted-foreground">{checkpoint.distance}</p>
                </div>
                <div className="text-right">
                  {checkpoint.time ? (
                    <p className="font-mono text-sm font-semibold text-foreground">
                      {checkpoint.time}
                    </p>
                  ) : (
                    <Badge variant="outline" className="text-xs">
                      예정
                    </Badge>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
