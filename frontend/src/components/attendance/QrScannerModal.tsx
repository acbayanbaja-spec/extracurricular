"use client";

import React, { useState, useEffect } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { QrCode, Camera, CheckCircle2, AlertCircle } from 'lucide-react';
import { ApiClient } from '@/lib/api';
import { toast } from 'sonner';

interface QrScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function QrScannerModal({ isOpen, onClose, onSuccess }: QrScannerModalProps) {
  const [manualCode, setManualCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualCode.trim()) return;

    setIsLoading(true);
    try {
      let sessionId = '';
      let token = manualCode.trim();

      // Check if code is JSON payload format
      try {
        const parsed = JSON.parse(manualCode);
        if (parsed.sessionId && parsed.token) {
          sessionId = parsed.sessionId;
          token = parsed.token;
        }
      } catch {}

      // If token format is CNHS-ATT-{sessionId}-{timestamp}-{random}
      if (!sessionId && token.startsWith('CNHS-ATT-')) {
        const parts = token.split('-');
        if (parts.length >= 3) {
          sessionId = parts[2];
        }
      }

      // If still no session id, send as token
      const result = await ApiClient.post<{ success: boolean; message: string }>('/attendance/qr/scan', {
        sessionId: sessionId || 'ses-01',
        token,
      });

      toast.success('Attendance Recorded! ✅', {
        description: result.message || 'You have been checked in successfully.',
      });

      setManualCode('');
      onSuccess?.();
      onClose();
    } catch (err: any) {
      toast.error('Check-in Failed', {
        description: err.message || 'Invalid or expired attendance QR token.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div className="flex items-center gap-2 text-foreground font-bold">
          <QrCode className="h-5 w-5 text-primary-600" />
          <span>Extracurricular Attendance Check-in</span>
        </div>
      }
      description="Scan session QR code or enter token provided by your activity adviser."
      maxWidth="md"
    >
      <div className="space-y-4">
        {/* Visual Scanner Area */}
        <div className="relative flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-primary-500/40 bg-muted/40 p-6 text-center">
          <div className="relative flex h-36 w-36 items-center justify-center rounded-2xl border-2 border-primary-600 bg-background/80 shadow-lg">
            {/* Corner Scanner lines */}
            <div className="absolute top-2 left-2 w-4 h-4 border-t-2 border-l-2 border-primary-600" />
            <div className="absolute top-2 right-2 w-4 h-4 border-t-2 border-r-2 border-primary-600" />
            <div className="absolute bottom-2 left-2 w-4 h-4 border-b-2 border-l-2 border-primary-600" />
            <div className="absolute bottom-2 right-2 w-4 h-4 border-b-2 border-r-2 border-primary-600" />

            <QrCode className="h-20 w-20 text-muted-foreground/60 animate-pulse" />
          </div>

          <p className="mt-3 text-xs text-muted-foreground max-w-xs">
            Point camera at the teacher's screen QR display, or enter the session check-in token below.
          </p>
        </div>

        {/* Manual Token Form */}
        <form onSubmit={handleManualSubmit} className="space-y-3 pt-2">
          <div>
            <label className="block text-xs font-bold text-foreground mb-1">
              Attendance Token / QR Code String
            </label>
            <input
              type="text"
              placeholder="e.g. SES-QR-TREE-001 or CNHS-ATT-..."
              value={manualCode}
              onChange={(e) => setManualCode(e.target.value)}
              className="w-full rounded-xl border border-input bg-background px-3.5 py-2.5 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary-500"
              required
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-1">
            <Button type="button" variant="outline" size="sm" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" size="sm" isLoading={isLoading} className="font-bold">
              Verify & Check In
            </Button>
          </div>
        </form>
      </div>
    </Modal>
  );
}
