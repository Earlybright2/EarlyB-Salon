/**
 * AI Hairstyle Try-On v3 — real MediaPipe on the client (not mock).
 */
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { hairstyles, type Hairstyle } from "@/data/storeData";
import {
  Sparkles,
  Camera,
  Upload,
  Scan,
  X,
  Share2,
  Bookmark,
  RefreshCw,
  Video,
} from "lucide-react";
import {
  initFaceLandmarker,
  detectForImage,
  isMediaPipeSupported,
} from "@/lib/ai/faceLandmarker";
import {
  runFullAnalysis,
  scoreHairstyle,
  type FullAnalysis,
} from "@/lib/ai/faceAnalysis";
import {
  drawFrameWithHairstyle,
  drawPhotoWithHairstyle,
  preloadSprite,
} from "@/lib/ai/overlayDraw";
import type { FaceLandmarker } from "@mediapipe/tasks-vision";

type Step = "upload" | "live" | "scanning" | "results";

export default function TryOn() {
  const [step, setStep] = useState<Step>("upload");
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<FullAnalysis | null>(null);
  const [selectedHairstyle, setSelectedHairstyle] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [mpReady, setMpReady] = useState(false);
  const [liveActive, setLiveActive] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const liveCanvasRef = useRef<HTMLCanvasElement>(null);
  const resultCanvasRef = useRef<HTMLCanvasElement>(null);
  const landmarkerRef = useRef<FaceLandmarker | null>(null);
  const rafRef = useRef(0);
  const spriteRef = useRef<HTMLImageElement | null>(null);
  const lastVideoTimeRef = useRef(-1);

  const ranked = useMemo(() => {
    if (!analysis) {
      return hairstyles.map((h, i) => ({
        ...h,
        recommendation_score: h.trendScore,
        _i: i,
      }));
    }
    return hairstyles
      .map((h, i) => ({
        ...h,
        recommendation_score: scoreHairstyle(h, analysis),
        _i: i,
      }))
      .sort((a, b) => b.recommendation_score - a.recommendation_score);
  }, [analysis]);

  const currentStyle: Hairstyle = ranked[selectedHairstyle] ?? hairstyles[0];

  useEffect(() => {
    if (!isMediaPipeSupported()) {
      setError(
        "This browser does not support camera / MediaPipe. Use photo upload on a modern browser."
      );
      return;
    }
    initFaceLandmarker()
      .then((lm) => {
        landmarkerRef.current = lm;
        setMpReady(true);
      })
      .catch(() => {
        setError(
          "Could not load AI model. Check network access to MediaPipe CDN."
        );
      });
    return () => {
      cancelAnimationFrame(rafRef.current);
      stopStream();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const url = currentStyle?.image;
    if (!url) return;
    preloadSprite(url)
      .then((img) => {
        spriteRef.current = img;
      })
      .catch(() => {
        spriteRef.current = null;
      });
  }, [currentStyle?.image]);

  const stopStream = () => {
    const stream = videoRef.current?.srcObject as MediaStream | null;
    stream?.getTracks().forEach((t) => t.stop());
    if (videoRef.current) videoRef.current.srcObject = null;
    setLiveActive(false);
  };

  const liveLoop = useCallback(() => {
    const video = videoRef.current;
    const canvas = liveCanvasRef.current;
    const lm = landmarkerRef.current;
    if (!video || !canvas || !lm || video.readyState < 2) {
      rafRef.current = requestAnimationFrame(liveLoop);
      return;
    }
    if (video.currentTime !== lastVideoTimeRef.current) {
      lastVideoTimeRef.current = video.currentTime;
      const w = video.videoWidth;
      const h = video.videoHeight;
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        const result = lm.detectForVideo(video, performance.now());
        const landmarks = result.faceLandmarks?.[0];
        const matrix = result.facialTransformationMatrixes?.[0]?.data as
          | number[]
          | Float32Array
          | undefined;
        drawFrameWithHairstyle(
          ctx,
          video,
          landmarks || [],
          spriteRef.current,
          matrix
        );
        if (landmarks && Math.floor(performance.now() / 500) % 2 === 0) {
          setAnalysis(runFullAnalysis(landmarks, w, h, ctx));
        }
      }
    }
    rafRef.current = requestAnimationFrame(liveLoop);
  }, []);

  const startLiveCamera = async () => {
    setError(null);
    try {
      if (!landmarkerRef.current) {
        landmarkerRef.current = await initFaceLandmarker();
        setMpReady(true);
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "user",
          width: { ideal: 720 },
          height: { ideal: 960 },
        },
        audio: false,
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setStep("live");
      setLiveActive(true);
      cancelAnimationFrame(rafRef.current);
      lastVideoTimeRef.current = -1;
      rafRef.current = requestAnimationFrame(liveLoop);
    } catch {
      setError("Camera permission denied or unavailable. Try photo upload.");
    }
  };

  const analyzeImageElement = async (
    img: HTMLImageElement,
    dataUrl: string
  ) => {
    setStep("scanning");
    setUploadedImage(dataUrl);
    setError(null);
    try {
      const result = await detectForImage(img);
      if (!result?.faceLandmarks?.[0]) {
        setError(
          "No face detected. Use a clear, front-facing photo with good light."
        );
        setStep("upload");
        return;
      }
      const landmarks = result.faceLandmarks[0];
      const w = img.naturalWidth || img.width;
      const h = img.naturalHeight || img.height;
      const off = document.createElement("canvas");
      off.width = w;
      off.height = h;
      const offCtx = off.getContext("2d");
      offCtx?.drawImage(img, 0, 0);
      setAnalysis(runFullAnalysis(landmarks, w, h, offCtx));
      await new Promise((r) => setTimeout(r, 50));
      const canvas = resultCanvasRef.current;
      if (canvas) {
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d");
        const matrix = result.facialTransformationMatrixes?.[0]?.data as
          | number[]
          | Float32Array
          | undefined;
        if (ctx) {
          drawPhotoWithHairstyle(
            ctx,
            img,
            landmarks,
            w,
            h,
            spriteRef.current,
            matrix
          );
        }
      }
      setStep("results");
    } catch (e) {
      console.error(e);
      setError("Analysis failed. Please try another photo.");
      setStep("upload");
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      const img = new Image();
      img.onload = () => analyzeImageElement(img, dataUrl);
      img.src = dataUrl;
    };
    reader.readAsDataURL(file);
  };

  const captureFromLive = () => {
    const canvas = liveCanvasRef.current;
    if (!canvas) return;
    setUploadedImage(canvas.toDataURL("image/jpeg", 0.92));
    cancelAnimationFrame(rafRef.current);
    stopStream();
    setStep("results");
  };

  const reset = () => {
    cancelAnimationFrame(rafRef.current);
    stopStream();
    setStep("upload");
    setUploadedImage(null);
    setAnalysis(null);
    setSelectedHairstyle(0);
    setError(null);
  };

  useEffect(() => {
    if (step !== "results" || !uploadedImage || liveActive) return;
    const img = new Image();
    img.onload = async () => {
      try {
        const result = await detectForImage(img);
        const landmarks = result?.faceLandmarks?.[0];
        if (!landmarks) return;
        const canvas = resultCanvasRef.current;
        if (!canvas) return;
        const w = img.naturalWidth;
        const h = img.naturalHeight;
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d");
        const matrix = result?.facialTransformationMatrixes?.[0]?.data as
          | number[]
          | Float32Array
          | undefined;
        if (ctx) {
          drawPhotoWithHairstyle(
            ctx,
            img,
            landmarks,
            w,
            h,
            spriteRef.current,
            matrix
          );
        }
      } catch {
        /* ignore */
      }
    };
    img.src = uploadedImage;
  }, [selectedHairstyle, step, uploadedImage, liveActive, currentStyle?.image]);

  return (
    <div className="min-h-screen bg-ebs-bg pt-24 pb-16">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-ebs-gold/10 border border-ebs-gold/20 mb-4">
            <Sparkles className="h-4 w-4 text-ebs-gold" />
            <span className="text-sm font-medium text-ebs-gold">
              AI-Powered · MediaPipe
            </span>
          </div>
          <h1 className="font-display text-ebs-text mb-3">
            AI Hairstyle <span className="text-gradient-gold">Try-On</span>
          </h1>
          <p className="text-ebs-text-secondary max-w-lg mx-auto">
            Real-time face tracking in your browser. We analyze face shape, skin
            tone, hair density, beard, and hairline — then recommend styles that
            fit you.
          </p>
          {!mpReady && !error && (
            <p className="text-xs text-ebs-text-muted mt-2">Loading AI model…</p>
          )}
          {error && (
            <p className="text-sm text-red-400 mt-3 max-w-md mx-auto">{error}</p>
          )}
        </div>

        {step === "upload" && (
          <div className="max-w-2xl mx-auto">
            <div className="rounded-2xl bg-ebs-bg-card border border-dashed border-ebs-gold/30 p-12 text-center hover:border-ebs-gold/50 transition-colors">
              <div className="h-20 w-20 rounded-full bg-ebs-gold/10 flex items-center justify-center mx-auto mb-6">
                <Scan className="h-10 w-10 text-ebs-gold" />
              </div>
              <h3 className="font-display text-xl text-ebs-text mb-3">
                Upload or Live Camera
              </h3>
              <p className="text-sm text-ebs-text-muted mb-8 max-w-sm mx-auto">
                Front-facing light works best. Processing runs on-device with
                MediaPipe — your live feed is not uploaded until you save.
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
                  onClick={startLiveCamera}
                  disabled={!mpReady}
                  className="inline-flex items-center gap-2 px-6 py-3 border border-ebs-gold/30 text-ebs-gold font-semibold rounded-xl hover:bg-ebs-gold/10 transition-colors disabled:opacity-50"
                >
                  <Video className="h-5 w-5" />
                  Live Try-On
                </button>
              </div>
            </div>
          </div>
        )}

        {step === "live" && (
          <div className="max-w-3xl mx-auto">
            <div className="rounded-2xl bg-ebs-bg-card border border-white/5 overflow-hidden relative">
              <video ref={videoRef} playsInline muted className="hidden" />
              <canvas
                ref={liveCanvasRef}
                className="w-full max-h-[70vh] object-contain bg-black"
              />
              <button
                onClick={reset}
                className="absolute top-4 right-4 h-10 w-10 rounded-full bg-ebs-bg/80 flex items-center justify-center text-ebs-text"
              >
                <X className="h-5 w-5" />
              </button>
              {analysis && (
                <div className="absolute bottom-4 left-4 glass-panel rounded-xl px-4 py-2 border border-ebs-gold/20 text-left">
                  <p className="text-xs text-ebs-text-muted">Live analysis</p>
                  <p className="text-sm font-semibold text-ebs-gold">
                    {analysis.faceShape.faceShape} · {analysis.skinTone.label}
                  </p>
                  <p className="text-xs text-ebs-text-secondary">
                    Hairline: {analysis.hairline.stage.replace(/_/g, " ")} ·{" "}
                    {analysis.beard.style.replace(/_/g, " ")}
                  </p>
                </div>
              )}
            </div>
            <div className="mt-4 flex flex-wrap gap-3 justify-center">
              <Button
                onClick={captureFromLive}
                className="h-12 px-8 bg-gradient-gold text-ebs-bg font-bold"
              >
                <Camera className="h-5 w-5 mr-2" />
                Capture & Continue
              </Button>
            </div>
            <div className="mt-6 flex gap-3 overflow-x-auto pb-2">
              {ranked.map((style, i) => (
                <button
                  key={style.id}
                  onClick={() => setSelectedHairstyle(i)}
                  className={`flex-shrink-0 rounded-xl border p-2 ${
                    selectedHairstyle === i
                      ? "border-ebs-gold bg-ebs-gold/10"
                      : "border-white/10"
                  }`}
                >
                  <img
                    src={style.image}
                    alt={style.name}
                    className="h-14 w-14 rounded-lg object-cover"
                  />
                  <p className="text-[10px] text-ebs-text-muted mt-1 max-w-[56px] truncate">
                    {style.name}
                  </p>
                </button>
              ))}
            </div>
          </div>
        )}

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
                    Running MediaPipe analysis…
                  </h3>
                  <p className="text-sm text-ebs-text-muted">
                    Face shape · Skin tone · Density · Beard · Hairline
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {step === "results" && (
          <div className="space-y-8">
            <div className="flex items-center justify-between">
              <button
                onClick={reset}
                className="flex items-center gap-2 text-sm text-ebs-text-muted hover:text-ebs-gold transition-colors"
              >
                <RefreshCw className="h-4 w-4" />
                Try Another
              </button>
              <div className="flex gap-2">
                <button className="p-2 text-ebs-text-muted hover:text-ebs-gold">
                  <Share2 className="h-5 w-5" />
                </button>
                <button className="p-2 text-ebs-text-muted hover:text-ebs-rose">
                  <Bookmark className="h-5 w-5" />
                </button>
              </div>
            </div>

            <div className="grid lg:grid-cols-[1fr_380px] gap-8">
              <div className="rounded-2xl overflow-hidden bg-ebs-bg-card border border-white/5 relative">
                <canvas
                  ref={resultCanvasRef}
                  className="w-full h-auto max-h-[560px] object-contain bg-black"
                />
                {analysis && (
                  <div className="absolute bottom-4 left-4 glass-panel rounded-xl px-4 py-2 border border-ebs-gold/20">
                    <p className="text-xs text-ebs-text-muted">Face Shape</p>
                    <p className="text-sm font-semibold text-ebs-gold">
                      {analysis.faceShape.faceShape} ✓{" "}
                      {Math.round(analysis.faceShape.confidence * 100)}%
                    </p>
                  </div>
                )}
                <div className="absolute top-4 right-4 glass-panel rounded-xl px-4 py-2 border border-ebs-teal/20">
                  <p className="text-xs text-ebs-text-muted">Hairstyle</p>
                  <p className="text-sm font-semibold text-ebs-teal">
                    {currentStyle?.name}
                  </p>
                </div>
              </div>

              <div className="space-y-6">
                <div className="rounded-2xl bg-ebs-bg-card border border-white/5 p-6">
                  <h3 className="font-display text-lg text-ebs-text mb-4">
                    Your Analysis
                  </h3>
                  <div className="space-y-3">
                    <Row
                      label="Face Shape"
                      value={
                        analysis
                          ? `${analysis.faceShape.faceShape} (${Math.round(analysis.faceShape.confidence * 100)}%)`
                          : "—"
                      }
                      accent="gold"
                    />
                    <Row
                      label="Skin Tone"
                      value={analysis?.skinTone.label ?? "—"}
                      accent="teal"
                    />
                    <Row
                      label="Hair Density"
                      value={
                        analysis
                          ? `${analysis.hairDensity.level.replace(/_/g, " ")} (${Math.round(analysis.hairDensity.score * 100)}%)`
                          : "—"
                      }
                    />
                    <Row
                      label="Beard"
                      value={
                        analysis
                          ? analysis.beard.style.replace(/_/g, " ")
                          : "—"
                      }
                    />
                    <Row
                      label="Hairline"
                      value={
                        analysis
                          ? `${analysis.hairline.stage.replace(/_/g, " ")} · N${analysis.hairline.norwoodEstimate}`
                          : "—"
                      }
                      accent="success"
                    />
                  </div>
                  {analysis?.hairline.notes && (
                    <p className="text-xs text-ebs-text-muted mt-3">
                      {analysis.hairline.notes}
                    </p>
                  )}
                </div>

                <div className="rounded-2xl bg-ebs-bg-card border border-white/5 p-6">
                  <h3 className="font-display text-lg text-ebs-text mb-1">
                    Recommended Styles
                  </h3>
                  <p className="text-xs text-ebs-text-muted mb-4">
                    Ranked by face shape, trend, celebrity, hairline & density
                  </p>
                  <div className="space-y-3 max-h-[320px] overflow-y-auto">
                    {ranked.map((style, i) => (
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
                            {style.isCelebrity && (
                              <span className="ml-1 text-[10px] text-ebs-gold">
                                ★ {style.celebrityName || "Celebrity"}
                              </span>
                            )}
                          </p>
                          <p className="text-xs text-ebs-text-muted capitalize">
                            {style.category} · score{" "}
                            {Math.round(style.recommendation_score)}
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
    </div>
  );
}

function Row({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: "gold" | "teal" | "success";
}) {
  const color =
    accent === "gold"
      ? "text-ebs-gold"
      : accent === "teal"
        ? "text-ebs-teal"
        : accent === "success"
          ? "text-ebs-success"
          : "text-ebs-text";
  return (
    <div className="flex items-center justify-between p-3 rounded-lg bg-ebs-bg">
      <span className="text-sm text-ebs-text-secondary">{label}</span>
      <span className={`text-sm font-semibold capitalize ${color}`}>{value}</span>
    </div>
  );
}
