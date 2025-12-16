import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Algemeen from "./pages/Algemeen";
import DepartmentPage from "./pages/DepartmentPage";
import PanelenIndex from "./pages/PanelenIndex";
import PanelenDashboard from "./pages/PanelenDashboard";
import PanelenTimeline from "./pages/PanelenTimeline";
import MyCubyIndex from "./pages/MyCubyIndex";
import MyCubyProjecten from "./pages/MyCubyProjecten";
import MyCubyProjectDetail from "./pages/MyCubyProjectDetail";
import MyCubyModellen from "./pages/MyCubyModellen";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/algemeen" element={<Algemeen />} />
          <Route path="/tifa" element={<DepartmentPage />} />
          <Route path="/panelen" element={<PanelenIndex />} />
          <Route path="/panelen/dashboard" element={<PanelenDashboard />} />
          <Route path="/panelen/tijdlijn" element={<PanelenTimeline />} />
          <Route path="/units" element={<DepartmentPage />} />
          <Route path="/mycuby" element={<MyCubyIndex />} />
          <Route path="/mycuby/projecten" element={<MyCubyProjecten />} />
          <Route path="/mycuby/projecten/:projectId" element={<MyCubyProjectDetail />} />
          <Route path="/mycuby/modellen" element={<MyCubyModellen />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
