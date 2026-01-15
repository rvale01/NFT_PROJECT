# Algorand NFT Marketplace

A modern, user-friendly NFT marketplace built on Algorand with lazy minting capabilities. Designed for non-technical users who may have never used NFTs before.

## ✨ Features

- 🎨 **Lazy Minting**: NFTs are only minted when purchased
- 💰 **No Upfront Costs**: Creators don't pay blockchain fees
- 🚀 **Fast Transactions**: Built on Algorand's fast and cheap network
- 🌱 **Eco-Friendly**: Algorand is carbon-negative
- 📱 **Mobile-First**: Responsive design for all devices
- 🔒 **Secure**: Wallet-based authentication with Pera Wallet
- 🎯 **User-Friendly**: Clear explanations, no crypto jargon

## 🚀 Getting Started

### Prerequisites

- **Node.js** 18.0.0 or higher (required - Vite 5 uses modern JavaScript features)
  - Check your version: `node --version`
  - Download from [nodejs.org](https://nodejs.org/) if needed
- **npm** 9.0.0 or higher
- **Pera Wallet** - Download from [perawallet.app](https://perawallet.app)

### Installation

1. Clone the repository
2. Install dependencies:
```bash
npm install
```

### Development

Start the development server:
```bash
npm run dev
```

The app will open at `http://localhost:3000`

### Build for Production

```bash
npm run build
```

Preview production build:
```bash
npm run preview
```

## 📁 Project Structure

```
src/
├── components/        # Reusable UI components
│   ├── Button.jsx
│   ├── ImageUpload.jsx
│   ├── Modal.jsx
│   ├── Navbar.jsx
│   └── NFTCard.jsx
├── pages/            # Page components
│   ├── LandingPage.jsx
│   ├── CreateNFTPage.jsx
│   ├── MarketplacePage.jsx
│   ├── NFTDetailPage.jsx
│   └── DashboardPage.jsx
├── contexts/         # React contexts
│   ├── WalletContext.jsx
│   └── NFTContext.jsx
├── utils/            # Utilities
│   ├── algorand.js
│   └── constants.js
├── App.jsx           # Main app with routing
└── main.jsx          # Entry point
```

## 🎨 Pages Overview

### 1. Landing Page (`/`)
- Clear value proposition
- Explains lazy minting in simple terms
- Trust signals and features
- CTAs to create or explore

### 2. Create NFT (`/create`)
- Image upload with drag & drop
- NFT details form (name, description, price, royalty)
- Wallet connection flow
- Lazy minting explanation

### 3. Marketplace (`/marketplace`)
- Browse all listed NFTs
- Search and filter functionality
- Responsive grid layout

### 4. NFT Detail (`/nft/:id`)
- Large image preview
- Full NFT information
- Buy now flow with wallet connection
- Purchase confirmation modal

### 5. Dashboard (`/dashboard`)
- Manage listed NFTs
- View purchased NFTs
- Wallet connection status

## 🛠 Technology Stack

- **React 18** - UI framework
- **React Router v6** - Navigation
- **Tailwind CSS** - Utility-first styling
- **Algorand SDK** - Blockchain integration
- **Pera Wallet Connect** - Wallet connection
- **Vite** - Build tool
- **Lucide React** - Icon library

## ⚙️ Configuration

### Network Configuration

The app is currently configured for **Algorand Testnet**. To switch to Mainnet:

1. Update `src/contexts/WalletContext.jsx`:
   - Change `chainId: 416002` to `chainId: 416001`

2. Update `src/utils/algorand.js`:
   - Update `ALGOD_SERVER` and `INDEXER_SERVER` to mainnet endpoints

### IPFS Integration

Currently, images are stored as data URLs. For production:

1. Set up an IPFS service (e.g., Pinata, Web3.Storage)
2. Update `uploadToIPFS` in `src/utils/algorand.js`
3. Store IPFS hashes instead of data URLs

## 🔐 Wallet Integration

The app uses Pera Wallet for Algorand transactions:

1. Users connect via Pera Wallet mobile app or browser extension
2. Transactions are signed securely in the wallet
3. No private keys are stored in the app

## 📝 Notes

- This is a demo/prototype implementation
- In production, you'll need:
  - Backend API for NFT metadata storage
  - IPFS integration for image hosting
  - Actual blockchain transaction execution
  - Transaction status tracking
  - Error handling and retry logic

## 🐛 Troubleshooting

**Wallet won't connect:**
- Ensure Pera Wallet is installed
- Check that you're on the correct network (Testnet/Mainnet)
- Clear browser cache and try again

**NFTs not showing:**
- Check browser console for errors
- Verify localStorage is enabled
- Clear localStorage and refresh if needed

## 📄 License

MIT

## 🙏 Acknowledgments

Built with Algorand's fast, secure, and sustainable blockchain technology.

