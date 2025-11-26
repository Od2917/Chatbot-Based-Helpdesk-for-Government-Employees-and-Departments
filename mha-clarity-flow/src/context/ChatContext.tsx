import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export interface Message {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  sources?: Array<{
    title: string;
    page?: number;
    confidence: number;
  }>;
}

export interface SavedChat {
  id: string;
  title: string;
  messages: Message[];
  createdAt: Date;
  lastModified: Date;
}

interface ChatContextType {
  messages: Message[];
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
  savedChats: SavedChat[];
  saveCurrentChat: (title?: string) => void;
  loadChat: (chatId: string) => void;
  deleteChat: (chatId: string) => void;
  clearCurrentChat: () => void;
  currentChatId: string | null;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export const ChatProvider = ({ children }: { children: ReactNode }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [savedChats, setSavedChats] = useState<SavedChat[]>([]);
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);

  // Load saved chats from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('mha-saved-chats');
    if (saved) {
      try {
        const parsedChats = JSON.parse(saved).map((chat: any) => ({
          ...chat,
          createdAt: new Date(chat.createdAt),
          lastModified: new Date(chat.lastModified),
          messages: chat.messages.map((msg: any) => ({
            ...msg,
            timestamp: new Date(msg.timestamp)
          }))
        }));
        setSavedChats(parsedChats);
      } catch (error) {
        console.error('Error loading saved chats:', error);
      }
    }
  }, []);

  // Save to localStorage whenever savedChats changes
  useEffect(() => {
    localStorage.setItem('mha-saved-chats', JSON.stringify(savedChats));
  }, [savedChats]);

  const generateChatTitle = (messages: Message[]): string => {
    if (messages.length === 0) return "New Chat";
    
    const firstUserMessage = messages.find(msg => msg.type === 'user');
    if (firstUserMessage) {
      return firstUserMessage.content.slice(0, 50) + (firstUserMessage.content.length > 50 ? '...' : '');
    }
    
    return "Untitled Chat";
  };

  const saveCurrentChat = (title?: string) => {
    if (messages.length === 0) return;

    const chatTitle = title || generateChatTitle(messages);
    const now = new Date();
    
    if (currentChatId) {
      // Update existing chat
      setSavedChats(prev => prev.map(chat => 
        chat.id === currentChatId 
          ? { ...chat, title: chatTitle, messages: [...messages], lastModified: now }
          : chat
      ));
    } else {
      // Create new saved chat
      const newChatId = Date.now().toString();
      const newChat: SavedChat = {
        id: newChatId,
        title: chatTitle,
        messages: [...messages],
        createdAt: now,
        lastModified: now
      };
      
      setSavedChats(prev => [newChat, ...prev]);
      setCurrentChatId(newChatId);
    }
  };

  const loadChat = (chatId: string) => {
    const chat = savedChats.find(c => c.id === chatId);
    if (chat) {
      setMessages(chat.messages);
      setCurrentChatId(chatId);
    }
  };

  const deleteChat = (chatId: string) => {
    setSavedChats(prev => prev.filter(chat => chat.id !== chatId));
    if (currentChatId === chatId) {
      setCurrentChatId(null);
    }
  };

  const clearCurrentChat = () => {
    setMessages([]);
    setCurrentChatId(null);
  };

  return (
    <ChatContext.Provider value={{
      messages,
      setMessages,
      savedChats,
      saveCurrentChat,
      loadChat,
      deleteChat,
      clearCurrentChat,
      currentChatId
    }}>
      {children}
    </ChatContext.Provider>
  );
};

export const useChat = () => {
  const context = useContext(ChatContext);
  if (context === undefined) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
};
