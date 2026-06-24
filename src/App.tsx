import React, { useState, useEffect } from 'react';
import Swal from 'sweetalert2';
import { TabName, Intent, StopWord, Phrase, SavedPhrase } from './types';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import DashboardTab from './components/DashboardTab';
import WorkspaceTab from './components/WorkspaceTab';
import DuplicateTab from './components/DuplicateTab';
import IntentMatchingTab from './components/IntentMatchingTab';
import IntentsTab from './components/IntentsTab';
import StopWordsTab from './components/StopWordsTab';
import LogoSettingsTab from './components/LogoSettingsTab';

export default function App() {
  const [activeTab, setActiveTab] = useState<TabName>('dashboard');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  // Database lists
  const [intents, setIntents] = useState<Intent[]>([]);
  const [stopWords, setStopWords] = useState<StopWord[]>([]);
  const [sessionPhrases, setSessionPhrases] = useState<Phrase[]>([]);
  const [historyPhrases, setHistoryPhrases] = useState<SavedPhrase[]>([]);
  const [savedAnalytics, setSavedAnalytics] = useState({ categories: [], insights: [] });

  // System settings
  const [systemName, setSystemName] = useState('Post Intent Lab');
  const [systemLogo, setSystemLogo] = useState('');

  // Modals visibility states
  const [isStopWordModalOpen, setIsStopWordModalOpen] = useState(false);
  const [isIntentModalOpen, setIsIntentModalOpen] = useState(false);

  // New item inputs
  const [newIntentName, setNewIntentName] = useState('');
  const [newIntentDesc, setNewIntentDesc] = useState('');
  const [newStopWordPattern, setNewStopWordPattern] = useState('');
  const [newStopWordType, setNewStopWordType] = useState('Regex');
  const [newStopWordDesc, setNewStopWordDesc] = useState('');

  // Fetch initial data
  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    setIsProcessing(true);
    try {
      const res = await fetch('/api/db');
      const data = await res.json();
      if (data) {
        setIntents(data.intents || []);
        setStopWords(data.stopwords || []);
        setHistoryPhrases(data.phrases || []);
        setSystemName(data.system_name || 'Post Intent Lab');
        setSystemLogo(data.system_logo || '');
        setSavedAnalytics(data.analytics || { categories: [], insights: [] });
      }
    } catch (err) {
      console.error('Error loading database config:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  const reloadIntents = async () => {
    try {
      const res = await fetch('/api/intents');
      const data = await res.json();
      setIntents(data);
    } catch (e) {
      console.error('Failed to reload intents', e);
    }
  };

  const reloadStopWords = async () => {
    try {
      const res = await fetch('/api/stopwords');
      const data = await res.json();
      setStopWords(data);
    } catch (e) {
      console.error('Failed to reload stopwords', e);
    }
  };

  const reloadHistoryPhrases = async () => {
    try {
      const res = await fetch('/api/phrases');
      const data = await res.json();
      setHistoryPhrases(data);
    } catch (e) {
      console.error('Failed to reload phrases', e);
    }
  };

  // Intent Operations
  const handleAddIntent = async (name: string, desc: string) => {
    try {
      const res = await fetch('/api/intents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, description: desc })
      });
      const data = await res.json();
      if (data.success) {
        await reloadIntents();
      }
      return data;
    } catch (e: any) {
      return { success: false, message: e.toString() };
    }
  };

  const handleUpdateIntent = async (oldName: string, newName: string, desc: string) => {
    try {
      const res = await fetch('/api/intents', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ oldName, newName, description: desc })
      });
      const data = await res.json();
      if (data.success) {
        await reloadIntents();
        // Update intents inside sessionPhrases as well
        setSessionPhrases(prev => prev.map(p => p.intent === oldName ? { ...p, intent: newName } : p));
      }
      return data;
    } catch (e: any) {
      return { success: false, message: e.toString() };
    }
  };

  const handleDeleteIntent = async (name: string) => {
    try {
      const res = await fetch(`/api/intents/${encodeURIComponent(name)}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (data.success) {
        await reloadIntents();
        // Clear intents inside sessionPhrases as well
        setSessionPhrases(prev => prev.map(p => p.intent === name ? { ...p, intent: '' } : p));
      }
      return data;
    } catch (e: any) {
      return { success: false, message: e.toString() };
    }
  };

  // Stop Word Operations
  const handleAddStopWord = async (pattern: string, type: string, desc: string) => {
    try {
      const res = await fetch('/api/stopwords', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pattern, type, description: desc })
      });
      const data = await res.json();
      if (data.success) {
        await reloadStopWords();
      }
      return data;
    } catch (e: any) {
      return { success: false, message: e.toString() };
    }
  };

  const handleUpdateStopWord = async (id: number, pattern: string, type: string, desc: string) => {
    try {
      const res = await fetch(`/api/stopwords/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pattern, type, description: desc })
      });
      const data = await res.json();
      if (data.success) {
        await reloadStopWords();
      }
      return data;
    } catch (e: any) {
      return { success: false, message: e.toString() };
    }
  };

  const handleDeleteStopWord = async (id: number) => {
    try {
      const res = await fetch(`/api/stopwords/${id}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (data.success) {
        await reloadStopWords();
      }
      return data;
    } catch (e: any) {
      return { success: false, message: e.toString() };
    }
  };

  // Save matched phrases to Google Sheets (Server Storage)
  const handleSaveToStorage = () => {
    if (sessionPhrases.length === 0) {
      Swal.fire({
        icon: 'error',
        title: 'ผิดพลาด',
        text: 'ไม่มีข้อมูลใหม่สำหรับการส่งบันทึก',
        customClass: { popup: 'custom-swal-popup', confirmButton: 'custom-swal-confirm-btn' },
      });
      return;
    }

    const completedList = sessionPhrases.filter((item) => item.intent !== '');
    if (completedList.length === 0) {
      Swal.fire({
        icon: 'warning',
        text: 'กรุณาระบุจับคู่หมวดหมู่ Intent อย่างน้อย 1 รายการก่อนส่งข้อมูล',
        customClass: { popup: 'custom-swal-popup', confirmButton: 'custom-swal-confirm-btn' },
      });
      return;
    }

    Swal.fire({
      title: 'ยืนยันสั่งบันทึกข้อมูล?',
      text: `ต้องการบันทึกข้อมูลประโยคสะสมจำนวน ${completedList.length} แถวนี้ เข้าสู่คลัง All_Data_Storage หรือไม่?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'บันทึกเลย',
      cancelButtonText: 'ยกเลิก',
      customClass: {
        popup: 'custom-swal-popup',
        confirmButton: 'custom-swal-confirm-btn',
        cancelButton: 'custom-swal-cancel-btn',
      },
    }).then(async (result) => {
      if (result.isConfirmed) {
        setIsProcessing(true);

        // Pre-compute dynamic categories for saved history summary
        const catMap: { [key: string]: number } = {};
        completedList.forEach((p) => {
          const cat = p.category || 'ทั่วไป (Greeting)';
          catMap[cat] = (catMap[cat] || 0) + 1;
        });

        const categoriesList = Object.entries(catMap).map(([name, count], index) => ({
          rank: index + 1,
          name,
          count,
          percentage: ((count / completedList.length) * 100).toFixed(0),
        }));

        const phraseFreq: { [key: string]: { item: Phrase; count: number } } = {};
        completedList.forEach((p) => {
          const key = (p.phrase || '').trim().toLowerCase();
          if (!key) return;
          if (phraseFreq[key]) {
            phraseFreq[key].count += 1;
          } else {
            phraseFreq[key] = { item: p, count: 1 };
          }
        });

        const insightsList = Object.values(phraseFreq)
          .map((obj, index) => ({
            rank: index + 1,
            phrase: obj.item.phrase,
            cleanedPhrase: obj.item.cleanedPhrase,
            category: obj.item.category,
            topic: obj.item.topic,
            frequency: obj.count,
          }))
          .sort((a, b) => b.frequency - a.frequency)
          .slice(0, 10);

        try {
          const res = await fetch('/api/phrases', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              dataList: completedList,
              categories: categoriesList,
              insights: insightsList,
            }),
          });
          const data = await res.json();
          if (data.success) {
            Swal.fire({
              icon: 'success',
              title: 'สำเร็จ!',
              text: data.message,
              customClass: { popup: 'custom-swal-popup', confirmButton: 'custom-swal-confirm-btn' },
            });
            await reloadHistoryPhrases();
            // Clear matched ones from sessionPhrases on successful backend save
            setSessionPhrases((prev) => prev.filter((p) => p.intent === ''));
          } else {
            Swal.fire({
              icon: 'error',
              title: 'บันทึกไม่สำเร็จ',
              text: data.message,
              customClass: { popup: 'custom-swal-popup', confirmButton: 'custom-swal-confirm-btn' },
            });
          }
        } catch (e: any) {
          Swal.fire({
            icon: 'error',
            title: 'ผิดพลาด',
            text: e.toString(),
            customClass: { popup: 'custom-swal-popup', confirmButton: 'custom-swal-confirm-btn' },
          });
        } finally {
          setIsProcessing(false);
        }
      }
    });
  };

  // System Settings Operations
  const handleSaveSystemName = async (name: string) => {
    try {
      const res = await fetch('/api/app-config/name', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name })
      });
      if (!res.ok) {
        const text = await res.text();
        return { success: false, message: `ไม่สามารถบันทึกชื่อได้ (รหัสข้อผิดพลาด: ${res.status}): ${text.substring(0, 100)}` };
      }
      const contentType = res.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await res.text();
        return { success: false, message: `เซิร์ฟเวอร์ตอบกลับไม่ใช่ข้อมูล JSON: ${text.substring(0, 100)}` };
      }
      const data = await res.json();
      if (data.success) {
        setSystemName(name);
      }
      return data;
    } catch (e: any) {
      return { success: false, message: e.toString() };
    }
  };

  const handleSaveSystemLogo = async (logoBase64: string) => {
    try {
      const res = await fetch('/api/app-config/logo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ logo: logoBase64 })
      });
      if (!res.ok) {
        const text = await res.text();
        return { success: false, message: `ไม่สามารถบันทึกโลโก้ได้ (รหัสข้อผิดพลาด: ${res.status}): ${text.substring(0, 100)}` };
      }
      const contentType = res.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await res.text();
        return { success: false, message: `เซิร์ฟเวอร์ตอบกลับไม่ใช่ข้อมูล JSON: ${text.substring(0, 100)}` };
      }
      const data = await res.json();
      if (data.success) {
        setSystemLogo(logoBase64);
      }
      return data;
    } catch (e: any) {
      return { success: false, message: e.toString() };
    }
  };

  const handleResetSystemLogo = async () => {
    try {
      const res = await fetch('/api/app-config/logo', {
        method: 'DELETE'
      });
      if (!res.ok) {
        const text = await res.text();
        return { success: false, message: `ไม่สามารถรีเซ็ตโลโก้ได้ (รหัสข้อผิดพลาด: ${res.status}): ${text.substring(0, 100)}` };
      }
      const contentType = res.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await res.text();
        return { success: false, message: `เซิร์ฟเวอร์ตอบกลับไม่ใช่ข้อมูล JSON: ${text.substring(0, 100)}` };
      }
      const data = await res.json();
      if (data.success) {
        setSystemLogo('');
      }
      return data;
    } catch (e: any) {
      return { success: false, message: e.toString() };
    }
  };

  // Modals Save Handlers
  const handleSaveNewStopWord = async () => {
    if (!newStopWordPattern.trim()) {
      Swal.fire({
        title: 'ข้อมูลไม่ครบถ้วน',
        text: 'กรุณากรอกรูปแบบคำฟุ่มเฟือย',
        icon: 'error',
        customClass: { popup: 'custom-swal-popup', confirmButton: 'custom-swal-confirm-btn' }
      });
      return;
    }

    setIsProcessing(true);
    const res = await handleAddStopWord(newStopWordPattern, newStopWordType, newStopWordDesc);
    setIsProcessing(false);

    if (res.success) {
      Swal.fire({
        title: 'สำเร็จ!',
        text: res.message,
        icon: 'success',
        customClass: { popup: 'custom-swal-popup', confirmButton: 'custom-swal-confirm-btn' }
      });
      setIsStopWordModalOpen(false);
      // Reset state inputs
      setNewStopWordPattern('');
      setNewStopWordDesc('');
    } else {
      Swal.fire({
        title: 'ผิดพลาด!',
        text: res.message,
        icon: 'error',
        customClass: { popup: 'custom-swal-popup', confirmButton: 'custom-swal-confirm-btn' }
      });
    }
  };

  const handleSaveNewIntent = async () => {
    if (!newIntentName.trim()) {
      Swal.fire({
        title: 'ข้อมูลไม่ครบถ้วน',
        text: 'กรุณากรอกชื่อ Intent',
        icon: 'error',
        customClass: { popup: 'custom-swal-popup', confirmButton: 'custom-swal-confirm-btn' }
      });
      return;
    }

    setIsProcessing(true);
    const res = await handleAddIntent(newIntentName, newIntentDesc);
    setIsProcessing(false);

    if (res.success) {
      Swal.fire({
        title: 'สำเร็จ!',
        text: res.message,
        icon: 'success',
        customClass: { popup: 'custom-swal-popup', confirmButton: 'custom-swal-confirm-btn' }
      });
      setIsIntentModalOpen(false);
      setNewIntentName('');
      setNewIntentDesc('');
    } else {
      Swal.fire({
        title: 'ผิดพลาด!',
        text: res.message,
        icon: 'error',
        customClass: { popup: 'custom-swal-popup', confirmButton: 'custom-swal-confirm-btn' }
      });
    }
  };

  const renderActiveTab = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <DashboardTab
            sessionPhrases={sessionPhrases}
            historyPhrases={historyPhrases}
            savedAnalytics={savedAnalytics}
          />
        );
      case 'workspace':
        return (
          <WorkspaceTab
            sessionPhrases={sessionPhrases}
            setSessionPhrases={setSessionPhrases}
            intents={intents}
            stopWords={stopWords}
            onSaveToStorage={handleSaveToStorage}
          />
        );
      case 'duplicate-center':
        return (
          <DuplicateTab
            sessionPhrases={sessionPhrases}
            setSessionPhrases={setSessionPhrases}
            historyPhrases={historyPhrases}
            setHistoryPhrases={setHistoryPhrases}
          />
        );
      case 'intent-matching':
        return (
          <IntentMatchingTab />
        );
      case 'intents-center':
        return (
          <IntentsTab
            intents={intents}
            onAddIntent={handleAddIntent}
            onUpdateIntent={handleUpdateIntent}
            onDeleteIntent={handleDeleteIntent}
            openCreateModal={() => setIsIntentModalOpen(true)}
          />
        );
      case 'stopwords-center':
        return (
          <StopWordsTab
            stopWords={stopWords}
            onAddStopWord={handleAddStopWord}
            onUpdateStopWord={handleUpdateStopWord}
            onDeleteStopWord={handleDeleteStopWord}
            openCreateModal={() => setIsStopWordModalOpen(true)}
          />
        );
      case 'logo-settings':
        return (
          <LogoSettingsTab
            systemName={systemName}
            onSaveSystemName={handleSaveSystemName}
            systemLogo={systemLogo}
            onSaveSystemLogo={handleSaveSystemLogo}
            onResetSystemLogo={handleResetSystemLogo}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="bg-gray-50 h-screen overflow-hidden flex text-gray-800 relative font-sans">
      {/* Sidebar collapsible */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        duplicateCount={0} // Computed automatically in duplicate list tab if needed
        isSidebarCollapsed={isSidebarCollapsed}
        setIsSidebarCollapsed={setIsSidebarCollapsed}
        isMobileSidebarOpen={isMobileSidebarOpen}
        setIsMobileSidebarOpen={setIsMobileSidebarOpen}
        systemName={systemName}
        systemLogo={systemLogo}
      />

      {/* Main Workspace Frame */}
      <div className="flex-grow flex flex-col h-full overflow-hidden">
        {/* Header bar */}
        <Header
          activeTab={activeTab}
          isProcessing={isProcessing}
          isMobileSidebarOpen={isMobileSidebarOpen}
          setIsMobileSidebarOpen={setIsMobileSidebarOpen}
        />

        {/* Scrollable Container */}
        <main id="main-content-scroll" className="flex-1 overflow-y-auto p-4 lg:p-6 space-y-6 bg-gray-50 no-scrollbar">
          {renderActiveTab()}
        </main>
      </div>

      {/* POPUP MODALS */}

      {/* 1. Stop Words Creator Modal */}
      {isStopWordModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center transition-all-smooth">
          <div className="bg-white rounded-3xl w-full max-w-md p-6 shadow-2xl border border-gray-100 m-4 animate-fade-in">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-base font-bold text-gray-800 flex items-center">
                <i className="fa-solid fa-filter text-orange-500 text-xl mr-2"></i>
                เพิ่มคำฟุ่มเฟือยเพื่อล้างออโต้
              </h3>
              <button
                onClick={() => setIsStopWordModalOpen(false)}
                className="w-8 h-8 rounded-full bg-gray-50 hover:bg-gray-100 flex items-center justify-center text-gray-400 hover:text-gray-600 transition-all-smooth cursor-pointer"
              >
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">คำฟุ่มเฟือย/สัญลักษณ์ (เช่น ครับ|คับ)</label>
                <input
                  type="text"
                  value={newStopWordPattern}
                  onChange={(e) => setNewStopWordPattern(e.target.value)}
                  placeholder="เช่น นะครับ|น่ะครับ"
                  className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-red-500 transition-all-smooth bg-gray-50/50"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">ประเภทของคำข้อมูล</label>
                <select
                  value={newStopWordType}
                  onChange={(e) => setNewStopWordType(e.target.value)}
                  className="w-full py-2.5 px-3 border border-gray-200 text-sm rounded-xl focus:outline-none focus:border-red-500 bg-white"
                >
                  <option value="Regex">รูปแบบพิเศษ (Regex)</option>
                  <option value="Word">คำศัพท์ทั่วไป (Word)</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">คำอธิบายคีย์เวิร์ด</label>
                <input
                  type="text"
                  value={newStopWordDesc}
                  onChange={(e) => setNewStopWordDesc(e.target.value)}
                  placeholder="เช่น หางเสียงฟุ่มเฟือย"
                  className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-red-500 transition-all-smooth bg-gray-50/50"
                />
              </div>

              <div className="pt-2">
                <button
                  onClick={handleSaveNewStopWord}
                  className="w-full py-3 bg-orange-500 hover:bg-orange-600 text-white text-sm font-bold rounded-xl transition-all-smooth shadow-lg shadow-orange-100 flex items-center justify-center space-x-2 cursor-pointer"
                >
                  <i className="fa-solid fa-save"></i>
                  <span>บันทึกคำใหม่</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. Intent Creator Modal */}
      {isIntentModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center transition-all-smooth">
          <div className="bg-white rounded-3xl w-full max-w-md p-6 shadow-2xl border border-gray-100 m-4 animate-fade-in">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-base font-bold text-gray-800 flex items-center">
                <i className="fa-solid fa-circle-plus text-primary text-xl mr-2"></i>
                สร้างประเภทคำสั่ง (Intent) ใหม่
              </h3>
              <button
                onClick={() => setIsIntentModalOpen(false)}
                className="w-8 h-8 rounded-full bg-gray-50 hover:bg-gray-100 flex items-center justify-center text-gray-400 hover:text-gray-600 transition-all-smooth cursor-pointer"
              >
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">ชื่อ Intent (ภาษาอังกฤษ ไม่มีช่องว่าง)</label>
                <input
                  type="text"
                  value={newIntentName}
                  onChange={(e) => setNewIntentName(e.target.value)}
                  placeholder="เช่น ask_shipping_price"
                  className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-red-500 transition-all-smooth bg-gray-50/50"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">คำอธิบาย Intent</label>
                <textarea
                  value={newIntentDesc}
                  onChange={(e) => setNewIntentDesc(e.target.value)}
                  rows={3}
                  placeholder="ระบุขอบเขตของ Intent นี้..."
                  className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-red-500 transition-all-smooth bg-gray-50/50"
                />
              </div>

              <div className="pt-2">
                <button
                  onClick={handleSaveNewIntent}
                  className="w-full py-3 bg-primary hover:bg-primary-hover text-white text-sm font-bold rounded-xl transition-all-smooth shadow-lg shadow-red-100 flex items-center justify-center space-x-2 cursor-pointer"
                >
                  <i className="fa-solid fa-floppy-disk"></i>
                  <span>สร้าง Intent</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
