import { useEffect, useRef } from "react";
import { X, Download, ExternalLink, FileText, FileImage } from "lucide-react";
import { format } from "date-fns";

interface Note {
  id: number;
  title: string;
  file_key: string;
  file_url: string;
  created_at: string;
}

interface FileViewerProps {
  note: Note;
  onClose: () => void;
}

function fileExt(key: string) {
  return key.split(".").pop()?.toLowerCase() ?? "";
}

function isImage(ext: string) {
  return ["jpg", "jpeg", "png", "gif", "webp"].includes(ext);
}

function isPDF(ext: string) {
  return ext === "pdf";
}

export default function FileViewer({ note, onClose }: FileViewerProps) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const ext = fileExt(note.file_key);
  const filename = note.file_key.split("/").pop() ?? note.title;

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  // Close on backdrop click
  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === overlayRef.current) onClose();
  };

  return (
    <div
      ref={overlayRef}
      onClick={handleOverlayClick}
      className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4"
    >
      <div className="flex flex-col w-full max-w-4xl max-h-[90vh] rounded-2xl border border-border bg-card shadow-lg animate-scale-in overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between gap-4 px-5 py-4 border-b border-border flex-shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-primary/10">
              {isPDF(ext) ? (
                <FileText className="h-4 w-4 text-primary" />
              ) : (
                <FileImage className="h-4 w-4 text-primary" />
              )}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-foreground truncate">
                {note.title}
              </p>
              <p className="text-[10px] text-muted-foreground font-mono truncate">
                {filename} ·{" "}
                {format(new Date(note.created_at), "MMM d, yyyy")}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1 flex-shrink-0">
            {/* Download */}
            <a
              href={note.file_url}
              download={filename}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
              title="Download"
            >
              <Download className="h-3.5 w-3.5" />
              Download
            </a>
            {/* Open in new tab */}
            <a
              href={note.file_url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
              title="Open in new tab"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              Open
            </a>
            {/* Close */}
            <button
              onClick={onClose}
              className="ml-1 rounded-md p-1.5 text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Preview area */}
        <div className="flex-1 overflow-hidden bg-background-subtle">
          {isPDF(ext) && (
            // PDF: use <iframe> with the file URL — works for public S3 URLs
            // For private S3 URLs (presigned), the iframe src still works fine
            <iframe
              src={note.file_url}
              title={note.title}
              className="w-full h-full min-h-[60vh]"
              style={{ border: "none" }}
            />
          )}

          {isImage(ext) && (
            <div className="flex items-center justify-center w-full h-full min-h-[60vh] p-6">
              <img
                src={note.file_url}
                alt={note.title}
                className="max-w-full max-h-full object-contain rounded-lg"
                style={{ maxHeight: "calc(90vh - 100px)" }}
              />
            </div>
          )}

          {!isPDF(ext) && !isImage(ext) && (
            // Unsupported preview type
            <div className="flex flex-col items-center justify-center w-full min-h-[60vh] gap-4 text-center p-8">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-secondary">
                <FileText className="h-7 w-7 text-muted-foreground" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">
                  Preview not available for .{ext} files
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Download or open in a new tab to view
                </p>
              </div>
              <a
                href={note.file_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm hover:bg-primary-glow transition-colors"
              >
                <ExternalLink className="h-4 w-4" />
                Open file
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}