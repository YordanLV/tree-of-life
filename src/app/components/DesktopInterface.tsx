import { useState, useEffect } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import Chat from './Chat';
import * as Tooltip from '@radix-ui/react-tooltip';
import { PiPillDuotone } from 'react-icons/pi';
import LoadingDots from './LoadingDots';
import { useWallet } from '@solana/wallet-adapter-react';
import { Connection, PublicKey, Transaction, SystemProgram, LAMPORTS_PER_SOL } from '@solana/web3.js';

interface Bot {
  id: string;
  name: string;
  imageUrl: string;
  personality: string;
  background: string;
}

interface DesktopInterfaceProps {
  bots: Bot[];
  onBotClick: (bot: Bot) => void;
  onBotDelete: (botId: string) => void;
  isLoading: boolean;
  onUploadClick: () => void;
  setBots: (bots: Bot[]) => void;
  isCreating?: boolean;
}

// Comment out or remove this constant
// const REQUIRED_TOKEN_AMOUNT = 50000;
// const DRUID_TOKEN_ADDRESS = new PublicKey('MLoYxeB1Xm4BZyuWLaM3K69LvMSm4TSPXWedF9Epump');

// New component for static desktop icons
const StaticDesktopIcon = ({ 
  src, 
  alt, 
  href, 
  onClick 
}: { 
  src: string; 
  alt: string; 
  href: string; 
  onClick?: () => void 
}) => (
  <motion.div 
    className="flex flex-col items-center relative group" 
    whileHover={{ scale: 1.05 }}
    onClick={onClick || (() => window.open(href, '_blank'))}
  >
    <div className="w-16 h-16 relative rounded-lg overflow-hidden cursor-pointer">
      <Image 
        src={src} 
        alt={alt} 
        fill 
        className="object-cover transition-all duration-200" 
      />
    </div>
    <span className="mt-2 text-xs text-white text-center max-w-full truncate">
      {alt}
    </span>
  </motion.div>
);

// New component for the deployment modal
const DeploymentModal = ({ 
  isOpen, 
  tokenAddress, 
  landingPageUrl, 
  onClose 
}: { 
  isOpen: boolean; 
  tokenAddress?: string; 
  landingPageUrl?: string; 
  onClose: () => void;
}) => (
  <AnimatePresence>
    {isOpen && (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999] pointer-events-auto"
      >
        <motion.div
          initial={{ scale: 0.95 }}
          animate={{ scale: 1 }}
          exit={{ scale: 0.95 }}
          className="bg-gray-900 rounded-lg p-6 max-w-md w-full mx-4"
        >
          <h3 className="text-xl font-semibold mb-4 text-white">Token Deployed Successfully! 🎉</h3>
          <div className="space-y-4">
            <div>
              <p className="text-gray-400 text-sm mb-1">Token Address:</p>
              <p className="text-white bg-gray-800 p-2 rounded text-sm font-mono break-all">
                {tokenAddress}
              </p>
            </div>
            <div className="flex flex-col gap-3">
              <p className="text-gray-500 text-sm italic">
                Token creation may take up to 2 minutes to appear in pump.fun
              </p>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => window.open(`${window.location.origin}${landingPageUrl}`, '_blank')}
                  className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                >
                  View Landing Page
                </button>
                <button
                  onClick={onClose}
                  className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    )}
  </AnimatePresence>
);

// New component for the edit modal
const EditBotModal = ({ 
  isOpen, 
  bot, 
  onClose, 
  onSubmit 
}: { 
  isOpen: boolean; 
  bot?: Bot; 
  onClose: () => void;
  onSubmit: (bot: Bot) => void;
}) => (
  <AnimatePresence>
    {isOpen && bot && (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999] pointer-events-auto"
      >
        <motion.div
          initial={{ scale: 0.95 }}
          animate={{ scale: 1 }}
          exit={{ scale: 0.95 }}
          className="bg-gray-900 rounded-lg p-6 max-w-md w-full mx-4"
        >
          <h3 className="text-xl font-semibold mb-4 text-white">Edit Bot Settings</h3>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              const updatedBot = {
                ...bot!,
                name: formData.get('name') as string,
                personality: formData.get('personality') as string,
                background: formData.get('background') as string,
              };
              onSubmit(updatedBot);
            }}
            className="space-y-4"
          >
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">Name</label>
              <input
                name="name"
                defaultValue={bot.name}
                className="w-full bg-gray-800 rounded p-2 text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">Personality</label>
              <textarea
                name="personality"
                defaultValue={bot.personality}
                className="w-full bg-gray-800 rounded p-2 text-white h-24"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">Background</label>
              <textarea
                name="background"
                defaultValue={bot.background}
                className="w-full bg-gray-800 rounded p-2 text-white h-24"
              />
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
              >
                Save Changes
              </button>
            </div>
          </form>
        </motion.div>
      </motion.div>
    )}
  </AnimatePresence>
);

export default function DesktopInterface({ 
  bots, 
  onBotDelete, 
  isLoading, 
  onUploadClick,
  setBots,
  isCreating = false
}: DesktopInterfaceProps) {
  const [selectedBot, setSelectedBot] = useState<Bot | null>(null);
  const [windows, setWindows] = useState<Bot[]>([]);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [deletingBotId, setDeletingBotId] = useState<string | null>(null);
  const [deploymentModal, setDeploymentModal] = useState<{
    isOpen: boolean;
    tokenAddress?: string;
    landingPageUrl?: string;
  }>({ isOpen: false });
  const [isDeploying, setIsDeploying] = useState<string | null>(null);
  const [editModal, setEditModal] = useState<{
    isOpen: boolean;
    bot?: Bot;
  }>({ isOpen: false });

  const wallet = useWallet();
  const PAYMENT_AMOUNT = 0.03 * LAMPORTS_PER_SOL; // 0.01 SOL in lamports
  const TREASURY_ADDRESS = new PublicKey('DruiDHCxP8pAVkST7pxBZokL9UkXj5393K5as3Kj9hi1'); // Replace with your treasury wallet

  const handleDeploy = async (bot: Bot) => {
    if (!wallet || !wallet.signTransaction) {
      alert('Wallet not properly connected');
      return;
    }

    if (!wallet.publicKey) {
      alert('Wallet not found');
      return;
    }

    let txSignature: string | null = null;

    try {
      setIsDeploying(bot.id);
      
      // Create connection
      const connection = new Connection(
        "https://aged-capable-uranium.solana-mainnet.quiknode.pro/27f8770e7a18869a2edf701c418b572d5214da01/",
        {
          commitment: 'confirmed',
          confirmTransactionInitialTimeout: 120000, // 120 seconds
          wsEndpoint: "wss://aged-capable-uranium.solana-mainnet.quiknode.pro/27f8770e7a18869a2edf701c418b572d5214da01/"
        }
      );

      // Get latest blockhash
      const { blockhash } = await connection.getLatestBlockhash();
      const transaction = new Transaction().add(
        SystemProgram.transfer({
          fromPubkey: wallet.publicKey,
          toPubkey: TREASURY_ADDRESS,
          lamports: PAYMENT_AMOUNT,
        })
      );
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = wallet.publicKey;

      // Request signature from user
      const signed = await wallet.signTransaction(transaction);
      
      // Send transaction and store signature
      txSignature = await connection.sendRawTransaction(signed.serialize(), {
        skipPreflight: false,
        preflightCommitment: 'confirmed',
        maxRetries: 3
      });

      // Wait for confirmation with more detailed options
      await connection.confirmTransaction({
        signature: txSignature,
        blockhash: blockhash,
        lastValidBlockHeight: (await connection.getLatestBlockhash()).lastValidBlockHeight
      }, 'confirmed');

      // Continue with token deployment
      const clientToken = localStorage.getItem('clientToken') || '';
      const response = await fetch('/api/deploy-portal-token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ bot, clientToken }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to deploy token');
      }

      const data = await response.json();
      if (data.success) {
        setDeploymentModal({
          isOpen: true,
          tokenAddress: data.tokenAddress,
          landingPageUrl: data.landingPageUrl,
        });
      } else {
        throw new Error(data.error || 'Failed to deploy token');
      }
    } catch (error) {
      console.error('Error:', error);
      
      // Show a more user-friendly message for timeout errors
      if (error instanceof Error && error.message?.includes('TransactionExpiredTimeoutError')) {
        alert('Transaction is taking longer than expected. Please check your wallet or try again with a better connection.');
      } else {
        // If we have a transaction signature and deployment failed, attempt refund
        if (txSignature) {
          try {
            const connection = new Connection(
              "https://aged-capable-uranium.solana-mainnet.quiknode.pro/27f8770e7a18869a2edf701c418b572d5214da01/"
            );
            
            // Create refund transaction
            const { blockhash } = await connection.getLatestBlockhash();
            const refundTx = new Transaction().add(
              SystemProgram.transfer({
                fromPubkey: TREASURY_ADDRESS,
                toPubkey: wallet.publicKey,
                lamports: PAYMENT_AMOUNT,
              })
            );
            refundTx.recentBlockhash = blockhash;
            refundTx.feePayer = TREASURY_ADDRESS;

            // Send refund transaction
            const refundSignature = await connection.sendTransaction(refundTx, []);
            await connection.confirmTransaction(refundSignature);
            
            alert('Token deployment failed. Your payment has been refunded.');
          } catch (refundError) {
            console.error('Refund failed:', refundError);
            alert('Token deployment failed. Please contact support for a refund.');
          }
        } else {
          alert('Failed to deploy token. Please try again.');
        }
      }
    } finally {
      setIsDeploying(null);
    }
  };

  const openWindow = (bot: Bot) => {
    if (!windows.find(w => w.id === bot.id)) {
      setWindows([...windows, bot]);
    }
    setSelectedBot(bot);
  };

  const closeWindow = (botId: string) => {
    setWindows(windows.filter(w => w.id !== botId));
    if (selectedBot?.id === botId) {
      setSelectedBot(null);
    }
  };

  const handleDelete = async (botId: string) => {
    setDeletingBotId(botId);
    try {
      const response = await fetch(`/api/bots/${botId}`, {
        method: 'DELETE',
      });
      
      if (response.ok) {
        closeWindow(botId);
        onBotDelete(botId);
      }
    } catch (error) {
      console.error('Error deleting bot:', error);
    }
    setShowDeleteConfirm(null);
    setDeletingBotId(null);
  };

  const handleBotUpdate = async (updatedBot: Bot) => {
    try {
      const response = await fetch(`/api/bots/${updatedBot.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedBot),
      });

      if (!response.ok) {
        throw new Error('Failed to update bot');
      }

      // Update local state
      setBots(bots.map(bot => bot.id === updatedBot.id ? updatedBot : bot));
      
      // Update windows state to reflect changes immediately
      setWindows(windows.map(window => 
        window.id === updatedBot.id ? updatedBot : window
      ));
      
      // Update selected bot if it's the one being edited
      if (selectedBot?.id === updatedBot.id) {
        setSelectedBot(updatedBot);
      }
      
      setEditModal({ isOpen: false });
    } catch (error) {
      console.error('Error updating bot:', error);
      alert('Failed to update bot settings');
    }
  };

  const getDeployTooltipContent = () => {
    if (isDeploying) return 'Deploying...';
    if (!wallet.publicKey) return 'Connect wallet first';
    // Remove token requirement message
    return 'Deploy On Pump.Fun (0.01 SOL)';
  };

  return (
    <div className="fixed inset-0 w-screen h-screen pointer-events-none flex items-center justify-center">
      <div className="fixed left-4 top-4 grid auto-cols-[96px] gap-6 pointer-events-auto
                    grid-flow-col grid-rows-[repeat(auto-fill,96px)] max-h-[calc(100vh-2rem)] max-w-[calc(100vw-2rem)]">
        {/* Static icons using new component */}
        <StaticDesktopIcon 
          src="/twitter.png" 
          alt="Twitter" 
          href="https://x.com/DruidAi_APP" 
        />
        <StaticDesktopIcon 
          src="/dex.png" 
          alt="Dex" 
          href="https://dexscreener.com/solana/MLoYxeB1Xm4BZyuWLaM3K69LvMSm4TSPXWedF9Epump" 
        />
        <StaticDesktopIcon 
          src="/doc.png" 
          alt="Docs" 
          href="https://druid-ai-docs.gitbook.io/start" 
        />

        {/* Create icon with original structure */}
        <motion.div
          className="flex flex-col items-center relative group"
          whileHover={{ scale: 1.05 }}
          onClick={onUploadClick}
        >
          <div className="w-16 h-16 relative rounded-lg overflow-hidden cursor-pointer bg-white/30">
            <div className="absolute inset-0 flex items-center justify-center text-2xl text-white">
              +
            </div>
          </div>
          <span className="mt-2 text-xs text-white text-center max-w-full truncate">
            Create
          </span>
        </motion.div>

        {/* Existing bot icons */}
        {isLoading ? (
          <motion.div
            className="flex flex-col items-center relative group"
            whileHover={{ scale: 1.05 }}
          >
            <div className="w-16 h-16 relative rounded-lg overflow-hidden cursor-pointer bg-white/50 flex items-center justify-center">
              <Image 
                src="/loading.gif" 
                alt="Loading" 
                fill 
                className="object-cover"
              />
            </div>
            <span className="mt-2 text-xs text-white text-center max-w-full truncate">
              Loading
            </span>
          </motion.div>
        ) : ( 
          [...bots].reverse().map((bot) => (
            <div key={bot.id} className="relative">
              <motion.div
                className="flex flex-col items-center relative group"
                whileHover={{ scale: 1.05 }}
              >
                <div 
                  className="w-16 h-16 relative rounded-lg overflow-hidden cursor-pointer"
                  onClick={() => openWindow(bot)}
                >
                  {bot.imageUrl ? (
                    <Image 
                      src={bot.imageUrl} 
                      alt={bot.name} 
                      fill 
                      className="object-cover transition-all duration-200" 
                    />
                  ) : (
                    <div className="w-full h-full bg-white/10">
                      <Image 
                        src="/loading.gif" 
                        alt="Loading" 
                        fill 
                        className="object-contain p-2" 
                      />
                    </div>
                  )}
                  {deletingBotId === bot.id && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                      <LoadingDots size="sm" />
                    </div>
                  )}
                </div>
                <span className="mt-2 text-xs text-white text-center max-w-full truncate">
                  {bot.name}
                </span>
                
                {/* Delete button */}
                <button
                  onClick={() => setShowDeleteConfirm(bot.id)}
                  className="absolute -right-2 -top-2 w-6 h-6 bg-red-500 rounded-full text-white 
                             opacity-0 group-hover:opacity-100 transition-opacity duration-200
                             flex items-center justify-center text-xs"
                >
                  ×
                </button>
              </motion.div>

              {/* Delete confirmation modal - now a sibling */}
              {showDeleteConfirm === bot.id && (
                <div className="absolute left-full ml-2 top-0 w-48 bg-black/90 p-3 rounded-lg z-50">
                  <p className="text-xs text-white mb-2">Delete {bot.name}?</p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleDelete(bot.id)}
                      className="px-2 py-1 bg-red-500 text-white text-xs rounded"
                    >
                      Delete
                    </button>
                    <button
                      onClick={() => setShowDeleteConfirm(null)}
                      className="px-2 py-1 bg-gray-500 text-white text-xs rounded"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))
        )}

        {isCreating && (
          <motion.div
            key="creating"
            className="flex flex-col items-center relative group"
            whileHover={{ scale: 1.05 }}
          >
            <div className="w-16 h-16 relative rounded-lg overflow-hidden cursor-pointer bg-white/10 flex items-center justify-center">
              <Image 
                src="/loading.gif" 
                alt="Creating" 
                fill 
                className="object-cover"
              />
            </div>
            <span className="mt-2 text-xs text-white text-center max-w-full truncate">
              Creating...
            </span>
          </motion.div>
        )}
      </div>

      {/* Windows */}
      <AnimatePresence>
        {windows.map((bot) => (
          <motion.div
            key={bot.id}
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            className="pointer-events-auto bg-black/80 backdrop-blur-sm rounded-lg overflow-hidden
                     w-[400px] h-[500px]"
          >
            <div className="flex items-center justify-between p-2 bg-white/10">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 relative">
                  <Image
                    src={bot.imageUrl}
                    alt={bot.name}
                    fill
                    className="object-cover rounded grayscale hover:grayscale-0 transition-all duration-200"
                  />
                </div>
                <span className="text-sm">{bot.name}</span>
              </div>
              <div className="flex items-center gap-2">
                <Tooltip.Provider>
                  <Tooltip.Root>
                    <Tooltip.Trigger asChild>
                      <button
                        onClick={() => setEditModal({ isOpen: true, bot })}
                        className="p-1.5 bg-gradient-to-r from-gray-500 to-gray-600 
                                 text-white rounded-full hover:opacity-90 transition-opacity"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="20"
                          height="20"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                        </svg>
                      </button>
                    </Tooltip.Trigger>
                    <Tooltip.Portal>
                      <Tooltip.Content
                        className="bg-black/90 text-white text-xs py-1 px-2 rounded"
                        sideOffset={5}
                      >
                        Edit Bot Settings
                        <Tooltip.Arrow className="fill-black/90" />
                      </Tooltip.Content>
                    </Tooltip.Portal>
                  </Tooltip.Root>
                </Tooltip.Provider>
                <Tooltip.Provider>
                  <Tooltip.Root>
                    <Tooltip.Trigger asChild>
                      <button
                        onClick={() => handleDeploy(bot)}
                        className="p-1.5 bg-gradient-to-r from-gray-500 to-gray-600 
                                 text-white rounded-full hover:opacity-90 transition-opacity 
                                 disabled:opacity-50 disabled:cursor-not-allowed"
                        disabled={isDeploying === bot.id || !wallet.publicKey}
                      >
                        {isDeploying === bot.id ? (
                          <div className="w-5 h-5 flex items-center justify-center">
                            <LoadingDots size="sm" />
                          </div>
                        ) : (
                          <PiPillDuotone className="w-5 h-5" />
                        )}
                      </button>
                    </Tooltip.Trigger>
                    <Tooltip.Portal>
                      <Tooltip.Content
                        className="bg-black/90 text-white text-xs py-1 px-2 rounded"
                        sideOffset={5}
                      >
                        {getDeployTooltipContent()}
                        <Tooltip.Arrow className="fill-black/90" />
                      </Tooltip.Content>
                    </Tooltip.Portal>
                  </Tooltip.Root>
                </Tooltip.Provider>
                <button
                  onClick={() => closeWindow(bot.id)}
                  className="text-white hover:text-red-500"
                >
                  ✕
                </button>
              </div>
            </div>
            <div className="p-4 h-[calc(100%-48px)] overflow-y-auto">
              <Chat persona={bot} />
            </div>
          </motion.div>
        ))}
      </AnimatePresence>

      <DeploymentModal 
        isOpen={deploymentModal.isOpen}
        tokenAddress={deploymentModal.tokenAddress}
        landingPageUrl={deploymentModal.landingPageUrl}
        onClose={() => setDeploymentModal({ isOpen: false })}
      />

      <EditBotModal 
        isOpen={editModal.isOpen}
        bot={editModal.bot}
        onClose={() => setEditModal({ isOpen: false })}
        onSubmit={handleBotUpdate}
      />
    </div>
  );
} 