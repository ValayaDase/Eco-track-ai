# EcoTrack AI

EcoTrack AI is a carbon footprint awareness platform that helps individuals understand, track, and reduce their daily emissions through quick lifestyle logging, personalized insights, simulations, and simple behavior-change challenges.

Live Link: https://eco-track-ai-mu.vercel.app/

## Solution Overview

The platform is designed around one loop: measure today's footprint, understand the biggest driver, choose a realistic action, and reinforce the habit over time.

- **Understand:** The homepage provides an instant carbon snapshot without requiring an account, turning common habits into kg CO2e estimates.
- **Track:** The activity tracker records transport, electricity, AC use, diet, plastics, and shopping for daily footprint history.
- **Personalize:** AI recommendations prioritize actions by category, difficulty, priority, and estimated monthly savings.
- **Reduce:** The simulator lets users compare current habits against lower-carbon choices before committing.
- **Reinforce:** Challenges, streaks, XP, badges, reports, and leaderboards make progress visible and repeatable.

## Core User Flow

1. Adjust the public carbon snapshot to understand the main emission source.
2. Create an account or log in to save daily activity.
3. Review the dashboard breakdown and recent audits.
4. Use recommendations and simulator results to choose the next action.
5. Complete challenges and review reports to sustain progress.

## Tech Stack

- **Framework:** Next.js App Router with React and TypeScript
- **Styling:** Tailwind CSS, shadcn-compatible UI primitives
- **Charts:** Recharts
- **Maps:** Leaflet and React Leaflet
- **AI:** Google Gemini integration
- **Data:** MongoDB through Mongoose models
- **Auth:** JWT-based authentication with bcrypt password hashing

## Getting Started

Install dependencies and run the development server:

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Useful Commands

```bash
npm run build
npm run lint
```

## Environment

Create `.env.local` with the values required by the API routes and services:

```bash
MONGODB_URI=
JWT_SECRET=
GEMINI_API_KEY=
```
