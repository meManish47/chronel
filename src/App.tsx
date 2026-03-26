import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  BrowserRouter,
  Routes,
  Route,
  createBrowserRouter,
  RouterProvider,
} from "react-router-dom";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import NotFound from "./pages/NotFound";
import userSyncUser from "./hooks/userSyncUser";
import { TaskProvider } from "./providers/tasksProvider";
import Notes from "./pages/Notes";

const queryClient = new QueryClient();
const router = createBrowserRouter([
  { path: "/", element: <Index /> },
  { path: "/login", element: <Login /> },
  { path: "/dashboard", element: <Dashboard /> },
  { path: "*", element: <NotFound /> },
  { path: "/notes", element: <Notes/> },
]);
const App = () => (
  userSyncUser(),
  (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <TaskProvider>
          <RouterProvider router={router} />
        </TaskProvider>
      </TooltipProvider>
    </QueryClientProvider>
  )
);

export default App;
