import React, { useState, useEffect, useRef } from 'react';
import * as XLSX from 'xlsx';
import Swal from 'sweetalert2';
import { Phrase, Intent, StopWord } from '../types';
import { cleanStopWords, autoClassifyAndExtractTopic } from '../utils/textCleaner';

interface WorkspaceTabProps {
  sessionPhrases: Phrase[];
  setSessionPhrases: React.Dispatch<React.SetStateAction<Phrase[]>>;
  intents: Intent[];
  stopWords: StopWord[];
  onSaveToStorage: () => void;
}

export default function WorkspaceTab({
  sessionPhrases,
  setSessionPhrases,
  intents,
  stopWords,
  onSaveToStorage,
}: WorkspaceTabProps) {
  // Ref for table container to scroll to top on pagination
  const tableContainerRef = useRef<HTMLDivElement>(null);
  // Ref for the main table section card to scroll to after file upload
  const mainTableSectionRef = useRef<HTMLDivElement>(null);
  // Track previous page to only scroll on actual page transitions (avoiding on mount)
  const prevPageRef = useRef<number | undefined>(undefined);

  // Scroll to the top of the main container when the component first mounts
  useEffect(() => {
    const mainContainer = document.getElementById('main-content-scroll');
    if (mainContainer) {
      mainContainer.scrollTo({ top: 0 });
    }
  }, []);

  // Filters & Sorting states
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'matched' | 'unmatched'>('all');
  const [intentFilter, setIntentFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [sortCol, setSortCol] = useState<string>('none');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const pageLimit = 50;

  // Row selection state
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());

  // Inline editing state
  const [editingRowId, setEditingRowId] = useState<number | null>(null);
  const [editingText, setEditingText] = useState('');

  // Extract unique intents in current session file for the dropdown filter
  const [uniqueIntentsInFile, setUniqueIntentsInFile] = useState<string[]>([]);

  useEffect(() => {
    const list = Array.from(new Set(sessionPhrases.map(p => p.intent).filter(Boolean)));
    setUniqueIntentsInFile(list);
  }, [sessionPhrases]);

  // Scroll table back to top and focus first row when page changes
  useEffect(() => {
    if (prevPageRef.current !== undefined && prevPageRef.current !== currentPage) {
      if (tableContainerRef.current) {
        tableContainerRef.current.scrollTop = 0;
        tableContainerRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    }
    prevPageRef.current = currentPage;
  }, [currentPage]);

  // Handle excel import
  const handleExcelImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    Swal.fire({
      title: 'กำลังนำเข้าและประมวลผลไฟล์...',
      html: `
        <div class="space-y-4">
          <div class="w-full bg-slate-100 rounded-full h-4 overflow-hidden relative border border-slate-200">
            <div id="swal-progress-bar" class="bg-indigo-600 h-4 rounded-full transition-all duration-300" style="width: 25%"></div>
          </div>
          <p class="text-xs text-slate-500 font-semibold">กำลังเริ่มต้นสแกนประโยคดิบ...</p>
        </div>
      `,
      allowOutsideClick: false,
      showConfirmButton: false,
      didOpen: () => {
        const reader = new FileReader();
        reader.onload = (evt) => {
          try {
            const data = new Uint8Array(evt.target?.result as ArrayBuffer);
            const workbook = XLSX.read(data, { type: 'array' });
            const sheetName = workbook.SheetNames[0];
            const sheet = workbook.Sheets[sheetName];
            const rows = XLSX.utils.sheet_to_json<any[]>(sheet, { header: 1 });

            if (rows.length <= 1) {
              Swal.fire({
                title: 'เกิดข้อผิดพลาด!',
                text: 'ไฟล์ที่นำเข้าไม่มีข้อมูล หรือโครงสร้างคอลัมน์ไม่ถูกต้อง',
                icon: 'error',
                customClass: { popup: 'custom-swal-popup', confirmButton: 'custom-swal-confirm-btn' },
              });
              return;
            }

            // Progress Update
            const pBar = document.getElementById('swal-progress-bar');
            if (pBar) pBar.style.width = '75%';

            const parsedPhrases: Phrase[] = [];
            // Skip header row
            for (let i = 1; i < rows.length; i++) {
              const row = rows[i];
              if (!row || row.length === 0) continue;

              // Row format can be [intent, phrase]
              const intentVal = row[0] ? String(row[0]).trim() : '';
              const phraseVal = row[1] ? String(row[1]).trim() : '';

              if (!phraseVal) continue;

              const cleaned = cleanStopWords(phraseVal, stopWords);
              const { category, topic } = autoClassifyAndExtractTopic(cleaned);

              parsedPhrases.push({
                id: i, // row number as fallback session id
                intent: intentVal,
                phrase: phraseVal,
                cleanedPhrase: cleaned,
                category,
                topic,
                createdAt: Date.now(),
              });
            }

            setSessionPhrases(parsedPhrases);
            setCurrentPage(1);
            setSelectedIds(new Set());

            Swal.fire({
              title: 'นำเข้าไฟล์สำเร็จ!',
              text: `นำเข้าพิจารณาจำนวนทั้งหมด ${parsedPhrases.length} แถว เรียบร้อย`,
              icon: 'success',
              customClass: { popup: 'custom-swal-popup', confirmButton: 'custom-swal-confirm-btn' },
            }).then(() => {
              // Smooth scroll to the data table box automatically
              setTimeout(() => {
                if (mainTableSectionRef.current) {
                  mainTableSectionRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
              }, 150);
            });
          } catch (err: any) {
            Swal.fire({
              title: 'เกิดข้อผิดพลาดในการเปิดไฟล์',
              text: err.message,
              icon: 'error',
              customClass: { popup: 'custom-swal-popup', confirmButton: 'custom-swal-confirm-btn' },
            });
          }
        };
        reader.readAsArrayBuffer(file);
      },
    });

    e.target.value = ''; // Reset input
  };

  // Export Excel matching exactly Columns A (intent) and B (phrase)
  const handleExcelExport = () => {
    if (sessionPhrases.length === 0) {
      Swal.fire({
        title: 'ผิดพลาด!',
        text: 'ไม่มีข้อมูลอยู่ในหน่วยความจำ กรุณาอัปโหลดข้อมูลก่อนรันผลลัพธ์',
        icon: 'error',
        customClass: { popup: 'custom-swal-popup', confirmButton: 'custom-swal-confirm-btn' },
      });
      return;
    }

    const exportRows = sessionPhrases.map(item => ({
      intent: item.intent,
      phrase: item.phrase,
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportRows);
    XLSX.utils.sheet_add_aoa(worksheet, [["intent", "phrase"]], { origin: "A1" });

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Training_Intent_Results");
    XLSX.writeFile(workbook, "intent_training_ready.xlsx");

    Swal.fire({
      icon: 'success',
      title: 'ดาวน์โหลดสำเร็จ!',
      text: 'ส่งออกไฟล์ Excel สำหรับส่งขึ้นประมวลบอทเรียบร้อย (คอลัมน์ A: intent, คอลัมน์ B: phrase)',
      customClass: { popup: 'custom-swal-popup', confirmButton: 'custom-swal-confirm-btn' },
    });
  };

  // Download template
  const handleDownloadTemplate = () => {
    const templateData = [
      { intent: "greeting", phrase: "สวัสดีค่ะ สอบถามข้อมูลหน่อยค่ะ" },
      { intent: "check_status", phrase: "พัสดุ TH123456789TH ถึงไหนแล้ว" },
      { intent: "", phrase: "ค่าส่งพัสดุไปเชียงรายเท่าไหร่คะ" }
    ];

    const worksheet = XLSX.utils.json_to_sheet(templateData);
    XLSX.utils.sheet_add_aoa(worksheet, [["intent", "phrase"]], { origin: "A1" });

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Template");
    XLSX.writeFile(workbook, "thailand_post_intent_template.xlsx");

    Swal.fire({
      icon: 'success',
      title: 'ดาวน์โหลด Template สำเร็จ!',
      text: 'ดาวน์โหลดไฟล์เทมเพลตสำหรับอัปโหลดเรียบร้อย',
      customClass: { popup: 'custom-swal-popup', confirmButton: 'custom-swal-confirm-btn' },
    });
  };

  // Filter & Sort logic
  const filteredPhrases = sessionPhrases.filter(item => {
    // Search filter
    const phraseVal = item.phrase || "";
    const cleanedVal = item.cleanedPhrase || "";
    const matchesSearch = phraseVal.toLowerCase().includes(search.toLowerCase()) ||
                          cleanedVal.toLowerCase().includes(search.toLowerCase());

    // Status filter
    let matchesStatus = true;
    if (statusFilter === 'matched') matchesStatus = (item.intent || '') !== '';
    else if (statusFilter === 'unmatched') matchesStatus = (item.intent || '') === '';

    // File Intent filter
    let matchesIntent = true;
    if (intentFilter === 'empty') matchesIntent = (item.intent || '') === '';
    else if (intentFilter !== 'all') matchesIntent = item.intent === intentFilter;

    // Category filter
    let matchesCategory = true;
    if (categoryFilter !== 'all') {
      const catVal = item.category || "";
      if (categoryFilter === 'complaint') matchesCategory = catVal.includes('ร้องเรียน');
      else if (categoryFilter === 'pricing') matchesCategory = catVal.includes('ค่าบริการ');
      else if (categoryFilter === 'status') matchesCategory = catVal.includes('ติดตาม');
      else if (categoryFilter === 'general') matchesCategory = catVal.includes('ทั่วไป');
    }

    return matchesSearch && matchesStatus && matchesIntent && matchesCategory;
  });

  // Sort logic
  if (sortCol !== 'none') {
    filteredPhrases.sort((a: any, b: any) => {
      const valA = a[sortCol] ? a[sortCol].toString().trim() : '';
      const valB = b[sortCol] ? b[sortCol].toString().trim() : '';
      const comp = valA.localeCompare(valB, 'th', { sensitivity: 'base' });
      return sortDir === 'asc' ? comp : -comp;
    });
  }

  // Pagination bounds
  const totalPages = Math.ceil(filteredPhrases.length / pageLimit) || 1;
  const startIndex = (currentPage - 1) * pageLimit;
  const paginatedPhrases = filteredPhrases.slice(startIndex, startIndex + pageLimit);

  // Check if all paginated elements are selected
  const allPaginatedSelected = paginatedPhrases.length > 0 && paginatedPhrases.every(item => selectedIds.has(item.id));

  const handleSelectAllPaginated = (checked: boolean) => {
    const nextSelected = new Set(selectedIds);
    paginatedPhrases.forEach(p => {
      if (checked) nextSelected.add(p.id);
      else nextSelected.delete(p.id);
    });
    setSelectedIds(nextSelected);
  };

  const handleSelectIndividual = (id: number, checked: boolean) => {
    const nextSelected = new Set(selectedIds);
    if (checked) nextSelected.add(id);
    else nextSelected.delete(id);
    setSelectedIds(nextSelected);
  };

  const handleIntentChange = (id: number, intentVal: string) => {
    setSessionPhrases(prev => prev.map(p => p.id === id ? { ...p, intent: intentVal } : p));
  };

  const handleDeleteIndividual = (id: number) => {
    Swal.fire({
      title: 'ต้องการลบข้อมูลประโยคนี้?',
      text: 'ลบแถวออกจากรายการอัปโหลดไฟล์ชั่วคราว',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'ลบแถว',
      cancelButtonText: 'ยกเลิก',
      customClass: {
        popup: 'custom-swal-popup',
        confirmButton: 'custom-swal-confirm-btn',
        cancelButton: 'custom-swal-cancel-btn'
      }
    }).then(result => {
      if (result.isConfirmed) {
        setSessionPhrases(prev => prev.filter(p => p.id !== id));
        setSelectedIds(prev => {
          const next = new Set(prev);
          next.delete(id);
          return next;
        });
      }
    });
  };

  const handleDeleteSelected = () => {
    Swal.fire({
      title: 'ลบรายการข้อมูลสะสมที่เลือก?',
      text: `คุณแน่ใจว่าต้องการลบประโยคจำนวนทั้งหมด ${selectedIds.size} แถวนี้ใช่หรือไม่?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'ลบข้อมูล',
      cancelButtonText: 'ยกเลิก',
      customClass: {
        popup: 'custom-swal-popup',
        confirmButton: 'custom-swal-confirm-btn',
        cancelButton: 'custom-swal-cancel-btn'
      }
    }).then(result => {
      if (result.isConfirmed) {
        setSessionPhrases(prev => prev.filter(p => !selectedIds.has(p.id)));
        setSelectedIds(new Set());
        Swal.fire({
          title: 'ลบสำเร็จ!',
          text: 'ทำความสะอาดข้อมูลทิ้งเรียบร้อย',
          icon: 'success',
          customClass: { popup: 'custom-swal-popup', confirmButton: 'custom-swal-confirm-btn' },
        });
      }
    });
  };

  const startEditing = (id: number, phraseText: string) => {
    setEditingRowId(id);
    setEditingText(phraseText);
  };

  const saveEditing = (id: number) => {
    if (!editingText.trim()) return;
    setSessionPhrases(prev => prev.map(p => {
      if (p.id === id) {
        const cleaned = cleanStopWords(editingText, stopWords);
        const { category, topic } = autoClassifyAndExtractTopic(cleaned);
        return {
          ...p,
          phrase: editingText,
          cleanedPhrase: cleaned,
          category,
          topic,
        };
      }
      return p;
    }));
    setEditingRowId(null);
  };

  return (
    <section id="tab-workspace" className="space-y-6">
      <datalist id="intents-datalist">
        {intents.map((int) => (
          <option key={int.name} value={int.name} />
        ))}
      </datalist>

      {/* Workspace top action panel */}
      <div className="bg-white p-4 lg:p-5 rounded-2xl border border-gray-100 shadow-sm flex flex-col gap-4">
        <div className="flex flex-wrap items-center gap-2.5">
          <label className="w-full sm:w-auto px-4 py-2.5 bg-primary hover:bg-primary-hover text-white rounded-xl cursor-pointer font-semibold flex items-center justify-center space-x-2 transition-all-smooth shadow-lg shadow-red-100 text-xs lg:text-sm">
            <i className="fa-solid fa-file-excel text-sm"></i>
            <span>นำเข้าไฟล์เทรนบอท (Excel)</span>
            <input type="file" accept=".xlsx, .xls" className="hidden" onChange={handleExcelImport} />
          </label>

          <button
            onClick={handleExcelExport}
            className="w-full sm:w-auto px-4 py-2.5 bg-gray-800 hover:bg-gray-900 text-white rounded-xl font-semibold flex items-center justify-center space-x-2 transition-all-smooth text-xs lg:text-sm cursor-pointer"
          >
            <i className="fa-solid fa-download text-sm"></i>
            <span>ส่งออกไฟล์ excel</span>
          </button>

          <button
            onClick={handleDownloadTemplate}
            className="w-full sm:w-auto px-4 py-2.5 bg-white hover:bg-gray-100 text-gray-700 border border-gray-300 rounded-xl font-semibold flex items-center justify-center space-x-2 transition-all-smooth text-xs lg:text-sm cursor-pointer"
          >
            <i className="fa-solid fa-file-arrow-down text-emerald-500 text-sm"></i>
            <span>Download Template</span>
          </button>

          <button
            onClick={onSaveToStorage}
            className="w-full sm:w-auto px-4 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-xl font-semibold flex items-center justify-center space-x-2 transition-all-smooth text-xs lg:text-sm cursor-pointer"
          >
            <i className="fa-solid fa-cloud-arrow-up text-sm"></i>
            <span>บันทึกขึ้น All_Data_Storage</span>
          </button>

          {selectedIds.size > 0 && (
            <button
              onClick={handleDeleteSelected}
              className="w-full sm:w-auto px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl font-semibold flex items-center justify-center space-x-2 transition-all-smooth text-xs lg:text-sm cursor-pointer"
            >
              <i className="fa-solid fa-trash-can text-sm"></i>
              <span>ลบรายการที่เลือก ({selectedIds.size})</span>
            </button>
          )}
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
              <i className="fa-solid fa-magnifying-glass text-xs"></i>
            </span>
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="ค้นหาประโยคคำถาม..."
              className="w-full pl-9 pr-4 py-2.5 text-xs lg:text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-red-500 transition-all-smooth bg-gray-50/50"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value as any);
              setCurrentPage(1);
            }}
            className="py-2.5 px-3 border border-gray-200 text-xs lg:text-sm rounded-xl focus:outline-none focus:border-red-500 bg-white min-w-[150px]"
          >
            <option value="all">สถานะจับคู่: ทั้งหมด</option>
            <option value="matched">จับคู่สำเร็จแล้ว</option>
            <option value="unmatched">ยังไม่ระบุ Intent</option>
          </select>
        </div>
      </div>

      {/* Guide/Instructions Panel */}
      <div className="bg-gradient-to-r from-red-50 to-red-50/40 p-5 rounded-2xl border border-red-100 shadow-sm space-y-3">
        <h4 className="text-xs lg:text-sm font-bold text-red-900 flex items-center">
          <i className="fa-solid fa-circle-info mr-2 text-red-600"></i>
          คู่มือและขั้นตอนการใช้งานระบบ "จับคู่คำ INTENT" (Lab Studio)
        </h4>
        <p className="text-xs text-red-950 leading-relaxed">
          ระบบจัดสรรเพื่อจับคู่ข้อความนำเข้าที่ลูกค้าป้อนสอบถามเข้าสู่ประเภทคำสั่ง Intent ที่จำแนกกลุ่มไว้ในคลัง Intents_List เพื่อเตรียมข้อมูลเทรนบอทอย่างเป็นระบบ
        </p>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-[11px] lg:text-xs leading-relaxed text-red-900 pt-1">
          <div className="bg-white/80 p-3 rounded-xl border border-red-100/50">
            <span className="font-bold text-red-600 block mb-1">1. โหลดแบบฟอร์มเทมเพลต</span>
            <p>คลิกที่ปุ่ม <b>Download Template</b> เพื่อดาวน์โหลดไฟล์ Excel โครงสร้างมาตรฐาน (A: intent, B: phrase)</p>
          </div>
          <div className="bg-white/70 p-3 rounded-xl border border-red-100/50">
            <span className="font-bold text-red-600 block mb-1">2. อัปโหลดข้อมูลประมวลผล</span>
            <p>กดปุ่ม <b>นำเข้าไฟล์เทรนบอท (Excel)</b> เพื่ออัปโหลดไฟล์ดิบ ระบบจะคลีนคำและวิเคราะห์หมวดหมู่ออโต้ทันที</p>
          </div>
          <div className="bg-white/70 p-3 rounded-xl border border-red-100/50">
            <span className="font-bold text-red-600 block mb-1">3. ค้นหาและจับคู่</span>
            <p>เลือก Intent ในตารางโดยพิมพ์ค้นหา หรือดับเบิ้ลคลิกแก้คำถามลูกค้าในช่องประโยคคำถามจริงเพื่อแก้คำได้โดยตรง</p>
          </div>
          <div className="bg-white/70 p-3 rounded-xl border border-red-100/50">
            <span className="font-bold text-red-600 block mb-1">4. บันทึกขึ้นสโตเรจระบบ</span>
            <p>กดปุ่ม <b>บันทึกขึ้น All_Data_Storage</b> เพื่อส่งข้อมูลขึ้นฐานข้อมูลและแสดงผลสถิติย้อนหลัง</p>
          </div>
        </div>
      </div>

      {/* Advanced Filters Panel */}
      <div id="filter-sort-panel" className="bg-white p-4 lg:p-5 rounded-2xl border border-gray-100 shadow-sm space-y-4">
        <div className="flex items-center space-x-2 text-gray-700 font-bold text-xs lg:text-sm border-b border-gray-100 pb-2">
          <i className="fa-solid fa-sliders text-primary"></i>
          <span>เครื่องมือวิเคราะห์ ดึง และเรียงลำดับข้อมูลขั้นสูง</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">กรองตาม Intent เฉพาะในไฟล์</label>
            <select
              value={intentFilter}
              onChange={(e) => {
                setIntentFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full py-2 px-3 border border-gray-200 text-xs lg:text-sm rounded-xl focus:outline-none focus:border-red-500 bg-white"
            >
              <option value="all">-- แสดงข้อมูลทุก Intent ในไฟล์ --</option>
              <option value="empty">-- ดึงเฉพาะแถวที่เป็นค่าว่าง --</option>
              {uniqueIntentsInFile.map(int => (
                <option key={int} value={int}>{int}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">กรองตามกลุ่มหมวดหมู่ประโยค</label>
            <select
              value={categoryFilter}
              onChange={(e) => {
                setCategoryFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full py-2 px-3 border border-gray-200 text-xs lg:text-sm rounded-xl focus:outline-none focus:border-red-500 bg-white"
            >
              <option value="all">-- แสดงทุกหมวดหมู่ --</option>
              <option value="complaint">หมวดร้องเรียน / บริการล่าช้า</option>
              <option value="pricing">หมวดสอบถามค่าบริการ / อัตราส่ง</option>
              <option value="status">หมวดติดตามพัสดุ</option>
              <option value="general">หมวดคำทักทายและเรื่องทั่วไป</option>
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">เลือกคอลัมน์ใช้จัดเรียง</label>
            <select
              value={sortCol}
              onChange={(e) => {
                setSortCol(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full py-2 px-3 border border-gray-200 text-xs lg:text-sm rounded-xl focus:outline-none focus:border-red-500 bg-white"
            >
              <option value="none">-- เรียงลำดับตามแถวปกติ --</option>
              <option value="intent">ชื่อ Intent ในระบบ</option>
              <option value="phrase">ประโยคคำถามเดิม (Phrase)</option>
              <option value="cleanedPhrase">ประโยคที่ล้างคำฟุ่มเฟือยแล้ว</option>
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">ทิศทางจัดเรียงข้อมูล</label>
            <select
              value={sortDir}
              onChange={(e) => {
                setSortDir(e.target.value as any);
                setCurrentPage(1);
              }}
              className="w-full py-2 px-3 border border-gray-200 text-xs lg:text-sm rounded-xl focus:outline-none focus:border-red-500 bg-white"
            >
              <option value="asc">จากน้อยไปมาก (A-Z / ก-ฮ)</option>
              <option value="desc">จากมากไปน้อย (Z-A / ฮ-ก)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Table area */}
      <div ref={mainTableSectionRef} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col">
        <div className="p-4 bg-gray-50 border-b border-gray-100 flex flex-col sm:flex-row justify-between items-start sm:items-center text-xs text-gray-500 gap-3">
          <div>พบข้อมูลที่กรองอยู่: <span id="filtered-total" className="font-bold text-gray-700">{filteredPhrases.length}</span> รายการ จากทั้งหมดในไฟล์ <span id="file-total" className="font-bold text-gray-700">{sessionPhrases.length}</span> รายการ</div>
          <div className="flex items-center space-x-4">
            <label className="flex items-center space-x-1.5 cursor-pointer text-gray-700 font-semibold select-none">
              <input
                type="checkbox"
                checked={allPaginatedSelected}
                onChange={(e) => handleSelectAllPaginated(e.target.checked)}
                className="rounded text-red-500 focus:ring-red-500"
              />
              <span>เลือกทั้งหมดในหน้านี้เพื่อสั่งลบ</span>
            </label>
            <span className="px-2 py-0.5 bg-gray-200 text-gray-600 rounded hidden sm:inline">แสดงผลหน้าละ {pageLimit} บรรทัด</span>
          </div>
        </div>

        {/* Responsive Table Wrapper */}
        <div ref={tableContainerRef} className="overflow-x-auto max-h-[500px] w-full p-2">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="bg-gray-50/50 border-b border-gray-200 text-[11px] font-bold uppercase tracking-wider text-gray-500">
                <th className="py-4 px-6 w-16 text-center">เลือก</th>
                <th className="py-4 px-6 w-16">#</th>
                <th className="py-4 px-6 w-80 min-w-[320px]">ชื่อ Intent ในระบบ</th>
                <th className="py-4 px-6 w-1/2">ประโยคคำถามจริง (Phrase) <span className="text-[10px] text-red-500 font-normal block">(ดับเบิ้ลคลิกแก้คำสด)</span></th>
                <th className="py-4 px-6 w-44">หมวดหมู่/หัวข้ออัตโนมัติ</th>
                <th className="py-4 px-6 w-20 text-center">ลบ</th>
              </tr>
            </thead>
            <tbody id="table-body" className="divide-y divide-gray-100 text-sm">
              {paginatedPhrases.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-20 text-center text-gray-400">
                    <i className="fa-solid fa-file-circle-plus text-5xl mb-4 text-gray-300 block"></i>
                    <p className="font-semibold text-gray-500 text-sm">ยังไม่มีข้อมูลในระบบสตูดิโอ</p>
                    <p className="text-xs text-gray-400 mt-1">กรุณากดอัปโหลดไฟล์ Excel เพื่อเริ่มคัดแยก</p>
                  </td>
                </tr>
              ) : (
                paginatedPhrases.map((item, idx) => {
                  const absoluteIdx = startIndex + idx;
                  const isChecked = selectedIds.has(item.id);

                  return (
                    <tr
                      key={item.id}
                      className={`transition-all-smooth ${
                        isChecked ? "bg-red-50/40 hover:bg-red-50/60" : "hover:bg-gray-50/70"
                      }`}
                    >
                      <td className="py-3 px-6 text-center">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => handleSelectIndividual(item.id, e.target.checked)}
                          className="rounded text-red-500 focus:ring-red-500 cursor-pointer"
                        />
                      </td>
                      <td className="py-3 px-6 text-xs text-gray-400 font-semibold">{absoluteIdx + 1}</td>
                      <td className="py-3 px-6">
                        <input
                          type="text"
                          list="intents-datalist"
                          value={item.intent}
                          onChange={(e) => handleIntentChange(item.id, e.target.value)}
                          placeholder="ค้นหาหรือเลือก Intent"
                          className="w-full text-xs font-semibold py-1.5 px-2 bg-white border border-gray-200 rounded-lg focus:outline-none focus:border-red-500"
                        />
                      </td>
                      <td
                        className="py-3 px-6 font-medium text-gray-800 leading-normal"
                        onDoubleClick={() => startEditing(item.id, item.phrase)}
                      >
                        {editingRowId === item.id ? (
                          <input
                            type="text"
                            value={editingText}
                            onChange={(e) => setEditingText(e.target.value)}
                            onBlur={() => saveEditing(item.id)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') saveEditing(item.id);
                              if (e.key === 'Escape') setEditingRowId(null);
                            }}
                            autoFocus
                            className="w-full px-3 py-1.5 border border-red-500 rounded-xl focus:outline-none text-sm font-medium"
                          />
                        ) : (
                          item.phrase
                        )}
                      </td>
                      <td className="py-3 px-6 text-xs text-gray-500">
                        <span className="px-2 py-0.5 bg-gray-100 font-bold rounded text-[10px] text-gray-600">
                          {item.category}
                        </span>
                        <div className="text-[10px] text-gray-400 mt-1">
                          หัวข้อ: <b>{item.topic}</b>
                        </div>
                      </td>
                      <td className="py-3 px-6 text-center border-l border-gray-50">
                        <button
                          onClick={() => handleDeleteIndividual(item.id)}
                          className="p-2 text-gray-300 hover:text-red-500 rounded-lg hover:bg-red-50 transition-all-smooth cursor-pointer"
                          title="ลบประโยคนี้"
                        >
                          <i className="fa-solid fa-trash-can text-sm"></i>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination controls */}
        <div className="p-4 bg-gray-50/70 border-t border-gray-100 flex items-center justify-between">
          <button
            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
            className="px-3 lg:px-4 py-2 border border-gray-200 rounded-xl hover:bg-white text-xs font-semibold text-gray-600 disabled:opacity-40 transition-all-smooth cursor-pointer"
          >
            <i className="fa-solid fa-arrow-left mr-1"></i> ก่อนหน้า
          </button>
          <span className="text-xs font-medium text-gray-500">
            หน้าที่ <span id="lbl-current-page" className="font-bold text-gray-700">{currentPage}</span> / <span id="lbl-total-pages" className="font-bold text-gray-700">{totalPages}</span>
          </span>
          <button
            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages}
            className="px-3 lg:px-4 py-2 border border-gray-200 rounded-xl hover:bg-white text-xs font-semibold text-gray-600 disabled:opacity-40 transition-all-smooth cursor-pointer"
          >
            ถัดไป <i className="fa-solid fa-arrow-right mr-1"></i>
          </button>
        </div>
      </div>
    </section>
  );
}
