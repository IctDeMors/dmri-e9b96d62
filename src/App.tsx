import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Settings from "./pages/Settings";
import Algemeen from "./pages/Algemeen";
import TifaIndex from "./pages/TifaIndex";
import TifaCRM from "./pages/TifaCRM";
import PanelenIndex from "./pages/PanelenIndex";
import PanelenDashboard from "./pages/PanelenDashboard";
import PanelenOrders from "./pages/PanelenOrders";
import PanelenTimeline from "./pages/PanelenTimeline";
import PanelenCRM from "./pages/PanelenCRM";
import UnitsIndex from "./pages/UnitsIndex";
import UnitsCRM from "./pages/UnitsCRM";
import MyCubyIndex from "./pages/MyCubyIndex";
import MyCubyProjecten from "./pages/MyCubyProjecten";
import MyCubyProjectDetail from "./pages/MyCubyProjectDetail";
import MyCubyModellen from "./pages/MyCubyModellen";
import MyCubyCRM from "./pages/MyCubyCRM";
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
          <Route path="/instellingen" element={<Settings />} />
          <Route path="/algemeen" element={<Algemeen />} />
          <Route path="/tifa" element={<TifaIndex />} />
          <Route path="/tifa/crm" element={<TifaCRM />} />
          <Route path="/panelen" element={<PanelenIndex />} />
          <Route path="/panelen/dashboard" element={<PanelenDashboard />} />
          <Route path="/panelen/orders" element={<PanelenOrders />} />
          <Route path="/panelen/timeline" element={<PanelenTimeline />} />
          <Route path="/panelen/crm" element={<PanelenCRM />} />
          <Route path="/units" element={<UnitsIndex />} />
          <Route path="/units/crm" element={<UnitsCRM />} />
          <Route path="/mycuby" element={<MyCubyIndex />} />
          <Route path="/mycuby/projecten" element={<MyCubyProjecten />} />
          <Route path="/mycuby/projecten/:projectId" element={<MyCubyProjectDetail />} />
          <Route path="/mycuby/modellen" element={<MyCubyModellen />} />
          <Route path="/mycuby/crm" element={<MyCubyCRM />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
