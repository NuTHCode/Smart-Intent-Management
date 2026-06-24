import React from 'react';
import { TabName } from '../types';

interface SidebarProps {
  activeTab: TabName;
  setActiveTab: (tab: TabName) => void;
  duplicateCount: number;
  isSidebarCollapsed: boolean;
  setIsSidebarCollapsed: (collapsed: boolean) => void;
  isMobileSidebarOpen: boolean;
  setIsMobileSidebarOpen: (open: boolean) => void;
  systemName: string;
  systemLogo: string;
}

export default function Sidebar({
  activeTab,
  setActiveTab,
  duplicateCount,
  isSidebarCollapsed,
  setIsSidebarCollapsed,
  isMobileSidebarOpen,
  setIsMobileSidebarOpen,
  systemName,
  systemLogo,
}: SidebarProps) {
  const menuItems = [
    {
      id: 'dashboard' as TabName,
      label: 'แดชบอร์ดสรุปภาพรวม',
      iconClass: 'fa-solid fa-truck-fast',
      textColor: 'text-red-600',
      activeBg: 'bg-red-50 text-red-600 font-semibold',
      inactiveClass: 'text-gray-500 hover:bg-gray-50 hover:text-gray-800 font-medium',
    },
    {
      id: 'workspace' as TabName,
      label: 'จับคู่คำ INTENT',
      iconClass: 'fa-solid fa-envelope-open-text',
      textColor: 'text-gray-600',
      activeBg: 'bg-red-50 text-red-600 font-semibold',
      inactiveClass: 'text-gray-500 hover:bg-gray-50 hover:text-gray-800 font-medium',
    },
    {
      id: 'duplicate-center' as TabName,
      label: 'ตรวจสอบคำซ้ำ',
      iconClass: 'fa-solid fa-paste text-amber-500',
      textColor: 'text-gray-600',
      activeBg: 'bg-red-50 text-red-600 font-semibold',
      inactiveClass: 'text-gray-500 hover:bg-gray-50 hover:text-gray-800 font-medium',
      badge: duplicateCount,
    },
    {
      id: 'intent-matching' as TabName,
      label: 'Intent Matching',
      iconClass: 'fa-solid fa-bezier-curve text-indigo-600',
      textColor: 'text-gray-600',
      activeBg: 'bg-red-50 text-red-600 font-semibold',
      inactiveClass: 'text-gray-500 hover:bg-gray-50 hover:text-gray-800 font-medium',
    },
    {
      id: 'logo-settings' as TabName, // Placeholder TabName to keep TS compiler happy
      label: 'Smart Intent Engine',
      iconClass: 'fa-solid fa-wand-magic-sparkles text-purple-600',
      textColor: 'text-gray-600',
      activeBg: 'bg-red-50 text-red-600 font-semibold',
      inactiveClass: 'text-gray-500 hover:bg-gray-50 hover:text-gray-800 font-medium',
      isExternal: true,
      href: 'https://script.google.com/macros/s/AKfycbzLdATX9CQ7vORXkKtNhb4KlnP_VJ9dhsbKFkwxKCAlpwyYCDquhHIetgK2ZE_7xSjf/exec',
    },
    {
      id: 'intents-center' as TabName,
      label: 'จัดการ Intent',
      iconClass: 'fa-solid fa-tags text-red-500',
      textColor: 'text-gray-600',
      activeBg: 'bg-red-50 text-red-600 font-semibold',
      inactiveClass: 'text-gray-500 hover:bg-gray-50 hover:text-gray-800 font-medium',
    },
    {
      id: 'stopwords-center' as TabName,
      label: 'เพิ่มคำ STOP WORDS',
      iconClass: 'fa-solid fa-scissors text-orange-500',
      textColor: 'text-gray-600',
      activeBg: 'bg-red-50 text-red-600 font-semibold',
      inactiveClass: 'text-gray-500 hover:bg-gray-50 hover:text-gray-800 font-medium',
    },
    {
      id: 'logo-settings' as TabName,
      label: 'จัดการระบบ',
      iconClass: 'fa-solid fa-sliders text-blue-500',
      textColor: 'text-gray-600',
      activeBg: 'bg-red-50 text-red-600 font-semibold',
      inactiveClass: 'text-gray-500 hover:bg-gray-50 hover:text-gray-800 font-medium',
    },
  ];

  return (
    <>
      {/* Sidebar aside */}
      <aside
        id="sidebar"
        className={`fixed lg:static inset-y-0 left-0 bg-white border-r border-gray-200 h-full flex flex-col justify-between transition-all-smooth z-40 shadow-xl lg:shadow-sm transform 
          ${isMobileSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'} 
          ${isSidebarCollapsed ? 'lg:w-20' : 'lg:w-64'} w-64`}
      >
        <div>
          {/* Brand Header */}
          <div className={`h-16 flex items-center border-b border-gray-100 bg-gradient-to-r from-red-600 to-red-500 transition-all-smooth ${
            isSidebarCollapsed ? 'justify-center px-2' : 'justify-between px-4'
          }`}>
            {isSidebarCollapsed ? (
              <button
                onClick={() => setIsSidebarCollapsed(false)}
                className="p-2 rounded-lg hover:bg-red-700 text-white transition-all-smooth cursor-pointer flex items-center justify-center"
                title="ขยายเมนู"
              >
                <i className="fa-solid fa-bars text-xl"></i>
              </button>
            ) : (
              <>
                <div id="sidebar-logo" className="flex items-center space-x-3 overflow-hidden">
                  <div
                    id="logo-holder"
                    className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-primary shadow-lg overflow-hidden flex-shrink-0"
                  >
                    {systemLogo ? (
                      <img src={systemLogo} className="w-full h-full object-cover" alt="Custom Logo" />
                    ) : (
                      <svg
                        id="default-swallow-logo"
                        className="w-7 h-7 text-red-600 animate-pulse"
                        viewBox="0 0 24 24"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          d="M2.00012 12C2.00012 12 6.50012 5.5 12.0001 5.5C17.5001 5.5 22.0001 12 22.0001 12C22.0001 12 17.5001 18.5 12.0001 18.5C6.50012 18.5 2.00012 12 2.00012 12Z"
                          stroke="currentColor"
                          strokeWidth="1.5"
                          strokeLinejoin="round"
                        />
                        <path
                          d="M12 14.5C13.3807 14.5 14.5 13.3807 14.5 12C14.5 10.6193 13.3807 9.5 12 9.5C10.6193 9.5 9.5 10.6193 9.5 12C9.5 13.3807 10.6193 14.5 12 14.5Z"
                          fill="currentColor"
                        />
                        <path
                          d="M3 4L12 11L21 4"
                          stroke="currentColor"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    )}
                  </div>
                  {!isSidebarCollapsed && (
                    <span id="system-name-display" className="font-bold text-lg tracking-tight whitespace-nowrap text-white">
                      {systemName}
                    </span>
                  )}
                </div>
                <button
                  onClick={() => setIsSidebarCollapsed(true)}
                  className="hidden lg:block p-2 rounded-lg hover:bg-red-700 text-white transition-all-smooth cursor-pointer"
                  title="ย่อเมนู"
                >
                  <i id="toggle-icon" className="fa-solid fa-chevron-left transition-all-smooth"></i>
                </button>
              </>
            )}
          </div>

          {/* Navigation Items */}
          <nav className="p-3 space-y-1">
            {menuItems.map((item) => {
              const isActive = activeTab === item.id;
              if ('isExternal' in item && item.isExternal) {
                return (
                  <a
                    key={item.label}
                    href={item.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => {
                      setIsMobileSidebarOpen(false);
                    }}
                    className={`w-full flex items-center p-3 rounded-xl transition-all-smooth cursor-pointer relative ${
                      isSidebarCollapsed ? 'justify-center' : 'space-x-3'
                    } ${item.inactiveClass}`}
                    title={item.label}
                  >
                    <i className={`${item.iconClass} text-lg flex-shrink-0`}></i>
                    {!isSidebarCollapsed && (
                      <span className="sidebar-text text-sm whitespace-nowrap transition-all-smooth">
                        {item.label}
                      </span>
                    )}
                  </a>
                );
              }
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id);
                    setIsMobileSidebarOpen(false);
                  }}
                  className={`w-full flex items-center p-3 rounded-xl transition-all-smooth cursor-pointer relative ${
                    isSidebarCollapsed ? 'justify-center' : 'space-x-3'
                  } ${isActive ? item.activeBg : item.inactiveClass}`}
                  title={item.label}
                >
                  <i className={`${item.iconClass} text-lg flex-shrink-0`}></i>
                  {!isSidebarCollapsed && (
                    <span className="sidebar-text text-sm whitespace-nowrap transition-all-smooth">
                      {item.label}
                    </span>
                  )}
                  {item.badge !== undefined && item.badge > 0 && (
                    <span
                      className={`absolute ${
                        isSidebarCollapsed ? 'top-1.5 right-1.5' : 'right-3 top-3.5'
                      } bg-amber-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-gray-100">
          <div id="sidebar-footer" className="flex items-center space-x-3 overflow-hidden">
            <div className="w-8 h-8 rounded-full bg-red-50 flex items-center justify-center text-red-500 flex-shrink-0">
              <i className="fa-solid fa-user-shield"></i>
            </div>
            {!isSidebarCollapsed && (
              <div className="sidebar-text transition-all-smooth truncate">
                <p className="text-xs font-semibold text-gray-800">แอดมินนำจ่ายคำ</p>
                <p className="text-[10px] text-gray-400">ผู้ดูแลระบบคลังส่งออก</p>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* Backdrop */}
      {isMobileSidebarOpen && (
        <div
          id="mobile-backdrop"
          onClick={() => setIsMobileSidebarOpen(false)}
          className="fixed inset-0 bg-black/40 z-30 transition-all-smooth lg:hidden"
        ></div>
      )}
    </>
  );
}
