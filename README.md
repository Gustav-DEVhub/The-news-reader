# News Reader 📰

A high-performance, aesthetically premium news discovery platform. Built with React and Express, it provides a seamless reading experience with real-time news across multiple categories and languages, powered by **TheNewsApi**.

## ✨ Features

- **🎯 Quality Filtering**: Sophisticated server-side filtering that ensures every news item has a valid image and description, providing a consistent, high-quality feed.
- **🌓 Adaptive Theming**: Full support for Dark and Light modes with smooth transitions and persistent user preferences.
- **🌍 Multilingual Support**: Fully localized interface in **Spanish**, **English**, and **Italian**.
- **📱 Responsive & Premium UI**: A mobile-first, "glassmorphism" inspired design that feels like a high-end digital magazine.
- **🔗 Social Sharing**: Native device sharing integration (Web Share API) and "copy to clipboard" fallbacks for desktop.
- **⚡ Performance Optimized**: Native lazy loading for images and asynchronous decoding to ensure snappy performance on all devices.
- **🔖 Favorites Management**: Save and manage your favorite articles locally with a sleek sidebar interface.

## 🛠 Tech Stack

Verified against each workspace's `package.json`:

**Frontend (`web/`)**

- React 18 + React DOM
- TypeScript 5.9
- Vite 7 (`@vitejs/plugin-react`)
- Vanilla CSS3 custom design system (no CSS framework)
- Custom Theme Context and i18n (Spanish, English, Italian)

**Backend (`server/` — local development proxy)**

- Node.js 16+
- Express 4
- `cors`, `dotenv`, `node-fetch`

**Production API (`api/`)**

- Vercel Serverless Functions (secure TheNewsApi proxy)

**Tooling & Deployment**

- npm workspaces (`server` + `web`) with `concurrently` for parallel dev scripts
- TheNewsApi as the news data source
- Deployed on Vercel

## 📁 Project Structure

```text
├── api/                # Vercel Serverless Functions (Production Proxy)
├── server/             # Express Server (Local Development Proxy)
├── web/                # React + Vite Frontend
│   ├── src/
│   │   ├── components/ # Reusable UI Components
│   │   ├── theme/      # Theme Context and Persistence
│   │   ├── i18n/       # Localization strings and logic
│   │   ├── lib/        # API helpers and types
│   │   └── styles.css  # Core Design System
└── README.md           # Documentation
```

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- [TheNewsApi Token](https://www.thenewsapi.com/)

### Installation

1. **Clone the repository**:
   ```bash
   git clone <your-repo-url>
   cd news-reader
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure environment variables**:
   Create a `.env` file in the `server/` directory:
   ```env
   THENEWSAPI_TOKEN=your_api_token_here
   PORT=5177
   ```

4. **Run in development**:
   ```bash
   npm run dev
   ```
   - Server: `http://localhost:5177`
   - Web: `http://localhost:5176`

## ☁️ Deployment

This project is ready for **Vercel**.

1. **Set Environment Variables**: In your Vercel Dashboard, add `THENEWSAPI_TOKEN`.
2. **Build Settings**: The project is pre-configured with `api/` functions for the proxy.
3. **Deploy**: Push to your main branch or use `vercel deploy`.

## 🛡 Security & Architecture

- **Secure Proxy**: The API key is never exposed to the frontend. Browser requests go through an internal API proxy/serverless function.
- **Defense in Depth**: Category normalization and quality filtering happen server-side to reduce data processing on the client.
- **Privacy**: User preferences (theme, language, favorites) are stored locally on the user's device.

---

*Built with passion for quality journalism and high-end web design.*
