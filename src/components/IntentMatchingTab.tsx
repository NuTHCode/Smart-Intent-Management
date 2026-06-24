import React, { useState } from 'react';

export default function IntentMatchingTab() {
  const iframeUrl = "https://script.google.com/macros/s/AKfycbxrtZQmNzrbOvu-SNNf2w4yJ7eLn14g5kQUINIffCpWbWXakJVK0bR0Uyaq2eeBZo7dbA/exec";
  const [key, setKey] = useState(0);

  const handleReload = () => {
    setKey(prev => prev + 1);
  };

  return (
    <div id="tab-intent-matching" className="flex flex-col h-[calc(100vh-130px)] space-y-4 animate-fade-in">
      {/* Dynamic Subsystem Control Header */}
      <div className="bg-white p-4 lg:p-5 rounded-2xl border border-gray-100 shadow-sm flex flex-col md:flex-row gap-4 justify-between items-center hover:shadow-md transition-all duration-300 flex-shrink-0">
        <div className="space-y-1 text-center md:text-left">
          <h3 className="text-sm lg:text-base font-bold text-gray-800 flex items-center justify-center md:justify-start">
            <i className="fa-solid fa-bezier-curve text-indigo-600 mr-2 animate-pulse"></i>
            ระบบล้างข้อมูลและจัดกลุ่มคำสั่งจริง (Intent Matrix System)
          </h3>
          <p className="text-xs text-gray-400">
            ระบบจัดทำและจัดกลุ่มข้อมูลคำถามผู้ใช้ (Dataset Pipeline) เชื่อมโยงสดผ่านระบบย่อย Google Apps Script ล่าสุดอย่างสมบูรณ์แบบ
          </p>
        </div>
        
        <div className="flex gap-2.5 flex-shrink-0">
          <a 
            href={iframeUrl} 
            target="_blank" 
            rel="noopener noreferrer"
            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-600 text-xs font-bold rounded-xl transition-all duration-200 flex items-center space-x-1.5"
          >
            <i className="fa-solid fa-arrow-up-right-from-square"></i>
            <span>เปิดในแท็บใหม่</span>
          </a>
          <button 
            onClick={handleReload}
            className="px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 text-xs font-bold rounded-xl transition-all duration-200 flex items-center space-x-1.5"
          >
            <i className="fa-solid fa-rotate"></i>
            <span>รีโหลดระบบย่อย</span>
          </button>
        </div>
      </div>

      {/* Embedded Live Google Apps Script Application */}
      <div className="flex-grow bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden relative min-h-[500px]">
        <iframe
          key={key}
          id="intent-matrix-iframe"
          src={iframeUrl}
          className="w-full h-full border-0 absolute inset-0"
          title="Intent Matrix Subsystem"
          allow="clipboard-read; clipboard-write; geolocation; microphone; camera"
        ></iframe>
      </div>
    </div>
  );
}
