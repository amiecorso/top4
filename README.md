# Top Four - Party Game

A fun web-based party game where players rank ideas and try to predict each other's rankings.

## How to Play

1. **Create or join a game** - Share the 4-letter game code with friends
2. **Take turns** - On your turn, 4 random ideas are shown to everyone
3. **Rank secretly** - Order them 1-4 based on your preference
4. **Others predict** - Other players try to guess your ranking
5. **Score points** - Get 1 point for each correct position guess
6. **Win the game** - Highest score after all rounds wins!

## Running Locally

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start the development server:
   ```bash
   npm run dev
   ```

3. Open [http://localhost:3000](http://localhost:3000) in your browser

## Deployment

This app is designed to be deployed on Vercel:

1. Push your code to a Git repository
2. Connect it to Vercel
3. Deploy automatically

## Technology Stack

- **Framework**: Next.js 14 with TypeScript
- **Styling**: Tailwind CSS
- **Real-time Updates**: HTTP polling (easily upgradeable to WebSockets)
- **Deployment**: Vercel

## Game Features

- ✅ Real-time multiplayer gameplay
- ✅ Simple 4-letter room codes
- ✅ Responsive design for mobile and desktop
- ✅ Default idea list included
- ✅ Automatic scoring and leaderboard
- ✅ Turn-based gameplay with multiple rounds

## Future Enhancements

- Custom idea submission before games
- WebSocket support for better real-time experience
- Player avatars and themes
- Game replay and statistics
- Private rooms with passwords