import { useState } from "react";
import { SignIn, SignUp } from "@clerk/clerk-react";
import { Zap } from "lucide-react";

export default function Login() {
  const [isSignup, setIsSignup] = useState(false);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      {/* background glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 h-96 w-96 rounded-full bg-primary/4 blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 h-64 w-64 rounded-full bg-primary/3 blur-3xl" />
      </div>

      <div className="relative w-full max-w-sm">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary mb-4 shadow-accent">
            <Zap className="h-6 w-6 text-primary-foreground" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Chronel
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {isSignup ? "Create your account" : "Welcome back"}
          </p>
        </div>

        {/* Clerk Card */}
        <div className="rounded-2xl border border-border bg-card p-4 shadow-lg">
          
          {!isSignup ? (
            <SignIn
              routing="virtual"
              afterSignInUrl="/dashboard"
              appearance={{
                elements: {
                  card: "shadow-none border-none p-0",
                  formButtonPrimary:
                    "bg-primary hover:bg-primary-glow text-sm",
                },
              }}
            />
          ) : (
            <SignUp
              routing="virtual"
              afterSignUpUrl="/dashboard"
              appearance={{
                elements: {
                  card: "shadow-none border-none p-0",
                  formButtonPrimary:
                    "bg-primary hover:bg-primary-glow text-sm",
                },
              }}
            />
          )}

          <div className="mt-4 pt-4 border-t border-border text-center">
            <button
              onClick={() => setIsSignup(!isSignup)}
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              {isSignup
                ? "Already have an account? Sign in"
                : "Don't have an account? Sign up"}
            </button>
          </div>
        </div>

        <p className="mt-6 text-center text-xs text-muted-foreground">
          Student productivity, reimagined.
        </p>
      </div>
    </div>
  );
}