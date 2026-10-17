# CLAUDE.md — BORNEO Culture Hub

- Stack: Vite + React + TypeScript strict + Tailwind v4 + motion + zod + vitest. Lihat `PRD.md` & `PLAN.md`.
- **Satu sumber angka:** `src/data/budaya-2026.json`. Jangan hardcode angka di komponen.
- Status dihitung di `src/lib/status.ts` (ambang di `src/config/status.ts`); insight di `src/lib/insights.ts`.
- Format angka id-ID lewat `src/lib/format.ts`.
- Hormati `prefers-reduced-motion`, navigasi keyboard, kontras AA. Tanpa URL/IP internal.
- Sebelum commit: `npm run validate && npm run test && npm run lint && npm run build`.
