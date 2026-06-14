import { Menu, Search, Bell, User } from "lucide-react";

interface TopBarProps {
  sidebarCollapsed: boolean;
  onToggleSidebar: () => void;
}

export default function TopBar({ onToggleSidebar }: TopBarProps) {
  return (
    <header className="h-16 bg-topbar-bg border-b border-topbar-border flex items-center justify-between px-4 shrink-0">
      <div className="flex items-center gap-4">
        <button
          onClick={onToggleSidebar}
          className="p-2 rounded-lg hover:bg-gray-100 transition-colors text-gray-600 hover:text-primary"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="relative hidden md:block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="搜索任务、字段、问题..."
            className="pl-10 pr-4 py-2 w-80 bg-gray-50 border border-gray-200 rounded-lg text-sm
                       focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary
                       placeholder-gray-400 transition-all"
          />
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button className="relative p-2 rounded-lg hover:bg-gray-100 transition-colors text-gray-600 hover:text-primary">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
        </button>

        <div className="h-8 w-px bg-gray-200 mx-2" />

        <div className="flex items-center gap-3 pl-2">
          <div className="w-9 h-9 rounded-full bg-primary flex items-center justify-center text-white font-medium">
            <User className="w-5 h-5" />
          </div>
          <div className="hidden sm:block">
            <div className="text-sm font-medium text-gray-800">数据治理专员</div>
            <div className="text-xs text-gray-500">管理员</div>
          </div>
        </div>
      </div>
    </header>
  );
}
