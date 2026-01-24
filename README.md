# Pending Tracker — BTC MVP (local dev)

This is a minimal web app that:
- accepts a Bitcoin txid
- fetches tx + status + recommended fees from mempool.space
- produces a plain-English diagnosis + next steps (RBF / CPFP / wait)

## Prereqs
- Node.js 18+ recommended

## Setup
```bash
cp .env.example .env.local
npm install
npm run dev
```

Open http://localhost:3000

## Notes
- The upstream provider can be swapped later (e.g., your own self-hosted mempool instance).
- This MVP is intentionally non-custodial and educational.
