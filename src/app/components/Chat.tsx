'use client';

import { useState, useEffect, useRef } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { checkTokenBalance } from '../utils/tokenCheck';

interface Persona {
  id?: string;
  name: string;
  personality: string;
  background: string;
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
  createdAt?: string;
}

interface ChatProps {
  persona: Persona;
}

const UNCENSORED_STORAGE_KEY = 'uncensored_bots';

export default function Chat({ persona }: ChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isUncensored, setIsUncensored] = useState(false);
  const [mode, setMode] = useState<'natural' | 'uncensored' | 'deepseek'>('natural');
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const [hasEnoughTokens, setHasEnoughTokens] = useState(false);
  const wallet = useWallet();

  // Load uncensored state from localStorage
  useEffect(() => {
    if (typeof window !== 'undefined' && persona.id) {
      const uncensoredBots = JSON.parse(localStorage.getItem(UNCENSORED_STORAGE_KEY) || '{}');
      setIsUncensored(uncensoredBots[persona.id] || false);
    }
  }, [persona.id]);

  // Save uncensored state to localStorage
  useEffect(() => {
    if (typeof window !== 'undefined' && persona.id) {
      const uncensoredBots = JSON.parse(localStorage.getItem(UNCENSORED_STORAGE_KEY) || '{}');
      uncensoredBots[persona.id] = isUncensored;
      localStorage.setItem(UNCENSORED_STORAGE_KEY, JSON.stringify(uncensoredBots));
    }
  }, [isUncensored, persona.id]);

  // Load previous messages
  useEffect(() => {
    const loadMessages = async () => {
      if (!persona.id) return;
      
      try {
        const response = await fetch(`/api/messages?botId=${persona.id}`);
        if (!response.ok) throw new Error('Failed to fetch messages');
        
        const data = await response.json();
        setMessages(data.messages);
      } catch (error) {
        console.error('Error loading messages:', error);
      }
    };

    loadMessages();
  }, [persona.id]);

  useEffect(() => {
    const scrollToBottom = () => {
      if (chatContainerRef.current) {
        const lastMessage = chatContainerRef.current.querySelector('[data-message]:last-of-type');
        if (lastMessage) {
          setTimeout(() => {
            lastMessage.scrollIntoView({ 
              behavior: 'smooth',
              block: 'end'
            });
          }, 100);
        }
      }
    };

    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    const checkBalance = async () => {
      if (wallet.publicKey) {
        const hasBalance = await checkTokenBalance(wallet.publicKey);
        setHasEnoughTokens(hasBalance);
        if (!hasBalance && isUncensored) {
          setIsUncensored(false);
        }
      } else {
        setHasEnoughTokens(false);
        if (isUncensored) {
          setIsUncensored(false);
        }
      }
    };
    
    checkBalance();
  }, [wallet.publicKey, isUncensored]);

  const storeMessage = async (message: Message) => {
    if (!persona.id) return;

    try {
      await fetch('/api/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          botId: persona.id,
          role: message.role,
          content: message.content,
        }),
      });
    } catch (error) {
      console.error('Error storing message:', error);
    }
  };

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = { role: 'user' as const, content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      // Store user message
      await storeMessage(userMessage);

      let endpoint = '/api/chat';
      if (mode === 'uncensored') {
        endpoint = '/api/uncensored-chat';
      } else if (mode === 'deepseek') {
        endpoint = '/api/deepseek';
      }

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [...messages, userMessage],
          persona: persona,
          systemPrompt: `You are ${persona.name}. ${persona.personality} ${persona.background}`
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      if (!data.response) {
        throw new Error('Invalid response format from server');
      }

      const assistantMessage = { role: 'assistant' as const, content: data.response };
      
      // Store assistant message
      await storeMessage(assistantMessage);

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Error:', error);
      let errorMessage = 'Sorry, I encountered an error. Please try again.';
      
      if (error instanceof Error) {
        const errorText = error.message.toLowerCase();
        if (errorText.includes('429')) {
          errorMessage = 'Too many requests. Please wait a moment before trying again.';
        } else if (errorText.includes('api key')) {
          errorMessage = mode === 'uncensored' 
            ? 'The uncensored chat service is currently unavailable. Please try switching to natural mode.'
            : mode === 'deepseek'
              ? 'The DeepSeek service is currently unavailable. Please try another mode.'
              : 'The chat service is currently unavailable. Please try again later.';
        } else if (errorText.includes('invalid response format')) {
          errorMessage = 'Received an invalid response. Please try again.';
        } else if (errorText.includes('500')) {
          errorMessage = mode === 'uncensored'
            ? 'The uncensored chat service encountered an error. Please try switching to natural mode.'
            : mode === 'deepseek'
              ? 'The DeepSeek service encountered an error. Please try another mode.'
              : 'The chat service encountered an error. Please try again later.';
        }
      }
      
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: errorMessage
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col text-xs h-full rounded-xl p-6 shadow-lg border border-white chat-container" ref={chatContainerRef}>
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center space-x-2">
          <span className="text-white">Mode:</span>
          <select
            value={mode}
            onChange={(e) => {
              const newMode = e.target.value as 'natural' | 'uncensored' | 'deepseek';
              if (newMode === 'uncensored' && !hasEnoughTokens) {
                alert('You need at least 20,000 DRU tokens to use uncensored mode');
                return;
              }
              setMode(newMode);
            }}
            className={`px-3 py-1 rounded-xl transition-colors duration-200 text-xs
              ${mode === 'uncensored' 
                ? 'bg-red-500 text-white' 
                : mode === 'deepseek'
                  ? 'bg-blue-500 text-white'
                  : 'bg-green-500 text-white'
              }`}
          >
            <option value="natural">Natural</option>
            <option value="deepseek">DeepSeek</option>
            <option value="uncensored" disabled={!hasEnoughTokens}>Uncensored</option>
          </select>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto space-y-4 pr-2 scrollbar-thin scrollbar-thumb-white">
        {messages.map((message, index) => (
          <div
            key={index}
            data-message
            className={`p-4 rounded-xl ${
              message.role === 'user'
                ? 'bg-white text-black ml-auto'
                : 'bg-black text-white'
            } max-w-[80%] shadow-sm border border-white`}
          >
            <p className="leading-relaxed whitespace-pre-wrap">
              {message.content}
            </p>
          </div>
        ))}
        {isLoading && (
          <div className="p-4 rounded-xl bg-black text-white max-w-[80%] shadow-sm border border-white animate-pulse">
            Thinking...
          </div>
        )}
      </div>
      <div className="h-[60px] flex gap-3 pt-3 border-t border-white">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && !isLoading && sendMessage()}
          className="w-3/4 p-1 rounded-xl bg-black border border-white
            focus:outline-none focus:ring-2 focus:ring-white
            text-white placeholder-white/60 text-base md:text-xs chat-input no-select"
          placeholder="Type your message..."
          style={{ fontSize: '16px' }}
          disabled={isLoading}
        />
        <button
          onClick={sendMessage}
          disabled={isLoading}
          className="w-1/4 px-4 py-1 bg-white text-black rounded-xl 
            hover:bg-white/90 transition-colors duration-200 font-medium text-xs
            disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? 'Sending...' : 'Send'}
        </button>
      </div>
    </div>
  );
}