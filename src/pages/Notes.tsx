import { useEffect, useState, useContext } from "react";
import { useUser, useClerk } from "@clerk/clerk-react";
import { toast } from "sonner";
import { format } from "date-fns";
import {
  FileText,
  FileImage,
  Trash2,
  Upload,
  Search,
  Eye,
  MessageCircle,
  Sparkles,
  Loader2,
} from "lucide-react";
import Sidebar from "@/components/Sidebar";
import FileUpload from "@/components/FileUpload";
import FileViewer from "@/components/FileViewer";
import NoteChat from "@/components/NoteChat";
import { cn } from "@/lib/utils";
import { TaskContext } from "@/providers/tasksProvider";

interface Note {
  id: number;
  title: string;
  file_key: string;
  file_url: string;
  created_at: string;
}

function fileExt(key: string) {
  return key.split(".").pop()?.toLowerCase() ?? "";
}

function FileIcon({ fileKey }: { fileKey: string }) {
  const ext = fileExt(fileKey);
  const Icon = ext === "pdf" ? FileText : FileImage;
  const colorClass =
    ext === "pdf"
      ? "bg-status-overdue/10 text-status-overdue"
      : "bg-primary/10 text-primary";
  return (
    <div className={cn("flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg", colorClass)}>
      <Icon className="h-5 w-5" />
    </div>
  );
}

function ExtBadge({ fileKey }: { fileKey: string }) {
  const ext = fileExt(fileKey).toUpperCase();
  const colorClass =
    ext === "PDF"
      ? "text-status-overdue border-status-overdue/30 bg-status-overdue/10"
      : "text-primary border-primary/30 bg-primary/10";
  return (
    <span className={cn("text-[9px] font-medium px-1.5 py-0.5 rounded border flex-shrink-0", colorClass)}>
      {ext}
    </span>
  );
}

export default function Notes() {
  const { user, isLoaded } = useUser();
  const { openSignIn } = useClerk();
  const taskCtx = useContext(TaskContext);
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [uploadOpen, setUploadOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [viewingNote, setViewingNote] = useState<Note | null>(null);
  const [chatNote, setChatNote] = useState<Note | null>(null);
  const [generatingId, setGeneratingId] = useState<number | null>(null);
  const [genSuccess, setGenSuccess] = useState<number | null>(null);

  const fetchNotes = async () => {
    if (!user) return;
    try {
      setLoading(true);
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/api/notes?clerk_id=${user.id}`
      );
      const data = await res.json();
      setNotes(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to fetch notes:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isLoaded && user) fetchNotes();
  }, [isLoaded, user]);

  const handleGenerateTasks = async (e: React.MouseEvent, note: Note) => {
    e.stopPropagation();
    if (!user) return;
    setGeneratingId(note.id);
    setGenSuccess(null);
    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/api/ai/generate-tasks`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ note_id: note.id, clerk_id: user.id }),
        }
      );
      const data = await res.json();
      if (data.tasks) {
        setGenSuccess(note.id);
        taskCtx?.fetchTasks(); // Refresh task list on Dashboard
        setTimeout(() => setGenSuccess(null), 3000);
      }
    } catch (err) {
      console.error("Generate tasks failed:", err);
    } finally {
      setGeneratingId(null);
    }
  };

  const handleDelete = async (e: React.MouseEvent, id: number) => {
    e.stopPropagation();
    setDeletingId(id);
    try {
      await fetch(`${import.meta.env.VITE_API_URL}/api/notes/${id}`, {
        method: "DELETE",
      });
      setNotes((prev) => prev.filter((n) => n.id !== id));
      if (viewingNote?.id === id) setViewingNote(null);
    } catch (err) {
      console.error("Delete failed:", err);
    } finally {
      setDeletingId(null);
    }
  };

  const filtered = notes.filter((n) =>
    n.title.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar />

      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="flex-shrink-0 px-8 py-6 border-b border-border bg-background">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-semibold text-foreground">My Notes</h1>
              <p className="text-sm text-muted-foreground mt-0.5">
                {notes.length} file{notes.length !== 1 ? "s" : ""} uploaded
              </p>
            </div>
            <button
              onClick={() => {
                if (!isLoaded) return;
                if (!user) {
                  toast.error("Please sign in to upload files");
                  openSignIn?.();
                  return;
                }
                setUploadOpen(true);
              }}
              className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary-glow transition-colors"
            >
              <Upload className="h-4 w-4" />
              Upload file
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto scrollbar-thin px-8 py-6 space-y-4">
          <div className="relative max-w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search notes..."
              className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-1 focus:ring-ring"
            />
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="h-8 w-8 rounded-full border-4 border-muted border-t-primary animate-spin" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="h-12 w-12 rounded-2xl bg-secondary flex items-center justify-center mb-4">
                <FileText className="h-6 w-6 text-muted-foreground" />
              </div>
              <p className="text-sm font-medium text-foreground mb-1">
                {search ? "No notes match your search" : "No files yet"}
              </p>
              {!search && (
                <button
                  onClick={() => {
                    if (!isLoaded) return;
                    if (!user) {
                      toast.error("Please sign in to upload files");
                      openSignIn?.();
                      return;
                    }
                    setUploadOpen(true);
                  }}
                  className="mt-3 text-xs text-primary underline hover:text-primary-glow"
                >
                  Upload your first file
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
              {filtered.map((note) => (
                <div
                  key={note.id}
                  onClick={() => setViewingNote(note)}
                  className="group relative flex items-start gap-3 rounded-xl border border-border bg-card p-4 hover:bg-background-elevated hover:border-border-subtle transition-all duration-200 cursor-pointer"
                >
                  <FileIcon fileKey={note.file_key} />

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                      <p className="text-sm font-medium text-foreground truncate">
                        {note.title}
                      </p>
                      <ExtBadge fileKey={note.file_key} />
                    </div>
                    <p className="text-[10px] text-muted-foreground font-mono truncate">
                      {note.file_key.split("/").pop()}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {format(new Date(note.created_at), "MMM d, yyyy")}
                    </p>
                  </div>

                  {/* Hover action buttons */}
                  <div className="absolute top-3 right-3 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setViewingNote(note);
                      }}
                      className="rounded-md p-1.5 text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
                      title="Preview"
                    >
                      <Eye className="h-3.5 w-3.5" />
                    </button>
                    {/* <button
                      onClick={(e) => handleGenerateTasks(e, note)}
                      disabled={generatingId === note.id}
                      className="rounded-md p-1.5 text-muted-foreground hover:text-yellow-400 hover:bg-secondary transition-colors disabled:opacity-40"
                      title="Generate study tasks from this note"
                    >
                      {generatingId === note.id ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Sparkles className="h-3.5 w-3.5" />
                      )}
                    </button> */}
                    <button
                      onClick={(e) => handleDelete(e, note.id)}
                      disabled={deletingId === note.id}
                      className="rounded-md p-1.5 text-muted-foreground hover:text-destructive hover:bg-secondary transition-colors disabled:opacity-40"
                      title="Delete"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>

                  {/* Bottom label */}
                  {genSuccess === note.id ? (
                    <p className="absolute bottom-2.5 right-3 text-[9px] text-green-400 opacity-100">
                      ✓ tasks added to dashboard
                    </p>
                  ) : (
                    <div className="absolute bottom-2.5 right-3 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-2">
                      <button
                        onClick={(e) => { e.stopPropagation(); setChatNote(note); }}
                        className="flex items-center gap-1.5 rounded-full bg-blue-600/20 text-blue-500 hover:bg-blue-600 hover:text-white px-3 py-1 text-xs font-semibold border border-blue-500/30 shadow-[0_0_10px_rgba(37,99,235,0.2)] hover:shadow-[0_0_15px_rgba(37,99,235,0.6)] transition-all duration-300"
                      >
                        <MessageCircle className="h-3.5 w-3.5" />
                        Ask AI
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* File viewer modal */}
      {viewingNote && (
        <FileViewer note={viewingNote} onClose={() => setViewingNote(null)} />
      )}

      {/* AI Chat panel */}
      {chatNote && (
        <NoteChat
          noteId={chatNote.id}
          noteTitle={chatNote.title}
          onClose={() => setChatNote(null)}
        />
      )}

      {/* Upload modal */}
      {uploadOpen && (
        <>
          <div
            className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm"
            onClick={() => setUploadOpen(false)}
          />
          <div className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-border bg-card shadow-lg animate-scale-in">
            <div className="flex items-center justify-between border-b border-border px-6 py-4">
              <div className="flex items-center gap-2">
                <Upload className="h-4 w-4 text-primary" />
                <h2 className="text-sm font-semibold text-foreground">
                  Upload file
                </h2>
              </div>
              <button
                onClick={() => setUploadOpen(false)}
                className="rounded-md p-1.5 text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors text-sm"
              >
                ✕
              </button>
            </div>
            <div className="p-6">
              <FileUpload
                userId={user?.id ?? ""}
                clerkId={user?.id ?? ""}
                onSuccess={(note) => {
                  setNotes((prev) => [
                    { ...note, created_at: new Date().toISOString() },
                    ...prev,
                  ]);
                  setUploadOpen(false);
                }}
                onError={(msg) => console.error(msg)}
              />
            </div>
          </div>
        </>
      )}
    </div>
  );
}