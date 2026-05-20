// console.log("CLERK KEY:", import.meta.env.VITE_CLERK_PUBLISHABLE_KEY);
// console.log("ENV OBJECT:", import.meta.env);

import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App";
import { ClerkProvider } from "@clerk/clerk-react";

const localization = {
  signIn: {
    start: {
      title: "Sign in to Chronel",
      subtitle: "to continue to Chronel",
    },
  },
  signUp: {
    start: {
      title: "Create your Chronel account",
      subtitle: "to continue to Chronel",
    },
  },
};

createRoot(document.getElementById("root")!).render(
  <ClerkProvider
    publishableKey={import.meta.env.VITE_CLERK_PUBLISHABLE_KEY}
    localization={localization}
  >
    <App />
  </ClerkProvider>
);