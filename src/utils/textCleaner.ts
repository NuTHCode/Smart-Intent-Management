import { StopWord } from "../types";

export function cleanStopWords(text: string, stopWords: StopWord[]): string {
  if (!text) return "";
  let cleaned = text;

  stopWords.forEach((sw) => {
    try {
      if (sw.type === "Regex") {
        const regex = new RegExp(sw.pattern, "gi");
        cleaned = cleaned.replace(regex, "");
      } else {
        const escapedPattern = sw.pattern.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
        const regex = new RegExp(escapedPattern, "gi");
        cleaned = cleaned.replace(regex, "");
      }
    } catch (e) {
      console.error("Invalid regex pattern:", sw.pattern, e);
    }
  });

  // Remove excess spaces
  cleaned = cleaned.replace(/\s+/g, " ").trim();
  return cleaned;
}

export function autoClassifyAndExtractTopic(phrase: string): { category: string; topic: string } {
  const text = (phrase || "").toLowerCase();
  
  let category = "หมวดคำทักทายและเรื่องทั่วไป";
  let topic = "เรื่องทั่วไป";

  if (text.includes("ร้องเรียน") || text.includes("เสียหาย") || text.includes("ช้า") || text.includes("พัง") || text.includes("แย่") || text.includes("ไม่พอใจ") || text.includes("ร้องทุกข์")) {
    category = "หมวดร้องเรียน / บริการล่าช้า";
    topic = "ร้องเรียนการบริการ/ล่าช้า";
  } else if (text.includes("ราคา") || text.includes("ค่าส่ง") || text.includes("กี่บาท") || text.includes("อัตรา") || text.includes("แพง") || text.includes("ค่าบริการ") || text.includes("ราคาประเมิน")) {
    category = "หมวดสอบถามค่าบริการ / อัตราส่ง";
    topic = "สอบถามค่าบริการอัตราส่ง";
  } else if (text.includes("เช็ค") || text.includes("ตาม") || text.includes("สถานะ") || text.includes("พัสดุ") || text.includes("เลข") || text.includes("อยู่ที่ไหน") || text.includes("ของถึง")) {
    category = "หมวดติดตามพัสดุ";
    topic = "ติดตามพัสดุ";
  } else if (text.includes("สวัสดี") || text.includes("ฮัลโหล") || text.includes("ดีครับ") || text.includes("ดีค่ะ") || text.includes("ยินดีต้อนรับ")) {
    category = "หมวดคำทักทายและเรื่องทั่วไป";
    topic = "คำทักทาย";
  }

  return { category, topic };
}
