import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Database, MessageSquare, Search, Zap, Maximize2, X } from "lucide-react";
import { motion } from "framer-motion";
import { useState } from "react";

const About = () => {
  const [showModal, setShowModal] = useState(false);
  const features = [
    {
      icon: MessageSquare,
      title: "Conversational AI",
      description: "Natural language understanding for government queries"
    },
    {
      icon: Database,
      title: "Knowledge Base",
      description: "Comprehensive government documents and policies"
    },
    {
      icon: Search,
      title: "Semantic Search",
      description: "Advanced retrieval of relevant information"
    },
    {
      icon: Zap,
      title: "Real-time Processing",
      description: "Instant responses with high accuracy"
    }
  ];

  return (
    <div className="container mx-auto px-6 py-12 max-w-4xl">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        {/* Hero Section */}
        <div className="text-center mb-16">
          <Badge variant="outline" className="mb-4 border-saffron/50 text-saffron">About MHA Assistant</Badge>
          <h1 className="text-4xl md:text-5xl font-bold mb-6 gradient-text-heritage">
            Government Helpdesk
            <br />
            Powered by AI
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            MHA Assistant is an intelligent chatbot designed to help citizens access 
            government information and services efficiently through natural conversation.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-16">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 + 0.3 }}
            >
              <Card className="stat-card h-full">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className={`p-3 rounded-xl ${
                      index === 0 ? 'bg-royal-blue/10' :
                      index === 1 ? 'bg-indian-green/10' :
                      index === 2 ? 'bg-saffron/10' : 'bg-gold/10'
                    }`}>
                      <feature.icon className={`w-6 h-6 ${
                        index === 0 ? 'text-royal-blue' :
                        index === 1 ? 'text-indian-green' :
                        index === 2 ? 'text-saffron-deep' : 'text-gold'
                      }`} />
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg mb-2">{feature.title}</h3>
                      <p className="text-muted-foreground">{feature.description}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Pipeline Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
        >
          <Card className="glass p-8">
            <div className="space-y-8">
              <div className="text-center">
                <h2 className="text-3xl font-bold mb-4">System Architecture</h2>
                <p className="text-muted-foreground max-w-2xl mx-auto">
                  Our AI-powered system uses advanced natural language processing 
                  and retrieval-augmented generation to provide accurate responses.
                </p>
                {/* Flow diagram with expand button */}
                <div className="flex justify-center mt-8 relative">
                  <img
                    src="/public/FlowDiagram.png"
                    alt="System Architecture Flow Diagram"
                    className="max-w-full h-auto rounded-xl shadow-lg cursor-pointer"
                    onClick={() => setShowModal(true)}
                  />
                  <button
                    className="absolute bottom-4 right-4 bg-white/80 hover:bg-white rounded-full p-2 shadow-lg flex items-center"
                    onClick={() => setShowModal(true)}
                    aria-label="Expand diagram"
                  >
                    <Maximize2 className="w-5 h-5 text-royal-blue" />
                  </button>
                </div>
                {/* Modal for fullscreen image */}
                {showModal && (
                  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
                    <div className="relative">
                      <img
                        src="/public/FlowDiagram.png"
                        alt="System Architecture Flow Diagram Fullscreen"
                        className="max-h-[90vh] max-w-[90vw] rounded-xl shadow-2xl border-4 border-white"
                      />
                      <button
                        className="absolute top-2 right-2 bg-white/80 hover:bg-white rounded-full p-2 shadow-lg"
                        onClick={() => setShowModal(false)}
                        aria-label="Close fullscreen"
                      >
                        <X className="w-5 h-5 text-royal-blue" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </Card>
        </motion.div>

      </motion.div>
    </div>
  );
};

export default About;