<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/drive/1lpkEuq8tPaTckcAKYaZ0XLV7Y6S5HBpQ

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Create a server env file:
   - copy `.env.example` to `.env`
   - set `GEMINI_API_KEY` inside `.env`
3. Run the app (frontend + backend):
   `npm run dev`

### Notes

- The Gemini API key is kept **server-side only** (not shipped to the browser).
- In dev: frontend runs on `http://localhost:5173` and proxies `/api/*` to the backend on `http://localhost:3000`.
