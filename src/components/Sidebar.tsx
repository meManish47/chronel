import { Link, useLocation } from "react-router-dom";
import { LayoutDashboard, FileText, LogOut, Zap, LogIn } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  SignedIn,
  SignedOut,
  SignInButton,
  SignUpButton,
  useUser,
  useClerk,
} from "@clerk/clerk-react";
import FileUpload from "./FileUpload";

const navItems = [
  { icon: LayoutDashboard, label: "Dashboard", href: "/dashboard" },
  { icon: FileText, label: "Notes", href: "/notes" },
];

interface SidebarProps {
  className?: string;
  onClose?: () => void;
}

export default function Sidebar({ className, onClose }: SidebarProps) {
  const location = useLocation();
  const { user } = useUser();
  const { signOut } = useClerk();

  return (
    <aside className={cn("flex h-screen w-60 flex-col border-r border-sidebar-border bg-sidebar", className)}>
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-6 py-6 border-b border-sidebar-border">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
          <Zap className="h-4 w-4 text-primary-foreground" />
        </div>
        <span className="text-lg font-semibold tracking-tight text-foreground">
          Chronel
        </span>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {navItems.map(({ icon: Icon, label, href }) => {
          const active = location.pathname === href;
          return (
            <Link
              key={href}
              to={href}
              onClick={onClose}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                active
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
              )}
            >
              <Icon
                className={cn(
                  "h-4 w-4 flex-shrink-0",
                  active ? "text-primary" : "text-sidebar-foreground",
                )}
              />
              {label}
            </Link>
          );
        })}
        {/* <FileUpload
          userId={user ? user.id || "" : ""} // clerk id → becomes S3 key prefix
          clerkId={user?.id || ""} // same — backend uses this to find db user
          onSuccess={(note) => console.log("Saved note:", note)}
        /> */}
      </nav>

      {/* Auth */}
      <div className="border-t border-sidebar-border p-4">
        <SignedOut>
          <div className="flex flex-col gap-2">
            <SignInButton mode="modal">
              <button
                onClick={onClose}
                className="flex w-full items-center gap-2.5 px-3 py-2 rounded-lg text-sm bg-primary text-white hover:bg-primary-glow transition-colors"
              >
                <LogIn className="h-3.5 w-3.5" />
                Sign In
              </button>
            </SignInButton>
            <SignUpButton mode="modal">
              <button
                onClick={onClose}
                className="flex w-full items-center gap-2.5 px-3 py-2 rounded-lg text-sm border border-border hover:bg-sidebar-accent transition-colors"
              >
                Create Account
              </button>
            </SignUpButton>
          </div>
        </SignedOut>

        <SignedIn>
          <div className="flex items-center gap-3 mb-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/20 text-primary text-sm font-semibold flex-shrink-0">
              {user?.firstName?.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-sidebar-accent-foreground truncate">
                {user?.firstName}
              </p>
              <p className="text-xs text-muted-foreground truncate">
                {user?.primaryEmailAddress?.emailAddress}
              </p>
            </div>
          </div>
          <button
            onClick={async () => {
              onClose?.();
              await signOut();
            }}
            className="flex w-full items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:text-sidebar-accent-foreground hover:bg-sidebar-accent transition-colors"
          >
            <LogOut className="h-3.5 w-3.5" />
            Sign out
          </button>
        </SignedIn>
      </div>
    </aside>
  );
}
