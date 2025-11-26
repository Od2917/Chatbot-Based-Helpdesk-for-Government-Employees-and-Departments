import React, { useState } from 'react';
import { useChat } from '@/context/ChatContext';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Save, 
  FolderOpen, 
  Trash2, 
  MessageSquare, 
  Calendar, 
  Search,
  Plus,
  X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter
} from '@/components/ui/dialog';
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger
} from '@/components/ui/alert-dialog';

interface SavedChatsPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

const SavedChatsPanel: React.FC<SavedChatsPanelProps> = ({ isOpen, onClose }) => {
  const { 
    savedChats, 
    loadChat, 
    deleteChat, 
    saveCurrentChat, 
    clearCurrentChat, 
    messages,
    currentChatId 
  } = useChat();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [customTitle, setCustomTitle] = useState('');

  const filteredChats = savedChats.filter(chat =>
    chat.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSaveChat = () => {
    saveCurrentChat(customTitle || undefined);
    setCustomTitle('');
    setSaveDialogOpen(false);
  };

  const handleLoadChat = (chatId: string) => {
    loadChat(chatId);
    onClose();
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, x: 300 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 300 }}
          className="fixed right-0 top-0 h-full w-80 bg-white/95 dark:bg-gray-900/95 backdrop-blur-lg border-l border-border shadow-2xl z-50"
        >
          {/* Header */}
          <div className="p-4 border-b border-border flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FolderOpen className="w-5 h-5 text-primary" />
              <h2 className="text-lg font-semibold">Saved Chats</h2>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>

          {/* Action Buttons */}
          <div className="p-4 space-y-3 border-b border-border">
            {/* Save Current Chat */}
            <Dialog open={saveDialogOpen} onOpenChange={setSaveDialogOpen}>
              <DialogTrigger asChild>
                <Button
                  className="w-full justify-start gap-2"
                  disabled={messages.length === 0}
                >
                  <Save className="w-4 h-4" />
                  {currentChatId ? 'Update Chat' : 'Save Current Chat'}
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Save Chat</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <Input
                    placeholder="Enter chat title (optional)"
                    value={customTitle}
                    onChange={(e) => setCustomTitle(e.target.value)}
                  />
                  <p className="text-sm text-muted-foreground">
                    Leave empty to auto-generate title from first message
                  </p>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setSaveDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleSaveChat}>
                    Save Chat
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            {/* New Chat */}
            <Button
              variant="outline"
              className="w-full justify-start gap-2"
              onClick={() => {
                clearCurrentChat();
                onClose();
              }}
            >
              <Plus className="w-4 h-4" />
              New Chat
            </Button>

            {/* Search */}
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search chats..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>

          {/* Saved Chats List */}
          <ScrollArea className="flex-1 p-4">
            <div className="space-y-3">
              {filteredChats.length === 0 ? (
                <div className="text-center py-8">
                  <MessageSquare className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                  <p className="text-muted-foreground">
                    {savedChats.length === 0 ? 'No saved chats yet' : 'No chats match your search'}
                  </p>
                </div>
              ) : (
                filteredChats.map((chat) => (
                  <Card
                    key={chat.id}
                    className={`cursor-pointer transition-all hover:shadow-md ${
                      currentChatId === chat.id ? 'ring-2 ring-primary bg-primary/5' : ''
                    }`}
                    onClick={() => handleLoadChat(chat.id)}
                  >
                    <CardContent className="p-3">
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="font-medium text-sm truncate flex-1 pr-2">
                          {chat.title}
                        </h3>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0 hover:bg-red-100 hover:text-red-600"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Chat</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete "{chat.title}"? This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => deleteChat(chat.id)}
                                className="bg-red-600 hover:bg-red-700"
                              >
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                      
                      <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                        <Calendar className="w-3 h-3" />
                        {formatDate(chat.lastModified)}
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <Badge variant="secondary" className="text-xs">
                          {chat.messages.length} messages
                        </Badge>
                        {currentChatId === chat.id && (
                          <Badge className="text-xs bg-primary">
                            Current
                          </Badge>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </ScrollArea>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default SavedChatsPanel;
