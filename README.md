## Performance & Scalability

### Load Balancing & Clustering

#### PM2 (Node.js Clustering)

To run multiple Node.js processes for better CPU utilization:

```bash
npm install -g pm2
pm2 start dist/index.js -i max # or specify number of instances
```

#### Nginx (Recommended for Production)

Use Nginx as a reverse proxy to distribute traffic across your Node.js instances:

```
upstream haunted_ai_backend {
	server 127.0.0.1:5000;
	server 127.0.0.1:5001;
	# Add more servers as needed
}

server {
	listen 80;
	server_name yourdomain.com;

	location / {
		proxy_pass http://haunted_ai_backend;
		proxy_set_header Host $host;
		proxy_set_header X-Real-IP $remote_addr;
		proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
		proxy_set_header X-Forwarded-Proto $scheme;
	}
}
```

This setup helps handle multiple concurrent users and improves reliability.
# Haunted AI Chatbot 👻

A spooky AI chatbot that becomes increasingly personal and unsettling the more you talk to it. Built with React, Node.js, and OpenAI's GPT-3.5.

## Features

- **Creepy AI Personality**: The ghost's responses become more personal and unsettling over time
- **Real-time Chat**: WebSocket-based communication for instant message delivery
- **Typing Indicators**: Visual feedback when the ghost is "typing"
- **Message History**: Chat history is saved and restored between sessions
- **Atmospheric UI**: Dark theme with spooky animations and effects
- **Responsive Design**: Works on desktop and mobile devices

## Tech Stack

- **Frontend**: React, TypeScript, Tailwind CSS, Framer Motion
- **Backend**: Node.js, Express, Socket.IO
- **Database**: MongoDB with Mongoose
- **AI**: OpenAI GPT-3.5

## Prerequisites

- Node.js (v16 or later)
- npm or yarn
- MongoDB (local or Atlas)
- OpenAI API key

## Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/yourusername/haunted-ai.git
cd haunted-ai
```

### 2. Set up the backend

```bash
cd server
cp .env.example .env
```

Edit the `.env` file with your configuration:

```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/haunted-ai
OPENAI_API_KEY=your_openai_api_key_here
CLIENT_URL=http://localhost:3000
```

Install dependencies and start the server:

```bash
npm install
npm run dev
```

### 3. Set up the frontend

In a new terminal:

```bash
cd client
cp .env.example .env
```

Edit the `.env` file:

```env
REACT_APP_API_URL=http://localhost:5000
```

Install dependencies and start the development server:

```bash
npm install
npm start
```

The app should now be running at `http://localhost:3000`

## Environment Variables

### Backend (server/.env)

| Variable | Description | Default |
|----------|-------------|---------|
| PORT | Port for the Express server | 5000 |
| MONGO_URI | MongoDB connection string | mongodb://localhost:27017/haunted-ai |
| OPENAI_API_KEY | Your OpenAI API key | - |
| CLIENT_URL | URL of the frontend | http://localhost:3000 |

### Frontend (client/.env)

| Variable | Description | Default |
|----------|-------------|---------|
| REACT_APP_API_URL | URL of the backend API | http://localhost:5000 |

## API Endpoints

- `GET /api/chat/history/:sessionId` - Get chat history for a session
- `POST /api/chat/send` - Send a new message

## Deployment

### Backend Deployment

1. Set up a MongoDB database (e.g., MongoDB Atlas)
2. Deploy the server to a hosting provider (e.g., Heroku, Railway, or Render)
3. Set the environment variables in your hosting provider's dashboard

### Frontend Deployment

1. Update the `REACT_APP_API_URL` in the client's `.env` file to point to your deployed backend
2. Build the React app: `npm run build`
3. Deploy the `build` folder to a static hosting service (e.g., Vercel, Netlify, or GitHub Pages)

## Customization

### Changing the Ghost's Personality

Edit the system prompt in `server/src/controllers/chatController.ts` to modify the ghost's personality and behavior.

### Styling

Customize the colors and styling in:
- `client/tailwind.config.js` - Theme configuration
- `client/src/index.css` - Global styles and animations

## Contributing

Contributions are welcome! Please open an issue or submit a pull request.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- Inspired by various AI horror experiences and interactive fiction
- Built with amazing open source technologies

---

👻 Happy haunting!