import React, { useState, useRef, useEffect } from "react";
import { useChat, Message } from "@/context/ChatContext";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Paperclip, RotateCcw, Mic, FileText, User, Bot } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

// Message type is now imported from ChatContext

const TypingIndicator = () => (
  <motion.div
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    className="flex items-center gap-2 p-4"
  >
    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary/20 to-primary/40 flex items-center justify-center">
      <Bot className="w-4 h-4 text-primary" />
    </div>
    <div className="flex items-center gap-1">
      <div className="typing-dot w-2 h-2 bg-primary/60 rounded-full"></div>
      <div className="typing-dot w-2 h-2 bg-primary/60 rounded-full"></div>
      <div className="typing-dot w-2 h-2 bg-primary/60 rounded-full"></div>
    </div>
    <span className="text-sm text-muted-foreground">MHA Assistant is typing...</span>
  </motion.div>
);

const Index = () => {
  const { messages, setMessages } = useChat();
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [showWelcome, setShowWelcome] = useState(messages.length === 0);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const welcomeMessage: Message = {
    id: "welcome",
    type: "assistant",
    content: "👋 Hello! I'm MHA Assistant, your friendly government helpdesk chatbot. Type your question below!",
    timestamp: new Date(),
  };

  useEffect(() => {
    // Auto-focus input
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    // Scroll to bottom when new messages arrive
    if (scrollAreaRef.current) {
      const scrollContainer = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
      }
    }
  }, [messages, isTyping]);

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      type: "user",
      content: inputValue,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue("");
    setIsTyping(true);
    setShowWelcome(false);

    // Simulate API call
    try {
      const response = await fetch('http://localhost:8000/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: inputValue }),
      });

      if (!response.ok) {
        // Fallback response for demo
        throw new Error('API not available');
      }

      const data = await response.json();
      console.log(data);
      // data.answer is the main response, data.chunks is the array of sources
      const assistantMessage: Message = {
        id: Date.now().toString() + "_assistant",
        type: "assistant",
        content: data.answer,
        timestamp: new Date(),
        sources: data.chunks?.map(chunk => ({
          title: chunk.source,
          page: chunk.page,
          confidence: chunk.score ? Number(chunk.score) : 1
        })) || [],
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      // Demo fallback response
      setTimeout(() => {
        const assistantMessage: Message = {
          id: Date.now().toString() + "_assistant",
          type: "assistant", 
          content: "Thank you for your question. I'm currently in demo mode. In a live environment, I would search through government documents and policies to provide you with accurate, source-backed information about your query.",
          timestamp: new Date(),
          sources: [
            { title: "Government Service Manual", page: 23, confidence: 0.92 },
            { title: "Citizen Charter Guidelines", page: 7, confidence: 0.87 },
          ],
        };
        setMessages(prev => [...prev, assistantMessage]);
        setIsTyping(false);
      }, 2000);
      return;
    }

    setIsTyping(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const regenerateResponse = (messageId: string) => {
    // Simulate regeneration
    setIsTyping(true);
    setTimeout(() => {
      setMessages(prev => prev.map(msg => 
        msg.id === messageId 
          ? { ...msg, content: "This is a regenerated response. " + msg.content }
          : msg
      ));
      setIsTyping(false);
    }, 1500);
  };

  return (
    <div className="flex h-[calc(100vh-4rem)] relative overflow-hidden">
      {/* Gradient Blur Background with Floating Icons */}
      <div className="absolute inset-0 -z-10 flex items-center justify-center">
        <div className="w-[90vw] h-[90vh] rounded-3xl bg-gradient-to-br from-[#e3f0ff] via-[#c3e7f9] to-[#f9e7c3] blur-2xl opacity-70"></div>
        {/* Floating site-related icons */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="absolute left-24 top-32 animate-float-slow">
            <Bot className="w-16 h-16 text-primary/30" />
          </div>
          <div className="absolute right-32 top-48 animate-float-medium">
            <FileText className="w-14 h-14 text-saffron/30" />
          </div>
          <div className="absolute left-1/2 bottom-24 animate-float-fast">
            <User className="w-12 h-12 text-indian-green/30" />
          </div>
          {/* Add more icons as desired */}
        </div>
      </div>
      <div className="flex-1 flex flex-col max-w-4xl mx-auto w-full">
        {/* Chat Header */}
        <motion.div
          className="glass border-b border-border/50 p-6"
          whileHover={{ scale: 1.01, boxShadow: "0 4px 32px rgba(0,0,0,0.08)" }}
          transition={{ type: "spring", stiffness: 300 }}>
          <div className="text-center">
            <h1 className="text-2xl font-bold gradient-text mb-2">MHA Assistant</h1>
            <p className="text-muted-foreground">Government Helpdesk Chatbot</p>
          </div>
        </motion.div>

        {/* Chat Messages */}
        <ScrollArea ref={scrollAreaRef} className="flex-1 px-6">
          <div className="py-6 space-y-6">
            {/* Welcome Message */}
            <AnimatePresence>
              {showWelcome && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                >
                  <div className="flex items-start gap-4">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary/20 to-primary/40 flex items-center justify-center">
                      <Bot className="w-4 h-4 text-primary" />
                    </div>
                    <div className="flex-1">
                      <Card className="chat-bubble-assistant max-w-2xl">
                        <CardContent className="p-4">
                          <p className="text-sm">{welcomeMessage.content}</p>
                        </CardContent>
                      </Card>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Chat Messages */}
            <AnimatePresence>
              {messages.map((message, index) => (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={cn(
                    "flex items-start gap-4",
                    message.type === "user" && "justify-end"
                  )}
                >
                  {message.type === "assistant" && (
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary/20 to-primary/40 flex items-center justify-center">
                      <Bot className="w-4 h-4 text-primary" />
                    </div>
                  )}

                  <div className={cn("flex-1", message.type === "user" && "flex justify-end")}> 
                    <Card className={cn(
                      "max-w-2xl",
                      message.type === "user" 
                        ? "chat-bubble-user" 
                        : "chat-bubble-assistant"
                    )}>
                      <CardContent className="p-4">
                        <p className={cn(
                          "text-sm",
                          message.type === "user" && "text-primary-foreground"
                        )}>
                          {message.content}
                        </p>

                        {/* Sources Section */}
                        {message.type === "assistant" && message.sources && (
                          <Collapsible className="mt-4">
                            <CollapsibleTrigger asChild>
                              <Button variant="ghost" size="sm" className="h-auto p-0 text-xs text-muted-foreground hover:text-foreground">
                                <FileText className="w-3 h-3 mr-1" />
                                View Sources ({message.sources.length})
                              </Button>
                            </CollapsibleTrigger>
                            <CollapsibleContent className="mt-2">
                              <Separator className="mb-3" />
                              <div className="space-y-2">
                                {message.sources.map((source, idx) => (
                                  <div key={idx} className="flex items-center justify-between text-xs">
                                    <span className="font-medium">{source.title}</span>
                                    <div className="flex items-center gap-2">
                                      {source.page && (
                                        <span className="text-muted-foreground">p.{source.page}</span>
                                      )}
                                      <Badge variant="secondary" className="text-xs">
                                        {Math.round(source.confidence * 100)}%
                                      </Badge>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </CollapsibleContent>
                          </Collapsible>
                        )}

                        {/* Message Actions */}
                        {message.type === "assistant" && (
                          <div className="flex items-center gap-2 mt-3">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-auto p-1 text-xs"
                              onClick={() => regenerateResponse(message.id)}
                            >
                              <RotateCcw className="w-3 h-3 mr-1" />
                              Regenerate
                            </Button>
                            <span className="text-xs text-muted-foreground">
                              {message.timestamp.toLocaleTimeString()}
                            </span>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </div>

                  {message.type === "user" && (
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-saffron/20 to-saffron/40 flex items-center justify-center">
                      <User className="w-4 h-4 text-saffron" />
                    </div>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>

            {/* Typing Indicator */}
            <AnimatePresence>
              {isTyping && <TypingIndicator />}
            </AnimatePresence>
          </div>
        </ScrollArea>

        {/* Input Area */}
        <div className="glass border-t border-border/50 p-6">
          <div className="flex items-end gap-3 max-w-4xl mx-auto">
            <div className="flex-1 relative">
              <Input
                ref={inputRef}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask me anything about government services..."
                className="input-premium pr-24 min-h-[48px] text-base resize-none"
                disabled={isTyping}
              />
              <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 hover:bg-primary/10"
                  disabled={isTyping}
                >
                  <Paperclip className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 hover:bg-primary/10"
                  disabled={isTyping}
                >
                  <Mic className="w-4 h-4" />
                </Button>
              </div>
            </div>
            <Button
              onClick={handleSendMessage}
              disabled={!inputValue.trim() || isTyping}
              className="h-12 px-6 bg-gradient-to-r from-primary to-primary-glow hover:shadow-lg transition-all duration-200"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
          <p className="text-xs text-muted-foreground text-center mt-3">
            MHA Assistant can make mistakes. Please verify important information.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Index;