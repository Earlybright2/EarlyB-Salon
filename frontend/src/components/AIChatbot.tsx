import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  MessageCircle,
  X,
  Send,
  Sparkles,
  User,
  Loader2,
} from "lucide-react";
// @ts-ignore - ScrollArea reserved for future use

interface Message {
  id: number;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

const quickQuestions = [
  "What products for hair growth?",
  "How does AI try-on work?",
  "Book a salon near me",
  "Hairline restoration options",
];

const welcomeMessage: Message = {
  id: 0,
  role: "assistant",
  content: `Welcome to Early Bright! I'm your AI beauty assistant. I can help you:\n\n- Find the perfect hair products for your needs\n- Recommend hairstyles for your face shape\n- Explain our AI try-on technology\n- Guide you through booking a verified stylist\n- Answer questions about hairline restoration\n\nWhat can I help you with today?`,
  timestamp: new Date(),
};

export default function AIChatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([welcomeMessage]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const generateResponse = (userMsg: string): string => {
    const lower = userMsg.toLowerCase();
    if (lower.includes("hair growth") || lower.includes("growth")) {
      return "For hair growth, I highly recommend our **Aurora Hair Elixir Serum** (₦12,500) — it's our best-seller with biotin and caffeine. Pair it with our **Hair Revitalize Complex** supplements (₦18,000) for results from inside and out. Many clients see noticeable improvement in 4-6 weeks!";
    }
    if (lower.includes("ai try-on") || lower.includes("try on") || lower.includes("try-on")) {
      return "Our **AI Try-On** uses advanced facial recognition to analyze your face shape, skin tone, and hairline. Simply upload a photo or use your camera, and our AI will overlay different hairstyles to show you exactly how they'll look. It's like having a virtual stylist! Head to the **AI Try-On** page to get started.";
    }
    if (lower.includes("salon") || lower.includes("book") || lower.includes("barber")) {
      return "I can help you book a verified stylist! We have amazing salons like **Amaka's Hair Studio** in Lekki (4.9 stars) and **Kings Barbershop** in Victoria Island (4.8 stars). All our stylists are KYC-verified. Visit our **Salons** page to browse, filter by location, and book instantly!";
    }
    if (lower.includes("hairline") || lower.includes("restoration") || lower.includes("receding")) {
      return "Hairline restoration is one of our specialties! We offer:\n\n- **Scalp treatments** at verified clinics\n- **Premium hairline products** like our Opulence Edge Control Gel\n- **Progress tracking** to monitor your journey\n- Access to certified trichologists\n\nVisit the **Restore** page for a personalized hairline assessment plan.";
    }
    if (lower.includes("price") || lower.includes("cost") || lower.includes("how much")) {
      return "Our products range from ₦5,500 to ₦18,000. Salon services vary by stylist — braids start at ₦8,000, haircuts from ₦5,000, and premium treatments from ₦15,000. We offer **free shipping** on all product orders! Would you like recommendations in a specific budget range?";
    }
    if (lower.includes("shampoo") || lower.includes("wash")) {
      return "Our **Organic Elixir Shampoo** (₦8,500) is sulfate-free and perfect for all hair types. It's enriched with shea butter, coconut oil, and aloe vera. For best results, pair it with our **Aurora Bliss Conditioner** (₦9,200) for deep hydration and repair!";
    }
    if (lower.includes("braid") || lower.includes("braids")) {
      return "For beautiful braids, I'd recommend booking with **Amaka's Hair Studio** — they specialize in knotless braids, box braids, and twists starting at ₦8,000. Their stylists are experts in protective styling that promotes hair health while looking stunning!";
    }
    if (lower.includes("thank")) {
      return "You're so welcome! I'm always here to help you look and feel your best. Don't hesitate to reach out anytime — whether it's finding products, booking a stylist, or getting hair care advice. Have a beautiful day!";
    }
    return "That's a great question! I'd be happy to help you with that. To give you the most personalized recommendation, could you tell me more about your hair type and what you're looking to achieve? Or feel free to browse our **Shop** or **Salons** sections for more details!";
  };

  const handleSend = async (text?: string) => {
    const messageText = text || input.trim();
    if (!messageText) return;

    const userMessage: Message = {
      id: Date.now(),
      role: "user",
      content: messageText,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsTyping(true);

    // Simulate AI response delay
    setTimeout(() => {
      const response = generateResponse(messageText);
      const assistantMessage: Message = {
        id: Date.now() + 1,
        role: "assistant",
        content: response,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, assistantMessage]);
      setIsTyping(false);
    }, 800 + Math.random() * 600);
  };

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`fixed bottom-6 right-6 z-50 h-14 w-14 rounded-full flex items-center justify-center shadow-lg transition-all duration-300 ${
          isOpen
            ? "bg-ebs-bg-elevated border border-ebs-gold/30 rotate-0"
            : "bg-gradient-gold animate-pulse-gold"
        }`}
      >
        {isOpen ? (
          <X className="h-6 w-6 text-ebs-text" />
        ) : (
          <MessageCircle className="h-6 w-6 text-ebs-bg" />
        )}
      </button>

      {/* Chat Panel */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 z-50 w-[380px] max-w-[calc(100vw-3rem)] h-[520px] bg-ebs-bg-card border border-ebs-gold/15 rounded-2xl shadow-dark-lg flex flex-col overflow-hidden animate-fade-in-up">
          {/* Header */}
          <div className="flex items-center gap-3 px-5 py-4 bg-gradient-to-r from-ebs-bg-elevated to-ebs-bg-card border-b border-ebs-gold/10">
            <div className="h-9 w-9 rounded-full bg-ebs-gold/20 flex items-center justify-center">
              <Sparkles className="h-5 w-5 text-ebs-gold" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-ebs-text">
                Early Bright AI
              </h3>
              <p className="text-xs text-ebs-teal flex items-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-ebs-teal animate-pulse" />
                Online — Ready to help
              </p>
            </div>
          </div>

          {/* Messages */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-4">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-2.5 ${
                  msg.role === "user" ? "flex-row-reverse" : ""
                }`}
              >
                <div
                  className={`h-7 w-7 rounded-full flex items-center justify-center shrink-0 ${
                    msg.role === "assistant"
                      ? "bg-ebs-gold/20"
                      : "bg-ebs-teal/20"
                  }`}
                >
                  {msg.role === "assistant" ? (
                    <Sparkles className="h-3.5 w-3.5 text-ebs-gold" />
                  ) : (
                    <User className="h-3.5 w-3.5 text-ebs-teal" />
                  )}
                </div>
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                    msg.role === "assistant"
                      ? "bg-ebs-bg-elevated text-ebs-text border border-white/5"
                      : "bg-ebs-teal/20 text-ebs-text border border-ebs-teal/20"
                  }`}
                >
                  <div className="whitespace-pre-wrap">{msg.content}</div>
                </div>
              </div>
            ))}
            {isTyping && (
              <div className="flex gap-2.5">
                <div className="h-7 w-7 rounded-full bg-ebs-gold/20 flex items-center justify-center shrink-0">
                  <Sparkles className="h-3.5 w-3.5 text-ebs-gold" />
                </div>
                <div className="bg-ebs-bg-elevated border border-white/5 rounded-2xl px-4 py-3">
                  <div className="flex gap-1">
                    <span className="h-2 w-2 rounded-full bg-ebs-gold/40 animate-bounce" style={{ animationDelay: "0ms" }} />
                    <span className="h-2 w-2 rounded-full bg-ebs-gold/40 animate-bounce" style={{ animationDelay: "150ms" }} />
                    <span className="h-2 w-2 rounded-full bg-ebs-gold/40 animate-bounce" style={{ animationDelay: "300ms" }} />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Quick Questions */}
          {messages.length <= 2 && (
            <div className="px-4 pb-2">
              <p className="text-xs text-ebs-text-muted mb-2">Quick questions:</p>
              <div className="flex flex-wrap gap-2">
                {quickQuestions.map((q) => (
                  <button
                    key={q}
                    onClick={() => handleSend(q)}
                    className="text-xs px-3 py-1.5 rounded-full bg-ebs-gold/10 text-ebs-gold hover:bg-ebs-gold/20 transition-colors border border-ebs-gold/20"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Input */}
          <div className="p-4 border-t border-white/5">
            <div className="flex gap-2">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSend()}
                placeholder="Ask about products, styles..."
                className="flex-1 bg-ebs-bg-elevated border-white/10 text-ebs-text placeholder:text-ebs-text-muted focus:border-ebs-gold/50 h-10"
              />
              <Button
                onClick={() => handleSend()}
                disabled={!input.trim() || isTyping}
                size="icon"
                className="h-10 w-10 bg-ebs-gold hover:bg-ebs-gold-light text-ebs-bg shrink-0"
              >
                {isTyping ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
