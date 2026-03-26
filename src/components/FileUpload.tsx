
import { useState, useRef, DragEvent, ChangeEvent } from "react";
import {
  Upload,
  X,
  FileImage,
  FileText,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface UploadedNote {
  id: number;
  title: string;
  file_key: string;
  file_url: string;
}

interface FileUploadProps {
  userId: string;    // clerk user id — used as S3 key prefix
  clerkId: string;   // same value — passed to backend to resolve db user
  accept?: string;
  maxSizeMB?: number;
  onSuccess?: (note: UploadedNote) => void;
  onError?: (error: string) => void;
}

type UploadStatus = "idle" | "dragging" | "uploading" | "success" | "error";

function fileIcon(name: string) {
  return name.split(".").pop()?.toLowerCase() === "pdf" ? FileText : FileImage;
}

function formatSize(bytes: number) {
  return bytes < 1024 * 1024
    ? `${(bytes / 1024).toFixed(1)} KB`
    : `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// Produces a clean S3-safe filename
function sanitizeFilename(name: string) {
  const ext = name.split(".").pop()?.toLowerCase() ?? "";
  const base = name
    .replace(/\.[^/.]+$/, "")
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9\-_]/g, "")
    .slice(0, 80);
  return `${base}.${ext}`;
}

export default function FileUpload({
  userId,
  clerkId,
  accept = ".jpg,.jpeg,.png,.pdf",
  maxSizeMB = 10,
  onSuccess,
  onError,
}: FileUploadProps) {
  const [status, setStatus] = useState<UploadStatus>("idle");
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [progress, setProgress] = useState(0);
  const [errorMsg, setErrorMsg] = useState("");
  const [uploadedNote, setUploadedNote] = useState<UploadedNote | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const maxBytes = maxSizeMB * 1024 * 1024;

  const validate = (f: File): string | null => {
    if (f.size > maxBytes) return `File exceeds ${maxSizeMB}MB limit.`;
    const ext = "." + f.name.split(".").pop()?.toLowerCase();
    const allowed = accept.split(",").map((a) => a.trim().toLowerCase());
    if (!allowed.includes(ext))
      return `File type not allowed. Accepted: ${accept}`;
    return null;
  };

  const handleFile = (f: File) => {
    const err = validate(f);
    if (err) {
      setErrorMsg(err);
      setStatus("error");
      onError?.(err);
      return;
    }
    setFile(f);
    setStatus("idle");
    setErrorMsg("");
    if (!title) {
      setTitle(f.name.replace(/\.[^/.]+$/, "").replace(/[-_]/g, " "));
    }
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setStatus("idle");
    const f = e.dataTransfer.files[0];
    if (f) handleFile(f);
  };

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) handleFile(f);
  };

 const handleUpload = async () => {
  if (!file || !title.trim()) return;
  setStatus("uploading");
  setProgress(0);

  try {
    const safe = sanitizeFilename(file.name);
    const s3Key = `${userId}/notes/${Date.now()}-${safe}`;

    // FormData sends the file as raw binary — no JSON serialization
    const form = new FormData();
    form.append("file", file);           // binary blob
    form.append("clerkId", clerkId);
    form.append("title", title.trim());
    form.append("s3Key", s3Key);

    const tick = setInterval(() => {
      setProgress((p) => Math.min(p + 10, 85));
    }, 180);

    const res = await fetch(
      `${import.meta.env.VITE_API_URL}/api/notes/upload`,
      {
        method: "POST",
        // Do NOT set Content-Type header — browser sets it automatically
        // with the correct multipart boundary when using FormData
        body: form,
      }
    );

    clearInterval(tick);

    if (!res.ok) {
      const { error } = await res.json().catch(() => ({}));

      console.error("Upload failed:", error);
      throw new Error(error ?? "Upload failed.");
    }

    const note: UploadedNote = await res.json();
    setProgress(100);
    setStatus("success");
    setUploadedNote(note);
    onSuccess?.(note);
  } catch (err: any) {
    setStatus("error");
    const msg = err.message ?? "Something went wrong.";
    setErrorMsg(msg);
    onError?.(msg);
  }
};

  const reset = () => {
    setFile(null);
    setTitle("");
    setStatus("idle");
    setProgress(0);
    setErrorMsg("");
    setUploadedNote(null);
    if (inputRef.current) inputRef.current.value = "";
  };

  const FileIcon = file ? fileIcon(file.name) : Upload;
  const busy = status === "uploading" || status === "success";

  return (
    <div className="w-full space-y-3">
      {/* Title */}
      <div className="space-y-1.5">
        <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Note title *
        </label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. Data Structures Week 3"
          disabled={busy}
          className="w-full rounded-lg border border-input bg-background-subtle px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring disabled:opacity-50 transition-all"
        />
      </div>

      {/* Drop zone */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          if (!busy) setStatus("dragging");
        }}
        onDragLeave={() => setStatus((s) => (s === "dragging" ? "idle" : s))}
        onDrop={handleDrop}
        onClick={() => !file && !busy && inputRef.current?.click()}
        className={cn(
          "relative flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed p-7 transition-all duration-200",
          status === "dragging"
            ? "border-primary bg-primary/5"
            : "border-border hover:border-primary/40 hover:bg-background-subtle",
          !file && !busy ? "cursor-pointer" : "cursor-default",
          status === "error" && "border-status-overdue/40 bg-status-overdue/5"
        )}
      >
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          onChange={handleChange}
          className="hidden"
        />

        {!file ? (
          <>
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-secondary">
              <Upload className="h-5 w-5 text-muted-foreground" />
            </div>
            <div className="text-center">
              <p className="text-sm font-medium text-foreground">
                Drop file or click to browse
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {accept.replace(/\./g, "").toUpperCase().replace(/,/g, " · ")}{" "}
                — max {maxSizeMB}MB
              </p>
            </div>
          </>
        ) : (
          <div className="flex w-full items-center gap-3">
            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-primary/10">
              <FileIcon className="h-5 w-5 text-primary" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-foreground">
                {file.name}
              </p>
              <p className="text-xs text-muted-foreground">
                {formatSize(file.size)}
              </p>
            </div>
            {!busy && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  reset();
                }}
                className="flex-shrink-0 rounded-md p-1 text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        )}
      </div>

      {/* Progress bar */}
      {status === "uploading" && (
        <div className="space-y-1.5">
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-secondary">
            <div
              className="h-full rounded-full bg-primary transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-xs text-muted-foreground">Uploading… {progress}%</p>
        </div>
      )}

      {/* Success */}
      {status === "success" && uploadedNote && (
        <div className="rounded-lg border border-status-completed/30 bg-status-completed/10 px-3 py-2.5 space-y-1">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-status-completed" />
            <p className="text-xs font-medium text-status-completed">
              "{uploadedNote.title}" saved
            </p>
          </div>
          <p className="ml-6 text-[10px] text-muted-foreground font-mono break-all">
            {uploadedNote.file_key}
          </p>
          <button
            onClick={reset}
            className="ml-6 text-xs text-muted-foreground underline hover:text-foreground"
          >
            Upload another
          </button>
        </div>
      )}

      {/* Error */}
      {status === "error" && (
        <div className="flex items-center gap-2 rounded-lg border border-status-overdue/30 bg-status-overdue/10 px-3 py-2">
          <AlertCircle className="h-4 w-4 text-status-overdue flex-shrink-0" />
          <p className="text-xs text-status-overdue">{errorMsg}</p>
          <button
            onClick={reset}
            className="ml-auto text-xs text-muted-foreground underline hover:text-foreground whitespace-nowrap"
          >
            Try again
          </button>
        </div>
      )}

      {/* Submit */}
      {file && !busy && (
        <button
          onClick={handleUpload}
          disabled={!title.trim()}
          className="w-full rounded-lg bg-primary py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary-glow transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Upload note
        </button>
      )}
    </div>
  );
}