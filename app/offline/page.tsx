import { WifiOff, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function OfflinePage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="text-center max-w-md">
        <div className="mb-6 flex justify-center">
          <div className="p-4 bg-muted rounded-full">
            <WifiOff className="h-12 w-12 text-muted-foreground" />
          </div>
        </div>
        <h1 className="text-2xl font-bold mb-2">Çevrimdışısın</h1>
        <p className="text-muted-foreground mb-6">
          İnternet bağlantısı yok gibi görünüyor. Bağlantını kontrol edip tekrar dene.
        </p>
        <Button
          onClick={() => window.location.reload()}
          className="gap-2"
        >
          <RefreshCw className="h-4 w-4" />
          Tekrar Dene
        </Button>
      </div>
    </div>
  );
}
