import { useEffect, useState } from 'react';
import { Activity } from 'lucide-react';
import { checkHealth } from '@/lib/api';

export function Footer() {
  const [apiStatus, setApiStatus] = useState<'checking' | 'online' | 'offline'>('checking');

  useEffect(() => {
    const checkApiHealth = async () => {
      try {
        const result = await checkHealth();
        setApiStatus(result.status === 'ok' ? 'online' : 'offline');
      } catch {
        setApiStatus('offline');
      }
    };

    checkApiHealth();
    const interval = setInterval(checkApiHealth, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <footer className="border-t border-white/5 bg-card/30 py-5">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 items-center gap-3 md:grid-cols-3">
          
          {/* Left */}
          <div className="flex items-center justify-center gap-2 md:justify-start">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg border border-primary/20 bg-primary/10">
              <Activity className="h-3.5 w-3.5 text-primary" />
            </div>
            <span
              className="text-sm font-bold text-foreground"
              style={{ fontFamily: 'Rajdhani, sans-serif', letterSpacing: '0.05em' }}
            >
              IPL NRR SIMULATOR
            </span>
            <span className="text-xs text-muted-foreground font-mono">2026</span>
          </div>

          {/* Center */}
          <div className="text-center">
            <p className="text-sm text-muted-foreground">
              Have suggestions or queries?{' '}
              <a
                href="mailto:contact.iplnrr@gmail.com"
                className="text-primary underline underline-offset-2"
              >
                📧 contact.iplnrr@gmail.com
              </a>
            </p>
          </div>

          {/* Right - hidden on mobile */}
          <div className="hidden md:flex items-center justify-end gap-4">
            <span className="text-xs text-muted-foreground">
              Data sourced from ESPNcricinfo
            </span>

            <div className="flex items-center gap-1.5">
              {apiStatus === 'checking' ? (
                <span className="text-xs font-mono text-muted-foreground">Connecting...</span>
              ) : apiStatus === 'online' ? (
                <div className="flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-green-400 animate-pulse" />
                  <span className="text-xs font-mono text-green-400">API ONLINE</span>
                </div>
              ) : (
                <div className="flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-red-400" />
                  <span className="text-xs font-mono text-red-400">API OFFLINE</span>
                </div>
              )}
            </div>
          </div>

        </div>
      </div>
    </footer>
  );
}