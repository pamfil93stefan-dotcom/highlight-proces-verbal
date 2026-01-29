
import React, { useRef, useState, useEffect, useCallback } from 'react';
import { PhotoAngle } from '../types';

interface CameraModalProps {
  angle: PhotoAngle;
  onCapture: (base64: string) => void;
  onClose: () => void;
}

const CameraModal: React.FC<CameraModalProps> = ({ angle, onCapture, onClose }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [cameraReady, setCameraReady] = useState(false);
  const [showFlash, setShowFlash] = useState(false);

  useEffect(() => {
    document.body.classList.add('camera-open');
    let activeStream: MediaStream | null = null;
    
    async function setupCamera() {
      // Extended constraints for maximum compatibility
      const constraintSets = [
        { video: { facingMode: { exact: 'environment' }, width: { ideal: 1280 }, height: { ideal: 720 } }, audio: false },
        { video: { facingMode: 'environment', width: { ideal: 1024 } }, audio: false },
        { video: { width: { ideal: 640 }, height: { ideal: 480 } }, audio: false },
        { video: true, audio: false }
      ];

      let lastError: any = null;

      for (const constraints of constraintSets) {
        try {
          console.log("Attempting camera:", JSON.stringify(constraints));
          const s = await navigator.mediaDevices.getUserMedia(constraints);
          activeStream = s;
          setStream(s);
          
          if (videoRef.current) {
            videoRef.current.srcObject = s;
            // Force attributes for mobile
            videoRef.current.setAttribute('playsinline', 'true');
            videoRef.current.setAttribute('autoplay', 'true');
            videoRef.current.setAttribute('muted', 'true');

            videoRef.current.onloadedmetadata = async () => {
              try {
                await videoRef.current?.play();
                setCameraReady(true);
              } catch (e) {
                console.error("Video play error:", e);
              }
            };
          }
          return; 
        } catch (err) {
          console.warn("Constraints set failed:", err);
          lastError = err;
        }
      }

      setError(`Eroare cameră: ${lastError?.name || 'Acces Refuzat'}. Verifică permisiunile browserului.`);
    }

    setupCamera();

    return () => {
      document.body.classList.remove('camera-open');
      if (activeStream) {
        activeStream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const takePhoto = useCallback(async () => {
    if (isCapturing || !cameraReady || !videoRef.current || !canvasRef.current) return;
    
    setIsCapturing(true);
    setShowFlash(true);
    
    setTimeout(() => setShowFlash(false), 150);

    try {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      
      // Capture at a reasonable resolution to avoid memory issues (max 1280px width)
      const scale = Math.min(1, 1280 / video.videoWidth);
      const width = video.videoWidth * scale;
      const height = video.videoHeight * scale;
      
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, width, height);
        // Use JPEG with 0.7 quality to keep Base64 strings lean
        const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
        onCapture(dataUrl);
        setTimeout(onClose, 200);
      }
    } catch (err) {
      console.error("Capture Error:", err);
      setIsCapturing(false);
    }
  }, [onCapture, onClose, isCapturing, cameraReady]);

  return (
    <div className="fixed inset-0 z-[9999] flex flex-col bg-black overflow-hidden touch-none select-none">
      {showFlash && (
        <div className="absolute inset-0 bg-white z-[10000] pointer-events-none transition-opacity duration-150"></div>
      )}

      <div className="safe-top absolute top-0 left-0 right-0 z-50">
        <div className="flex justify-between items-center p-6">
          <div className="bg-black/60 backdrop-blur-xl px-5 py-2.5 rounded-2xl border border-white/20">
             <span className="text-white font-black text-[10px] tracking-widest uppercase">{angle}</span>
          </div>
          <button 
            onClick={onClose} 
            className="w-12 h-12 bg-black/60 backdrop-blur-xl rounded-2xl flex items-center justify-center text-white border border-white/20 active:scale-75 transition-all"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
      </div>

      <div className="flex-1 relative bg-black flex items-center justify-center">
        {!cameraReady && !error && (
          <div className="text-white text-center">
            <div className="w-10 h-10 border-4 border-white/20 border-t-white rounded-full animate-spin mx-auto mb-4"></div>
            <p className="font-black text-[9px] uppercase tracking-widest opacity-50">Inițializare Cameră...</p>
          </div>
        )}

        {error ? (
          <div className="p-10 text-center text-white space-y-6">
            <p className="font-bold text-sm text-red-400">{error}</p>
            <button 
              onClick={onClose} 
              className="px-8 py-4 bg-white text-black rounded-2xl font-black uppercase tracking-widest text-[10px] active:scale-95 transition-all"
            >
              Închide
            </button>
          </div>
        ) : (
          <video 
            ref={videoRef} 
            autoPlay 
            playsInline 
            muted
            className={`w-full h-full object-cover transition-opacity duration-700 ${cameraReady ? 'opacity-100' : 'opacity-0'}`}
          />
        )}

        {cameraReady && !error && (
          <div className="absolute inset-10 border border-white/10 pointer-events-none rounded-[40px]">
             <div className="absolute top-1/2 left-0 right-0 h-px bg-white/20"></div>
             <div className="absolute left-1/2 top-0 bottom-0 w-px bg-white/20"></div>
          </div>
        )}
      </div>

      <div className="bg-black pb-16 pt-8 safe-bottom flex justify-center items-center">
        <button
          onClick={takePhoto}
          disabled={!cameraReady || isCapturing}
          className={`relative flex items-center justify-center active:scale-90 transition-all duration-150 ${!cameraReady || isCapturing ? 'opacity-30' : 'opacity-100'}`}
        >
          <div className="w-20 h-20 rounded-full border-4 border-white flex items-center justify-center p-1.5">
            <div className={`w-full h-full rounded-full transition-all duration-150 ${isCapturing ? 'bg-slate-400' : 'bg-white'}`}></div>
          </div>
        </button>
      </div>
      
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
};

export default CameraModal;
