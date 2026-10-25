"use client";

import React, { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { Html5Qrcode } from 'html5-qrcode';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/context/AuthContext';
import { ApiClient } from '@/lib/api';
import { realtimeSync } from '@/lib/realtime';
import { toast } from 'sonner';
import {
  AlertTriangle,
  Camera,
  CheckCircle2,
  Image as ImageIcon,
  Keyboard,
  Loader2,
  QrCode,
  RefreshCw,
  ShieldAlert,
  Sparkles,
  VideoOff,
  Zap,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface QrScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

type ScanMode = 'camera' | 'token';
type ScannerPhase = 'idle' | 'starting' | 'scanning' | 'verifying' | 'success' | 'error';

interface ScanFailure {
  title: string;
  hint: string;
  kind: 'permission' | 'hardware' | 'insecure' | 'busy' | 'rejected' | 'enrolment' | 'generic';
}

interface ScanResponse {
  recordId?: string;
  status?: string;
  pointsAwarded?: number;
  alreadyPresent?: boolean;
  enrolmentStatus?: string;
  activityTitle?: string;
  sessionTitle?: string;
  checkInTime?: string;
  message?: string;
}

/**
 * The projected QR holds JSON; printed or legacy codes hold the raw session token,
 * which the API resolves through attendance_sessions.qr_code_token.
 */
function parseQrPayload(raw: string): { sessionId?: string; token: string } {
  const text = raw.trim();
  try {
    const parsed = JSON.parse(text);
    if (parsed && typeof parsed === 'object') {
      const token = String(parsed.token || parsed.qrToken || '');
      const sessionId = parsed.sessionId ? String(parsed.sessionId) : undefined;
      if (token) return { sessionId, token };
    }
  } catch {}
  return { token: text };
}

function describeCameraError(err: any): ScanFailure {
  const signal = `${err?.name || ''} ${err?.message || ''}`;
  if (/NotAllowed|PermissionDenied|Permission dismissed|denied/i.test(signal)) {
    return {
      kind: 'permission',
      title: 'Camera access was blocked',
      hint: 'Press the camera icon in your browser address bar, choose “Allow”, then start the camera again. You can still scan a photo of the code or type the session token.',
    };
  }
  if (/NotFoundError|DevicesNotFound|Requested device not found/i.test(signal)) {
    return {
      kind: 'hardware',
      title: 'No camera was detected',
      hint: 'This device has no camera the browser can reach. Take a photo of the QR code on another device and use “Scan a photo”, or enter the session token.',
    };
  }
  if (!window.isSecureContext) {
    return {
      kind: 'insecure',
      title: 'Camera needs a secure address',
      hint: 'Browsers only hand out the camera over HTTPS or localhost. Open this portal through the school’s https address, or http://localhost:3000 on the lab machine.',
    };
  }
  if (/NotReadable|TrackStart|Could not start video source|in use/i.test(signal)) {
    return {
      kind: 'busy',
      title: 'The camera is already in use',
      hint: 'Close Zoom, Google Meet, Teams or another browser tab that is using the camera, then start it again.',
    };
  }
  if (/Overconstrained/i.test(signal)) {
    return {
      kind: 'hardware',
      title: 'Camera mode is not supported',
      hint: 'Your camera refused the requested mode. Try “Switch camera”, scan a photo of the code, or use the session token.',
    };
  }
  return {
    kind: 'generic',
    title: 'The camera could not start',
    hint: String(err?.message || 'Check your camera permissions and try again.'),
  };
}

function playCheckInCue() {
  try {
    if ('vibrate' in navigator) (navigator as any).vibrate?.(120);
  } catch {}
  try {
    const AudioCtor = (window as any).AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtor) return;
    const ctx = new AudioCtor();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(880, ctx.currentTime);
    gain.gain.setValueAtTime(0.0001, ctx.currentTime);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    gain.gain.exponentialRampToValueAtTime(0.12, ctx.currentTime + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.2);
    osc.stop(ctx.currentTime + 0.22);
    osc.onended = () => ctx.close();
  } catch {}
}

export function QrScannerModal({ isOpen, onClose, onSuccess }: QrScannerModalProps) {
  const { user } = useAuth();
  const studentName = user ? `${user.firstName} ${user.lastName}`.trim() || 'Learner' : 'Learner';

  const reactId = React.useId();
  const regionId = React.useMemo(() => `cnhs-qr-${reactId.replace(/[^a-zA-Z0-9]/g, '')}`, [reactId]);

  const [mode, setMode] = useState<ScanMode>('camera');
  const [phase, setPhase] = useState<ScannerPhase>('idle');
  const [failure, setFailure] = useState<ScanFailure | null>(null);
  const [lastResult, setLastResult] = useState<ScanResponse | null>(null);
  const [manualCode, setManualCode] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [cameras, setCameras] = useState<{ id: string; label: string }[]>([]);
  const [activeCameraId, setActiveCameraId] = useState<string | null>(null);
  const [torchSupported, setTorchSupported] = useState(false);
  const [torchOn, setTorchOn] = useState(false);
  const [sourceLabel, setSourceLabel] = useState('');

  const scannerRef = useRef<Html5Qrcode | null>(null);
  const lockRef = useRef(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const stopCamera = useCallback(async () => {
    const scanner = scannerRef.current;
    scannerRef.current = null;
    if (!scanner) return;
    try {
      if (scanner.isScanning) await scanner.stop();
    } catch {}
    try {
      scanner.clear();
    } catch {}
    setTorchOn(false);
    setTorchSupported(false);
  }, []);

  const submitCode = useCallback(
    async (raw: string) => {
      const text = raw.trim();
      if (!text || lockRef.current) return;
      lockRef.current = true;
      setIsSubmitting(true);
      setPhase('verifying');
      await stopCamera();
      playCheckInCue();

      try {
        const { sessionId, token } = parseQrPayload(text);
        const res = await ApiClient.post<ScanResponse>('/attendance/qr/scan', { sessionId, token });
        setLastResult(res || null);
        setPhase('success');
        const pointsOnHold = !!res?.enrolmentStatus && !['Approved', 'Completed'].includes(res.enrolmentStatus);
        toast.success(res?.alreadyPresent ? 'You are already checked in' : 'Attendance recorded!', {
          description: res?.activityTitle
            ? `${res.activityTitle} • ${res.status || 'Present'}${
                res.pointsAwarded ? ` • +${res.pointsAwarded} growth points` : pointsOnHold ? ' • points held for approval' : ''
              }`
            : res?.message || 'Your check-in was verified by the adviser’s session code.',
        });
        realtimeSync.broadcast(
          'ATTENDANCE_CHECKED_IN',
          { studentName, sessionTitle: res?.sessionTitle, activityTitle: res?.activityTitle },
          studentName,
          'STUDENT'
        );
        onSuccess?.();
        window.setTimeout(() => onClose(), 1300);
      } catch (err: any) {
        const message = err?.message || 'The session code was not recognised.';
        const isEnrolment = /not enrolled|registration/i.test(message);
        setPhase('error');
        setFailure({
          kind: isEnrolment ? 'enrolment' : 'rejected',
          title: isEnrolment ? 'You are not on this activity’s roster' : 'Check-in was not accepted',
          hint: /waking up|fetch/i.test(message)
            ? 'The school server is waking up. Try again in a few seconds.'
            : isEnrolment
            ? 'Register for the activity first — your adviser can also add you directly. Open My Activities to check your pending applications.'
            : `${message} Ask your adviser to refresh the live QR, or enter the session token shown under it.`,
        });
        toast.error('Check-in failed', { description: message });
      } finally {
        setIsSubmitting(false);
        lockRef.current = false;
      }
    },
    [onClose, onSuccess, stopCamera, studentName]
  );

  const startCamera = useCallback(
    async (preferredId?: string) => {
      if (typeof window === 'undefined') return;
      if (!window.isSecureContext || !navigator.mediaDevices?.getUserMedia) {
        setPhase('error');
        setFailure(describeCameraError({ name: 'NotFoundError' }));
        return;
      }

      setFailure(null);
      setPhase('starting');
      await stopCamera();
      if (!document.getElementById(regionId)) return;

      const scanner = new Html5Qrcode(regionId, false);
      scannerRef.current = scanner;

      let cameraId = preferredId;
      let cameraList: { id: string; label: string }[] = [];

      try {
        try {
          const devices = await Html5Qrcode.getCameras();
          cameraList = (devices || []).map((d: any, i: number) => ({ id: d.id, label: d.label || `Camera ${i + 1}` }));
          setCameras(cameraList);
          if (!cameraId && cameraList.length > 0) {
            const rear = cameraList.find((d) => /back|rear|environment|secondary/i.test(d.label));
            cameraId = (rear || cameraList[cameraList.length - 1]).id;
          }
        } catch {}

        await scanner.start(
          cameraId || { facingMode: { ideal: 'environment' } },
          {
            fps: 10,
            qrbox: (viewfinderWidth: number, viewfinderHeight: number) => {
              const side = Math.round(Math.min(viewfinderWidth, viewfinderHeight) * 0.72);
              return { width: Math.max(side, 80), height: Math.max(side, 80) };
            },
          },
          (decodedText: string) => {
            void submitCode(decodedText);
          },
          () => {}
        );

        if (scannerRef.current !== scanner) {
          try {
            await scanner.stop();
          } catch {}
          return;
        }

        setActiveCameraId(cameraId || null);
        const activeLabel = cameraList.find((d) => d.id === cameraId)?.label;
        setSourceLabel(activeLabel || 'Camera connected');
        setPhase('scanning');

        try {
          setTorchSupported(scanner.getRunningTrackCameraCapabilities().torchFeature().isSupported());
        } catch {
          setTorchSupported(false);
        }
      } catch (err: any) {
        try {
          scanner.clear();
        } catch {}
        if (scannerRef.current === scanner) scannerRef.current = null;
        if (lockRef.current) return;
        setPhase('error');
        setFailure(describeCameraError(err));
      }
    },
    [regionId, stopCamera, submitCode]
  );

  useEffect(() => {
    if (!isOpen) {
      void stopCamera();
      setPhase('idle');
      setFailure(null);
      setLastResult(null);
      setMode('camera');
      setManualCode('');
      lockRef.current = false;
      return;
    }
    return () => {
      void stopCamera();
    };
  }, [isOpen, stopCamera]);

  useEffect(() => {
    if (!isOpen || mode !== 'camera') return;
    const timer = window.setTimeout(() => {
      void startCamera();
    }, 120);
    return () => window.clearTimeout(timer);
  }, [isOpen, mode, startCamera]);

  const handleTorch = useCallback(async () => {
    const scanner = scannerRef.current;
    if (!scanner) return;
    try {
      const torch = scanner.getRunningTrackCameraCapabilities().torchFeature();
      const next = !torchOn;
      await torch.apply(next);
      setTorchOn(next);
    } catch {
      setTorchSupported(false);
    }
  }, [torchOn]);

  const handleSwitchCamera = useCallback(async () => {
    if (cameras.length < 2) {
      await startCamera(activeCameraId || undefined);
      return;
    }
    const currentIndex = cameras.findIndex((c) => c.id === activeCameraId);
    const next = cameras[(currentIndex + 1) % cameras.length];
    await startCamera(next.id);
  }, [activeCameraId, cameras, startCamera]);

  const handleImageFile = useCallback(
    async (file?: File | null) => {
      if (!file || lockRef.current) return;
      lockRef.current = true;
      setFailure(null);
      await stopCamera();
      setPhase('verifying');
      setSourceLabel(file.name);

      const scanner = new Html5Qrcode(regionId, false);
      scannerRef.current = scanner;
      try {
        const decoded = await scanner.scanFile(file, false);
        try {
          scanner.clear();
        } catch {}
        if (scannerRef.current === scanner) scannerRef.current = null;
        lockRef.current = false;
        await submitCode(String(decoded));
      } catch {
        try {
          scanner.clear();
        } catch {}
        if (scannerRef.current === scanner) scannerRef.current = null;
        lockRef.current = false;
        setPhase('error');
        setFailure({
          kind: 'generic',
          title: 'No QR code found in that image',
          hint: 'Fill the frame with the code, avoid glare and blur, then try again — or type the session token shown under the QR.',
        });
      }
    },
    [regionId, stopCamera, submitCode]
  );

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualCode.trim()) return;
    await submitCode(manualCode);
  };

  const isLive = phase === 'scanning';
  const isBusy = phase === 'starting' || phase === 'verifying';

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div className="flex items-center gap-2 text-foreground font-bold">
          <QrCode className="h-5 w-5 text-primary-600" />
          <span>Attendance Check-in</span>
        </div>
      }
      description="Point your camera at the QR code projected by your activity adviser."
      maxWidth="md"
    >
      <div className="space-y-4">
        {/* Mode switch */}
        <div className="grid grid-cols-2 gap-1 rounded-2xl border border-border/70 bg-muted/60 p-1">
          {(
            [
              { key: 'camera' as ScanMode, label: 'Camera scan', Icon: Camera },
              { key: 'token' as ScanMode, label: 'Session token', Icon: Keyboard },
            ]
          ).map(({ key, label, Icon }) => (
            <button
              key={key}
              type="button"
              onClick={() => setMode(key)}
              className={cn(
                'flex items-center justify-center gap-2 rounded-xl px-3 py-2 text-xs font-bold transition-all',
                mode === key
                  ? 'bg-card text-foreground shadow-sm ring-1 ring-border'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <Icon className="h-4 w-4" />
              {label}
            </button>
          ))}
        </div>

        {mode === 'camera' ? (
          <div className="space-y-3">
            {/* Viewfinder */}
            <div className="relative mx-auto aspect-[4/3] w-full max-w-[420px] overflow-hidden rounded-3xl border border-primary-900/30 bg-slate-950 shadow-inner">
              <div id={regionId} className="cnhs-qr-reader absolute inset-0 h-full w-full" />

              {/* Live frame overlay */}
              {isLive && (
                <div className="pointer-events-none absolute inset-0">
                  <div className="absolute inset-[12%] rounded-2xl border-2 border-emerald-400/70 shadow-[0_0_0_9999px_rgba(2,6,23,0.45)]">
                    <span className="absolute -left-1 -top-1 h-7 w-7 rounded-tl-2xl border-l-4 border-t-4 border-emerald-300" />
                    <span className="absolute -right-1 -top-1 h-7 w-7 rounded-tr-2xl border-r-4 border-t-4 border-emerald-300" />
                    <span className="absolute -bottom-1 -left-1 h-7 w-7 rounded-bl-2xl border-b-4 border-l-4 border-emerald-300" />
                    <span className="absolute -bottom-1 -right-1 h-7 w-7 rounded-br-2xl border-b-4 border-r-4 border-emerald-300" />
                    <div className="cnhs-qr-sweep absolute inset-x-3 top-1/2 h-0.5 rounded-full bg-emerald-300/80 shadow-[0_0_12px_2px_rgba(52,211,153,0.7)]" />
                  </div>
                  <span className="absolute bottom-3 left-1/2 -translate-x-1/2 rounded-full bg-slate-900/80 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-emerald-300 backdrop-blur">
                    Hold steady — scanning
                  </span>
                </div>
              )}

              {/* Idle / starting / error panel */}
              {!isLive && phase !== 'success' && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-slate-950/95 p-6 text-center">
                  {isBusy ? (
                    <>
                      <Loader2 className="h-9 w-9 animate-spin text-emerald-400" />
                      <p className="text-xs font-semibold text-slate-200">
                        {phase === 'starting' ? 'Waking up your camera…' : 'Verifying your check-in…'}
                      </p>
                    </>
                  ) : failure ? (
                    <>
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500/15 ring-1 ring-amber-400/40">
                        {failure.kind === 'permission' || failure.kind === 'insecure' ? (
                          <ShieldAlert className="h-6 w-6 text-amber-300" />
                        ) : failure.kind === 'rejected' ? (
                          <AlertTriangle className="h-6 w-6 text-rose-300" />
                        ) : (
                          <VideoOff className="h-6 w-6 text-slate-300" />
                        )}
                      </div>
                      <p className="text-sm font-bold text-white">{failure.title}</p>
                      <p className="max-w-xs text-[11px] leading-relaxed text-slate-300">{failure.hint}</p>
                    </>
                  ) : (
                    <>
                      <QrCode className="h-10 w-10 text-slate-600" />
                      <p className="text-xs font-semibold text-slate-300">Camera is paused</p>
                    </>
                  )}

                  {failure && failure.kind !== 'enrolment' && (
                    <Button size="sm" onClick={() => void startCamera()} className="mt-1 font-bold">
                      <RefreshCw className="mr-1.5 h-3.5 w-3.5" /> Start camera
                    </Button>
                  )}
                  {failure && failure.kind === 'enrolment' && (
                    <Link
                      href="/student/my-activities"
                      onClick={onClose}
                      className="mt-1 inline-flex items-center gap-1.5 rounded-lg border border-slate-500/50 px-3.5 py-1.5 text-[11px] font-bold text-white hover:bg-white/10"
                    >
                      Open My Activities
                    </Link>
                  )}
                </div>
              )}

              {/* Success flash */}
              {phase === 'success' && (
                <div className="cnhs-qr-pop absolute inset-0 flex flex-col items-center justify-center gap-2 bg-emerald-600/95 text-white">
                  <CheckCircle2 className="h-14 w-14" />
                  <p className="text-base font-black tracking-tight">Checked in!</p>
                  <p className="max-w-xs px-4 text-[11px] font-semibold leading-relaxed text-emerald-100">
                    {lastResult?.activityTitle
                      ? `${lastResult.activityTitle} • ${lastResult.pointsAwarded ? `+${lastResult.pointsAwarded} growth points` : 'points post when your adviser approves your registration'}`
                      : 'Attendance verified with your adviser'}
                  </p>
                </div>
              )}
            </div>

            {/* Camera controls */}
            <div className="flex flex-wrap items-center justify-center gap-2">
              {isLive ? (
                <Button size="sm" variant="outline" onClick={() => void stopCamera().then(() => setPhase('idle'))}>
                  <Camera className="mr-1.5 h-3.5 w-3.5" /> Stop camera
                </Button>
              ) : phase !== 'verifying' ? (
                <Button size="sm" onClick={() => void startCamera()} isLoading={phase === 'starting'} className="font-bold">
                  <Camera className="mr-1.5 h-3.5 w-3.5" /> Start camera
                </Button>
              ) : null}

              {cameras.length > 1 && (
                <Button size="sm" variant="outline" onClick={() => void handleSwitchCamera()} disabled={isBusy}>
                  <RefreshCw className="mr-1.5 h-3.5 w-3.5" /> Switch camera
                </Button>
              )}

              {torchSupported && (
                <Button
                  size="sm"
                  variant={torchOn ? 'default' : 'outline'}
                  onClick={() => void handleTorch()}
                  className={torchOn ? 'bg-amber-500 hover:bg-amber-600 text-white' : ''}
                >
                  <Zap className="mr-1.5 h-3.5 w-3.5" /> {torchOn ? 'Torch on' : 'Torch'}
                </Button>
              )}

              <Button size="sm" variant="outline" onClick={() => fileInputRef.current?.click()} disabled={isBusy}>
                <ImageIcon className="mr-1.5 h-3.5 w-3.5" /> Scan a photo
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={(e) => {
                  void handleImageFile(e.target.files?.[0]);
                  e.target.value = '';
                }}
              />
            </div>

            {sourceLabel && (
              <p className="flex items-center justify-center gap-1.5 text-[11px] text-muted-foreground">
                <Sparkles className="h-3 w-3 text-primary-500" />
                <span className="truncate max-w-[16rem]">{sourceLabel}</span>
              </p>
            )}
          </div>
        ) : (
          <form onSubmit={handleManualSubmit} className="space-y-3">
            <div className="rounded-2xl border border-dashed border-border bg-muted/30 p-3 text-[11px] leading-relaxed text-muted-foreground">
              Your adviser shows this token under the live QR code. It works even if the camera is unavailable in the computer lab.
            </div>
            <div>
              <label className="block text-xs font-bold text-foreground mb-1">Session token</label>
              <input
                type="text"
                placeholder="CNHS-ATT-… or SES-QR-…"
                value={manualCode}
                onChange={(e) => setManualCode(e.target.value)}
                autoComplete="off"
                spellCheck={false}
                className="w-full rounded-xl border border-input bg-background px-3.5 py-2.5 text-xs font-mono text-foreground focus:outline-none focus:ring-2 focus:ring-primary-500"
                required
              />
            </div>
            <div className="flex items-center justify-end gap-2">
              <Button type="button" variant="outline" size="sm" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" size="sm" isLoading={isSubmitting} className="font-bold">
                Verify & check in
              </Button>
            </div>
          </form>
        )}

        {mode === 'camera' && (
          <div className="flex items-center justify-between gap-2 border-t border-border/70 pt-3">
            <button
              type="button"
              onClick={() => setMode('token')}
              className="text-[11px] font-bold text-primary-600 hover:underline"
            >
              Camera unavailable? Enter the session token
            </button>
            <Button type="button" variant="ghost" size="sm" onClick={onClose}>
              Close
            </Button>
          </div>
        )}
      </div>
    </Modal>
  );
}
