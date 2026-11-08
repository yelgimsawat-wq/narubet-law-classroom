# ห้องเรียนกฎหมายของครูนฤเบศ — React + Express + MongoDB

เวอร์ชันใหม่ของ https://teacher-narubet-law-classroom.vercel.app/ แบบ client/server พร้อมระบบสมาชิก (JWT) และ Backoffice สำหรับครู

```
client/      React (Vite) — หน้านักเรียน + Backoffice ครู (ธีมสว่าง/มืด)
server/      Express API + MongoDB (mongoose) + JWT
  src/app.js   แอป Express (ใช้ร่วมกันทั้งรันในเครื่องและบน Vercel)
  src/index.js รันในเครื่อง / เซิร์ฟเวอร์เดียว
  seed-data/   ข้อมูลเนื้อหา/ข้อสอบ/มินิเกม จากเว็บเดิม (ใช้ตอน seed)
api/index.js Vercel serverless function (ชี้ไปที่ server/src/app.js)
vercel.json  ตั้งค่า build + rewrites สำหรับ Vercel
```

## ติดตั้งและรัน (dev)

1. สร้าง cluster ฟรีที่ MongoDB Atlas > Database Access เพิ่ม user > Network Access อนุญาต IP > Connect > Drivers คัดลอก connection string
2. ตั้งค่า server
   ```bash
   cd server
   cp .env.example .env    # ใส่ MONGODB_URI, JWT_SECRET, TEACHER_PASSWORD
   npm install
   npm run seed            # ใส่เนื้อหา + สร้างบัญชีครู + นักเรียนตัวอย่าง 69101 / demo1234
   npm run dev             # http://localhost:4000
   ```
3. รัน client (อีกหน้าต่าง)
   ```bash
   cd client
   npm install
   npm run dev             # http://localhost:5173 (proxy /api ไป :4000)
   ```

`npm run seed -- --force` = เขียนทับเนื้อหาด้วยข้อมูลต้นฉบับ (ข้อสอบที่ครูแก้จะหาย)

## Deploy บน Vercel (แพ็กเกจฟรี Hobby)

1. **MongoDB Atlas** (ฟรี M0): สร้าง cluster ภูมิภาค **Singapore (ap-southeast-1)** · Network Access → เพิ่ม `0.0.0.0/0` (Vercel ไม่มี IP คงที่) · คัดลอก connection string
2. **ใส่ข้อมูลเริ่มต้นลง Atlas** (ทำในเครื่องครั้งเดียว): แก้ `MONGODB_URI` ใน `server/.env` เป็นของ Atlas แล้ว
   ```bash
   cd server && npm install && npm run seed
   ```
3. **Vercel** → Add New Project → import repo นี้ (หรือ `npx vercel` ที่โฟลเดอร์นี้) · Root Directory = โฟลเดอร์นี้ (ไม่ต้องตั้ง framework, ใช้ `vercel.json`)
4. **Environment Variables** ใน Vercel: `MONGODB_URI` (ของ Atlas), `JWT_SECRET` (สุ่มยาว ๆ) — ไฟล์ `server/.env` จะไม่ถูกอัปโหลด (`.vercelignore`)
5. Deploy → เปิดเว็บแล้วเข้าสู่ระบบด้วยบัญชีครูที่สร้างตอน seed

ขีดจำกัดแพ็กเกจฟรีที่เกี่ยวข้อง (ตรวจสอบแล้ว): response API ใหญ่สุด ~436 KB (gzip 75 KB) < 4.5 MB · request body จำกัด 4 MB · ฟังก์ชันใช้ ~17 MB < 250 MB · ไฟล์ static 2.1 MB · Hobby ใช้ได้เฉพาะงานไม่เชิงพาณิชย์

## Production (เซิร์ฟเวอร์เดียว)

```bash
cd client && npm run build      # ได้ client/dist
cd ../server && npm start       # Express เสิร์ฟทั้ง /api และหน้าเว็บจาก client/dist
```
ตั้ง env `MONGODB_URI`, `JWT_SECRET`, `PORT` บนโฮสต์ (Render/Railway/VPS ฯลฯ)

ทางลัดจากโฟลเดอร์หลัก: `npm run dev:api` และ `npm run dev:web` (คนละหน้าต่าง)

## ฟังก์ชัน

**นักเรียน** — สมัคร/เข้าสู่ระบบด้วยรหัสประจำตัว + รหัสผ่าน · แดชบอร์ด + เส้นทางการเรียนรายบุคคล + เรดาร์ 5 หน่วย · ประเมินแรกเข้า 25 ข้อ · บทเรียน 5 หน่วย (เนื้อหา, อินโฟกราฟิก, กรณีศึกษา, สื่อจำลอง 5 ตัว, สไลด์บรรยายเสียงไทย) · ก่อน/หลังเรียน หน่วยละ 20 ข้อ · มินิเกม 5 หน่วย · ค้นหาคำสำคัญ · เอกสาร PDF 82 หน้า + ดาวน์โหลด .html · ใบรายงานผล (พิมพ์/PDF) · คู่มือ/เงื่อนไข

**ครู (Backoffice `/teacher`)** — ภาพรวมชั้นเรียน (กรองห้อง, ค่าเฉลี่ยก่อน/หลัง/เกม, นักเรียนที่ควรติดตาม, แผนการสอน 24 แผน) · จัดการนักเรียน (เพิ่ม/แก้ไข/ตั้งรหัสผ่านใหม่/ล้างคะแนน/ลบ/ดูใบรายงาน/ส่งออก CSV) · คลังข้อสอบ (แก้โจทย์/ตัวเลือก/เฉลย/คำอธิบาย) · แก้ไขเนื้อหา/มินิเกม/บรรณานุกรม/แผนการสอนผ่านฟอร์ม (มี JSON สำหรับขั้นสูง)

## ความปลอดภัย / ต่างจากเว็บเดิม

- คะแนนตรวจที่ server เท่านั้น นักเรียนไม่ได้รับเฉลยจนกว่าจะส่งคำตอบ (เว็บเดิมเก็บใน localStorage แก้คะแนนเองได้)
- ปุ่ม "ทดลองกรอกคำตอบ / เฉลยทั้งหมด" ของเว็บเดิมถูกเอาออกสำหรับนักเรียน (จะทำให้คะแนนที่ครูเห็นไม่จริง)
- ระบบ "สลับบัญชีในเครื่อง" แทนด้วยการ login/logout จริง ตารางผู้เรียนทั้งหมด + CSV ย้ายไปอยู่ Backoffice ครู
- รหัสผ่านเข้ารหัส bcrypt, JWT อายุ 7 วัน

ทดสอบ: `cd server && npm test`
