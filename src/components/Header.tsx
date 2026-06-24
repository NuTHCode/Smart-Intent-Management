import React from 'react';
import { TabName } from '../types';

interface HeaderProps {
  activeTab: TabName;
  isProcessing: boolean;
  isMobileSidebarOpen: boolean;
  setIsMobileSidebarOpen: (open: boolean) => void;
}

export default function Header({
  activeTab,
  isProcessing,
  isMobileSidebarOpen,
  setIsMobileSidebarOpen,
}: HeaderProps) {
  const getPageTitle = (tab: TabName): string => {
    switch (tab) {
      case 'dashboard':
        return 'แดชบอร์ดสรุปภาพรวมคลังข้อมูล';
      case 'workspace':
        return 'จับคู่และจัดหมวดหมู่ Intent สะสม';
      case 'duplicate-center':
        return 'ศูนย์ตรวจสอบและทำความสะอาดข้อความซ้ำซ้อน';
      case 'intent-matching':
        return 'ระบบล้างข้อมูลและจัดกลุ่มคำสั่งจริง (Intent Matrix System)';
      case 'intents-center':
        return 'ศูนย์จัดการประเภทคำสั่ง (Intent Management)';
      case 'stopwords-center':
        return 'ศูนย์จัดการคำฟุ่มเฟือยและสัญลักษณ์พิเศษ (Stop Words)';
      case 'logo-settings':
        return 'ตั้งค่าระบบ ปรับแต่งแบรนด์และชื่อระบบ';
      default:
        return 'Post Intent Lab';
    }
  };

  return (
    <>
      <header className="h-16 bg-white border-b border-gray-200 px-4 lg:px-6 flex items-center justify-between z-20">
        <div className="flex items-center space-x-2">
          {/* Mobile Hamburguer inside header for ease of use or layout matching */}
          <button
            onClick={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
            className="lg:hidden p-2 rounded-lg text-gray-500 hover:bg-gray-100 transition-all-smooth cursor-pointer mr-1"
          >
            <i className="fa-solid fa-bars text-lg"></i>
          </button>
          <h2 id="page-title" className="text-sm lg:text-lg font-bold text-gray-800 truncate">
            {getPageTitle(activeTab)}
          </h2>
        </div>

        <div className="flex items-center space-x-3 flex-shrink-0">
          <div
            id="sync-loader"
            className={`flex items-center space-x-2 text-[10px] lg:text-xs text-gray-400 ${
              isProcessing ? '' : 'hidden'
            }`}
          >
            <i className="fa-solid fa-circle-notch animate-spin text-primary"></i>
            <span className="hidden sm:inline">กำลังประมวลผลข้อมูล...</span>
          </div>
          <div className="h-2.5 w-2.5 rounded-full bg-green-500 animate-pulse"></div>
          <span className="text-[10px] lg:text-xs font-semibold text-green-600 bg-green-50 px-2 lg:px-2.5 py-1 rounded-full border border-green-200">
            ระบบทำงานปกติ
          </span>
        </div>
      </header>

      {/* Mobile Floating Toggle button exactly as in the original */}
      <button
        id="mobile-sidebar-toggle"
        onClick={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
        className="lg:hidden fixed bottom-5 left-5 w-12 h-12 bg-primary text-white rounded-full shadow-2xl flex items-center justify-center z-50 hover:bg-red-700 transition-all-smooth cursor-pointer"
      >
        <i
          id="mobile-toggle-icon"
          className={`fa-solid ${isMobileSidebarOpen ? 'fa-xmark' : 'fa-bars'} text-lg`}
        ></i>
      </button>
    </>
  );
}
