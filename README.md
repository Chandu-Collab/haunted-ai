# 👻 Haunted AI — AI Companion Platform

![Built With](https://img.shields.io/badge/Built_With-React_&_Node-e34f26?style=flat)
![Powered By](https://img.shields.io/badge/Powered_By-Google_Gemini-007acc?style=flat)
![Type](https://img.shields.io/badge/Type-AI_Companion-4c1?style=flat)
![Status](https://img.shields.io/badge/Status-Active-brightgreen?style=flat)
![License](https://img.shields.io/badge/License-MIT-yellow?style=flat)

> An AI companion built to turn boring moments into engaging experiences.

[![Live Demo](https://img.shields.io/badge/Live%20Demo-00C7B7?style=for-the-badge&logo=netlify&logoColor=white)](https://haunted-ai.netlify.app/)
[![Report Bug](https://img.shields.io/badge/Report%20Bug-181717?style=for-the-badge&logo=github&logoColor=white)](https://github.com/Chandu-Collab/haunted-ai/issues)
[![Request Feature](https://img.shields.io/badge/Request%20Feature-181717?style=for-the-badge&logo=github&logoColor=white)](https://github.com/Chandu-Collab/haunted-ai/issues)

---

## 🚧 Product Status

**Haunted AI is an experimental project exploring real-time AI companionship.**

It is built to showcase a novel idea for solving real-time engagement and boredom, rather than functioning as an immediate commercial startup. Future releases may expand character systems, personalization, memory, and interactive experiences.

---

## ✨ What is Haunted AI?

Haunted AI is an AI companion platform designed to help users break boredom, reset their mood, and engage in meaningful or playful conversations.

Instead of providing a single generic chatbot experience, Haunted AI explores character-driven AI interactions where each character can have its own personality, communication style, behavior, and purpose.

The long-term vision is to make AI interaction feel less like "asking a chatbot questions" and more like spending time with a digital companion.

---

## 🎯 The Problem

Traditional AI chat interfaces are highly utility-focused.

Users usually open an AI assistant because they need an answer, but there are many moments when people simply want:

- Someone to talk to
- A distraction from repetitive work
- Something entertaining
- A way to reset after a stressful moment
- A more personalized conversational experience

Haunted AI explores this space.

---

## 💡 Product Vision

Haunted AI aims to become a character-driven AI companion platform where users can choose the kind of interaction they want.

Different characters can provide different experiences:

🎭 **Personality-driven conversations**  
🎮 **Interactive mini-games**  
💬 **Casual conversations**  
🧠 **Context-aware responses**  
👻 **Themed AI experiences**  
✨ **Personalized interactions**  

---

## 🚀 Current Experience

The current version includes:

- **Real-time AI conversations**: Powered by WebSockets (Socket.IO).
- **Character-driven personality**: Select different ghost profiles with distinct behavior.
- **Atmospheric visual experience**: 3D motion backgrounds, particle systems, fog effects.
- **Interactive experiences**: Play chat-based games with the AI.
- **Conversation history**: Persistent state powered by Supabase and Prisma.
- **Typing indicators & real-time presence**: See when the companion is responding.

---

## 🧠 How It Works

```text
User
  ↓
Character Selection
  ↓
Conversation Context
  ↓
AI Processing (Google Gemini)
  ↓
Character Personality
  ↓
Response
  ↓
Interactive Experience
```

---

## 🛠️ Tech Stack

### Frontend
- **Framework**: React
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Animations**: Framer Motion
- **Tooling**: Vite

### Backend
- **Runtime**: Node.js
- **Framework**: Express
- **Real-time**: Socket.IO

### Data
- **Database**: Supabase
- **ORM**: Prisma & TypeORM

### AI
- **Provider**: Google Gemini (gemini-flash-latest)

### Deployment
- **Frontend**: Netlify
- **Backend**: Render

---

## 🏗️ Architecture

The platform separates the client application and the API layer. Clients connect via REST for standard operations and upgrade to WebSockets (Socket.IO) for real-time interactions and low-latency responses.

---

## 🎨 Product Philosophy

Haunted AI is built around one simple idea:

> **AI doesn't always need to solve a problem.**
> **Sometimes it can simply make a moment better.**

"AI for the moments when you don't need an answer."

---

## 🗺️ Roadmap

### Phase 1 — Core Companion
- [x] Real-time conversation
- [x] Character personality
- [x] Conversation history
- [x] Responsive UI
- [x] Atmospheric VFX (Fog, Particles)

### Phase 2 — Interactive Experiences
- [x] Mini-games
- [ ] More character experiences
- [ ] Rich interaction modes

### Phase 3 — Personalization
- [ ] User profiles
- [ ] Long-term memory
- [ ] Personalized characters
- [ ] Conversation preferences

### Phase 4 — Platform
- [ ] Character marketplace
- [ ] Custom character creation
- [ ] Community experiences
- [ ] Advanced personalization

---

## ⚙️ Local Setup

### 1. Clone the repository

```bash
git clone https://github.com/Chandu-Collab/haunted-ai.git
cd haunted-ai
```

### 2. Set up the backend

```bash
cd server
```

Create a `server/.env` file with your configuration:
- You will need a valid **Supabase** database URL.
- You will need a **Google Gemini API Key**.

Install dependencies and start the server:

```bash
npm install
npm run migrate
npm run dev
```

### 3. Set up the frontend

In a new terminal:

```bash
cd client
```

Create a `client/.env` file and set your variables.

Install dependencies and start the development server:

```bash
npm install
npm run dev
```

The app should now be running at `http://localhost:5173`

---

## 🔐 Privacy

Conversations and interactions are stored in Supabase to provide a persistent memory experience. No PII is shared with third parties, and all AI processing is done using official provider APIs without logging for model training.

---

## 🤝 Contributing

Contributions, ideas, and feedback are welcome. Check the roadmap for areas where we need the most help!

---

## 📄 License

MIT License

---

## 🔗 Links

- 🌐 **Live Product**: https://haunted-ai.netlify.app/
- 💻 **Source Code**: https://github.com/Chandu-Collab/haunted-ai
- 🐛 **Issues**: https://github.com/Chandu-Collab/haunted-ai/issues