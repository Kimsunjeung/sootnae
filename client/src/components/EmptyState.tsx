import { MapPin } from "lucide-react";
import { Card } from "@/components/ui/card";

export function EmptyState() {
  return (
    <Card className="p-12">
      <div className="text-center space-y-6 max-w-md mx-auto">
        <div className="w-20 h-20 mx-auto bg-primary/10 rounded-full flex items-center justify-center">
          <MapPin className="w-10 h-10 text-primary" />
        </div>
        <div className="space-y-3">
          <h2 className="text-2xl font-bold text-foreground">
            러너 추적을 시작하세요
          </h2>
          <p className="text-muted-foreground leading-relaxed">
            배번을 입력하면 JTBC 마라톤 대회에서 러너의 실시간 위치와 기록을 확인할 수 있습니다
          </p>
        </div>
        <div className="pt-4 space-y-2 text-sm text-muted-foreground">
          <div className="flex items-center justify-center gap-2">
            <div className="w-1.5 h-1.5 bg-primary rounded-full" />
            <span>풀코스 (42.195km)</span>
          </div>
          <div className="flex items-center justify-center gap-2">
            <div className="w-1.5 h-1.5 bg-primary rounded-full" />
            <span>2025년 11월 2일 오전 8시 출발</span>
          </div>
        </div>
      </div>
    </Card>
  );
}
