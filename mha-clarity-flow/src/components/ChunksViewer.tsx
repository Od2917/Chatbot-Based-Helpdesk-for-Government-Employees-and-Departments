import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search, FileText, ExternalLink } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { motion } from "framer-motion";

interface Chunk {
  id: string;
  content: string;
  source: string;
  metadata?: {
    page?: number;
    section?: string;
  };
}

const fetchChunks = async (): Promise<Chunk[]> => {
  try {
    const response = await fetch('http://localhost:8000/api/chunks');
    if (!response.ok) {
      // Fallback data for demo
      return [
        {
          id: "1",
          content: "Government policies and procedures for citizen services...",
          source: "Citizen Charter 2023",
          metadata: { page: 12, section: "Service Delivery" }
        },
        {
          id: "2", 
          content: "Digital India initiative guidelines and implementation framework...",
          source: "Digital India Handbook",
          metadata: { page: 45, section: "Technology Framework" }
        },
        {
          id: "3",
          content: "Public grievance redressal mechanism and escalation procedures...",
          source: "Grievance Policy Document",
          metadata: { page: 8, section: "Resolution Process" }
        },
      ];
    }
    return response.json();
  } catch {
    // Fallback data for demo
    return [
      {
        id: "1",
        content: "Government policies and procedures for citizen services...",
        source: "Citizen Charter 2023",
        metadata: { page: 12, section: "Service Delivery" }
      },
      {
        id: "2",
        content: "Digital India initiative guidelines and implementation framework...", 
        source: "Digital India Handbook",
        metadata: { page: 45, section: "Technology Framework" }
      },
      {
        id: "3",
        content: "Public grievance redressal mechanism and escalation procedures...",
        source: "Grievance Policy Document", 
        metadata: { page: 8, section: "Resolution Process" }
      },
    ];
  }
};

export const ChunksViewer = () => {
  const [searchQuery, setSearchQuery] = useState("");
  
  const { data: chunks, isLoading } = useQuery({
    queryKey: ['chunks'],
    queryFn: fetchChunks,
    refetchInterval: 60000, // Refresh every minute
  });

  const filteredChunks = chunks?.filter(chunk =>
    (chunk.content && chunk.content.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (chunk.source && chunk.source.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (chunk.metadata?.section && chunk.metadata.section.toLowerCase().includes(searchQuery.toLowerCase()))
  ) || [];

  return (
    <Card className="h-96">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-semibold">Knowledge Chunks</CardTitle>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search chunks..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 h-9"
          />
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-72 px-4">
          {isLoading ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="space-y-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                  <Skeleton className="h-16 w-full" />
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-3 pb-4">
              {filteredChunks.map((chunk, index) => (
                <motion.div
                  key={chunk.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card className="p-3 hover:shadow-md transition-shadow">
                    <div className="space-y-2">
                      <div className="flex items-start gap-2">
                        <FileText className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge variant="outline" className="text-xs">
                              {chunk.source}
                            </Badge>
                            {chunk.metadata?.page && (
                              <span className="text-xs text-muted-foreground">
                                p.{chunk.metadata.page}
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-foreground line-clamp-3">
                            {chunk.content}
                          </p>
                          {chunk.metadata?.section && (
                            <div className="flex items-center gap-1 mt-2">
                              <ExternalLink className="w-3 h-3 text-muted-foreground" />
                              <span className="text-xs text-muted-foreground">
                                {chunk.metadata.section}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              ))}
              {filteredChunks.length === 0 && !isLoading && (
                <div className="text-center text-muted-foreground py-8">
                  <FileText className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No chunks found</p>
                </div>
              )}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
};