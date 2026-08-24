import React, { useRef, useState, useEffect } from 'react';
import { Camera, Upload, RefreshCw, FlipHorizontal, Sun, AlertCircle, Sparkles, CheckCircle2 } from 'lucide-react';

export default function CameraCapture({ onImageSelected }) {
  const videoRef = useRef(null);
  const fileInputRef = useRef(null);
  const [stream, setStream] = useState(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [facingMode, setFacingMode] = useState('environment'); // 'environment' or 'user'
  const [cameraError, setCameraError] = useState(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  // Initialize camera stream with robust fallbacks
  const startCamera = async (mode = facingMode) => {
    setCameraError(null);
    let newStream = null;

    try {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }

      // Try with preferred constraints first
      try {
        newStream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: mode },
            width: { ideal: 1280 },
            height: { ideal: 720 }
          },
          audio: false
        });
      } catch (firstErr) {
        console.warn('Strict constraints failed, trying basic video fallback:', firstErr);
        // Fallback to basic video stream without high-res constraints
        newStream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: false
        });
      }

      setStream(newStream);
      setIsCameraActive(true);

      if (videoRef.current) {
        videoRef.current.srcObject = newStream;
        try {
          await videoRef.current.play();
        } catch (playErr) {
          console.warn('Auto-play error on video element:', playErr);
        }
      }
    } catch (err) {
      console.warn('Camera access error (opening file selector fallback):', err);
      setIsCameraActive(false);
      // Auto open file picker fallback so user can choose photo smoothly
      if (fileInputRef.current) {
        fileInputRef.current.click();
      }
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setIsCameraActive(false);
  };

  useEffect(() => {
    // Cleanup stream on unmount
    return () => {
      stopCamera();
    };
  }, []);

  // Connect active stream to video DOM element whenever stream or view state updates
  useEffect(() => {
    if (stream && videoRef.current) {
      videoRef.current.srcObject = stream;
      videoRef.current.play().catch(err => console.warn('Video play error:', err));
    }
  }, [stream, isCameraActive]);

  const flipCamera = () => {
    const nextMode = facingMode === 'environment' ? 'user' : 'environment';
    setFacingMode(nextMode);
  };

  // Capture frame from live video
  const handleCapture = () => {
    if (!videoRef.current || !isCameraActive) return;
    setIsCapturing(true);

    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;
    const ctx = canvas.getContext('2d');

    if (facingMode === 'user') {
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
    }

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.92);

    stopCamera();
    setTimeout(() => {
      setIsCapturing(false);
      onImageSelected(dataUrl);
    }, 200);
  };

  // Handle Gallery file selection
  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Please select a valid image file (JPEG, PNG, WEBP).');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      stopCamera();
      onImageSelected(event.target.result);
    };
    reader.readAsDataURL(file);
  };

  // Drag & drop handlers
  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      const reader = new FileReader();
      reader.onload = (event) => {
        stopCamera();
        onImageSelected(event.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  // Generates a clean synthetic skin sample photo for instant demo testing
  const handleUseSamplePhoto = (e) => {
    e.stopPropagation();
    stopCamera();
    const canvas = document.createElement('canvas');
    canvas.width = 600;
    canvas.height = 450;
    const ctx = canvas.getContext('2d');

    // Skin background gradient
    const skinGrad = ctx.createRadialGradient(300, 225, 30, 300, 225, 300);
    skinGrad.addColorStop(0, '#e5b89b');
    skinGrad.addColorStop(0.5, '#d8a384');
    skinGrad.addColorStop(1, '#c48f70');
    ctx.fillStyle = skinGrad;
    ctx.fillRect(0, 0, 600, 450);

    // Lesion spot
    const spotGrad = ctx.createRadialGradient(300, 225, 5, 300, 225, 65);
    spotGrad.addColorStop(0, '#a83e3e');
    spotGrad.addColorStop(0.4, '#c45c5c');
    spotGrad.addColorStop(0.8, '#d88675');
    spotGrad.addColorStop(1, 'transparent');
    ctx.fillStyle = spotGrad;
    ctx.beginPath();
    ctx.arc(300, 225, 65, 0, Math.PI * 2);
    ctx.fill();

    const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
    onImageSelected(dataUrl);
  };

  const nativeCameraInputRef = useRef(null);

  return (
    <div className="w-full max-w-2xl mx-auto flex flex-col items-center gap-6 p-4">
      
      {/* Title & Instructions */}
      <div className="text-center space-y-1">
        <h2 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-slate-100 to-cyan-200 bg-clip-text text-transparent">
          Skin Capture & Photo Analysis
        </h2>
        <p className="text-sm text-slate-400 max-w-md">
          Take a live photo with camera, upload a gallery image, or try an instant demo test.
        </p>
      </div>

      {/* Main Viewport Container */}
      <div className="w-full relative rounded-3xl overflow-hidden glass-card border border-slate-700/80 shadow-2xl bg-slate-900/90 aspect-[4/3] flex items-center justify-center">
        
        {isCameraActive ? (
          <>
            {/* Live Video Stream */}
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className={`w-full h-full object-cover ${facingMode === 'user' ? 'scale-x-[-1]' : ''}`}
            />

            {/* Target Alignment Overlay */}
            <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center p-6">
              {/* Outer dimmed mask */}
              <div className="w-64 h-64 sm:w-72 sm:h-72 rounded-3xl border-2 border-dashed border-cyan-400/80 shadow-[0_0_30px_rgba(6,182,212,0.3)] relative flex items-center justify-center animate-pulse-ring">
                {/* Corner reticles */}
                <div className="absolute top-2 left-2 w-4 h-4 border-t-2 border-l-2 border-cyan-300"></div>
                <div className="absolute top-2 right-2 w-4 h-4 border-t-2 border-r-2 border-cyan-300"></div>
                <div className="absolute bottom-2 left-2 w-4 h-4 border-b-2 border-l-2 border-cyan-300"></div>
                <div className="absolute bottom-2 right-2 w-4 h-4 border-b-2 border-r-2 border-cyan-300"></div>

                <div className="text-center bg-slate-950/70 backdrop-blur-md px-3 py-1.5 rounded-full border border-cyan-500/30 text-cyan-300 text-xs font-medium flex items-center gap-1.5 shadow-md">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Center lesion here</span>
                </div>
              </div>
            </div>

            {/* Live Camera Controls Bar */}
            <div className="absolute bottom-4 left-0 right-0 px-6 flex items-center justify-between pointer-events-auto">
              <button
                onClick={flipCamera}
                className="p-3 rounded-full bg-slate-900/80 hover:bg-slate-800 text-slate-200 border border-slate-700 backdrop-blur-md transition-transform active:scale-95 shadow-lg"
                title="Switch Camera"
                aria-label="Flip Camera"
              >
                <FlipHorizontal className="w-5 h-5" />
              </button>

              {/* Main Shutter Button */}
              <button
                onClick={handleCapture}
                disabled={isCapturing}
                className="group relative p-1 rounded-full bg-gradient-to-r from-cyan-500 to-teal-400 p-1 shadow-[0_0_25px_rgba(6,182,212,0.5)] active:scale-95 transition-all"
                title="Take Photo"
              >
                <div className="w-16 h-16 rounded-full bg-slate-950 flex items-center justify-center border-2 border-white/80 group-hover:bg-slate-900 transition-colors">
                  <div className="w-12 h-12 rounded-full bg-cyan-400 group-hover:scale-90 transition-transform"></div>
                </div>
              </button>

              <button
                onClick={() => fileInputRef.current?.click()}
                className="p-3 rounded-full bg-slate-900/80 hover:bg-slate-800 text-slate-200 border border-slate-700 backdrop-blur-md transition-transform active:scale-95 shadow-lg"
                title="Upload Photo"
                aria-label="Upload from gallery"
              >
                <Upload className="w-5 h-5" />
              </button>
            </div>
          </>
        ) : (
          /* Drag and drop / Gallery landing screen */
          <div
            onDragEnter={handleDrag}
            onDragOver={handleDrag}
            onDragLeave={handleDrag}
            onDrop={handleDrop}
            className={`w-full h-full flex flex-col items-center justify-center p-6 text-center transition-colors cursor-pointer ${
              dragActive ? 'bg-cyan-950/40 border-2 border-dashed border-cyan-400' : 'bg-slate-900/60'
            }`}
            onClick={() => nativeCameraInputRef.current?.click()}
          >
            <div className="w-16 h-16 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 mb-3 shadow-inner">
              <Camera className="w-8 h-8" />
            </div>

            <h3 className="text-lg font-bold text-slate-100 mb-1">
              Take Photo or Upload Image
            </h3>

            <p className="text-xs text-slate-400 mb-5 max-w-xs">
              Click below to take a photo directly, upload from your gallery, or test a demo.
            </p>

            {/* Action Buttons Grid */}
            <div className="flex flex-wrap items-center justify-center gap-3">
              {/* Direct Camera Capture Button */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  if (nativeCameraInputRef.current) {
                    nativeCameraInputRef.current.click();
                  } else {
                    startCamera();
                  }
                }}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-teal-400 hover:from-cyan-400 hover:to-teal-300 text-slate-950 text-xs sm:text-sm font-extrabold flex items-center gap-2 transition-all shadow-lg shadow-cyan-500/20 active:scale-95"
              >
                <Camera className="w-4 h-4 stroke-[2.5]" />
                <span>Take Photo</span>
              </button>

              {/* Direct Gallery Upload Button */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  fileInputRef.current?.click();
                }}
                className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs sm:text-sm font-semibold border border-slate-700 flex items-center gap-2 transition-all shadow-md active:scale-95"
              >
                <Upload className="w-4 h-4 text-cyan-400" />
                <span>Upload from Gallery</span>
              </button>

              {/* Instant Demo Test Button */}
              <button
                type="button"
                onClick={handleUseSamplePhoto}
                className="px-4 py-2.5 rounded-xl bg-teal-950/80 hover:bg-teal-900 text-teal-300 hover:text-teal-200 text-xs sm:text-sm font-bold border border-teal-700/60 flex items-center gap-1.5 transition-all shadow-md active:scale-95"
              >
                <Sparkles className="w-4 h-4 text-teal-400" />
                <span>Try Demo Photo</span>
              </button>
            </div>
          </div>
        )}

        {/* Direct Native Camera Input */}
        <input
          ref={nativeCameraInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={handleFileSelect}
        />

        {/* Gallery File Input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileSelect}
        />
      </div>

      {/* Guidelines Card */}
      <div className="w-full glass-card p-4 rounded-2xl border border-slate-800 text-xs text-slate-300 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-cyan-400 font-semibold">
          <Sun className="w-4 h-4 shrink-0" />
          <span>Tips for Best AI Accuracy:</span>
        </div>
        <div className="flex flex-wrap items-center gap-4 text-slate-400">
          <span className="flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5 text-teal-400" /> Good lighting</span>
          <span className="flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5 text-teal-400" /> Sharp focus</span>
          <span className="flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5 text-teal-400" /> Clear view of lesion</span>
        </div>
      </div>

    </div>
  );
}
