import { useEffect, useState } from 'react';
import { Zap, CheckCircle, XCircle } from 'lucide-react';
import { checkHealth } from '@/lib/api';

export function Footer() {
  const [apiStatus, setApiStatus] = useState<'checking' | 'online' | 'offline'>('checking');

  useEffect(() => {
    const checkApiHealth = async () => {
      const result = await checkHealth();
      setApiStatus(result.status === 'ok' ? 'online' : 'offline');
    };
    
    checkApiHealth();
    const interval = setInterval(checkApiHealth, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <footer className="border-t border-border bg-card/50 py-6">
      <div className="container mx-auto flex items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary">
            <Zap className="h-3.5 w-3.5 text-primary-foreground" />
          </div>
          <span className="text-sm font-medium text-foreground">
            WPL NRR Simulator
          </span>
        </div>

        <div className="flex items-center gap-2">
          {apiStatus === 'checking' ? (
            <span className="text-sm text-muted-foreground">Checking API...</span>
          ) : apiStatus === 'online' ? (
            <div className="flex items-center gap-1.5 text-success">
              <CheckCircle className="h-4 w-4" />
              <span className="text-sm font-medium">API Online</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 text-destructive">
              <XCircle className="h-4 w-4" />
              <span className="text-sm font-medium">API Offline</span>
            </div>
          )}
        </div>
      </div>
    </footer>
  );
}
