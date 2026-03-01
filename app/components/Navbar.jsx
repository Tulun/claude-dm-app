'use client';

import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import Icons from './Icons';

export default function Navbar({ onTabChange, activeTab, saveStatus }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  
  // Determine active page from pathname or activeTab prop
  const getActivePage = () => {
    if (pathname === '/combat') {
      if (activeTab) return activeTab;
      const tab = searchParams.get('tab');
      if (tab === 'characters') return 'characters';
      if (tab === 'templates') return 'templates';
      return 'combat';
    }
    if (pathname === '/encounters') return 'encounters';
    if (pathname === '/spellbook') return 'spellbook';
    if (pathname === '/dm') return 'dm';
    if (pathname === '/character') return 'characters';
    
    return 'combat';
  };
  
  const active = getActivePage();
  
  const navItems = [
    { key: 'combat', label: 'Combat', href: '/combat', icon: Icons.Sword },
    { key: 'characters', label: 'Characters', href: '/combat?tab=characters', icon: Icons.Shield },
    { key: 'encounters', label: 'Encounters', href: '/encounters', icon: Icons.Scroll },
    { key: 'templates', label: 'Templates', href: '/combat?tab=templates', icon: Icons.Book },
    { key: 'spellbook', label: 'Spellbook', href: '/spellbook', icon: Icons.Sparkles },
    { key: 'dm', label: 'DM', href: '/dm', icon: Icons.Crown },
  ];

  const handleClick = (item, e) => {
    // If on main page and clicking a tab that uses onTabChange
    if (onTabChange && (item.key === 'combat' || item.key === 'characters' || item.key === 'templates')) {
      e.preventDefault();
      onTabChange(item.key);
    }
  };

  return (
    <nav className="border-b border-amber-900/30 bg-stone-900/80 backdrop-blur-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link href="/combat" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
            <div className="p-2 rounded-lg bg-gradient-to-br from-amber-600 to-amber-800">
              <Icons.Dice className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-amber-400">DM's Toolkit</h1>
              <p className="text-xs text-stone-400">5th Edition Combat Manager</p>
            </div>
          </Link>

          {/* Save Status + Nav Items */}
          <div className="flex items-center gap-4">
            {saveStatus && (
              <span className="text-xs text-amber-400 bg-amber-900/30 px-2 py-1 rounded">{saveStatus}</span>
            )}
            <div className="flex gap-1 bg-stone-800 rounded-lg p-1">
              {navItems.map(item => {
                const Icon = item.icon;
                const isActive = active === item.key;
                
                return (
                  <Link
                    key={item.key}
                    href={item.href}
                    onClick={(e) => handleClick(item, e)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors ${
                      isActive 
                        ? 'bg-amber-700 text-amber-100' 
                        : 'text-stone-300 hover:bg-stone-700'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
