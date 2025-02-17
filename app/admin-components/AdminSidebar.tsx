import { Link, useLocation } from "@remix-run/react";
import { Users, LayoutTemplate, Settings, BarChart3 } from "lucide-react";
import { classNames } from "~/utils/classNames";

const menuItems = [
  {
    name: "Dashboard",
    icon: <BarChart3 className="w-5 h-5" />,
    href: "/admin",
  },
  {
    name: "Usuários",
    icon: <Users className="w-5 h-5" />,
    href: "/admin/users",
  },
  {
    name: "Componentes",
    icon: <LayoutTemplate className="w-5 h-5" />,
    href: "/admin/components",
  },
  {
    name: "Configurações",
    icon: <Settings className="w-5 h-5" />,
    href: "/admin/settings",
  },
];

export function AdminSidebar() {
  const location = useLocation();

  return (
    <div className="w-64 h-screen bg-[#09090B] border-r border-zinc-800 flex-shrink-0 fixed left-0 top-0">
      {/* Logo */}
      <div className="h-16 border-b border-zinc-800 flex items-center px-6">
        <span className="text-xl font-bold text-white">Admin Panel</span>
      </div>

      {/* Menu */}
      <nav className="p-4 space-y-2">
        {menuItems.map((item) => {
          const isActive = location.pathname === item.href;
          return (
            <Link
              key={item.name}
              to={item.href}
              className={classNames(
                "flex items-center gap-3 px-4 py-3 rounded-md transition-colors",
                "hover:bg-white/5",
                isActive
                  ? "bg-[#548BE4] text-white"
                  : "text-zinc-400 hover:text-white"
              )}
            >
              {item.icon}
              <span>{item.name}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
} 