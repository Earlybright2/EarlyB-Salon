import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { hairstyles } from "@/data/storeData";
import {
  Sparkles,
  Camera,
  Upload,
  Scan,
  X,
  Share2,
  Bookmark,
  RefreshCw,
} from "lucide-react";

const faceShapes = ["Oval", "Round", "Square", "Heart", "Diamond", "Oblong"];

export default function TryOn() {
  const [step, setStep] = useState<"upload" | "scanning" | "results">("upload");
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [detectedFaceShape, setDetectedFaceShape] = useState("");
  const [selectedHairstyle, setSelectedHairstyle] = useState(0);
  const [showCamera, setShowCamera] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        setUploadedImage(ev.target?.result as string);
        startScan();
      };
      reader.readAsDataURL(file);
    }
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setShowCamera(true);
    } catch {
      alert("Could not access camera. Please use upload instead.");
    }
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const ctx = canvasRef.current.getContext("2d");
      canvasRef.current.width = videoRef.current.videoWidth;
      canvasRef.current.height = videoRef.current.videoHeight;
      ctx?.drawImage(videoRef.current, 0, 0);
      const dataUrl = canvasRef.current.toDataURL("image/jpeg");
      setUploadedImage(dataUrl);
      setShowCamera(false);
      // Stop camera stream
      const stream = videoRef.current.srcObject as MediaStream;
      stream?.getTracks().forEach((t) => t.stop());
      startScan();
    }
  };

  const startScan = () => {
    setStep("scanning");
    // Simulate AI scanning
    setTimeout(() => {
      setDetectedFaceShape(faceShapes[Math.floor(Math.random() * faceShapes.length)]);
      setStep("results");
    }, 3000);
  };

  const reset = () => {
    setStep("upload");
    setUploadedImage(null);
    setDetectedFaceShape("");
    setSelectedHairstyle(0);
  };

  const currentHairstyle = hairstyles[selectedHairstyle];

  return (
    <div className="min-h-screen bg-ebs-bg pt-24 pb-16">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-ebs-gold/10 border border-ebs-gold/20 mb-4">
            <Sparkles className="h-4 w-4 text-ebs-gold" />
            <span className="text-sm font-medium text-ebs-gold">AI-Powered</span>
          </div>
          <h1 className="font-display text-ebs-text mb-3">
            AI Hairstyle <span className="text-gradient-gold">Try-On</span>
          </h1>
          <p className="text-ebs-text-secondary max-w-lg mx-auto">
            See how different hairstyles look on you before booking. Our AI
            analyzes your face shape and recommends the perfect styles.
          </p>
        </div>

        {/* Upload Step */}
        {step === "upload" && (
          <div className="max-w-2xl mx-auto">
            {!showCamera ? (
              <div className="rounded-2xl bg-ebs-bg-card border border-dashed border-ebs-gold/30 p-12 text-center hover:border-ebs-gold/50 transition-colors">
                <div className="h-20 w-20 rounded-full bg-ebs-gold/10 flex items-center justify-center mx-auto mb-6">
                  <Scan className="h-10 w-10 text-ebs-gold" />
                </div>
                <h3 className="font-display text-xl text-ebs-text mb-3">
                  Upload or Take a Photo
                </h3>
                <p className="text-sm text-ebs-text-muted mb-8 max-w-sm mx-auto">
                  For best results, use a front-facing photo with good lighting
                  and your hair pulled back.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <label className="cursor-pointer">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                    <span className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-gold text-ebs-bg font-semibold rounded-xl hover:shadow-gold transition-shadow">
                      <Upload className="h-5 w-5" />
                      Upload Photo
                    </span>
                  </label>
                  <button
                    onClick={startCamera}
                    className="inline-flex items-center gap-2 px-6 py-3 border border-ebs-gold/30 text-ebs-gold font-semibold rounded-xl hover:bg-ebs-gold/10 transition-colors"
                  >
                    <Camera className="h-5 w-5" />
                    Use Camera
                  </button>
                </div>
                <p className="text-xs text-ebs-text-muted mt-6">
                  PNG, JPG up to 10MB. Your photo is processed securely and never
                  stored without permission.
                </p>
              </div>
            ) : (
              <div className="rounded-2xl bg-ebs-bg-card border border-white/5 overflow-hidden">
                <div className="relative">
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    className="w-full h-[400px] object-cover"
                  />
                  <canvas ref={canvasRef} className="hidden" />
                  <button
                    onClick={() => {
                      setShowCamera(false);
                      const stream = videoRef.current?.srcObject as MediaStream;
                      stream?.getTracks().forEach((t) => t.stop());
                    }}
                    className="absolute top-4 right-4 h-10 w-10 rounded-full bg-ebs-bg/80 flex items-center justify-center text-ebs-text"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
                <div className="p-6 flex justify-center">
                  <Button
                    onClick={capturePhoto}
                    className="h-14 px-8 bg-gradient-gold text-ebs-bg font-bold text-base hover:shadow-gold"
                  >
                    <Camera className="h-5 w-5 mr-2" />
                    Capture Photo
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Scanning Step */}
        {step === "scanning" && uploadedImage && (
          <div className="max-w-2xl mx-auto text-center">
            <div className="relative rounded-2xl overflow-hidden mb-8">
              <img
                src={uploadedImage}
                alt="Scanning"
                className="w-full h-[400px] object-cover opacity-60"
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <div className="h-16 w-16 rounded-full border-4 border-ebs-gold border-t-transparent animate-spin mx-auto mb-4" />
                  <h3 className="font-display text-xl text-ebs-text mb-2">
                    Analyzing Your Features...
                  </h3>
                  <p className="text-sm text-ebs-text-muted">
                    Detecting face shape, skin tone, and hairline
                  </p>
                </div>
              </div>
              {/* Scanning animation overlay */}
              <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-0 left-0 right-0 h-0.5 bg-ebs-gold animate-[scan_3s_linear_infinite]" />
              </div>
            </div>
            <div className="flex justify-center gap-8">
              {["Face Shape", "Skin Tone", "Hairline"].map((item, i) => (
                <div key={item} className="flex items-center gap-2">
                  <div
                    className="h-6 w-6 rounded-full border-2 border-ebs-gold flex items-center justify-center"
                    style={{ animationDelay: `${i * 800}ms` }}
                  >
                    <div className="h-2 w-2 rounded-full bg-ebs-gold animate-pulse" />
                  </div>
                  <span className="text-sm text-ebs-text-secondary">{item}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Results Step */}
        {step === "results" && uploadedImage && (
          <div className="space-y-8">
            {/* Top bar */}
            <div className="flex items-center justify-between">
              <button
                onClick={reset}
                className="flex items-center gap-2 text-sm text-ebs-text-muted hover:text-ebs-gold transition-colors"
              >
                <RefreshCw className="h-4 w-4" />
                Try Another Photo
              </button>
              <div className="flex gap-2">
                <button className="p-2 text-ebs-text-muted hover:text-ebs-gold transition-colors">
                  <Share2 className="h-5 w-5" />
                </button>
                <button className="p-2 text-ebs-text-muted hover:text-ebs-rose transition-colors">
                  <Bookmark className="h-5 w-5" />
                </button>
              </div>
            </div>

            <div className="grid lg:grid-cols-[1fr_380px] gap-8">
              {/* Main preview */}
              <div className="rounded-2xl overflow-hidden bg-ebs-bg-card border border-white/5 relative">
                <img
                  src={uploadedImage}
                  alt="Your photo"
                  className="w-full h-[500px] object-cover"
                />
                <div className="absolute bottom-4 left-4 glass-panel rounded-xl px-4 py-2 border border-ebs-gold/20">
                  <p className="text-xs text-ebs-text-muted">Face Shape</p>
                  <p className="text-sm font-semibold text-ebs-gold">
                    {detectedFaceShape} ✓
                  </p>
                </div>
                <div className="absolute top-4 right-4 glass-panel rounded-xl px-4 py-2 border border-ebs-teal/20">
                  <p className="text-xs text-ebs-text-muted">Hairstyle</p>
                  <p className="text-sm font-semibold text-ebs-teal">
                    {currentHairstyle?.name}
                  </p>
                </div>
              </div>

              {/* Sidebar */}
              <div className="space-y-6">
                {/* Analysis Card */}
                <div className="rounded-2xl bg-ebs-bg-card border border-white/5 p-6">
                  <h3 className="font-display text-lg text-ebs-text mb-4">
                    Your Analysis
                  </h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 rounded-lg bg-ebs-bg">
                      <span className="text-sm text-ebs-text-secondary">
                        Face Shape
                      </span>
                      <span className="text-sm font-semibold text-ebs-gold">
                        {detectedFaceShape}
                      </span>
                    </div>
                    <div className="flex items-center justify-between p-3 rounded-lg bg-ebs-bg">
                      <span className="text-sm text-ebs-text-secondary">
                        Skin Tone
                      </span>
                      <span className="text-sm font-semibold text-ebs-teal">
                        Type IV (Medium)
                      </span>
                    </div>
                    <div className="flex items-center justify-between p-3 rounded-lg bg-ebs-bg">
                      <span className="text-sm text-ebs-text-secondary">
                        Hairline
                      </span>
                      <span className="text-sm font-semibold text-ebs-success">
                        Normal
                      </span>
                    </div>
                  </div>
                </div>

                {/* Hairstyle Selector */}
                <div className="rounded-2xl bg-ebs-bg-card border border-white/5 p-6">
                  <h3 className="font-display text-lg text-ebs-text mb-4">
                    Recommended Styles
                  </h3>
                  <div className="space-y-3">
                    {hairstyles.map((style, i) => (
                      <button
                        key={style.id}
                        onClick={() => setSelectedHairstyle(i)}
                        className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all ${
                          selectedHairstyle === i
                            ? "bg-ebs-gold/10 border border-ebs-gold/30"
                            : "bg-ebs-bg border border-white/5 hover:border-white/10"
                        }`}
                      >
                        <img
                          src={style.image}
                          alt={style.name}
                          className="h-12 w-12 rounded-lg object-cover"
                        />
                        <div className="text-left flex-1">
                          <p className="text-sm font-medium text-ebs-text">
                            {style.name}
                          </p>
                          <p className="text-xs text-ebs-text-muted capitalize">
                            {style.category} · {style.genderTarget}
                          </p>
                        </div>
                        {selectedHairstyle === i && (
                          <Sparkles className="h-4 w-4 text-ebs-gold" />
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                <Button className="w-full h-12 bg-ebs-teal hover:bg-ebs-teal-light text-white font-semibold">
                  <Sparkles className="h-5 w-5 mr-2" />
                  Book This Look
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes scan {
          0% { top: 0; }
          100% { top: 100%; }
        }
      `}</style>
    </div>
  );
}
