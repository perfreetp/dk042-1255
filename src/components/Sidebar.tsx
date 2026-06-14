import { NavLink } from "react-router-dom";
import { CheckSquare, Search, ListTodo, ClipboardList, BarChart3, Database } from "lucide-react";
import { cn } from "@/lib/utils";

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

const menuItems = [
  {
    to: "/tasks",
    label: "检查任务",
    icon: CheckSquare,
  },
  {
    to: "/matching",
    label: "字段匹配",
    icon: Search,
  },
  {
    to: "/issues",
    label: "问题清单",
    icon: ListTodo,
  },
  {
    to: "/rectification",
    label: "整改跟踪",
    icon: ClipboardList,
  },
  {
    to: "/analytics",
    label: "统计分析",
    icon: BarChart3,
  },
];

export default function Sidebar({ collapsed }: SidebarProps) {
  return (
    <aside
      className={cn(
        "h-full flex flex-col bg-sidebar-bg border-r border-sidebar-border transition-all duration-300 ease-in-out",
        collapsed ? "w-16" : "w-64"
      )}
    >
      <div className="h-16 flex items-center justify-center border-b border-sidebar-border px-4">
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center shrink-0">
            <Database className="w-5 h-5 text-white" />
          </div>
          {!collapsed && (
            <span className="text-white font-semibold text-lg whitespace-nowrap">
              数据标准检查
            </span>
          )}
        </div>
      </div>

      <nav className="flex-1 py-4 px-2 space-y-1">
        {menuItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors whitespace-nowrap",
                "text-gray-300 hover:bg-sidebar-hover hover:text-white",
                isActive && "bg-sidebar-active text-white border-l-2 border-primary-400",
                collapsed && "justify-center"
              )}
            >
              <Icon className="w-5 h-5 shrink-0" />
              {!collapsed && <span className="text-sm font-medium">{item.label}</span>}
            </NavLink>
          );
        })}
      </nav>

      <div className="p-3 border-t border-sidebar-border">
        <div
          className={cn(
            "flex items-center gap-3",
            collapsed && "justify-center"
          )}
        >
          {!collapsed && (
            <div className="text-xs text-gray-400">
              v1.0.0
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
