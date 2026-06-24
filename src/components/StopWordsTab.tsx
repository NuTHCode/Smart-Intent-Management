import React, { useState } from 'react';
import Swal from 'sweetalert2';
import { StopWord } from '../types';

interface StopWordsTabProps {
  stopWords: StopWord[];
  onAddStopWord: (pattern: string, type: string, desc: string) => Promise<{ success: boolean; message: string }>;
  onUpdateStopWord: (id: number, pattern: string, type: string, desc: string) => Promise<{ success: boolean; message: string }>;
  onDeleteStopWord: (id: number) => Promise<{ success: boolean; message: string }>;
  openCreateModal: () => void;
}

export default function StopWordsTab({
  stopWords,
  onAddStopWord,
  onUpdateStopWord,
  onDeleteStopWord,
  openCreateModal,
}: StopWordsTabProps) {
  const [search, setSearch] = useState('');

  const filteredWords = stopWords.filter(w => {
    return (
      (w.pattern || '').toLowerCase().includes(search.toLowerCase()) ||
      (w.description || '').toLowerCase().includes(search.toLowerCase())
    );
  });

  const handleEditStopWord = (sw: StopWord) => {
    Swal.fire({
      title: 'แก้ไขคำฟุ่มเฟือย',
      html: `
        <div class="space-y-4 text-left">
          <div>
            <label class="block text-xs font-bold text-gray-400 mb-1.5 uppercase">คำฟุ่มเฟือย/สัญลักษณ์ (Regex หรือคำทั่วไป)</label>
            <input id="swal-edit-sw-pattern" class="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none" value="${sw.pattern}">
          </div>
          <div>
            <label class="block text-xs font-bold text-gray-400 mb-1.5 uppercase">ประเภทของคำข้อมูล</label>
            <select id="swal-edit-sw-type" class="w-full py-2.5 px-3 border border-gray-200 text-sm rounded-xl focus:outline-none bg-white">
              <option value="Regex" ${sw.type === 'Regex' ? 'selected' : ''}>รูปแบบพิเศษ (Regex)</option>
              <option value="Word" ${sw.type === 'Word' ? 'selected' : ''}>คำศัพท์ทั่วไป (Word)</option>
            </select>
          </div>
          <div>
            <label class="block text-xs font-bold text-gray-400 mb-1.5 uppercase">คำอธิบายรายละเอียด</label>
            <input id="swal-edit-sw-desc" class="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none" value="${sw.description}">
          </div>
        </div>
      `,
      showCancelButton: true,
      confirmButtonText: 'บันทึกการแก้ไข',
      cancelButtonText: 'ยกเลิก',
      customClass: {
        popup: 'custom-swal-popup',
        confirmButton: 'custom-swal-confirm-btn',
        cancelButton: 'custom-swal-cancel-btn'
      },
      preConfirm: () => {
        const pattern = (document.getElementById('swal-edit-sw-pattern') as HTMLInputElement).value.trim();
        const type = (document.getElementById('swal-edit-sw-type') as HTMLSelectElement).value;
        const description = (document.getElementById('swal-edit-sw-desc') as HTMLInputElement).value.trim();
        if (!pattern) {
          Swal.showValidationMessage('กรุณากรอกรูปแบบคำฟุ่มเฟือย');
        }
        return { pattern, type, description };
      }
    }).then(async (result) => {
      if (result.isConfirmed) {
        const { pattern, type, description } = result.value;
        Swal.fire({
          title: 'กำลังบันทึกการแก้ไข...',
          allowOutsideClick: false,
          didOpen: () => Swal.showLoading()
        });

        const res = await onUpdateStopWord(sw.id, pattern, type, description);
        Swal.close();

        if (res.success) {
          Swal.fire({
            title: 'สำเร็จ!',
            text: res.message,
            icon: 'success',
            customClass: { popup: 'custom-swal-popup', confirmButton: 'custom-swal-confirm-btn' }
          });
        } else {
          Swal.fire({
            title: 'ผิดพลาด!',
            text: res.message,
            icon: 'error',
            customClass: { popup: 'custom-swal-popup', confirmButton: 'custom-swal-confirm-btn' }
          });
        }
      }
    });
  };

  const handleDeleteStopWord = (id: number) => {
    Swal.fire({
      title: 'ต้องการลบคำฟุ่มเฟือย?',
      text: 'คุณแน่ใจว่าต้องการลบคำฟุ่มเฟือยนี้ออกจากชีตคลังระบบหลักใช่หรือไม่?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'ใช่, ต้องการลบ',
      cancelButtonText: 'ยกเลิก',
      customClass: {
        popup: 'custom-swal-popup',
        confirmButton: 'custom-swal-confirm-btn',
        cancelButton: 'custom-swal-cancel-btn'
      }
    }).then(async (result) => {
      if (result.isConfirmed) {
        Swal.fire({
          title: 'กำลังทำการลบ...',
          allowOutsideClick: false,
          didOpen: () => Swal.showLoading()
        });

        const res = await onDeleteStopWord(id);
        Swal.close();

        if (res.success) {
          Swal.fire({
            title: 'สำเร็จ!',
            text: res.message,
            icon: 'success',
            customClass: { popup: 'custom-swal-popup', confirmButton: 'custom-swal-confirm-btn' }
          });
        } else {
          Swal.fire({
            title: 'ล้มเหลว!',
            text: res.message,
            icon: 'error',
            customClass: { popup: 'custom-swal-popup', confirmButton: 'custom-swal-confirm-btn' }
          });
        }
      }
    });
  };

  return (
    <section id="tab-stopwords-center" className="space-y-6 animate-fade-in">
      <div className="bg-white p-4 lg:p-5 rounded-2xl border border-gray-100 shadow-sm flex flex-col md:flex-row gap-4 justify-between items-center hover:shadow-md transition-all-smooth">
        <div className="space-y-1 text-center md:text-left">
          <h3 className="text-xs lg:text-base font-bold text-gray-800 flex items-center justify-center md:justify-start">
            <i className="fa-solid fa-scissors text-orange-500 mr-2"></i> จัดการรายการคำฟุ่มเฟือย (Stop Words)
          </h3>
          <p className="text-xs text-gray-400">รายการคำหางเสียง คำสร้อย หรือสัญลักษณ์พิเศษที่ระบบสแกนล้างทิ้งให้อัตโนมัติ (เพิ่ม, ลบ, แก้ไขได้โดยตรง)</p>
        </div>

        <div className="flex flex-wrap gap-2 w-full md:w-auto justify-center md:justify-end">
          <div className="relative w-full sm:w-64">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
              <i className="fa-solid fa-magnifying-glass text-xs"></i>
            </span>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="ค้นหาคำฟุ่มเฟือย..."
              className="w-full pl-9 pr-4 py-2.5 text-xs lg:text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-orange-500 transition-all-smooth bg-gray-50/50"
            />
          </div>

          <button
            onClick={() => setSearch('')}
            className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-600 text-xs font-bold rounded-xl transition-all-smooth cursor-pointer"
          >
            ล้างค่า
          </button>

          <button
            onClick={openCreateModal}
            className="px-5 py-3 bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold rounded-xl transition-all-smooth flex items-center justify-center space-x-1.5 shadow-lg shadow-orange-100 cursor-pointer"
          >
            <i className="fa-solid fa-plus-circle"></i>
            <span>เพิ่มคำ STOP WORDS</span>
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col">
        <div className="p-4 bg-gray-50 border-b border-gray-100 text-xs text-gray-500">
          <span>รายการคำล้างข้อมูลในชีต Stop_Words: <span id="lbl-sw-total" className="font-bold text-gray-700">{stopWords.length}</span> คำ</span>
        </div>

        <div className="overflow-x-auto max-h-[500px]">
          <table className="w-full text-left border-collapse min-w-[700px]">
            <thead>
              <tr className="bg-gray-50/50 border-b border-gray-200 text-[11px] font-bold uppercase tracking-wider text-gray-500">
                <th className="py-4 px-6 w-20">#</th>
                <th className="py-4 px-6 w-64">คำที่ใช้กรอง / แพทเทิร์น</th>
                <th className="py-4 px-6 w-44">ประเภท</th>
                <th className="py-4 px-6">คำอธิบายรายละเอียด</th>
                <th className="py-4 px-6 w-32 text-center">จัดการ</th>
              </tr>
            </thead>
            <tbody id="sw-table-body" className="divide-y divide-gray-100 text-sm">
              {filteredWords.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-16 text-center text-gray-400">
                    <i className="fa-solid fa-scissors text-4xl block mb-2 text-gray-300"></i>
                    <span>ไม่พบข้อมูลคำฟุ่มเฟือยที่ตรงกับคำที่ค้นหา</span>
                  </td>
                </tr>
              ) : (
                filteredWords.map((sw, index) => {
                  const typeBadge = sw.type === 'Regex'
                    ? 'bg-purple-50 text-purple-600 border border-purple-100'
                    : 'bg-blue-50 text-blue-600 border border-blue-100';

                  return (
                    <tr key={sw.id} className="hover:bg-orange-50/20 transition-all-smooth">
                      <td className="py-3 px-6 text-xs text-gray-400 font-semibold">{index + 1}</td>
                      <td className="py-3 px-6 font-semibold text-gray-800">{sw.pattern}</td>
                      <td className="py-3 px-6 text-xs">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${typeBadge}`}>
                          {sw.type === 'Regex' ? 'รูปแบบพิเศษ (Regex)' : 'คำศัพท์ทั่วไป (Word)'}
                        </span>
                      </td>
                      <td className="py-3 px-6 text-xs text-gray-500">{sw.description}</td>
                      <td className="py-3 px-6 text-center">
                        <div className="flex items-center justify-center space-x-2">
                          <button
                            onClick={() => handleEditStopWord(sw)}
                            className="p-1.5 text-blue-500 hover:text-blue-700 rounded-lg hover:bg-blue-50 transition-all-smooth cursor-pointer"
                            title="แก้ไขคำฟุ่มเฟือย"
                          >
                            <i className="fa-solid fa-pen-to-square text-sm"></i>
                          </button>
                          <button
                            onClick={() => handleDeleteStopWord(sw.id)}
                            className="p-1.5 text-gray-300 hover:text-red-500 rounded-lg hover:bg-red-50 transition-all-smooth cursor-pointer"
                            title="ลบคำนี้ออกจากระบบ"
                          >
                            <i className="fa-solid fa-trash-can text-sm"></i>
                          </button>
                        </div>
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
