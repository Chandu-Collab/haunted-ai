# Contributing to Haunted AI

First off, thank you for considering contributing to Haunted AI! It's people like you that make open-source such a great community to learn, inspire, and create.

## 🧠 Philosophy

Haunted AI is an experimental AI companion platform. When contributing, keep in mind our core vision: **AI doesn't always need to solve a problem. Sometimes it can simply make a moment better.**

## 🚀 How to Contribute

### 1. Reporting Bugs

If you find a bug, please use the **Bug Report** issue template. Include as much detail as possible:
- Steps to reproduce the bug
- Expected behavior vs. actual behavior
- Browser and OS details
- Console errors (if any)

### 2. Suggesting Features

We love new ideas! If you want to suggest a feature (like a new game, character personality, or visual effect), use the **Feature Request** issue template. 

### 3. Submitting Pull Requests

1. **Fork the repository** and clone it locally.
2. **Create a new branch** for your feature or bugfix: `git checkout -b feature/your-feature-name` or `git checkout -b fix/your-bug-name`.
3. **Set up the project locally** by following the setup instructions in the [README.md](README.md).
4. **Make your changes** and ensure everything runs smoothly.
5. **Commit your changes** with a descriptive commit message.
6. **Push to your fork** and submit a Pull Request to the `main` branch.

## 🛠️ Development Setup

The project is split into two parts: `client` (React/Vite) and `server` (Node.js/Express). 

Ensure you have your `.env` files set up correctly with your Supabase database URL and Google Gemini API key before running the local servers.

## 🎨 Code Style Guidelines

- **Frontend**: We use standard React functional components with hooks. Styling is done via Tailwind CSS. Try to match the existing dark, atmospheric aesthetic.
- **Backend**: We use TypeScript with Express. Keep routing clean and separate logic into controllers/services.
- **Types**: Since this is a TypeScript project, please try to avoid `any` types where possible.

We look forward to your contributions! 👻
