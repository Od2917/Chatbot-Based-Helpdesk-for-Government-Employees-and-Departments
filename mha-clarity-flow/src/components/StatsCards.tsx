import { useQuery } from "@tanstack/react-query";
import { FileText, Database, ExternalLink } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { motion } from "framer-motion";

interface Stats {
  documents: number;
  chunks: number;
  sources: number;
}

const fetchStats = async (): Promise<Stats> => {
  try {
    const response = await fetch('http://localhost:8000/api/stats');
    if (!response.ok) {
      // Fallback data for demo
      return { documents: 1247, chunks: 8953, sources: 127 };
    }
    return response.json();
  } catch {
    // Fallback data for demo
    return { documents: 1247, chunks: 8953, sources: 127 };
  }
};

interface StatsCardsProps {
  collapsed: boolean;
}

export const StatsCards: React.FC<StatsCardsProps> = ({ collapsed }) => {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['stats'],
    queryFn: fetchStats,
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const statItems = [
    {
      label: "Documents",
      value: stats?.documents,
      icon: FileText,
      color: "text-royal-blue",
      bgColor: "bg-royal-blue-light/20",
      gradientFrom: "from-royal-blue/10",
      gradientTo: "to-peacock-blue/10",
    },
    {
      label: "Chunks",
      value: stats?.chunks,
      icon: Database,
      color: "text-saffron-deep",
      bgColor: "bg-saffron-light/20",
      gradientFrom: "from-saffron/10",
      gradientTo: "to-gold/10",
    },
    {
      label: "Sources",
      value: stats?.sources,
      icon: ExternalLink,
      color: "text-indian-green",
      bgColor: "bg-indian-green-light/20",
      gradientFrom: "from-indian-green/10",
      gradientTo: "to-forest-green/10",
    },
  ];

  if (collapsed) {
    return (
      <div className="space-y-3">
        {statItems.map((item, index) => (
          <motion.div
            key={item.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card className={`stat-card p-3 bg-gradient-to-br ${item.gradientFrom} ${item.gradientTo} border-${item.color.split('-')[1]}/20`}>
              <CardContent className="p-0 flex flex-col items-center gap-2">
                <div className={`p-2 rounded-lg ${item.bgColor} shadow-sm`}>
                  <item.icon className={`w-4 h-4 ${item.color}`} />
                </div>
                {isLoading ? (
                  <Skeleton className="h-4 w-8" />
                ) : (
                  <span className={`text-sm font-semibold ${item.color}`}>
                    {item.value?.toLocaleString()}
                  </span>
                )}
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {statItems.map((item, index) => (
        <motion.div
          key={item.label}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: index * 0.1 }}
        >
          <Card className={`stat-card bg-gradient-to-br ${item.gradientFrom} ${item.gradientTo} border-${item.color.split('-')[1]}/20`}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">
                    {item.label}
                  </p>
                  {isLoading ? (
                    <Skeleton className="h-8 w-16" />
                  ) : (
                    <motion.p
                      className={`text-2xl font-bold ${item.color}`}
                      initial={{ scale: 0.8 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", stiffness: 200 }}
                    >
                      {item.value?.toLocaleString()}
                    </motion.p>
                  )}
                </div>
                <div className={`p-3 rounded-xl ${item.bgColor} shadow-sm`}>
                  <item.icon className={`w-5 h-5 ${item.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </div>
  );
};