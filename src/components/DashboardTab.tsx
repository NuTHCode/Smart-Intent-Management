import React, { useState, useEffect } from 'react';
import { Phrase, SavedPhrase, AnalyticsCategory, AnalyticsInsight } from '../types';

interface DashboardTabProps {
  sessionPhrases: Phrase[];
  historyPhrases: SavedPhrase[];
  savedAnalytics: {
    categories: AnalyticsCategory[];
    insights: AnalyticsInsight[];
  };
}

export default function DashboardTab({
  sessionPhrases,
  historyPhrases,
  savedAnalytics,
}: DashboardTabProps) {
  const [viewMode, setViewMode] = useState<'session' | 'history'>('session');
  
  // Date states
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  // Local derived KPIs
  const [totalCount, setTotalCount] = useState<number>(0);
  const [matchedCount, setMatchedCount] = useState<number>(0);
  const [unmatchedCount, setUnmatchedCount] = useState<number>(0);
  const [dbPhrasesCount, setDbPhrasesCount] = useState<number>(0);

  const [topCategories, setTopCategories] = useState<{ name: string; count: number; percentage: string }[]>([]);
  const [topInsights, setTopInsights] = useState<{ phrase: string; cleanedPhrase: string; category: string; frequency: number }[]>([]);

  // Init default dates
  useEffect(() => {
    const today = new Date();
    const past30Days = new Date();
    past30Days.setDate(today.getDate() - 30);
    
    setStartDate(formatDate(past30Days));
    setEndDate(formatDate(today));
  }, []);

  const formatDate = (date: Date): string => {
    const d = new Date(date);
    let month = '' + (d.getMonth() + 1);
    let day = '' + d.getDate();
    const year = d.getFullYear();

    if (month.length < 2) month = '0' + month;
    if (day.length < 2) day = '0' + day;

    return [year, month, day].join('-');
  };

  const handleResetFilter = () => {
    const today = new Date();
    const past30Days = new Date();
    past30Days.setDate(today.getDate() - 30);
    setStartDate(formatDate(past30Days));
    setEndDate(formatDate(today));
  };

  // Re-run whenever viewMode, phrases, or dates change
  useEffect(() => {
    if (viewMode === 'session') {
      setDbPhrasesCount(historyPhrases.length);
      setTotalCount(sessionPhrases.length);
      
      const matched = sessionPhrases.filter(p => p.intent !== '');
      setMatchedCount(matched.length);
      setUnmatchedCount(sessionPhrases.length - matched.length);

      // Compute top categories from session
      const catMap: { [key: string]: number } = {};
      sessionPhrases.forEach(p => {
        const cat = p.category || 'ทั่วไป (Greeting)';
        catMap[cat] = (catMap[cat] || 0) + 1;
      });

      const catList = Object.entries(catMap)
        .map(([name, count]) => ({
          name,
          count,
          percentage: sessionPhrases.length > 0 ? ((count / sessionPhrases.length) * 100).toFixed(0) : '0',
        }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);

      setTopCategories(catList);

      // Compute top insights from session (frequency of identical phrases)
      const phraseFreq: { [key: string]: { item: Phrase; count: number } } = {};
      sessionPhrases.forEach(p => {
        const key = (p.phrase || '').trim().toLowerCase();
        if (!key) return;
        if (phraseFreq[key]) {
          phraseFreq[key].count += 1;
        } else {
          phraseFreq[key] = { item: p, count: 1 };
        }
      });

      const insightList = Object.values(phraseFreq)
        .map(obj => ({
          phrase: obj.item.phrase,
          cleanedPhrase: obj.item.cleanedPhrase,
          category: obj.item.category,
          frequency: obj.count,
        }))
        .sort((a, b) => b.frequency - a.frequency)
        .slice(0, 10);

      setTopInsights(insightList);

    } else {
      // History mode - Aggregate from historyPhrases or savedAnalytics
      let pool = [...historyPhrases];

      // Apply date filter
      if (startDate || endDate) {
        const startMs = startDate ? new Date(startDate).setHours(0, 0, 0, 0) : 0;
        const endMs = endDate ? new Date(endDate).setHours(23, 59, 59, 999) : Infinity;

        pool = pool.filter(p => {
          const createdAt = p.createdAt || 0;
          return createdAt >= startMs && createdAt <= endMs;
        });
      }

      setDbPhrasesCount(historyPhrases.length);
      setTotalCount(pool.length);
      
      const matched = pool.filter(p => p.intent !== '');
      setMatchedCount(matched.length);
      setUnmatchedCount(pool.length - matched.length);

      // Compute categories
      const catMap: { [key: string]: number } = {};
      pool.forEach(p => {
        const cat = p.category || 'ทั่วไป (Greeting)';
        catMap[cat] = (catMap[cat] || 0) + 1;
      });

      const catList = Object.entries(catMap)
        .map(([name, count]) => ({
          name,
          count,
          percentage: pool.length > 0 ? ((count / pool.length) * 100).toFixed(0) : '0',
        }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);

      setTopCategories(catList);

      // Compute insights
      const phraseFreq: { [key: string]: { item: SavedPhrase; count: number } } = {};
      pool.forEach(p => {
        const key = (p.phrase || '').trim().toLowerCase();
        if (!key) return;
        if (phraseFreq[key]) {
          phraseFreq[key].count += 1;
        } else {
          phraseFreq[key] = { item: p, count: 1 };
        }
      });

      const insightList = Object.values(phraseFreq)
        .map(obj => ({
          phrase: obj.item.phrase,
          cleanedPhrase: obj.item.cleanedPhrase,
          category: obj.item.category,
          frequency: obj.count,
        }))
        .sort((a, b) => b.frequency - a.frequency)
        .slice(0, 10);

      setTopInsights(insightList);
    }
  }, [viewMode, sessionPhrases, historyPhrases, startDate, endDate]);

  return (
    <section id="tab-dashboard" className="space-y-6">
      {/* Date Filters and Range Selector */}
      <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm space-y-4 animate-fade-in">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 pb-2">
          <div className="flex items-center space-x-2 text-gray-700 font-bold text-sm">
            <i className="fa-solid fa-filter text-primary"></i>
            <span>เลือกช่วงเวลาในการคัดกรองแนวโน้มและจัดอันดับสถิติ</span>
          </div>
          {/* Dashboard Mode Switcher */}
          <div className="inline-flex rounded-xl bg-gray-100 p-1 select-none text-[10px] lg:text-xs self-start sm:self-auto">
            <button
              onClick={() => setViewMode('session')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all-smooth cursor-pointer ${
                viewMode === 'session' ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-400 hover:text-gray-800'
              }`}
            >
              ไฟล์ที่อัปโหลดปัจจุบัน
            </button>
            <button
              onClick={() => setViewMode('history')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all-smooth cursor-pointer ${
                viewMode === 'history' ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-400 hover:text-gray-800'
              }`}
            >
              ประวัติเทรนย้อนหลังในระบบ
            </button>
          </div>
        </div>

        {/* Date Selector */}
        {viewMode === 'history' && (
          <div id="dash-date-selectors" className="flex flex-col md:flex-row md:items-center gap-4 animate-fade-in">
            <div className="flex flex-1 gap-2 items-center">
              <span className="text-xs font-semibold text-gray-400 whitespace-nowrap">เริ่มต้น:</span>
              <input
                type="date"
                id="dash-start-date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full text-xs lg:text-sm py-2 px-3 border border-gray-200 rounded-xl focus:outline-none focus:border-red-500 bg-white"
              />
            </div>
            <div className="flex flex-1 gap-2 items-center">
              <span className="text-xs font-semibold text-gray-400 whitespace-nowrap">สิ้นสุด:</span>
              <input
                type="date"
                id="dash-end-date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full text-xs lg:text-sm py-2 px-3 border border-gray-200 rounded-xl focus:outline-none focus:border-red-500 bg-white"
              />
            </div>
            <div className="flex gap-2 justify-end">
              <button
                onClick={handleResetFilter}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-600 text-xs font-bold rounded-xl transition-all-smooth cursor-pointer"
              >
                รีเซ็ตช่วงเวลา
              </button>
            </div>
          </div>
        )}

        <div id="dash-view-status" className="text-xs text-amber-600 font-semibold bg-amber-50/50 p-2.5 rounded-xl border border-amber-100 flex items-center">
          <i className="fa-solid fa-circle-info mr-2"></i>
          <span id="lbl-view-status">
            {viewMode === 'session'
              ? 'กำลังแสดงผลลัพธ์: จากไฟล์ข้อมูลที่คุณนำเข้าล่าสุดเพื่อวิเคราะห์แนวโน้มทันที'
              : `กำลังแสดงผลลัพธ์: คัดกรองจากประวัติของแต่ละสถิติที่เคยได้รับการบันทึกจัดอันดับสะสมไว้ในระบบ (${startDate} ถึง ${endDate})`}
          </span>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
        <div className="bg-white p-4 lg:p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center space-x-3 lg:space-x-4 hover:shadow-md hover:scale-[1.02] transition-all-smooth cursor-pointer">
          <div className="p-2 lg:p-3 bg-red-50 text-primary rounded-xl">
            <i className="fa-solid fa-file-invoice text-xl lg:text-2xl"></i>
          </div>
          <div>
            <p className="text-[10px] lg:text-xs font-semibold text-gray-400 uppercase tracking-wider">ประโยคในไฟล์</p>
            <h3 id="stat-total" className="text-lg lg:text-2xl font-bold mt-0.5 text-gray-800">
              {totalCount.toLocaleString()}
            </h3>
          </div>
        </div>

        <div className="bg-white p-4 lg:p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center space-x-3 lg:space-x-4 hover:shadow-md hover:scale-[1.02] transition-all-smooth cursor-pointer">
          <div className="p-2 lg:p-3 bg-green-50 text-green-500 rounded-xl">
            <i className="fa-solid fa-circle-check text-xl lg:text-2xl"></i>
          </div>
          <div>
            <p className="text-[10px] lg:text-xs font-semibold text-gray-400 uppercase tracking-wider">จับคู่สำเร็จแล้ว</p>
            <h3 id="stat-matched" className="text-lg lg:text-2xl font-bold mt-0.5 text-green-600">
              {matchedCount.toLocaleString()}
            </h3>
          </div>
        </div>

        <div className="bg-white p-4 lg:p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center space-x-3 lg:space-x-4 hover:shadow-md hover:scale-[1.02] transition-all-smooth cursor-pointer">
          <div className="p-2 lg:p-3 bg-amber-50 text-amber-500 rounded-xl">
            <i className="fa-solid fa-hourglass-half text-xl lg:text-2xl"></i>
          </div>
          <div>
            <p className="text-[10px] lg:text-xs font-semibold text-gray-400 uppercase tracking-wider">รอระบุ Intent</p>
            <h3 id="stat-unmatched" className="text-lg lg:text-2xl font-bold mt-0.5 text-amber-500">
              {unmatchedCount.toLocaleString()}
            </h3>
          </div>
        </div>

        <div className="bg-white p-4 lg:p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center space-x-3 lg:space-x-4 hover:shadow-md hover:scale-[1.02] transition-all-smooth cursor-pointer">
          <div className="p-2 lg:p-3 bg-blue-50 text-blue-500 rounded-xl">
            <i className="fa-solid fa-database text-xl lg:text-2xl"></i>
          </div>
          <div>
            <p className="text-[10px] lg:text-xs font-semibold text-gray-400 uppercase tracking-wider">คลังคำ Storage</p>
            <h3 id="stat-database-count" className="text-lg lg:text-2xl font-bold mt-0.5 text-blue-600">
              {dbPhrasesCount.toLocaleString()}
            </h3>
          </div>
        </div>
      </div>

      {/* Analytics Lists */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top 10 Categories */}
        <div className="bg-white p-5 lg:p-6 rounded-2xl border border-gray-100 shadow-sm space-y-4 hover:shadow-md transition-all-smooth">
          <div className="flex items-center justify-between border-b border-gray-100 pb-3">
            <h3 className="text-xs lg:text-base font-bold text-gray-800 flex items-center">
              <i className="fa-solid fa-chart-bar text-emerald-500 mr-2 text-sm lg:text-lg"></i>
              10 อันดับหมวดหมู่คำถามสูงสุดของลูกค้า
            </h3>
            <span className="text-[9px] font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-100">
              สถิติจากระบบ
            </span>
          </div>
          <div className="overflow-hidden">
            <ul id="top-category-list" className="divide-y divide-gray-100 text-xs lg:text-sm text-gray-700">
              {topCategories.length === 0 ? (
                <li className="py-8 text-center text-gray-400">
                  <i className="fa-solid fa-chart-pie text-4xl block mb-2 text-gray-300"></i>
                  <span>ไม่มีข้อมูล กรุณานำเข้าหรือเลือกประวัติเทรนย้อนหลัง</span>
                </li>
              ) : (
                topCategories.map((cat, idx) => (
                  <li key={idx} className="py-3 flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <span className="w-6 h-6 rounded-full bg-slate-100 text-slate-600 font-bold flex items-center justify-center text-xs">
                        {idx + 1}
                      </span>
                      <span className="font-semibold text-gray-700">{cat.name}</span>
                    </div>
                    <div className="flex items-center space-x-4">
                      <span className="text-gray-400 font-medium">{cat.count} ครั้ง</span>
                      <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">
                        {cat.percentage}%
                      </span>
                    </div>
                  </li>
                ))
              )}
            </ul>
          </div>
        </div>

        {/* Top 10 Insights */}
        <div className="bg-white p-5 lg:p-6 rounded-2xl border border-gray-100 shadow-sm space-y-4 hover:shadow-md transition-all-smooth">
          <div className="flex items-center justify-between border-b border-gray-100 pb-3">
            <h3 className="text-xs lg:text-base font-bold text-gray-800 flex items-center">
              <i className="fa-solid fa-brain text-indigo-500 mr-2 text-sm lg:text-lg"></i>
              10 ประโยคเด่นสำหรับจัดชุดคำตอบใหม่
            </h3>
            <span className="text-[9px] font-bold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-full border border-indigo-100">
              สถิติจากระบบ
            </span>
          </div>
          <div className="overflow-hidden">
            <ul id="top-insight-list" className="divide-y divide-gray-100 text-xs lg:text-sm text-gray-700">
              {topInsights.length === 0 ? (
                <li className="py-8 text-center text-gray-400">
                  <i className="fa-solid fa-brain text-4xl block mb-2 text-gray-300"></i>
                  <span>ยังไม่มีข้อมูล กรุณานำเข้าหรือเลือกสแกนประวัติเทรน</span>
                </li>
              ) : (
                topInsights.map((ins, idx) => (
                  <li key={idx} className="py-3 flex items-center justify-between">
                    <div className="flex flex-col space-y-0.5 truncate mr-3">
                      <div className="font-bold text-gray-800 truncate">{ins.phrase}</div>
                      <div className="text-[10px] text-gray-400">
                        ล้างคำ: <span className="font-mono">{ins.cleanedPhrase}</span> | หมวดหมู่: {ins.category}
                      </div>
                    </div>
                    <div className="flex-shrink-0 flex items-center">
                      <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100 whitespace-nowrap">
                        เจอ {ins.frequency} ครั้ง
                      </span>
                    </div>
                  </li>
                ))
              )}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
