import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { JarvisProvider } from "@/contexts/JarvisContext";
import Index from "./pages/Index";
import Dashboard from "./pages/Dashboard";
import ApiDashboard from "./pages/ApiDashboard";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      staleTime: 5 * 60 * 1000,
      refetchOnWindowFocus: false,
    },
  },
});

const App = () => {
  
  return (
    <QueryClientProvider client={queryClient}>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <JarvisProvider>
          <Routes>
            {/* Rota principal - Chat JARVIS (sem login) */}
            <Route path="/" element={<Index />} />
            
            {/* Dashboard - acesso direto */}
            <Route path="/dashboard" element={<Dashboard />} />
            
            {/* API Dashboard - acesso direto */}
            <Route path="/api-dashboard" element={<ApiDashboard />} />
            
            {/* Rota de fallback */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </JarvisProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
};

export default App;
