import { useEffect } from 'react'
import { Route, BrowserRouter as Router, Routes } from 'react-router-dom'
import ErrorBoundary from './components/ErrorBoundary'
import Footer from './components/Footer'
import Navbar from './components/Navbar'
import ToastContainer from './components/Toast'
import CreateNFTPage from './pages/CreateNFTPage'
import DashboardPage from './pages/DashboardPage'
import LandingPage from './pages/LandingPage'
import MarketplacePage from './pages/MarketplacePage'
import NFTDetailPage from './pages/NFTDetailPage'
import NotFoundPage from './pages/NotFoundPage'
import { useWalletStore } from './stores/useWalletStore'
import { useNFTStore } from './stores/useNFTStore'

function App(): React.ReactElement {
  const initializeWallet = useWalletStore((state) => state.initialize)
  const fetchNFTs = useNFTStore((state) => state.fetchNFTs)

  useEffect(() => {
    // Initialize wallet connection check on mount
    initializeWallet()
    // Load NFTs from the backend API
    fetchNFTs()
  }, [initializeWallet, fetchNFTs])

  return (
    <ErrorBoundary>
      <Router>
        <div className="min-h-screen flex flex-col">
          <Navbar />
          <main className="flex-1">
            <Routes>
              <Route path="/" element={<LandingPage />} />
              <Route path="/create" element={<CreateNFTPage />} />
              <Route path="/marketplace" element={<MarketplacePage />} />
              <Route path="/nft/:id" element={<NFTDetailPage />} />
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="*" element={<NotFoundPage />} />
            </Routes>
          </main>
          <Footer />
          <ToastContainer />
        </div>
      </Router>
    </ErrorBoundary>
  )
}

export default App
