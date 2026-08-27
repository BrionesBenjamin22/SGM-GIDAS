import { Outlet } from "react-router-dom";
import { User } from "lucide-react";
import Sidebar from "@/components/Sidebar";
import Footer from "@/components/Footer";

export default function AppLayout() {
  return (
    <div className="min-h-screen bg-[#F6F6FB] text-slate-800 flex flex-col">
      <header className="w-full flex items-center justify-between px-4 py-2 border-b border-slate-200 bg-white h-[56px]">
        <Sidebar />
        <h1 className="font-semibold text-sm tracking-tight"></h1>
        <div
          title="Usuario"
          aria-label="Usuario autenticado"
          className="flex items-center justify-center rounded-lg p-2 text-slate-600"
        >
          <User aria-hidden="true" className="h-6 w-6" />
        </div>
      </header>

      <main className="flex-1">
        <div className="w-full max-w-7xl mx-auto px-6 lg:px-10 py-4">
          <Outlet />
        </div>
      </main>

      <Footer />
    </div>
  );
}
