# Solchat Mobile

A decentralized messaging application built on Solana, featuring end-to-end encryption and wallet-based authentication.

## Features

- 🔐 Secure wallet-based authentication
- 💬 Decentralized chat with end-to-end encryption
- 🌐 Built on Solana blockchain
- 🔄 Real-time message syncing
- 🎨 Customizable message colors
- 💰 Built-in BONK token transfers (coming soon)

## Getting Started

### Prerequisites

- Node.js 16+ and npm
- Expo CLI
- A Solana wallet (e.g., Phantom)
- Solana CLI (for development)

### Installation

1. Clone the repository
   ```bash
   git clone https://github.com/your-username/solchat-mobile.git
   cd solchat-mobile
   ```

2. Install dependencies
   ```bash
   npm install
   ```

3. Set up environment variables
   Create a `.env` file in the project root with:
   ```
   SOLANA_RPC_URL=your_rpc_url_here
   ```

4. Start the development server
   ```bash
   npx expo start
   ```
## How to Run

Follow these steps to quickly run the app on a local device or emulator.

### 1. Setup

```bash
git clone https://github.com/your-username/solchat-mobile.git
cd solchat-mobile
npm install
npm run android
```

### 2. In-App Instructions

Once the app launches:

1. **Connect your Solana wallet**
2. **Create a new account** (if prompted)
3. **Fund your wallet with Solana** (use airdrop on devnet)
4. **Hard-exit the app** (completely stop the app)
5. **Reopen the app** — your session and wallet state should persist

## App Structure

### Key Directories

- `app/` - Main application code
  - `(tabs)/` - Tab-based navigation
    - `chat/` - Chat interface and logic
      - `index.tsx` - Main chat component
      - `interface.tsx` - TypeScript interfaces
      - `helper.ts` - Helper functions
  - `account/` - Account management
  - `components/` - Reusable UI components
  - `solana/` - Solana wallet integration

### Chat Module (`app/(tabs)/chat/`)

The chat module handles all messaging functionality:

- **Command Processing**
  - `/help` - Show available commands
  - `/color [blue|red|green]` - Change message color
  - `/pw [key]` - Set encryption key
  - `/pw off` - Disable encryption
  - `/sendbonk [address] [amount]` - Send BONK tokens (under development)
  - `/leave` - Exit current chat

- **Encryption**
  - Optional end-to-end encryption using Hanlock
  - Per-message password protection
  - Secure key storage using AsyncStorage

- **Chat Flow**
  1. Connect wallet
  2. Join or create a chat room
  3. Set a nickname
  4. Optionally enable encryption
  5. Start chatting!

## Development

### Building for Production

```bash
# For Android
expo run:android

# For iOS
expo run:ios
```

### Testing

Run the test suite:
```bash
npm test
```

## Contributing

Contributions are welcome! Please read our [contributing guidelines](CONTRIBUTING.md) before submitting pull requests.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

For support, please open an issue in the GitHub repository or contact the development team.

## Acknowledgments

- Solana Web3.js
- Expo for cross-platform development
- Hanlock for message encryption
