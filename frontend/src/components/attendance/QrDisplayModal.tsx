"use client";

import React, { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { QrCode, RefreshCw, Copy, Check } from 'lucide-react';
import { ApiClient } from '@/lib/api';
import { toast } from 'sonner';

interface QrDisplayModalProps {
  isOpen: boolean;
  onClose: () => void;
  sessionId: string;
  sessionTitle: string;
}

export function QrDisplayModal({ isOpen, onClose, sessionId, sessionTitle }: QrDisplayModalProps) {
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [expiresAt, setExpiresAt] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  const generateCode = async () => {
    setIsLoading(true);
    try {
      const res = await ApiClient.post<{ token: string; qrDataUrl: string; expiresAt: string }>(
        `/attendance/session/${sessionId}/qr`,
        { minutes: 60 }
      );
      setQrDataUrl(res.qrDataUrl);
      setToken(res.token);
      setExpiresAt(res.expiresAt);
      toast.success('Live QR Code generated!');
    } catch (err: any) {
      toast.error('Failed to generate session QR code', { description: err.message });
    } finally {
      setIsLoading(false);
    }
  };

  React.useEffect(() => {
    if (isOpen && sessionId) {
      generateCode();
    }
  }, [isOpen, sessionId]);

  const copyToken = () => {
    if (!token) return;
    navigator.clipboard.writeText(token);
    setIsCopied(true);
    toast.success('Token copied to clipboard!');
    setTimeout(() => setIsCopied(false), 2000);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div className="flex items-center gap-2">
          <QrCode className="h-5 w-5 text-indigo-600" />
          <span>Live Attendance QR Code</span>
        </div>
      }
      description={`Display this QR code for students to scan during "${sessionTitle}".`}
      maxWidth="md"
    >
      <div className="flex flex-col items-center justify-center p-4 text-center">
        {/* QR Image */}
        <div className="relative flex h-64 w-64 items-center justify-center rounded-2xl border-2 border-primary-500/30 bg-white p-3 shadow-xl">
          {isLoading ? (
            <RefreshCw className="h-8 w-8 animate-spin text-primary-600" />
          ) : qrDataUrl ? (
            <img src={qrDataUrl} alt="Attendance QR Code" className="h-full w-full object-contain" />
          ) : (
            <p className="text-xs text-muted-foreground">Generating code...</p>
          )}
        </div>

        {/* Token string */}
        {token && (
          <div className="mt-4 w-full rounded-xl bg-muted/60 p-3 border border-border flex items-center justify-between">
            <div className="text-left overflow-hidden mr-2">
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Session Token</p>
              <p className="text-xs font-mono text-foreground truncate">{token}</p>
            </div>
            <Button size="sm" variant="outline" onClick={copyToken} className="h-8 px-2.5">
              {isCopied ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
            </Button>
          </div>
        )}

        <div className="mt-5 flex items-center gap-3 w-full">
          <Button
            variant="outline"
            size="sm"
            onClick={generateCode}
            isLoading={isLoading}
            className="flex-1"
          >
            <RefreshCw className="mr-1.5 h-3.5 w-3.5" /> Refresh Code
          </Button>
          <Button variant="default" size="sm" onClick={onClose} className="flex-1">
            Done
          </Button>
        </div>
      </div>
    </Modal>
  );
}
