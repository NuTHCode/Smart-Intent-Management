import React, { useState, useEffect } from 'react';
import Swal from 'sweetalert2';

interface LogoSettingsTabProps {
  systemName: string;
  onSaveSystemName: (name: string) => Promise<{ success: boolean; message: string }>;
  systemLogo: string;
  onSaveSystemLogo: (logoBase64: string) => Promise<{ success: boolean; message: string }>;
  onResetSystemLogo: () => Promise<{ success: boolean; message: string }>;
}

export default function LogoSettingsTab({
  systemName,
  onSaveSystemName,
  systemLogo,
  onSaveSystemLogo,
  onResetSystemLogo,
}: LogoSettingsTabProps) {
  const [localName, setLocalName] = useState(systemName);
  const [logoUrl, setLogoUrl] = useState('');
  const [logoBase64, setLogoBase64] = useState(systemLogo);
  const [logoDetails, setLogoDetails] = useState('ยังไม่ได้เลือกรูปภาพใหม่');
  const [dragActive, setDragActive] = useState(false);

  useEffect(() => {
    setLocalName(systemName);
  }, [systemName]);

  useEffect(() => {
    setLogoBase64(systemLogo);
  }, [systemLogo]);

  const handleSaveName = async () => {
    if (!localName.trim()) {
      Swal.fire({
        title: 'ผิดพลาด',
        text: 'กรุณากรอกชื่อระบบอย่างเหมาะสม',
        icon: 'error',
        customClass: { popup: 'custom-swal-popup', confirmButton: 'custom-swal-confirm-btn' },
      });
      return;
    }

    Swal.fire({
      title: 'กำลังบันทึกชื่อระบบ...',
      allowOutsideClick: false,
      didOpen: () => Swal.showLoading(),
    });

    const res = await onSaveSystemName(localName);
    Swal.close();

    if (res.success) {
      Swal.fire({
        title: 'สำเร็จ!',
        text: res.message,
        icon: 'success',
        customClass: { popup: 'custom-swal-popup', confirmButton: 'custom-swal-confirm-btn' },
      });
    } else {
      Swal.fire({
        title: 'ล้มเหลว!',
        text: res.message,
        icon: 'error',
        customClass: { popup: 'custom-swal-popup', confirmButton: 'custom-swal-confirm-btn' },
      });
    }
  };

  const handleFetchFromUrl = async () => {
    if (!logoUrl.trim()) {
      Swal.fire({
        title: 'ผิดพลาด',
        text: 'กรุณาระบุที่อยู่ลิงก์ URL ของรูปภาพ',
        icon: 'error',
        customClass: { popup: 'custom-swal-popup', confirmButton: 'custom-swal-confirm-btn' },
      });
      return;
    }

    Swal.fire({
      title: 'กำลังดึงรูปภาพจากลิงก์...',
      text: 'เชื่อมต่อและตรวจสอบภาพผ่านเซิร์ฟเวอร์หลักเพื่อหลีกเลี่ยง CORS',
      allowOutsideClick: false,
      didOpen: () => Swal.showLoading(),
    });

    try {
      // Fetch via backend proxy to avoid CORS
      const proxyRes = await fetch(`/api/proxy-image?url=${encodeURIComponent(logoUrl)}`);
      const data = await proxyRes.json();
      Swal.close();

      if (data.success && data.base64) {
        setLogoBase64(data.base64);
        setLogoDetails(`รูปภาพดึงจากลิงก์ (${data.contentType})`);
        Swal.fire({
          title: 'ดึงรูปภาพสำเร็จ!',
          text: 'ดึงไฟล์ผ่าน Proxy เรียบร้อย พร้อมสำหรับจัดเก็บ',
          icon: 'success',
          customClass: { popup: 'custom-swal-popup', confirmButton: 'custom-swal-confirm-btn' },
        });
      } else {
        Swal.fire({
          title: 'ดึงรูปภาพล้มเหลว',
          text: data.message || 'โปรดตรวจสอบความถูกต้องของ URL รูปภาพ',
          icon: 'error',
          customClass: { popup: 'custom-swal-popup', confirmButton: 'custom-swal-confirm-btn' },
        });
      }
    } catch (err: any) {
      Swal.close();
      Swal.fire({
        title: 'ดึงรูปภาพล้มเหลว',
        text: err.toString(),
        icon: 'error',
        customClass: { popup: 'custom-swal-popup', confirmButton: 'custom-swal-confirm-btn' },
      });
    }
  };

  const processFile = (file: File) => {
    if (!file.type.match('image.*')) {
      Swal.fire({
        title: 'ไฟล์ไม่ถูกต้อง',
        text: 'กรุณาเลือกเฉพาะไฟล์ภาพเท่านั้น',
        icon: 'error',
        customClass: { popup: 'custom-swal-popup', confirmButton: 'custom-swal-confirm-btn' },
      });
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      Swal.fire({
        title: 'ขนาดไฟล์เกินกำหนด',
        text: 'ไฟล์ภาพมีขนาดใหญ่เกิน 2MB กรุณาลดขนาดไฟล์ก่อนส่ง',
        icon: 'error',
        customClass: { popup: 'custom-swal-popup', confirmButton: 'custom-swal-confirm-btn' },
      });
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const base64 = e.target?.result as string;
      setLogoBase64(base64);
      setLogoDetails(`${file.name} (${(file.size / 1024).toFixed(1)} KB)`);
    };
    reader.readAsDataURL(file);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const handleSaveLogo = async () => {
    if (!logoBase64) return;

    Swal.fire({
      title: 'กำลังอัปโหลดโลโก้ใหม่...',
      allowOutsideClick: false,
      didOpen: () => Swal.showLoading(),
    });

    const res = await onSaveSystemLogo(logoBase64);
    Swal.close();

    if (res.success) {
      Swal.fire({
        title: 'สำเร็จ!',
        text: res.message,
        icon: 'success',
        customClass: { popup: 'custom-swal-popup', confirmButton: 'custom-swal-confirm-btn' },
      });
    } else {
      Swal.fire({
        title: 'ล้มเหลว!',
        text: res.message,
        icon: 'error',
        customClass: { popup: 'custom-swal-popup', confirmButton: 'custom-swal-confirm-btn' },
      });
    }
  };

  const handleResetLogo = () => {
    Swal.fire({
      title: 'คืนค่าโลโก้เริ่มต้น?',
      text: 'คุณต้องการคืนค่ากลับไปเป็นสัญลักษณ์นกไปรษณีย์ไทยแบบเดิมใช่หรือไม่?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'คืนค่าเริ่มต้น',
      cancelButtonText: 'ยกเลิก',
      customClass: {
        popup: 'custom-swal-popup',
        confirmButton: 'custom-swal-confirm-btn',
        cancelButton: 'custom-swal-cancel-btn'
      }
    }).then(async (result) => {
      if (result.isConfirmed) {
        Swal.fire({
          title: 'กำลังดำเนินการคืนค่า...',
          allowOutsideClick: false,
          didOpen: () => Swal.showLoading(),
        });

        const res = await onResetSystemLogo();
        Swal.close();

        if (res.success) {
          setLogoBase64('');
          setLogoDetails('ยังไม่ได้เลือกรูปภาพใหม่');
          Swal.fire({
            title: 'สำเร็จ!',
            text: res.message,
            icon: 'success',
            customClass: { popup: 'custom-swal-popup', confirmButton: 'custom-swal-confirm-btn' },
          });
        }
      }
    });
  };

  return (
    <section id="tab-logo-settings" className="space-y-6 animate-fade-in">
      <div className="bg-white p-5 lg:p-6 rounded-2xl border border-gray-100 shadow-sm space-y-6 max-w-2xl mx-auto">
        <div className="border-b border-gray-100 pb-4 text-center sm:text-left">
          <h3 className="text-base lg:text-lg font-bold text-gray-800 flex items-center justify-center sm:justify-start">
            <i className="fa-solid fa-gears text-blue-500 mr-2"></i>
            ระบบตั้งค่าและการปรับแต่งระบบ (จัดการระบบ)
          </h3>
          <p className="text-xs text-gray-400 mt-1">ตั้งค่าชื่อระบบของโปรแกรม รวมถึงสัญลักษณ์แบรนด์หรือโลโก้ตามความเหมาะสมของท่าน</p>
        </div>

        {/* Section 1: Name Settings */}
        <div className="space-y-3 bg-gray-50 p-4 rounded-2xl border border-gray-100">
          <h4 className="text-sm font-bold text-gray-700 flex items-center">
            <i className="fa-solid fa-signature text-blue-500 mr-2"></i>
            ตั้งค่าชื่อของระบบแอปพลิเคชัน
          </h4>
          <div className="flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              value={localName}
              onChange={(e) => setLocalName(e.target.value)}
              placeholder="พิมพ์ชื่อระบบ เช่น Post Intent Lab"
              className="flex-grow px-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 transition-all-smooth bg-white"
            />
            <button
              onClick={handleSaveName}
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all-smooth shadow-md shadow-blue-100 cursor-pointer"
            >
              บันทึกชื่อระบบ
            </button>
          </div>
        </div>

        {/* Section 2: Logo from URL */}
        <div className="space-y-3 bg-gray-50 p-4 rounded-2xl border border-gray-100">
          <h4 className="text-sm font-bold text-gray-700 flex items-center">
            <i className="fa-solid fa-link text-emerald-500 mr-2"></i>
            ดึงภาพโลโก้ผ่านลิงก์รูปภาพ (Image URL)
          </h4>
          <p className="text-[11px] text-gray-400">รองรับไฟล์หลากหลายรูปแบบ เช่น SVG, PNG, WebP, JPG, JPEG, GIF และอื่น ๆ</p>
          <div className="flex flex-col sm:flex-row gap-3">
            <input
              type="url"
              value={logoUrl}
              onChange={(e) => setLogoUrl(e.target.value)}
              placeholder="วางที่อยู่ลิงก์รูปภาพ https://example.com/logo.png"
              className="flex-grow px-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-emerald-500 transition-all-smooth bg-white"
            />
            <button
              onClick={handleFetchFromUrl}
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all-smooth shadow-md shadow-emerald-100 cursor-pointer"
            >
              ดึงรูปจากลิงก์
            </button>
          </div>
        </div>

        {/* Section 3: File Upload Zone */}
        <div className="space-y-3 bg-gray-50 p-4 rounded-2xl border border-gray-100">
          <h4 className="text-sm font-bold text-gray-700 flex items-center">
            <i className="fa-solid fa-file-import text-purple-500 mr-2"></i>
            อัปโหลดไฟล์ภาพจากเครื่องของท่าน
          </h4>
          <div
            onDragEnter={handleDrag}
            onDragOver={handleDrag}
            onDragLeave={handleDrag}
            onDrop={handleDrop}
            onClick={() => document.getElementById('logoFileInput')?.click()}
            className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer hover:bg-blue-50/20 transition-all-smooth flex flex-col items-center justify-center space-y-4 bg-white ${
              dragActive ? 'border-blue-500 bg-blue-50/30' : 'border-gray-300 hover:border-blue-500'
            }`}
          >
            <div className="w-14 h-14 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center shadow-inner">
              <i className="fa-solid fa-cloud-arrow-up text-2xl"></i>
            </div>
            <div>
              <p className="text-sm font-bold text-gray-700">ลากไฟล์ภาพโลโก้มาวางที่นี่ หรือ คลิกเพื่อเลือกไฟล์</p>
              <p className="text-[11px] text-gray-400 mt-1">ขนาดแนะนำ: สี่เหลี่ยมจัตุรัส (1:1) สูงสุด 2MB</p>
            </div>
            <input
              type="file"
              id="logoFileInput"
              accept="image/*"
              className="hidden"
              onChange={handleFileChange}
            />
          </div>
        </div>

        {/* Preview and Save actions */}
        <div className="flex flex-col sm:flex-row items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100 gap-4">
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 bg-white rounded-xl border border-gray-200 shadow-sm flex items-center justify-center overflow-hidden flex-shrink-0">
              {logoBase64 ? (
                <img id="logo-preview-image" src={logoBase64} className="w-full h-full object-cover" alt="Logo Preview" />
              ) : (
                <span id="logo-preview-empty" className="text-xs text-gray-400 font-semibold">ไม่มีภาพ</span>
              )}
            </div>
            <div>
              <p className="text-xs font-bold text-gray-700">ตัวอย่างโลโก้ใหม่</p>
              <p className="text-[10px] text-gray-400 mt-0.5" id="logo-file-details">{logoDetails}</p>
            </div>
          </div>

          <div className="flex gap-2 w-full sm:w-auto">
            <button
              onClick={handleResetLogo}
              className="flex-1 sm:flex-initial px-4 py-2 border border-gray-200 hover:bg-gray-100 text-gray-600 rounded-xl text-xs font-bold transition-all-smooth cursor-pointer"
            >
              รีเซ็ตโลโก้
            </button>
            <button
              onClick={handleSaveLogo}
              disabled={!logoBase64 || logoBase64 === systemLogo}
              className="flex-1 sm:flex-initial px-5 py-2 bg-primary hover:bg-primary-hover text-white rounded-xl text-xs font-bold transition-all-smooth cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              บันทึกโลโก้
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
