# Luxe Door Designer (Browserda doim ishlashi uchun)

Bu loyiha `Vite` (frontend) + `Express` (backend `/api`) dan iborat.
Dev rejim (`npm run dev`) Cursor/terminal yopilsa to‘xtab qoladi. Doim ishlashi uchun **build + start** ishlatiladi.

## Ishga tushirish (production / doimiy)

1) Bir marta paketlarni o‘rnating:

```bash
npm install
```

2) Frontend build qiling:

```bash
npm run build
```

3) Serverni ishga tushiring (frontend ham shu portda ochiladi):

```bash
npm run start
```

Brauzerda: `http://localhost:8787`

## Kompyuter yoqilganda avtomatik ishga tushirish (Windows)

### Variant A) Task Scheduler (tavsiya)

1) `scripts/start-prod.ps1` faylini ishlating (u `npm run start` ni boshlaydi).
2) Windows Search → **Task Scheduler**
3) **Create Task…**
   - **General**: “Run whether user is logged on or not”, “Run with highest privileges”
   - **Triggers**: “At startup” (yoki “At log on”)
   - **Actions**:
     - Program/script: `powershell.exe`
     - Add arguments:
       `-NoProfile -ExecutionPolicy Bypass -File "C:\Users\user\Desktop\luxe-door-designer-main\scripts\start-prod.ps1"`

> Eslatma: avval `npm run build` qilib qo‘ying. Kodni yangilasangiz yana `npm run build` kerak bo‘ladi.

# Welcome to your Lovable project

TODO: Document your project here
