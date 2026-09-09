import React, { useState, useRef, useEffect } from 'react';
import {
  Camera,
  CameraOff,
  ShieldCheck,
  AlertCircle,
  Eye,
  Smile,
  Activity,
  Sparkles,
  Info,
} from 'lucide-react';
import { ApiService } from '../services/api';
import { useConsent } from '../contexts/ConsentContext';
import { useToast } from '../components/ToastNotification';

export const FacialAnalysisPage: React.FC = () => {
  const { consent, updateConsent } = useConsent();
  const { showToast } = useToast();

  const [cameraActive, setCameraActive] = useState(false);
  const [permissionState, setPermissionState] = useState<'idle' | 'granted' | 'denied'>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [autoSample, setAutoSample] = useState(true);
  const [backgroundPaused, setBackgroundPaused] = useState(false);
  const [videoDimensions, setVideoDimensions] = useState<{ width: number; height: number } | null>(null);

  const [analysisResult, setAnalysisResult] = useState<any>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  // Guards the periodic sampler against overlapping in-flight requests.
  const inFlightRef = useRef(false);
  const consecutiveErrorsRef = useRef(0);

  // Stop camera on unmount
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  // Ensure stream is attached to video element when cameraActive changes
  useEffect(() => {
    if (cameraActive && streamRef.current && videoRef.current) {
      if (videoRef.current.srcObject !== streamRef.current) {
        videoRef.current.srcObject = streamRef.current;
      }
      videoRef.current.play().catch((e) => console.warn('Video play error:', e));
    }
  }, [cameraActive]);

  // Automatic camera activation if consent granted and permission available
  useEffect(() => {
    if (consent.camera_consent && !cameraActive && !backgroundPaused) {
      if (navigator.permissions && navigator.permissions.query) {
        navigator.permissions.query({ name: 'camera' as any }).then((res) => {
          if (res.state === 'granted') {
            startCamera();
          }
        }).catch(() => {});
      }
    } else if (!consent.camera_consent && cameraActive) {
      stopCamera();
      showToast('Camera stopped: privacy consent is currently disabled.', 'info');
    }
  }, [consent.camera_consent]);

  // Foreground-only safeguard: pause camera when app is backgrounded
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        if (streamRef.current) {
          stopCamera();
          setBackgroundPaused(true);
        }
      } else {
        if (backgroundPaused && consent.camera_consent) {
          setBackgroundPaused(false);
          startCamera();
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [backgroundPaused, consent.camera_consent, cameraActive]);

  // Periodic sampler when camera is active and autoSample is enabled
  useEffect(() => {
    let interval: any = null;
    if (cameraActive && autoSample) {
      interval = setInterval(() => {
        captureAndAnalyzeFrame();
      }, 3000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [cameraActive, autoSample]);

  const startCamera = async () => {
    setErrorMessage(null);
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Your browser does not support web camera access.');
      }

      // If consent wasn't recorded, update consent state
      if (!consent.camera_consent) {
        await updateConsent('camera_consent', true);
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: 'user' },
        audio: false,
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play().catch((e) => console.warn('Video play error:', e));
      }
      setCameraActive(true);
      setPermissionState('granted');
      setBackgroundPaused(false);
      showToast('Camera feed initialized. Analyzing facial expression proxies in-memory.', 'info');
    } catch (err: any) {
      console.error('Camera access error:', err);
      setPermissionState('denied');
      setCameraActive(false);
      const msg = err.name === 'NotAllowedError'
        ? 'Camera permission was denied. Please allow camera access in your browser address bar to enable facial signal analysis.'
        : err.message || 'Unable to access camera.';
      setErrorMessage(msg);
      showToast(msg, 'error');
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setCameraActive(false);
    setAnalysisResult(null);
    setVideoDimensions(null);
  };

  const captureAndAnalyzeFrame = async () => {
    if (!videoRef.current || !canvasRef.current || !cameraActive) return;

    // The sampler fires on a fixed interval; without this guard a slow round-trip lets requests
    // stack up and results arrive out of order, making the readout jump around.
    if (inFlightRef.current) return;

    const video = videoRef.current;
    if (video.readyState < 2) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    const base64Data = canvas.toDataURL('image/jpeg', 0.8);
    inFlightRef.current = true;
    setAnalyzing(true);
    try {
      const res = await ApiService.processFacialFrame(base64Data);
      setAnalysisResult(res);
      consecutiveErrorsRef.current = 0;
    } catch (e: any) {
      if (e.message?.includes('403') || e.message?.includes('consent')) {
        stopCamera();
        showToast('Camera consent required to process facial frames.', 'warning');
      } else {
        console.warn('Facial analysis inference notice:', e);
        // Stop the sampler after repeated failures instead of hammering a failing endpoint.
        consecutiveErrorsRef.current += 1;
        if (consecutiveErrorsRef.current >= 5) {
          setAutoSample(false);
          consecutiveErrorsRef.current = 0;
          showToast(
            'Continuous analysis paused after repeated errors. Re-enable it once the connection recovers.',
            'warning',
          );
        }
      }
    } finally {
      inFlightRef.current = false;
      setAnalyzing(false);
    }
  };

  const hasFace = Boolean(analysisResult?.face_detected && analysisResult?.signals);
  const signals = analysisResult?.signals;

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white dark:bg-forest-900 border border-earth-200/80 dark:border-forest-800 rounded-2xl p-6 shadow-soft">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-sage-100 dark:bg-forest-800 text-sage-700 dark:text-sage-300 mb-2">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Privacy-First In-Memory Processing</span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-forest-950 dark:text-sage-50">
              Camera-Based Facial Signal Analysis
            </h1>
            <p className="text-xs text-earth-600 dark:text-sage-400 mt-1 max-w-2xl">
              Camera access is strictly optional. GUIDE ME uses browser camera feeds to extract subtle muscular expression proxies. No video footage or facial photos are ever recorded or stored.
            </p>
          </div>

          <div className="flex items-center gap-3">
            {!cameraActive ? (
              <button
                onClick={startCamera}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-sage-600 hover:bg-sage-700 text-white text-sm font-medium transition-colors shadow-soft"
              >
                <Camera className="w-4 h-4" />
                <span>Enable Camera</span>
              </button>
            ) : (
              <button
                onClick={stopCamera}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-earth-200 dark:bg-forest-800 hover:bg-earth-300 dark:hover:bg-forest-700 text-earth-800 dark:text-sage-200 text-sm font-medium transition-colors"
              >
                <CameraOff className="w-4 h-4 text-rose-600" />
                <span>Stop Camera</span>
              </button>
            )}
          </div>
        </div>

        {/* Error / Denial Warning */}
        {permissionState === 'denied' && errorMessage && (
          <div className="mt-4 p-4 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 text-amber-900 dark:text-amber-200 text-xs flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0 text-amber-600" />
            <div>
              <strong className="block font-semibold">Camera Access Notice:</strong>
              <span>{errorMessage}</span>
            </div>
          </div>
        )}

        {/* Active Camera Live / Paused Status Badge */}
        {cameraActive && (
          <div className="mt-4 flex items-center justify-between p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-800 dark:text-emerald-200">
            <div className="flex items-center gap-2">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
              </span>
              <span className="font-semibold">Live Camera Active · Real-Time Muscular Landmark Extraction</span>
            </div>
            <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">RAM-only analysis · No video stored</span>
          </div>
        )}

        {backgroundPaused && (
          <div className="mt-4 flex items-center gap-2 p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-xs text-amber-800 dark:text-amber-200">
            <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0" />
            <span>App is backgrounded · Camera paused automatically to protect privacy and respect OS background policy.</span>
          </div>
        )}

        {/* Edge Case Warning Banners */}
        {analysisResult?.status === 'low_light' && (
          <div className="mt-3 p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 text-amber-900 dark:text-amber-200 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0" />
            <span>Low ambient illumination detected. Please brighten your room for accurate expression signal estimation.</span>
          </div>
        )}
        {analysisResult?.status === 'multiple_faces' && (
          <div className="mt-3 p-3 rounded-xl bg-sky-50 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-900 text-sky-900 dark:text-sky-200 text-xs flex items-center gap-2">
            <Info className="w-4 h-4 text-sky-600 flex-shrink-0" />
            <span>Multiple faces detected ({analysisResult.face_count || 2}). Focus locked onto primary subject.</span>
          </div>
        )}
        {analysisResult?.status === 'no_face' && cameraActive && (
          <div className="mt-3 p-3 rounded-xl bg-earth-100 dark:bg-forest-800 text-earth-700 dark:text-sage-300 text-xs flex items-center gap-2">
            <Info className="w-4 h-4 text-sage-600 flex-shrink-0" />
            <span>No face detected in viewfinder. Align your face within the dashed viewfinder boundary.</span>
          </div>
        )}
      </div>

      {/* Main Viewfinder & Analysis Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Camera Viewfinder */}
        <div className="lg:col-span-7 bg-white dark:bg-forest-900 border border-earth-200/80 dark:border-forest-800 rounded-2xl p-6 shadow-soft flex flex-col items-center justify-center">
          <div className="w-full relative aspect-video bg-earth-100 dark:bg-forest-950 rounded-xl overflow-hidden border border-earth-200/80 dark:border-forest-800 flex items-center justify-center">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              onLoadedMetadata={() => {
                if (videoRef.current) {
                  setVideoDimensions({
                    width: videoRef.current.videoWidth,
                    height: videoRef.current.videoHeight,
                  });
                  videoRef.current.play().catch((e) => console.warn('Video play error:', e));
                }
              }}
              className={`w-full h-full object-cover transform -scale-x-100 ${cameraActive ? 'block' : 'hidden'}`}
            />
            {cameraActive ? (
              <>
                {/* Visual landmark proxy frame overlay */}
                <div className={`absolute inset-8 border border-dashed rounded-3xl pointer-events-none flex items-center justify-center transition-colors ${
                  hasFace ? 'border-emerald-400/70' : 'border-amber-400/50'
                }`}>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full backdrop-blur ${
                    hasFace ? 'text-emerald-300 bg-forest-950/70' : 'text-amber-300 bg-forest-950/70'
                  }`}>
                    {hasFace ? 'Face Locked & Measuring' : 'Position Face in Frame'}
                  </span>
                </div>
              </>
            ) : (
              <div className="text-center p-6 text-earth-400 dark:text-sage-600">
                <Camera className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p className="text-xs font-medium">Camera is currently disabled</p>
                <p className="text-[11px] mt-1 max-w-xs text-earth-500 dark:text-sage-500">
                  Click "Enable Camera" above to grant camera permission and begin in-memory facial expression estimation.
                </p>
              </div>
            )}
            <canvas ref={canvasRef} className="hidden" />
          </div>

          {/* Diagnostic Details Bar */}
          <div className="mt-3 w-full p-2.5 rounded-xl bg-earth-50 dark:bg-forest-950 border border-earth-200/80 dark:border-forest-800 flex flex-wrap items-center justify-between gap-2 text-[11px] text-earth-600 dark:text-sage-400">
            <div className="flex items-center gap-1.5">
              <span className={`w-2 h-2 rounded-full ${cameraActive ? 'bg-emerald-500 animate-pulse' : 'bg-earth-400'}`} />
              <span>Stream: <strong className="text-forest-900 dark:text-sage-200">{cameraActive ? 'Active' : 'Stopped'}</strong></span>
            </div>
            {videoDimensions && (
              <div>Resolution: <strong className="text-forest-900 dark:text-sage-200">{videoDimensions.width} × {videoDimensions.height}</strong></div>
            )}
            {analysisResult && (
              <>
                <div>Status: <strong className="text-forest-900 dark:text-sage-200">{analysisResult.status}</strong></div>
                <div>Quality: <strong className="text-forest-900 dark:text-sage-200">{Math.round((analysisResult.frame_quality || 0) * 100)}%</strong></div>
              </>
            )}
          </div>

          {/* Controls below preview */}
          {cameraActive && (
            <div className="mt-3 w-full flex items-center justify-between">
              <label className="flex items-center gap-2 text-xs text-earth-700 dark:text-sage-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={autoSample}
                  onChange={(e) => setAutoSample(e.target.checked)}
                  className="rounded text-sage-600 focus:ring-sage-500 border-earth-300"
                />
                <span>Auto-sample frame every 3s</span>
              </label>

              <button
                onClick={captureAndAnalyzeFrame}
                disabled={analyzing}
                className="px-3.5 py-1.5 rounded-lg bg-sage-600 hover:bg-sage-700 text-white text-xs font-medium transition-colors shadow-soft disabled:opacity-50"
              >
                {analyzing ? 'Extracting Landmarks...' : 'Sample Frame Now'}
              </button>
            </div>
          )}
        </div>

        {/* Real-time Signal Metrics */}
        <div className="lg:col-span-5 bg-white dark:bg-forest-900 border border-earth-200/80 dark:border-forest-800 rounded-2xl p-6 shadow-soft flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold text-forest-950 dark:text-sage-100">Extracted Expression Signals</h2>
              {analysisResult?.model_version && (
                <span className="text-[11px] font-medium text-sage-600 dark:text-sage-400 bg-sage-50 dark:bg-forest-800 px-2 py-0.5 rounded-full">
                  {analysisResult.model_version}
                </span>
              )}
            </div>

            {/* Overall Classified State */}
            <div className="p-4 rounded-xl bg-earth-50 dark:bg-forest-800/60 border border-earth-200 dark:border-forest-700 mb-5">
              <span className="text-[10px] uppercase font-bold text-earth-500 dark:text-sage-400">
                Primary Signal Indicator
              </span>
              <div className="text-lg font-semibold text-forest-900 dark:text-sage-100 mt-0.5">
                {cameraActive
                  ? analysisResult?.detected_expression || 'Analyzing frame...'
                  : 'Camera is inactive'}
              </div>
              <div className="text-xs text-earth-600 dark:text-sage-300 mt-1">
                Confidence:{' '}
                <strong className="font-semibold">
                  {hasFace ? `${Math.round(analysisResult.confidence * 100)}%` : '—'}
                </strong>
              </div>
            </div>

            {/* Signal Breakdown Bars */}
            <div className="space-y-3.5">
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-earth-600 dark:text-sage-300 flex items-center gap-1">
                    <Smile className="w-3.5 h-3.5 text-amber-500" /> Smile Ratio
                  </span>
                  <span className="font-semibold text-forest-900 dark:text-sage-100">
                    {hasFace ? `${Math.round(signals.smile_ratio * 100)}%` : '—'}
                  </span>
                </div>
                <div className="h-2 w-full bg-earth-200 dark:bg-forest-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-amber-500 transition-all duration-300"
                    style={{ width: hasFace ? `${signals.smile_ratio * 100}%` : '0%' }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-earth-600 dark:text-sage-300 flex items-center gap-1">
                    <Activity className="w-3.5 h-3.5 text-rose-500" /> Brow Furrow Index
                  </span>
                  <span className="font-semibold text-forest-900 dark:text-sage-100">
                    {hasFace ? `${Math.round(signals.brow_furrow_index * 100)}%` : '—'}
                  </span>
                </div>
                <div className="h-2 w-full bg-earth-200 dark:bg-forest-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-rose-500 transition-all duration-300"
                    style={{ width: hasFace ? `${signals.brow_furrow_index * 100}%` : '0%' }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-earth-600 dark:text-sage-300 flex items-center gap-1">
                    <Eye className="w-3.5 h-3.5 text-indigo-500" /> Eye Aperture
                  </span>
                  <span className="font-semibold text-forest-900 dark:text-sage-100">
                    {hasFace ? `${Math.round(signals.eye_aperture * 100)}%` : '—'}
                  </span>
                </div>
                <div className="h-2 w-full bg-earth-200 dark:bg-forest-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-indigo-500 transition-all duration-300"
                    style={{ width: hasFace ? `${signals.eye_aperture * 100}%` : '0%' }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-earth-600 dark:text-sage-300 flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5 text-emerald-500" /> Head Pose Stability
                  </span>
                  <span className="font-semibold text-forest-900 dark:text-sage-100">
                    {hasFace ? `${Math.round(signals.head_pose_stability * 100)}%` : '—'}
                  </span>
                </div>
                <div className="h-2 w-full bg-earth-200 dark:bg-forest-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 transition-all duration-300"
                    style={{ width: hasFace ? `${signals.head_pose_stability * 100}%` : '0%' }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Scientific & Privacy Footnote */}
          <div className="mt-6 pt-4 border-t border-earth-100 dark:border-forest-800 text-[11px] text-earth-500 dark:text-sage-400 space-y-1">
            <div className="flex items-start gap-1.5">
              <Info className="w-3.5 h-3.5 text-sage-600 mt-0.5 flex-shrink-0" />
              <span>
                <strong>Scientific Caveat:</strong> Facial signals reflect transient muscular proxies and do not diagnose medical or affective states.
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
