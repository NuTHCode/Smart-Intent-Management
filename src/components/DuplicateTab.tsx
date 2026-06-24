import React, { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';
import Swal from 'sweetalert2';
import { Phrase, SavedPhrase } from '../types';

interface DuplicateTabProps {
  sessionPhrases: Phrase[];
  setSessionPhrases: React.Dispatch<React.SetStateAction<Phrase[]>>;
  historyPhrases: SavedPhrase[];
  setHistoryPhrases: React.Dispatch<React.SetStateAction<SavedPhrase[]>>;
}

interface DuplicateItem {
  id: number; // session phrase id
  type: string; // 'ซ้ำซ้อนภายในไฟล์ (Internal)' | 'ซ้ำซ้อนกับคลังข้อมูล All_Data_Storage'
  phrase: string;
  intent: string;
  systemIntent?: string;
}

export default function DuplicateTab({
  sessionPhrases,
  setSessionPhrases,
  historyPhrases,
  setHistoryPhrases,
}: DuplicateTabProps) {
  const [duplicateItems, setDuplicateItems] = useState<DuplicateItem[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());

  // Automatically compute duplicate summary label
  const getSummaryLabel = () => {
    if (duplicateItems.length === 0) {
      return 'พร้อมตรวจจับประโยคและ Intent ซ้ำในระบบ';
    }
    return `พบรายการซ้ำซ้อนจำนวน ${duplicateItems.length} แถว`;
  };

  // Upload old system database to compare with
  const handleDbUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    Swal.fire({
      title: 'กำลังอัปโหลดฐานคลังระบบเดิม...',
      text: 'ระบบกำลังดึงข้อมูลสะสมเพื่อตั้งค่าเป็นดัชนีอ้างอิงความถูกต้อง',
      allowOutsideClick: false,
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
                text: 'ไฟล์ฐานข้อมูลไม่มีแถวรายละเอียดคีย์ที่ถูกต้อง',
                icon: 'error',
                customClass: { popup: 'custom-swal-popup', confirmButton: 'custom-swal-confirm-btn' },
              });
              return;
            }

            const importedDb: SavedPhrase[] = [];
            for (let i = 1; i < rows.length; i++) {
              const row = rows[i];
              if (!row || !row[1]) continue;
              importedDb.push({
                intent: row[0] ? String(row[0]).trim() : '',
                phrase: String(row[1]).trim(),
                cleanedPhrase: String(row[1]).trim(),
                category: 'หมวดคำทักทายและเรื่องทั่วไป',
                topic: 'เรื่องทั่วไป',
                createdAt: Date.now(),
              });
            }

            setHistoryPhrases(importedDb);
            setSelectedIds(new Set());

            Swal.fire({
              title: 'วิเคราะห์ชุดระบบสำเร็จ!',
              text: `อัปโหลดคลังคำอ้างอิงย้อนหลังจำนวน ${importedDb.length} แถว เรียบร้อย พร้อมรันตรวจจับ`,
              icon: 'success',
              customClass: { popup: 'custom-swal-popup', confirmButton: 'custom-swal-confirm-btn' },
            });
          } catch (err: any) {
            Swal.fire({
              title: 'เกิดข้อผิดพลาด',
              text: err.message,
              icon: 'error',
              customClass: { popup: 'custom-swal-popup', confirmButton: 'custom-swal-confirm-btn' },
            });
          }
        };
        reader.readAsArrayBuffer(file);
      },
    });

    e.target.value = '';
  };

  // Run scans for duplicates
  const runScan = (silent = false) => {
    if (sessionPhrases.length === 0) {
      if (!silent) {
        Swal.fire({
          title: 'ผิดพลาด!',
          text: 'กรุณานำเข้าไฟล์ข้อมูลเพื่อสแกนก่อนตรวจหาคำซ้ำ',
          icon: 'error',
          customClass: { popup: 'custom-swal-popup', confirmButton: 'custom-swal-confirm-btn' },
        });
      }
      return;
    }

    if (!silent) {
      Swal.fire({
        title: 'กำลังสแกนคำซ้ำซ้อน...',
        text: 'เปรียบเทียบรูปคำสะกดกับคลังในเซิร์ฟเวอร์',
        allowOutsideClick: false,
        didOpen: () => {
          Swal.showLoading();
        },
      });
    }

    const phraseMap = new Map<string, number[]>();
    const dbPhrasesSet = new Set(historyPhrases.map(item => (item.phrase || '').toLowerCase()));
    const results: DuplicateItem[] = [];

    // 1. Group session phrases by lowercase text
    sessionPhrases.forEach((item) => {
      const textKey = (item.phrase || '').toLowerCase().trim();
      if (!textKey) return;
      if (phraseMap.has(textKey)) {
        phraseMap.get(textKey)!.push(item.id);
      } else {
        phraseMap.set(textKey, [item.id]);
      }
    });

    // 2. Identify internal duplicate extra occurrences
    phraseMap.forEach((ids) => {
      if (ids.length > 1) {
        for (let k = 1; k < ids.length; k++) {
          const rowItem = sessionPhrases.find(d => d.id === ids[k]);
          if (rowItem) {
            results.push({
              id: rowItem.id,
              type: 'ซ้ำซ้อนภายในไฟล์ (Internal)',
              phrase: rowItem.phrase,
              intent: rowItem.intent || 'ยังไม่กำหนด',
            });
          }
        }
      }
    });

    // 3. Identify duplicates against the database phrases
    sessionPhrases.forEach((item) => {
      const textKey = (item.phrase || '').toLowerCase().trim();
      if (!textKey) return;
      if (dbPhrasesSet.has(textKey)) {
        const alreadyListed = results.some(dup => dup.id === item.id);
        if (!alreadyListed) {
          const matchedDbItem = historyPhrases.find(db => (db.phrase || '').toLowerCase().trim() === textKey);
          results.push({
            id: item.id,
            type: 'ซ้ำซ้อนกับคลังข้อมูล All_Data_Storage',
            phrase: item.phrase,
            intent: item.intent || 'ยังไม่กำหนด',
            systemIntent: matchedDbItem ? matchedDbItem.intent : 'ไม่มี',
          });
        }
      }
    });

    setDuplicateItems(results);
    setSelectedIds(new Set());

    if (!silent) {
      Swal.close();
      Swal.fire({
        title: results.length > 0 ? 'ตรวจจับคำซ้ำพบ!' : 'วิเคราะห์สมบูรณ์!',
        text: `สแกนสแกนเทียบประวัติเสร็จสิ้น พบคำซ้ำจำนวนทั้งหมด ${results.length} แถว`,
        icon: results.length > 0 ? 'warning' : 'success',
        customClass: { popup: 'custom-swal-popup', confirmButton: 'custom-swal-confirm-btn' },
      });
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(new Set(duplicateItems.map(item => item.id)));
    } else {
      setSelectedIds(new Set());
    }
  };

  const handleSelectIndividual = (id: number, checked: boolean) => {
    const next = new Set(selectedIds);
    if (checked) next.add(id);
    else next.delete(id);
    setSelectedIds(next);
  };

  // Auto clean all duplicates
  const handleAutoCleanAll = () => {
    if (duplicateItems.length === 0) return;

    Swal.fire({
      title: 'สั่งลบข้อมูลซ้ำสะสมทั้งหมด?',
      text: `ต้องการล้างสแกนคำซ้ำทิ้งจำนวน ${duplicateItems.length} แถวจากไฟล์นี้ใช่หรือไม่?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'ตกลง, สั่งล้าง',
      cancelButtonText: 'ยกเลิก',
      customClass: {
        popup: 'custom-swal-popup',
        confirmButton: 'custom-swal-confirm-btn',
        cancelButton: 'custom-swal-cancel-btn'
      }
    }).then(result => {
      if (result.isConfirmed) {
        const idsToRemove = new Set(duplicateItems.map(item => item.id));
        setSessionPhrases(prev => prev.filter(item => !idsToRemove.has(item.id)));
        setDuplicateItems([]);
        setSelectedIds(new Set());

        Swal.fire({
          title: 'ทำความสะอาดเรียบร้อย!',
          text: 'ระบบกำจัดประโยคซ้ำซ้อนจากสโตเรจไฟล์เรียบร้อย',
          icon: 'success',
          customClass: { popup: 'custom-swal-popup', confirmButton: 'custom-swal-confirm-btn' },
        });
      }
    });
  };

  // Delete selected rows
  const handleDeleteSelected = () => {
    if (selectedIds.size === 0) return;

    Swal.fire({
      title: 'ยืนยันลบประโยคที่เลือก?',
      text: `ต้องการลบรายการข้อมูลซ้ำที่เลือกไว้จำนวนทั้งหมด ${selectedIds.size} รายการ ใช่หรือไม่?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'ลบรายการ',
      cancelButtonText: 'ยกเลิก',
      customClass: {
        popup: 'custom-swal-popup',
        confirmButton: 'custom-swal-confirm-btn',
        cancelButton: 'custom-swal-cancel-btn'
      }
    }).then(result => {
      if (result.isConfirmed) {
        setSessionPhrases(prev => prev.filter(item => !selectedIds.has(item.id)));
        setDuplicateItems(prev => prev.filter(item => !selectedIds.has(item.id)));
        setSelectedIds(new Set());

        Swal.fire({
          title: 'ลบข้อมูลเสร็จสิ้น!',
          text: `ทำความสะอาดข้อมูลสำเร็จ`,
          icon: 'success',
          customClass: { popup: 'custom-swal-popup', confirmButton: 'custom-swal-confirm-btn' },
        });
      }
    });
  };

  return (
    <section id="tab-duplicate-center" className="space-y-6 animate-fade-in">
      <div className="bg-white p-4 lg:p-5 rounded-2xl border border-gray-100 shadow-sm flex flex-col md:flex-row gap-4 justify-between items-center hover:shadow-md transition-all-smooth">
        <div className="space-y-1 text-center md:text-left">
          <h3 className="text-xs lg:text-base font-bold text-gray-800 flex items-center justify-center md:justify-start">
            <i className="fa-solid fa-paste text-amber-500 mr-2"></i> ศูนย์ล้างข้อมูลคำซ้ำซ้อน
          </h3>
          <p className="text-xs text-gray-400">
            เปรียบเทียบคำซ้ำจากภายในไฟล์ และฐานข้อมูลส่วนกลาง All_Data_Storage หรืออัปโหลดไฟล์เทียบตรงเพื่อความสะอาดสูงสุด
          </p>
        </div>

        <div className="flex flex-wrap gap-2 w-full md:w-auto justify-center md:justify-end">
          <label className="w-full sm:w-auto px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl cursor-pointer transition-all-smooth flex items-center justify-center space-x-1.5 shadow-md shadow-indigo-100">
            <i className="fa-solid fa-file-arrow-up"></i>
            <span>อัปโหลดคลังระบบเดิม (.xlsx)</span>
            <input type="file" accept=".xlsx, .xls" className="hidden" onChange={handleDbUpload} />
          </label>

          <button
            onClick={() => runScan(false)}
            className="w-full sm:w-auto px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold rounded-xl cursor-pointer transition-all-smooth flex items-center justify-center space-x-1.5 shadow-md shadow-amber-100"
          >
            <i className="fa-solid fa-magnifying-glass-chart"></i>
            <span>เริ่มสแกนคำซ้ำ</span>
          </button>

          <button
            onClick={handleAutoCleanAll}
            disabled={duplicateItems.length === 0}
            className="w-full sm:w-auto px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl cursor-pointer transition-all-smooth flex items-center justify-center space-x-1.5 shadow-md shadow-blue-100 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <i className="fa-solid fa-wand-magic-sparkles"></i>
            <span>Auto Clean</span>
          </button>

          <button
            onClick={handleDeleteSelected}
            disabled={selectedIds.size === 0}
            className="w-full sm:w-auto px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl cursor-pointer transition-all-smooth flex items-center justify-center space-x-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <i className="fa-solid fa-trash-can"></i>
            <span>ลบที่เลือกทั้งหมด</span>
          </button>
        </div>
      </div>

      {/* Guide Block */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-5 rounded-2xl border border-blue-100 shadow-sm space-y-3">
        <h4 className="text-xs lg:text-sm font-bold text-indigo-900 flex items-center">
          <i className="fa-solid fa-circle-question mr-2 text-indigo-600"></i>
          คู่มือการใช้งานระบบตรวจสอบคัดกรองคำซ้ำอย่างมีประสิทธิภาพสูงสุด
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-[11px] lg:text-xs leading-relaxed text-indigo-950 pt-1">
          <div className="bg-white/60 p-3 rounded-xl border border-indigo-100">
            <span className="font-bold text-indigo-600 block mb-1">ขั้นตอนที่ 1: นำเข้าไฟล์ดิบ</span>
            <p>นำเข้าไฟล์คำถามของลูกค้า (.xlsx) ในหน้า <b>จับคู่คำ INTENT</b> เพื่อเป็นไฟล์หลักในการคัดแยกประโยค</p>
          </div>
          <div className="bg-white/60 p-3 rounded-xl border border-indigo-100">
            <span className="font-bold text-indigo-600 block mb-1">ขั้นตอนที่ 2: เทียบสถิติสะสม</span>
            <p>ระบบจะทำความสะอาดลบคำฟุ่มเฟือยและเทียบคำซ้ำซ้อนกับคลัง <b>All_Data_Storage</b> ของคุณโดยอัตโนมัติ</p>
          </div>
          <div className="bg-white/60 p-3 rounded-xl border border-indigo-100">
            <span className="font-bold text-indigo-600 block mb-1">ขั้นตอนที่ 3: เทียบไฟล์พิเศษ</span>
            <p>คุณสามารถกดปุ่ม <b>อัปโหลดคลังระบบเดิม</b> เพื่อเปรียบเทียบคำซ้ำข้ามไฟล์อื่นได้ตามต้องการ</p>
          </div>
          <div className="bg-white/60 p-3 rounded-xl border border-indigo-100">
            <span className="font-bold text-indigo-600 block mb-1">ขั้นตอนที่ 4: เคลียร์แถวซ้ำออโต้</span>
            <p>กดปุ่ม <b>เริ่มสแกน</b> จากนั้นคลิกปุ่ม <b>Auto Clean</b> เพื่อล้างและกำจัดแถวที่ซ้ำซ้อนทิ้งทันทีในหนึ่งวิ</p>
          </div>
        </div>
      </div>

      {/* Duplicate Data Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-4 bg-gray-50 border-b border-gray-100 flex items-center justify-between text-xs text-gray-500">
          <span className="font-semibold text-amber-600 animate-pulse" id="lbl-duplicate-summary">
            {getSummaryLabel()}
          </span>
          <div className="flex items-center space-x-2">
            <label className="flex items-center space-x-1.5 cursor-pointer select-none text-gray-700 font-semibold">
              <input
                type="checkbox"
                checked={duplicateItems.length > 0 && selectedIds.size === duplicateItems.length}
                onChange={(e) => handleSelectAll(e.target.checked)}
                className="rounded text-red-500 focus:ring-red-500"
              />
              <span className="font-bold">เลือกทั้งหมด</span>
            </label>
          </div>
        </div>

        <div className="overflow-x-auto max-h-[450px]">
          <table className="w-full text-left border-collapse min-w-[700px]">
            <thead>
              <tr className="bg-gray-50/50 border-b border-gray-200 text-[11px] font-bold uppercase tracking-wider text-gray-500">
                <th className="py-4 px-6 w-16 text-center">เลือก</th>
                <th className="py-4 px-6 w-24">แถวในไฟล์</th>
                <th className="py-4 px-6 w-48">ประเภทการซ้ำ</th>
                <th className="py-4 px-6">ประโยคข้อความที่ซ้ำ (Phrase)</th>
                <th className="py-4 px-6 w-48">Intent ปัจจุบัน</th>
              </tr>
            </thead>
            <tbody id="duplicate-table-body" className="divide-y divide-gray-100 text-sm">
              {duplicateItems.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-20 text-center text-gray-400">
                    <i className="fa-solid fa-shield-halved text-5xl mb-4 text-gray-300 block"></i>
                    <p className="font-semibold text-gray-500 text-sm">ยังไม่มีการรันสแกนตรวจสอบคำซ้ำ</p>
                    <p className="text-xs text-gray-400 mt-1">กรุณากดปุ่ม "เริ่มสแกนคำซ้ำ" เพื่อเทียบค่ากับระบบฐานข้อมูลกลาง</p>
                  </td>
                </tr>
              ) : (
                duplicateItems.map(item => {
                  const isChecked = selectedIds.has(item.id);
                  const isInternal = item.type.includes('Internal');
                  const badgeStyle = isInternal
                    ? 'bg-red-50 text-red-600 border border-red-100'
                    : 'bg-amber-50 text-amber-600 border border-amber-100';

                  return (
                    <tr key={item.id} className="hover:bg-amber-50/50 transition-all-smooth border-b border-gray-100">
                      <td className="py-3 px-6 text-center">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => handleSelectIndividual(item.id, e.target.checked)}
                          className="rounded text-red-500 focus:ring-red-500 cursor-pointer"
                        />
                      </td>
                      <td className="py-3 px-6 text-xs text-gray-400 font-semibold">แถวที่ {item.id}</td>
                      <td className="py-3 px-6">
                        <span className={`px-2.5 py-1 text-[10px] font-bold rounded-full ${badgeStyle}`}>
                          {item.type}
                        </span>
                      </td>
                      <td className="py-3 px-6 font-medium text-gray-800">{item.phrase}</td>
                      <td className="py-3 px-6 text-xs text-gray-500">
                        {item.intent}
                        {item.systemIntent && (
                          <div className="text-[10px] text-gray-400">
                            ชีตระบบเดิม: <b>{item.systemIntent}</b>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
