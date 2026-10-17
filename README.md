# Stayline – Hotel Guest Service Dashboard (Angular 18)

## Run it
1. Install Node.js 18.19+ or 20+  (https://nodejs.org)
2. Open a terminal in this folder and run:  `npm install`
3. Start the app:  `npm start`   (opens http://localhost:4200)
4. Production build (optional):  `npm run build`  -> output in dist/

## Pages
- **Home** (`/home`)             – the 6 sections for ALL departments (charts/tables grouped by department)
- **Department-wise** (`/department/:slug`) – the same 6 sections for ONE department (grouped by its services)

## Folder guide
src/app/core/mock-data.ts      static data (seeded generator, Aug 1 – Oct 29 2024)
src/app/core/data.service.ts   filters (daily/weekly/monthly/custom) + all calculations (signals)
src/app/core/report.service.ts Excel / PDF / CSV export
src/app/shared/chart.component.ts      reusable Chart.js wrapper
src/app/shared/dashboard.component.*   the 6 sections (used by Home and Department pages)
src/app/layout/                sidebar shell + top filter bar with Download Report
src/app/pages/                 HomePage, DepartmentPage
