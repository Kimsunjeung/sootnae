import { AlertCircle } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface ErrorStateProps {
  message: string;
  onRetry?: () => void;
}

export function ErrorState({ message, onRetry }: ErrorStateProps) {
  return (
    <Card className="p-12">
      <div className="text-center space-y-6 max-w-md mx-auto">
        <div className="w-20 h-20 mx-auto bg-destructive/10 rounded-full flex items-center justify-center">
          <AlertCircle className="w-10 h-10 text-destructive" />
        </div>
        <div className="space-y-3">
          <h2 className="text-2xl font-bold text-foreground">
            오류가 발생했습니다
          </h2>
          <p className="text-muted-foreground leading-relaxed" data-testid="text-error-message">
            {message}
          </p>
        </div>
        {onRetry && (
          <Button onClick={onRetry} variant="outline" data-testid="button-retry">
            다시 시도
          </Button>
        )}
      </div>
    </Card>
  );
}
