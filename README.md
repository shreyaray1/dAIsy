# dAIsy

A personal AI stylist app built with React Native (Expo). dAIsy learns your taste through swiping, analyzes your coloring, and uses real product data to recommend outfits, suggest what to wear based on today's weather, and help you build a digital wardrobe.

---

## What it does

- **Onboarding** — Google sign-in, 6-step style quiz (brands, coloring, aesthetics), swipe-based taste training
- **Dashboard** — Live weather via GPS + AI-generated outfit of the day (real products, top + bottom or dress based on temperature)
- **Shop** — Real product grid with conversational AI search (natural language → results)
- **Discover** — Infinite swipe deck; builds a preference vector from every swipe; style check-in every 15 swipes with AI-generated observations
- **Closet** — Upload clothes, heart favorites, tap "Style This" to get AI-recommended pairings using vision analysis of your photo

---

## Tech stack

| | |
|---|---|
| Framework | React Native + Expo |
| Auth + Database + Storage | Supabase |
| Products | Drezily REST API |
| Conversational search | Drezily Zily (WebSocket) |
| AI (chat + vision) | Azure OpenAI GPT-4.1-mini |
| Weather | OpenWeatherMap |
| Location | expo-location |

---

## Setup

```bash
git clone https://github.com/YOUR_USERNAME/dAIsy.git
cd dAIsy
npm install
npx expo install expo-image-picker expo-web-browser expo-location
```

Create `supabase.js` in the project root:

```js
import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const supabase = createClient('YOUR_SUPABASE_URL', 'YOUR_SUPABASE_ANON_KEY', {
  auth: { storage: AsyncStorage, autoRefreshToken: true, persistSession: true, detectSessionInUrl: false },
});
export const OPENAI_KEY  = 'your-azure-openai-key';
export const WEATHER_KEY = 'your-openweathermap-key';
```

Then run:

```bash
npx expo start
```

---

## Database (Supabase)

Three tables required — `profiles`, `closet_items`, `discover_profile` — plus a `closet-images` storage bucket. Full SQL in [`/docs/schema.sql`](docs/schema.sql) (or see the project setup guide).

---

## Project structure

```
dAIsy/
├── App.js              # All screens, logic, and styles (~4,200 lines)
├── supabase.js         # Supabase client + API keys (gitignored)
├── app.json            # Expo config
├── styles/             # Style aesthetic images (quiz)
└── clothes-women/      # Swipe training images by age group
```

---

## Notes

- `supabase.js` should be in `.gitignore` — never commit API keys
- The Zily search endpoint is a test environment — ask your team for the production URL before shipping
- All AI features have rule-based fallbacks if API calls fail
