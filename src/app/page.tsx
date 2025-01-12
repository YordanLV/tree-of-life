'use client';

import { useEffect, useState, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import Logo from './components/Logo';
import IntroModal from './components/IntroModal';

interface Token {
  id: string;
  tokenAddress: string;
  name: string;
  imageUrl: string;
  createdAt: string;
  isDexPaid?: boolean;
}

interface PublicBot {
  id: string;
  name: string;
  imageUrl: string;
  personality: string;
  background: string;
  createdAt: string;
}

interface DexOrder {
  type: string;
  status: string;
  paymentTimestamp: string;
}

export default function Home() {
  const [latestTokens, setLatestTokens] = useState<Token[]>([]);
  const [publicBots, setPublicBots] = useState<PublicBot[]>([]);
  const [showTutorials, setShowTutorials] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);
  
  const slides = [
    { src: '/coingeko.png', alt: 'CoinGeko', href: 'https://www.coingecko.com/en/coins/druid-ai' },
    { src: '/memecoin.png', alt: 'Memecoin', href: 'https://memecoinseason.net/p/druid-ai' },
    { src: '/dextools.svg', alt: 'Dext', href: 'https://www.dextools.io/app/en/token/druidai?t=1736240680806' },
  ];

  const nextSlide = useCallback(() => {
    setCurrentSlide((prev) => (prev === slides.length - 2 ? 0 : prev + 1));
  }, [slides.length]);

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev === 0 ? slides.length - 2 : prev - 1));
  };

  // Auto-sliding effect
  useEffect(() => {
    const timer = setInterval(() => {
      nextSlide();
    }, 7500);

    return () => clearInterval(timer);
  }, [nextSlide]);

  const checkDexPaid = async (tokenAddress: string) => {
    try {
      const response = await fetch(`https://api.dexscreener.com/orders/v1/solana/${tokenAddress}`);
      if (!response.ok) {
        return false;
      }
      const data = await response.json();
      
      // Check if array has any entries and if the first entry is approved
      return data.some((order: DexOrder) => 
        order.type === 'tokenProfile' && 
        order.status === 'approved' &&
        order.paymentTimestamp
      );
    } catch (error) {
      console.error('Error checking DEX paid status:', error);
      return false;
    }
  };

  const fetchLatestTokens = async () => {
    try {
      const response = await fetch('/api/latest-tokens');
      if (!response.ok) {
        throw new Error('Failed to fetch tokens');
      }
      const data = await response.json();
      
      // Check DEX paid status for each token
      const tokensWithDexStatus = await Promise.all(
        data.map(async (token: Token) => {
          const isDexPaid = await checkDexPaid(token.tokenAddress);
          return { ...token, isDexPaid };
        })
      );
      
      // Sort tokens: DEX paid first, then by creation date
      const sortedTokens = tokensWithDexStatus.sort((a, b) => {
        if (a.isDexPaid && !b.isDexPaid) return -1;
        if (!a.isDexPaid && b.isDexPaid) return 1;
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
      
      setLatestTokens(sortedTokens);
    } catch (error) {
      console.error('Error fetching tokens:', error);
    }
  };

  const fetchPublicBots = async () => {
    try {
      const response = await fetch('/api/public-bots');
      if (!response.ok) {
        throw new Error('Failed to fetch public bots');
      }
      const data = await response.json();
      setPublicBots(data);
    } catch (error) {
      console.error('Error fetching public bots:', error);
    }
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    fetchLatestTokens();
    fetchPublicBots();
    
    // Set up polling interval (every 30 seconds)
    const interval = setInterval(() => {
      fetchLatestTokens();
      fetchPublicBots();
    }, 30000);
    
    return () => clearInterval(interval);
  }, []);

  return (
    <main className="min-h-screen flex flex-col items-center p-4 bg-black text-white relative">
      <IntroModal 
        isOpen={showTutorials} 
        onClose={() => setShowTutorials(false)} 
      />
      {/* Fire background */}
      <div className="fixed inset-0 w-full h-full z-0">
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-50"
          style={{
            backgroundImage: "url('/fire.gif')",
            backgroundAttachment: 'fixed',
            zIndex: -1
          }}
        />
      </div>

      {/* Content with higher z-index */}
      <div className="w-full max-w-7xl relative z-10">
        <div className="text-center mb-8">
          <Logo />
          <div className="mt-4 flex justify-center gap-4">
            <Link 
              href="/main" 
              className="px-4 py-2 bg-white/10 rounded-lg hover:bg-white/20 transition-colors"
            >
              Launch App
            </Link>
            <button
              onClick={() => setShowTutorials(true)}
              className="px-4 py-2 bg-white/10 rounded-lg hover:bg-white/20 transition-colors"
            >
              View Tutorials
            </button>
          </div>
          
          {/* Slideshow */}
          <div className="mt-8 relative w-full max-w-xl mx-auto">
            <div className="overflow-hidden rounded-lg h-32">
              <div 
                className="flex transition-transform duration-1000 ease-in-out"
                style={{ transform: `translateX(-${currentSlide * 50}%)` }}
              >
                {slides.map((slide, index) => (
                  <div key={index} className="min-w-[50%] px-2">
                    <Link 
                      href={slide.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block transition-transform hover:scale-105"
                    >
                      <Image
                        src={slide.src}
                        alt={slide.alt}
                        width={300}
                        height={128}
                        className="h-32 w-full object-contain bg-black/20 rounded-lg"
                      />
                    </Link>
                  </div>
                ))}
              </div>
            </div>
            <button
              className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-black/50 p-2 rounded-full hover:bg-black/70 text-sm"
              onClick={prevSlide}
            >
              ←
            </button>
            <button
              className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-black/50 p-2 rounded-full hover:bg-black/70 text-sm"
              onClick={nextSlide}
            >
              →
            </button>
            {/* Slide indicators */}
            <div className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 flex gap-2">
              {slides.slice(0, slides.length - 1).map((_, index) => (
                <button
                  key={index}
                  className={`w-1.5 h-1.5 rounded-full transition-colors ${
                    currentSlide === index ? 'bg-white' : 'bg-white/50'
                  }`}
                  onClick={() => setCurrentSlide(index)}
                />
              ))}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Deployed Tokens Column */}
          <div>
            <h2 className="text-xl font-bold mb-4 text-center">Latest Deployed Tokens</h2>
            {latestTokens.length === 0 ? (
              <div className="text-center text-gray-400 py-12">
                <p>No tokens have been deployed yet.</p>
                <p className="mt-2">Be the first to create one!</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {latestTokens.map((token) => (
                  <Link
                    key={token.id}
                    href={`/token/${token.tokenAddress}`}
                    className="flex bg-black/50 backdrop-blur-sm rounded-lg p-4 hover:bg-black/60 transition-colors flex-col"
                  >
                    <div className="relative w-full aspect-square mb-2">
                      <Image
                        src={token.imageUrl}
                        alt={token.name}
                        fill
                        className="object-cover rounded-lg"
                      />
                    </div>
                    <h3 className="text-base font-bold mb-1">{token.name}</h3>
                    <div className="flex flex-col gap-1 mt-auto">
                      <div className="text-xs">
                        {token.isDexPaid ? (
                          <span className="text-green-400">DEX Paid ✓</span>
                        ) : (
                          <span className="text-gray-400">DEX Not Paid ✗</span>
                        )}
                      </div>
                      <div className="text-[10px] bg-white/10 px-2 py-1 rounded-full text-center">
                        View Token
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Public Bots Column */}
          <div>
            <h2 className="text-xl font-bold mb-4 text-center">Public AI Agents</h2>
            {publicBots.length === 0 ? (
              <div className="text-center text-gray-400 py-12">
                <p>No public agents available yet.</p>
                <p className="mt-2">Make your agent public to see it here!</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {publicBots.map((bot) => (
                  <Link
                    key={bot.id}
                    href={`/bot/${bot.id}`}
                    className="flex bg-black/50 backdrop-blur-sm rounded-lg p-4 hover:bg-black/60 transition-colors flex-col"
                  >
                    <div className="relative w-full aspect-square mb-2">
                      <Image
                        src={bot.imageUrl}
                        alt={bot.name}
                        fill
                        className="object-cover rounded-lg"
                      />
                    </div>
                    <h3 className="text-base font-bold mb-1">{bot.name}</h3>
                    <div className="mt-auto">
                      <div className="text-[10px] bg-white/10 px-2 py-1 rounded-full text-center">
                        Chat Now
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
