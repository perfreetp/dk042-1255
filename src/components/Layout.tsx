import { useState } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import TopBar from "./TopBar";

export default function Layout() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const handleToggleSidebar = () => {
    setSidebarCollapsed((prev) => !prev);
  };

  return (
    <div className="h-screen w-screen flex bg-gray-50 overflow-hidden">
      <Sidebar collapsed={sidebarCollapsed} onToggle={handleToggleSidebar} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <TopBar sidebarCollapsed={sidebarCollapsed} onToggleSidebar={handleToggleSidebar} />
        <main className="flex-1 overflow-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
