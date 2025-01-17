import { Link } from '@remix-run/react';
import { PlusCircle, BookOpen, LayoutGrid, HelpCircle } from 'lucide-react';
import type { Icon } from 'lucide-react';

interface SidebarItemProps {
  icon: Icon;
  href: string;
  isActive?: boolean;
}

const SidebarItem = ({ icon: Icon, href, isActive }: SidebarItemProps) => {
  return (
    <Link
      to={href}
      className={`flex items-center justify-center w-10 h-10 rounded-lg transition-all ${
        isActive
          ? 'bg-[#1A1F2A] text-white'
          : 'text-gray-500 hover:bg-[#1A1F2A]/40 hover:text-white'
      }`}
    >
      <Icon className="w-5 h-5 stroke-[1.5px]" />
    </Link>
  );
};

export const FixedSidebar = () => {
  return (
    <div className="fixed left-0 top-0 h-full w-14 bg-[#0D0D0D] border-r border-[#1A1A1A]/50 flex flex-col items-center py-3">
      <div className="flex flex-col items-center gap-1.5">
        {/* Logo */}
        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500/20 to-blue-600/20 flex items-center justify-center text-blue-500 font-medium text-lg mb-4">
          P
        </div>

        {/* Top Actions */}
        <SidebarItem icon={PlusCircle} href="/new" />
        <SidebarItem icon={BookOpen} href="/docs" />
        <SidebarItem icon={LayoutGrid} href="/templates" />
      </div>

      {/* Bottom Actions */}
      <div className="mt-auto">
        <SidebarItem icon={HelpCircle} href="/help" />
      </div>
    </div>
  );
};
