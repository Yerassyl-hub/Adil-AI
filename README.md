## AdilAI

React Native + Expo mobile app that integrates with a FastAPI backend to deliver AI-assisted contracts, chat, and document flows for legal professionals.

### What’s in this repo
- Expo SDK 51 / React Native 0.74, TypeScript, Zustand, react-navigation
- Custom UI kit in `app/components/ui`, state stores in `app/store`, and localization in `app/i18n`
- API clients in `app/services` talking to `/health`, `/v1/analyze/contract`, `/v1/documents/upload`, `/v1/chat`
- PDF helpers, notifications, and mock data to keep the UI working offline

### Requirements
1. Node.js 20+ (bundled with npm)
2. Expo CLI (`npm install -g expo-cli` if missing)
3. Android Studio / Xcode / web browser for testing targets

### Setup
1. Install dependencies: `npm install`
2. Copy environment template: `cp .env.example .env`
3. Update `.env` with the backend URL/API key, e.g.:
   ```text
   API_URL=http://127.0.0.1:8000
   API_KEY=superdev123
   TENANT_ID=default
   NOTIFICATIONS_ENABLED=true
   ```
4. Start Expo: `npx expo start`
   - `a` launches Android (uses `http://10.0.2.2:8000`)
   - `i` launches iOS or iOS simulator
   - `w` runs the web client

### Backend considerations
- The mobile client polls `/health` and requires the FastAPI server to expose `/v1/analyze/contract`, `/v1/documents/upload`, and `/v1/chat`.
- For real devices or CI, expose the API using ngrok or your own HTTPS host and point `API_URL` there with the same `API_KEY`.
- Use `app/services/mock.ts` to emulate backend responses when the API is unavailable.

### Testing & linting
```
npm test
npm run lint
npm run lint:fix
npm run format
```

### Build
```
npx expo build:android
npx expo build:ios
```

### Publishing to GitHub
1. Commit your current work: `git add .` / `git commit -m "..."`.
2. Set the remote (once per repo):
   ```
   git remote add origin https://github.com/Yerassyl-hub/Adil-AI.git
   git branch -M main
   git push -u origin main
   ```
3. Future updates just need `git push`.

### Next steps
- Replace the placeholder analytics/config values in `app/env.ts` with prod-ready secrets before shipping.
- Attach the required Figma assets to `app/assets/` if not already present.
