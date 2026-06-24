import React, { useState } from 'react';
import Swal from 'sweetalert2';
import { Intent } from '../types';

interface IntentsTabProps {
  intents: Intent[];
  onAddIntent: (name: string, desc: string) => Promise<{ success: boolean; message: string }>;
  onUpdateIntent: (oldName: string, newName: string, desc: string) => Promise<{ success: boolean; message: string }>;
  onDeleteIntent: (name: string) => Promise<{ success: boolean; message: string }>;
  openCreateModal: () => void;
}

export default function IntentsTab({
  intents,
  onAddIntent,
  onUpdateIntent,
  onDeleteIntent,
  openCreateModal,
}: IntentsTabProps) {
  const [search, setSearch] = useState('');

  const filteredIntents = intents.filter(i => {
    return (
      (i.name || '').toLowerCase().includes(search.toLowerCase()) ||
      (i.description || '').toLowerCase().includes(search.toLowerCase())
    );
  });

  const handleEditIntent = (intent: Intent) => {
    Swal.fire({
      title: 'แก้ไข Intent',
      html: `
        <div class="space-y-4 text-left">
          <div>
            <label class="block text-xs font-bold text-gray-400 mb-1.5 uppercase">ชื่อ Intent (ภาษาอังกฤษ ไม่มีช่องว่าง)</label>
            <input id="swal-edit-intent-name" class="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none" value="${intent.name}">
          </div>
          <div>
            <label class="block text-xs font-bold text-gray-400 mb-1.5 uppercase">คำอธิบายรายละเอียดภารกิจ</label>
            <textarea id="swal-edit-intent-desc" rows="3" class="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none">${intent.description}</textarea>
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
        const nameInput = (document.getElementById('swal-edit-intent-name') as HTMLInputElement).value.trim();
        const descInput = (document.getElementById('swal-edit-intent-desc') as HTMLTextAreaElement).value.trim();
        if (!nameInput) {
          Swal.showValidationMessage('กรุณากรอกชื่อ Intent');
        }
        return { newName: nameInput, description: descInput };
      }
    }).then(async (result) => {
      if (result.isConfirmed) {
        const { newName, description } = result.value;
        Swal.fire({
          title: 'กำลังอัปเดตข้อมูล...',
          allowOutsideClick: false,
          didOpen: () => Swal.showLoading()
        });

        const res = await onUpdateIntent(intent.name, newName, description);
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

  const handleDeleteIntent = (name: string) => {
    Swal.fire({
      title: 'ลบ Intent?',
      text: `คุณต้องการลบประเภทคำสั่ง '${name}' ออกจากระบบหรือไม่? การทำรายการนี้จะไม่สามารถกู้กลับคืนมาได้`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'ใช่, ฉันต้องการลบ',
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

        const res = await onDeleteIntent(name);
        Swal.close();

        if (res.success) {
          Swal.fire({
            title: 'ลบสำเร็จ!',
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
    <section id="tab-intents-center" className="space-y-6 animate-fade-in">
      <div className="bg-white p-4 lg:p-5 rounded-2xl border border-gray-100 shadow-sm flex flex-col md:flex-row gap-4 justify-between items-center hover:shadow-md transition-all-smooth">
        <div className="space-y-1 text-center md:text-left">
          <h3 className="text-xs lg:text-base font-bold text-gray-800 flex items-center justify-center md:justify-start">
            <i className="fa-solid fa-tags text-red-500 mr-2"></i>
            ศูนย์จัดการข้อมูลคำสั่ง (Intent Management)
          </h3>
          <p className="text-xs text-gray-400">ค้นหา แก้ไข และลบหมวดหมู่คำสั่ง (Intent) ทั้งหมดที่ใช้ในการจำแนกบอท</p>
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
              placeholder="ค้นหาชื่อ Intent..."
              className="w-full pl-9 pr-4 py-2.5 text-xs lg:text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-red-500 transition-all-smooth bg-gray-50/50"
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
            className="px-5 py-3 bg-primary hover:bg-primary-hover text-white text-xs font-bold rounded-xl transition-all-smooth flex items-center justify-center space-x-1.5 shadow-lg shadow-red-100 cursor-pointer"
          >
            <i className="fa-solid fa-plus-circle"></i>
            <span>สร้าง Intent ใหม่</span>
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm flex flex-col">
        <div className="p-4 bg-gray-50 border-b border-gray-100 text-xs text-gray-500">
          <span>จำนวน Intent ทั้งหมดในคลังสะสม: <span id="lbl-intent-total-tab" className="font-bold text-gray-700">{intents.length}</span> รายการ</span>
        </div>

        <div className="overflow-x-auto max-h-[500px]">
          <table className="w-full text-left border-collapse min-w-[700px]">
            <thead>
              <tr className="bg-gray-50/50 border-b border-gray-200 text-[11px] font-bold uppercase tracking-wider text-gray-500">
                <th className="py-4 px-6 w-20">#</th>
                <th className="py-4 px-6 w-64">ชื่อ Intent ( snake_case )</th>
                <th className="py-4 px-6">คำอธิบายรายละเอียดภารกิจ</th>
                <th className="py-4 px-6 w-32 text-center">จัดการ</th>
              </tr>
            </thead>
            <tbody id="intents-table-body" className="divide-y divide-gray-100 text-sm">
              {filteredIntents.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-16 text-center text-gray-400">
                    <i className="fa-solid fa-tags text-4xl block mb-2 text-gray-300"></i>
                    <span>ไม่พบข้อมูล Intent ที่ระบุ</span>
                  </td>
                </tr>
              ) : (
                filteredIntents.map((intent, idx) => (
                  <tr key={intent.name} className="hover:bg-red-50/10 transition-all-smooth">
                    <td className="py-3 px-6 text-xs text-gray-400 font-semibold">{idx + 1}</td>
                    <td className="py-3 px-6 font-semibold text-gray-800">{intent.name}</td>
                    <td className="py-3 px-6 text-xs text-gray-500 leading-relaxed">{intent.description || 'ไม่มีรายละเอียดคำอธิบาย'}</td>
                    <td className="py-3 px-6 text-center">
                      <div className="flex items-center justify-center space-x-2">
                        <button
                          onClick={() => handleEditIntent(intent)}
                          className="p-1.5 text-blue-500 hover:text-blue-700 rounded-lg hover:bg-blue-50 transition-all-smooth cursor-pointer"
                          title="แก้ไข Intent"
                        >
                          <i className="fa-solid fa-pen-to-square text-sm"></i>
                        </button>
                        <button
                          onClick={() => handleDeleteIntent(intent.name)}
                          className="p-1.5 text-gray-300 hover:text-red-500 rounded-lg hover:bg-red-50 transition-all-smooth cursor-pointer"
                          title="ลบ Intent"
                        >
                          <i className="fa-solid fa-trash-can text-sm"></i>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
