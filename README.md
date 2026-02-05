# Gato Garage

An idle clicker/tycoon game where you run a garage with cat-maid mechanics!

**Starring: Cheese the Maid (Gato-san)**

## About

Gato Garage is a browser-based idle game inspired by classics like Cookie Clicker. Click to repair cars, earn money, buy tool upgrades, and hire adorable cat-maid workers to automate your garage empire!

### Features

- **Click-to-Repair**: Click on cars to fix them and earn money
- **Combo System**: Rapid clicks build up a combo multiplier for bonus repairs
- **Upgrades**: Purchase tools to increase your repair power
- **Workers**: Hire cat-maid helpers that auto-repair cars while you're away
- **Save System**: Automatic saving with offline progress calculation
- **Retro Aesthetic**: Game Boy inspired pixel art with cyberpunk neon accents

## How to Play

1. Open `index.html` in a modern web browser
2. Click on the game area to repair cars
3. Earn money when cars are fully repaired
4. Spend money on tools (upgrades) to repair faster
5. Hire cat-maids to auto-repair cars
6. Watch your garage empire grow!

## Character

**Cheese the Maid (Gato-san)**
- Species: Cat-Maid
- Role: Master Mechanic
- Features: Green hair, cat ears & tail, classic maid outfit

## Technical Details

- **Pure Vanilla**: HTML, CSS, and JavaScript with zero dependencies
- **No Build Required**: Just open in a browser and play
- **Offline Support**: Progress is saved to localStorage
- **Desktop Optimized**: Designed for mouse input (touch support planned)

## Project Structure

```
Gato-Garage-Game/
├── index.html          # Main entry point
├── css/
│   ├── main.css        # Core layout and structure
│   ├── theme.css       # Color scheme and effects
│   └── pixel-ui.css    # Pixel-art styled components
├── js/
│   ├── main.js         # Entry point
│   ├── game/           # Core game classes
│   ├── systems/        # Game mechanics
│   ├── entities/       # Car, Worker classes
│   ├── rendering/      # Canvas rendering
│   ├── ui/             # UI components
│   ├── data/           # Game balance data
│   └── utils/          # Utilities
└── assets/             # Sprites (placeholder for now)
```

## Color Palette

Inspired by Cheese's character design:

| Color | Hex | Usage |
|-------|-----|-------|
| Gato Green | `#4ade80` | Primary accent, highlights |
| Navy Blue | `#1e3a5f` | UI panels, outfit reference |
| Dark Navy | `#0a1628` | Main background |
| Cream | `#fef3c7` | Text, apron reference |
| Cyber Pink | `#f472b6` | Secondary accent |
| Cyber Cyan | `#22d3d3` | Tertiary accent |

## Development

### Running Locally

Simply open `index.html` in your browser. No server required!

For development with live reload, you can use any simple HTTP server:

```bash
# Python 3
python -m http.server 8000

# Node.js (npx)
npx serve

# Then open http://localhost:8000
```

### Debugging

The game instance is available in the browser console as `window.game`. Useful commands:

```javascript
// Add currency
game.state.addCurrency(1000)

// Check state
console.log(game.state)

// Force save
game.saveManager.save()

// Reset game
game.reset()
```

## Roadmap

- [ ] Prestige system (reset for permanent bonuses)
- [ ] Achievement system
- [ ] Real pixel art sprites
- [ ] Sound effects
- [ ] Mobile/touch support
- [ ] More car types and workers
- [ ] Special events

## Credits

- **Character Design**: Cheese the Maid (Gato-san)
- **Game Design & Development**: Built with Claude Code
- **Inspired By**: Cookie Clicker, Idle games, Retro Game Boy aesthetics

## License

This project is for personal/educational use.

---

*"Nyaa~ Welcome to Gato Garage!"* - Cheese
