import React from 'react';
import { Home, Users, FileText, Calendar, MessageSquare, Layers, LogOut } from 'lucide-react';

export type Tab = 'dashboard' | 'inquiries' | 'articles' | 'events' | 'galleries' | 'feedback';

interface SidebarProps {
  active: Tab;
  onSelect: (t: Tab) => void;
  onLogout: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ active, onSelect, onLogout }) => {
  const Item = ({
    tab,
    label,
    Icon,
  }: { tab: Tab; label: string; Icon: React.ComponentType<any> }) => {
    const isActive = active === tab;
    return (
      <button
        type="button"
        onClick={() => onSelect(tab)}
        className={`w-full flex items-center gap-3 px-4 py-2 rounded-xl text-left transition-colors
          ${isActive ? 'bg-blue-50 text-blue-700 font-medium' : 'hover:bg-gray-100 text-gray-700'}`}
        aria-current={isActive ? 'page' : undefined}
      >
        <Icon size={18} />
        <span>{label}</span>
      </button>
    );
  };

  return (
    <aside className="w-64 shrink-0 h-screen sticky top-0 border-r bg-white flex flex-col">
      <div className="px-4 py-4 text-xl font-semibold">Admin</div>

      <nav className="flex-1 px-2 space-y-1">
        <Item tab="dashboard" label="Dashboard" Icon={Home} />
        <Item tab="inquiries" label="Inquiries" Icon={Users} />
        <Item tab="articles" label="Articles" Icon={FileText} />
        <Item tab="events" label="Events" Icon={Calendar} />
        <Item tab="galleries" label="Galleries" Icon={Layers} />
        <Item tab="feedback" label="Feedback" Icon={MessageSquare} />
      </nav>

      <div className="p-3 border-t">
        <button
          onClick={onLogout}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-gray-100 text-gray-700"
        >
          <LogOut size={18} />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
