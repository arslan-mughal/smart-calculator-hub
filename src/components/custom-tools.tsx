import { useEffect, useRef, useState } from "react";
import {
  Check,
  Download,
  FileImage,
  Image as ImageIcon,
  Lock,
  QrCode,
  Unlock,
  Upload,
} from "lucide-react";

export function ImageResizer() {
  const [source, setSource] = useState<{
    url: string;
    name: string;
    width: number;
    height: number;
    size: number;
  }>();
  const [width, setWidth] = useState(1200);
  const [height, setHeight] = useState(900);
  const [locked, setLocked] = useState(true);
  const [format, setFormat] = useState("image/webp");
  const [quality, setQuality] = useState(90);
  const [result, setResult] = useState<{ url: string; size: number }>();
  const imageRef = useRef<HTMLImageElement>(null);

  useEffect(
    () => () => {
      if (source) URL.revokeObjectURL(source.url);
    },
    [source],
  );
  useEffect(
    () => () => {
      if (result) URL.revokeObjectURL(result.url);
    },
    [result],
  );

  const [fileError, setFileError] = useState("");
  const MAX_FILE_BYTES = 10 * 1024 * 1024; // 10 MB
  const MAX_DIMENSION = 8000;

  function chooseFile(file?: File) {
    setFileError("");
    if (!file) return;
    if (file.type === "image/svg+xml") {
      setFileError("SVG images are not accepted — please choose a JPG, PNG, WebP, GIF or BMP file.");
      return;
    }
    if (!file.type.startsWith("image/")) {
      setFileError("Please choose an image file.");
      return;
    }
    if (file.size > MAX_FILE_BYTES) {
      setFileError("That image is over 10 MB. Please choose a smaller file.");
      return;
    }
    const url = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      if (image.naturalWidth > MAX_DIMENSION || image.naturalHeight > MAX_DIMENSION) {
        URL.revokeObjectURL(url);
        setFileError(`That image is ${image.naturalWidth} x ${image.naturalHeight} px — images over ${MAX_DIMENSION} px on either side are not supported.`);
        return;
      }
      setSource({
        url,
        name: file.name,
        width: image.naturalWidth,
        height: image.naturalHeight,
        size: file.size,
      });
      setWidth(image.naturalWidth);
      setHeight(image.naturalHeight);
      setResult(undefined);
    };
    image.src = url;
  }

  function changeWidth(value: number) {
    setWidth(Math.max(1, Math.min(MAX_DIMENSION, value || 1)));
    if (locked && source)
      setHeight(Math.max(1, Math.round((value * source.height) / source.width)));
  }

  function changeHeight(value: number) {
    setHeight(Math.max(1, Math.min(MAX_DIMENSION, value || 1)));
    if (locked && source) setWidth(Math.max(1, Math.round((value * source.width) / source.height)));
  }

  function resize() {
    const image = imageRef.current;
    if (!image || !source || width < 1 || height < 1 || width > MAX_DIMENSION || height > MAX_DIMENSION) return;
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext("2d");
    if (!context) return;
    context.imageSmoothingEnabled = true;
    context.imageSmoothingQuality = "high";
    context.drawImage(image, 0, 0, width, height);
    canvas.toBlob(
      (blob) => {
        if (!blob) return;
        setResult({ url: URL.createObjectURL(blob), size: blob.size });
      },
      format,
      quality / 100,
    );
  }

  const extension = format === "image/png" ? "png" : format === "image/jpeg" ? "jpg" : "webp";

  return (
    <div className="space-y-6">
      {!source ? (
        <label className="flex min-h-64 cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-input bg-muted/40 p-8 text-center transition hover:border-primary hover:bg-muted">
          <span className="rounded-2xl bg-secondary p-4 text-primary">
            <Upload className="size-7" />
          </span>
          <span className="mt-4 text-lg font-bold">Choose an image to resize</span>
          <span className="mt-1 text-sm text-muted-foreground">
            JPG, PNG, WebP, GIF or BMP · processed on your device
          </span>
          <span className="mt-5 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground">
            Browse files
          </span>
          <input
            type="file"
            accept="image/*"
            className="sr-only"
            onChange={(event) => chooseFile(event.target.files?.[0])}
          />
        </label>
      ) : (
        <div className="grid gap-6 md:grid-cols-[220px_1fr]">
          <div className="rounded-xl border border-border bg-muted/40 p-3">
            <img
              ref={imageRef}
              src={source.url}
              alt="Selected original"
              className="aspect-square w-full rounded-lg object-contain"
            />
            <p className="mt-3 truncate text-sm font-semibold">{source.name}</p>
            <p className="mt-1 text-xs text-muted-foreground">
              {source.width} × {source.height} px · {(source.size / 1024).toFixed(0)} KB
            </p>
            <label className="mt-3 block cursor-pointer text-sm font-semibold text-primary hover:underline">
              Replace image
              <input
                type="file"
                accept="image/*"
                className="sr-only"
                onChange={(event) => chooseFile(event.target.files?.[0])}
              />
            </label>
          </div>
          <div className="space-y-4">
            <div className="grid grid-cols-[1fr_auto_1fr] items-end gap-3">
              <label className="text-sm font-medium">
                Width (px)
                <input
                  type="number"
                  min="1"
                  max="8000"
                  value={width}
                  onChange={(e) => changeWidth(Number(e.target.value))}
                  className="mt-1.5 w-full rounded-lg border border-input bg-background px-3 py-2.5 outline-none focus:ring-2 focus:ring-ring"
                />
              </label>
              <button
                type="button"
                onClick={() => setLocked(!locked)}
                aria-label={locked ? "Unlock aspect ratio" : "Lock aspect ratio"}
                className="mb-1 rounded-lg border border-border p-2.5 text-primary hover:bg-muted"
              >
                {locked ? <Lock className="size-4" /> : <Unlock className="size-4" />}
              </button>
              <label className="text-sm font-medium">
                Height (px)
                <input
                  type="number"
                  min="1"
                  max="8000"
                  value={height}
                  onChange={(e) => changeHeight(Number(e.target.value))}
                  className="mt-1.5 w-full rounded-lg border border-input bg-background px-3 py-2.5 outline-none focus:ring-2 focus:ring-ring"
                />
              </label>
            </div>
            <div className="flex flex-wrap gap-2">
              {[25, 50, 75].map((percent) => (
                <button
                  key={percent}
                  type="button"
                  onClick={() => changeWidth(Math.round((source.width * percent) / 100))}
                  className="rounded-full border border-border px-3 py-1.5 text-xs font-semibold hover:border-primary hover:text-primary"
                >
                  {percent}% of original
                </button>
              ))}
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="text-sm font-medium">
                Download format
                <select
                  value={format}
                  onChange={(e) => setFormat(e.target.value)}
                  className="mt-1.5 w-full rounded-lg border border-input bg-background px-3 py-2.5"
                >
                  <option value="image/webp">WebP</option>
                  <option value="image/jpeg">JPG</option>
                  <option value="image/png">PNG</option>
                </select>
              </label>
              <label className="text-sm font-medium">
                Quality · {quality}%
                <input
                  type="range"
                  min="10"
                  max="100"
                  value={quality}
                  onChange={(e) => setQuality(Number(e.target.value))}
                  className="mt-4 w-full accent-primary"
                />
              </label>
            </div>
            <button
              type="button"
              onClick={resize}
              className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-5 py-3 font-semibold text-primary-foreground hover:bg-primary/90"
            >
              <ImageIcon className="size-4" /> Resize image
            </button>
          </div>
        </div>
      )}
      {fileError && (
        <p role="alert" className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{fileError}</p>
      )}
      {result && (
        <div className="flex flex-col items-center rounded-2xl border border-primary/20 bg-secondary p-6 text-center">
          <span className="rounded-full bg-accent p-2 text-accent-foreground">
            <Check className="size-5" />
          </span>
          <p className="mt-3 font-bold">
            Your {width} × {height} image is ready
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            New file size: {(result.size / 1024).toFixed(0)} KB
          </p>
          <a
            href={result.url}
            download={`resized-${width}x${height}.${extension}`}
            className="mt-4 inline-flex items-center gap-2 rounded-lg bg-accent px-5 py-2.5 font-semibold text-accent-foreground hover:bg-accent/90"
          >
            <Download className="size-4" /> Download image
          </a>
        </div>
      )}
      <p className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
        <FileImage className="size-4" /> Your image never leaves your device.
      </p>
    </div>
  );
}

export function QrCodeGenerator() {
  const [text, setText] = useState("https://example.com");
  const [size, setSize] = useState(512);
  const [level, setLevel] = useState<"L" | "M" | "Q" | "H">("M");
  const [dataUrl, setDataUrl] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    const timer = window.setTimeout(() => {
      import("qrcode")
        .then((QRCode) =>
          QRCode.toDataURL(text || " ", { width: size, margin: 2, errorCorrectionLevel: level }),
        )
        .then((url) => {
          if (active) {
            setDataUrl(url);
            setError("");
          }
        })
        .catch(() => {
          if (active) setError("This text is too long for a QR code. Shorten it and try again.");
        });
    }, 180);
    return () => {
      active = false;
      window.clearTimeout(timer);
    };
  }, [text, size, level]);

  return (
    <div className="grid gap-8 md:grid-cols-[1fr_280px]">
      <div className="space-y-5">
        <label className="block text-sm font-medium">
          Link or text
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={6}
            className="mt-1.5 w-full resize-y rounded-lg border border-input bg-background px-3 py-3 text-base outline-none focus:ring-2 focus:ring-ring"
            placeholder="Paste a URL or enter text"
          />
        </label>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="text-sm font-medium">
            Image size
            <select
              value={size}
              onChange={(e) => setSize(Number(e.target.value))}
              className="mt-1.5 w-full rounded-lg border border-input bg-background px-3 py-2.5"
            >
              <option value="256">256 × 256 px</option>
              <option value="512">512 × 512 px</option>
              <option value="768">768 × 768 px</option>
              <option value="1024">1024 × 1024 px</option>
            </select>
          </label>
          <label className="text-sm font-medium">
            Error correction
            <select
              value={level}
              onChange={(e) => setLevel(e.target.value as "L" | "M" | "Q" | "H")}
              className="mt-1.5 w-full rounded-lg border border-input bg-background px-3 py-2.5"
            >
              <option value="L">Low · 7%</option>
              <option value="M">Medium · 15%</option>
              <option value="Q">Quartile · 25%</option>
              <option value="H">High · 30%</option>
            </select>
          </label>
        </div>
        <p className="text-sm text-muted-foreground">
          Static QR codes contain the text itself and never expire. Test your code before printing.
        </p>
        {error && (
          <p role="alert" className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
            {error}
          </p>
        )}
      </div>
      <div className="h-fit rounded-2xl border border-border bg-muted/40 p-5 text-center">
        {dataUrl ? (
          <img src={dataUrl} alt="Generated QR code" className="mx-auto w-full rounded-lg" />
        ) : (
          <div className="flex aspect-square items-center justify-center">
            <QrCode className="size-16 text-muted-foreground" />
          </div>
        )}
        {dataUrl && (
          <a
            href={dataUrl}
            download="calchub-qr-code.png"
            className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
          >
            <Download className="size-4" /> Download PNG
          </a>
        )}
        <p className="mt-3 text-xs text-muted-foreground">Generated locally in your browser</p>
      </div>
    </div>
  );
}
