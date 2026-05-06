import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import NotFound from "./pages/NotFound";
import userSyncUser from "./hooks/userSyncUser";
import { TaskProvider } from "./providers/tasksProvider";
import Notes from "./pages/Notes";
import MusicPlayer from "./components/MusicPlayer";

const queryClient = new QueryClient();

const router = createBrowserRouter([
  { path: "/", element: <Index /> },
  { path: "/login", element: <Login /> },
  { path: "/dashboard", element: <Dashboard /> },
  { path: "*", element: <NotFound /> },
  { path: "/notes", element: <Notes /> },
]);

const App = () => (
  userSyncUser(),
  (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <TaskProvider>
          {/* bottom padding so content never hides behind the bar */}
          <div style={{ paddingBottom: 52 }}>
            <RouterProvider router={router} />
          </div>
          {/* <MusicPlayer /> */}
        </TaskProvider>
      </TooltipProvider>
    </QueryClientProvider>
  )
);

export default App;