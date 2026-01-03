import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import Home from "./pages/Home";
import Auth from "./pages/Auth";
import ResetPassword from "./pages/ResetPassword";
import Settings from "./pages/Settings";
import GebruikersBeheer from "./pages/GebruikersBeheer";
import Algemeen from "./pages/Algemeen";
import TifaIndex from "./pages/TifaIndex";
import TifaCRM from "./pages/TifaCRM";
import TifaIFC from "./pages/TifaIFC";
import TifaIFCConversie from "./pages/TifaIFCConversie";
import PanelenIndex from "./pages/PanelenIndex";
import PanelenDashboard from "./pages/PanelenDashboard";
import PanelenOrders from "./pages/PanelenOrders";
import PanelenTimeline from "./pages/PanelenTimeline";
import PanelenCRM from "./pages/PanelenCRM";
import PanelenProducten from "./pages/PanelenProducten";
import UnitsIndex from "./pages/UnitsIndex";
import UnitsCRM from "./pages/UnitsCRM";
import MyCubyIndex from "./pages/MyCubyIndex";
import MyCubyProjecten from "./pages/MyCubyProjecten";
import MyCubyProjectDetail from "./pages/MyCubyProjectDetail";
import MyCubyModellen from "./pages/MyCubyModellen";
import MyCubyCRM from "./pages/MyCubyCRM";
import NarrowcastPresentation from "./pages/NarrowcastPresentation";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          {/* Public routes */}
          <Route path="/auth" element={<Auth />} />
          <Route path="/auth/reset-password" element={<ResetPassword />} />
          <Route path="/narrowcast/:channelId" element={<NarrowcastPresentation />} />
          
          {/* Protected routes */}
          <Route path="/" element={<ProtectedRoute><Home /></ProtectedRoute>} />
          <Route path="/instellingen" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
          <Route path="/gebruikers" element={<ProtectedRoute requireAdmin><GebruikersBeheer /></ProtectedRoute>} />
          
          {/* Algemeen routes */}
          <Route path="/algemeen" element={<ProtectedRoute requiredDepartment="algemeen"><Algemeen /></ProtectedRoute>} />
          
          {/* Tifa routes */}
          <Route path="/tifa" element={<ProtectedRoute requiredDepartment="tifa"><TifaIndex /></ProtectedRoute>} />
          <Route path="/tifa/crm" element={<ProtectedRoute requiredDepartment="tifa"><TifaCRM /></ProtectedRoute>} />
          <Route path="/tifa/ifc" element={<ProtectedRoute requiredDepartment="tifa"><TifaIFC /></ProtectedRoute>} />
          <Route path="/tifa/ifc-conversie" element={<ProtectedRoute requiredDepartment="tifa"><TifaIFCConversie /></ProtectedRoute>} />
          
          {/* Panelen routes */}
          <Route path="/panelen" element={<ProtectedRoute requiredDepartment="panelen"><PanelenIndex /></ProtectedRoute>} />
          <Route path="/panelen/dashboard" element={<ProtectedRoute requiredDepartment="panelen"><PanelenDashboard /></ProtectedRoute>} />
          <Route path="/panelen/orders" element={<ProtectedRoute requiredDepartment="panelen"><PanelenOrders /></ProtectedRoute>} />
          <Route path="/panelen/timeline" element={<ProtectedRoute requiredDepartment="panelen"><PanelenTimeline /></ProtectedRoute>} />
          <Route path="/panelen/crm" element={<ProtectedRoute requiredDepartment="panelen"><PanelenCRM /></ProtectedRoute>} />
          <Route path="/panelen/producten" element={<ProtectedRoute requiredDepartment="panelen"><PanelenProducten /></ProtectedRoute>} />
          
          {/* Units routes */}
          <Route path="/units" element={<ProtectedRoute requiredDepartment="units"><UnitsIndex /></ProtectedRoute>} />
          <Route path="/units/crm" element={<ProtectedRoute requiredDepartment="units"><UnitsCRM /></ProtectedRoute>} />
          
          {/* MyCuby routes */}
          <Route path="/mycuby" element={<ProtectedRoute requiredDepartment="mycuby"><MyCubyIndex /></ProtectedRoute>} />
          <Route path="/mycuby/projecten" element={<ProtectedRoute requiredDepartment="mycuby"><MyCubyProjecten /></ProtectedRoute>} />
          <Route path="/mycuby/projecten/:projectId" element={<ProtectedRoute requiredDepartment="mycuby"><MyCubyProjectDetail /></ProtectedRoute>} />
          <Route path="/mycuby/modellen" element={<ProtectedRoute requiredDepartment="mycuby"><MyCubyModellen /></ProtectedRoute>} />
          <Route path="/mycuby/crm" element={<ProtectedRoute requiredDepartment="mycuby"><MyCubyCRM /></ProtectedRoute>} />
          
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
