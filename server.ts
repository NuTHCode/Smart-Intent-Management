import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";

const PORT = 3000;
const DB_FILE = path.join(process.cwd(), "db.json");

// Types
interface Intent {
  id: number;
  name: string;
  description: string;
}

interface StopWord {
  id: number;
  pattern: string;
  type: string;
  description: string;
}

interface Phrase {
  intent: string;
  phrase: string;
  cleanedPhrase: string;
  category: string;
  topic: string;
  createdAt?: number;
}

interface AnalyticsCategory {
  rank: number;
  name: string;
  count: number;
  percentage: string;
  savedAt?: number;
}

interface AnalyticsInsight {
  rank: number;
  phrase: string;
  cleanedPhrase: string;
  category: string;
  topic: string;
  frequency: number;
  analyzedAt?: number;
}

interface DB {
  intents: Intent[];
  stopwords: StopWord[];
  phrases: Phrase[];
  system_logo: string;
  system_name: string;
  analytics: {
    categories: AnalyticsCategory[];
    insights: AnalyticsInsight[];
  };
}

// Initial DB configuration matching original Apps Script requirements
const defaultDb: DB = {
  intents: [
    { id: 1, name: "greeting", description: "คำทักทายทั่วไป เช่น สวัสดี ยินดีต้อนรับ" },
    { id: 2, name: "ask_price", description: "สอบถามราคาประเมิน ราคาสินค้า หรืออัตราค่าบริการ" },
    { id: 3, name: "check_status", description: "สอบถามสถานะพัสดุ หรือสถานะการจัดส่งสินค้า" },
    { id: 4, name: "complain_service", description: "ข้อร้องเรียน บริการล่าช้า พัสดุเสียหาย หรือไม่ประทับใจ" },
    { id: 5, name: "human_agent", description: "ต้องการคุยกับเจ้าหน้าที่ที่เป็นมนุษย์" }
  ],
  stopwords: [
    { id: 1, pattern: "\\[TRACKING_ID\\]", type: "Regex", description: "รหัสพัสดุติดตามสถานะ" },
    { id: 2, pattern: "\\[ADDRESS\\]", type: "Regex", description: "ข้อมูลที่อยู่ลูกค้า" },
    { id: 3, pattern: "ค่ะ|คะ|ครับ|คับ", type: "Regex", description: "คำหางเสียงและคำฟุ่มเฟือยทั่วไป" }
  ],
  phrases: [
    { 
      intent: "greeting", 
      phrase: "สวัสดีค่ะ รบกวนสอบถามนิดนึงค่ะ", 
      cleanedPhrase: "รบกวนสอบถามนิดนึง", 
      category: "ทั่วไป (Greeting)", 
      topic: "ทักทายทั่วไป", 
      createdAt: Date.now() 
    }
  ],
  system_logo: "",
  system_name: "Post Intent Lab",
  analytics: {
    categories: [
      { rank: 1, name: "ทั่วไป (Greeting)", count: 120, percentage: "45", savedAt: Date.now() },
      { rank: 2, name: "ติดตามสถานะพัสดุ", count: 80, percentage: "30", savedAt: Date.now() }
    ],
    insights: [
      { rank: 1, phrase: "เช็คพัสดุ TH123456789TH", cleanedPhrase: "เช็คพัสดุ", category: "ติดตามสถานะพัสดุ", topic: "ตามพัสดุ", frequency: 25, analyzedAt: Date.now() }
    ]
  }
};

function readDb(): DB {
  try {
    if (fs.existsSync(DB_FILE)) {
      const raw = fs.readFileSync(DB_FILE, "utf-8");
      return JSON.parse(raw);
    }
  } catch (e) {
    console.error("Error reading database file, using defaults", e);
  }
  return defaultDb;
}

function writeDb(db: DB) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), "utf-8");
  } catch (e) {
    console.error("Error writing to database file", e);
  }
}

// Express app setup
async function startServer() {
  const app = express();
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ extended: true, limit: "50mb" }));

  // API: Get entire settings / configurations
  app.get("/api/db", (req, res) => {
    res.json(readDb());
  });

  // API: Get Intents List
  app.get("/api/intents", (req, res) => {
    const db = readDb();
    res.json(db.intents);
  });

  // API: Add New Intent
  app.post("/api/intents", (req, res) => {
    const { name, description } = req.body;
    if (!name || name.trim() === "") {
      return res.status(400).json({ success: false, message: "กรุณาระบุชื่อ Intent ให้ถูกต้อง" });
    }

    const cleanName = name.trim().replace(/\s+/g, '_').toLowerCase();
    const db = readDb();

    const exists = db.intents.some(i => i.name.toLowerCase() === cleanName.toLowerCase());
    if (exists) {
      return res.json({ success: false, message: "มีชื่อ Intent นี้อยู่ในระบบแล้ว" });
    }

    const maxId = db.intents.reduce((max, item) => (item.id > max ? item.id : max), 0);
    const newIntent: Intent = {
      id: maxId + 1,
      name: cleanName,
      description: description ? description.trim() : ""
    };

    db.intents.push(newIntent);
    writeDb(db);

    res.json({ success: true, message: `บันทึกสร้าง Intent '${cleanName}' สำเร็จแล้ว!` });
  });

  // API: Update Intent
  app.put("/api/intents", (req, res) => {
    const { oldName, newName, description } = req.body;
    if (!oldName || !newName) {
      return res.status(400).json({ success: false, message: "ข้อมูลไม่ครบถ้วน" });
    }

    const db = readDb();
    const cleanNewName = newName.trim().replace(/\s+/g, '_').toLowerCase();
    const index = db.intents.findIndex(i => i.name.toLowerCase() === oldName.toLowerCase());

    if (index === -1) {
      return res.json({ success: false, message: "ไม่พบข้อมูลเดิม" });
    }

    db.intents[index].name = cleanNewName;
    db.intents[index].description = description ? description.trim() : "";
    writeDb(db);

    res.json({ success: true, message: "อัปเดตแก้ไข Intent เรียบร้อยแล้ว!" });
  });

  // API: Delete Intent
  app.delete("/api/intents/:name", (req, res) => {
    const name = req.params.name;
    const db = readDb();
    const index = db.intents.findIndex(i => i.name.toLowerCase() === name.toLowerCase());

    if (index === -1) {
      return res.json({ success: false, message: "ไม่พบชื่อ Intent ที่ต้องการลบ" });
    }

    db.intents.splice(index, 1);
    writeDb(db);

    res.json({ success: true, message: `ลบ Intent '${name}' เรียบร้อย!` });
  });

  // API: Get Stop Words
  app.get("/api/stopwords", (req, res) => {
    const db = readDb();
    res.json(db.stopwords);
  });

  // API: Add Stop Word
  app.post("/api/stopwords", (req, res) => {
    const { pattern, type, description } = req.body;
    if (!pattern || pattern.trim() === "") {
      return res.status(400).json({ success: false, message: "กรุณาระบุรูปแบบคำที่สมบูรณ์" });
    }

    const db = readDb();
    const maxId = db.stopwords.reduce((max, item) => (item.id > max ? item.id : max), 0);
    const newWord: StopWord = {
      id: maxId + 1,
      pattern: pattern.trim(),
      type: type || "Word",
      description: description ? description.trim() : ""
    };

    db.stopwords.push(newWord);
    writeDb(db);

    res.json({ success: true, message: `เพิ่มคำ Stop Word '${pattern.trim()}' เข้าระบบเรียบร้อย!` });
  });

  // API: Update Stop Word
  app.put("/api/stopwords/:id", (req, res) => {
    const id = parseInt(req.params.id, 10);
    const { pattern, type, description } = req.body;
    
    if (isNaN(id)) {
      return res.status(400).json({ success: false, message: "ID ไม่ถูกต้อง" });
    }

    const db = readDb();
    const index = db.stopwords.findIndex(s => s.id === id);

    if (index === -1) {
      return res.json({ success: false, message: "ไม่พบข้อมูลคำฟุ่มเฟือยที่ระบุ" });
    }

    db.stopwords[index].pattern = pattern.trim();
    db.stopwords[index].type = type || "Word";
    db.stopwords[index].description = description ? description.trim() : "";
    writeDb(db);

    res.json({ success: true, message: "อัปเดตคำสำเร็จ" });
  });

  // API: Delete Stop Word
  app.delete("/api/stopwords/:id", (req, res) => {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      return res.status(400).json({ success: false, message: "ID ไม่ถูกต้อง" });
    }

    const db = readDb();
    const index = db.stopwords.findIndex(s => s.id === id);

    if (index === -1) {
      return res.json({ success: false, message: "ไม่พบคำ Stop Word ในระบบ" });
    }

    db.stopwords.splice(index, 1);
    writeDb(db);

    res.json({ success: true, message: "ลบข้อมูลคำ Stop Word เรียบร้อยแล้ว" });
  });

  // API: Get Existing Phrases (All_Data_Storage)
  app.get("/api/phrases", (req, res) => {
    const db = readDb();
    res.json(db.phrases);
  });

  // API: Save Matched Data
  app.post("/api/phrases", (req, res) => {
    const { dataList, categories, insights } = req.body;
    if (!Array.isArray(dataList)) {
      return res.status(400).json({ success: false, message: "ข้อมูลไม่ถูกต้อง" });
    }

    const db = readDb();
    const now = Date.now();

    const formattedList: Phrase[] = dataList.map(item => ({
      intent: item.intent || "",
      phrase: item.phrase || "",
      cleanedPhrase: item.cleanedPhrase || "",
      category: item.category || "ทั่วไป (Greeting)",
      topic: item.topic || "เรื่องทั่วไป",
      createdAt: now
    }));

    db.phrases.push(...formattedList);

    // If analytics are passed, we save them as well to persist history tab dashboard!
    if (categories && Array.isArray(categories)) {
      db.analytics.categories = categories.map(c => ({
        rank: c.rank,
        name: c.name,
        count: c.count,
        percentage: c.percentage,
        savedAt: now
      }));
    }
    if (insights && Array.isArray(insights)) {
      db.analytics.insights = insights.map(i => ({
        rank: i.rank,
        phrase: i.phrase,
        cleanedPhrase: i.cleanedPhrase,
        category: i.category,
        topic: i.topic,
        frequency: i.frequency,
        analyzedAt: now
      }));
    }

    writeDb(db);

    res.json({ 
      success: true, 
      message: `บันทึกคลังชุดข้อมูลจำนวน ${formattedList.length} แถว ขึ้นสโตเรจระบบสำเร็จ!` 
    });
  });

  // API: System Logo Settings
  app.get(["/api/branding-logo", "/api/system/logo", "/api/app-config/logo"], (req, res) => {
    const db = readDb();
    res.json({ logo: db.system_logo });
  });

  app.post(["/api/branding-logo", "/api/system/logo", "/api/app-config/logo"], (req, res) => {
    const { logo } = req.body;
    const db = readDb();
    db.system_logo = logo || "";
    writeDb(db);
    res.json({ success: true, message: "บันทึกโลโก้ระบบสำเร็จ!" });
  });

  app.delete(["/api/branding-logo", "/api/system/logo", "/api/app-config/logo"], (req, res) => {
    const db = readDb();
    db.system_logo = "";
    writeDb(db);
    res.json({ success: true, message: "คืนค่าสัญลักษณ์นกไปรษณีย์ไทยแบบเดิมสำเร็จ" });
  });

  // API: System Name Settings
  app.get(["/api/branding-name", "/api/system/name", "/api/app-config/name"], (req, res) => {
    const db = readDb();
    res.json({ name: db.system_name });
  });

  app.post(["/api/branding-name", "/api/system/name", "/api/app-config/name"], (req, res) => {
    const { name } = req.body;
    if (!name || name.trim() === "") {
      return res.status(400).json({ success: false, message: "กรุณากรอกชื่อระบบอย่างเหมาะสม" });
    }
    const db = readDb();
    db.system_name = name.trim();
    writeDb(db);
    res.json({ success: true, message: "บันทึกชื่อระบบสำเร็จ" });
  });

  // Proxy download template to avoid static file issues
  app.get("/api/template", (req, res) => {
    // Return mock template CSV/xlsx response if requested, but SheetJS generates template client side.
    res.send("Template downloadable client-side via SheetJS");
  });

  // Proxy CORS images to avoid canvas image draw taint issues for local settings
  app.get("/api/proxy-image", async (req, res) => {
    const url = req.query.url as string;
    if (!url) {
      return res.status(400).json({ success: false, message: "Missing URL parameter" });
    }
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Failed to fetch image: ${response.statusText}`);
      }
      const arrayBuffer = await response.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const contentType = response.headers.get("content-type") || "image/png";
      const base64 = `data:${contentType};base64,${buffer.toString("base64")}`;
      res.json({ success: true, base64, contentType });
    } catch (e: any) {
      res.json({ success: false, message: e.toString() });
    }
  });

  // Vite Integration
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
