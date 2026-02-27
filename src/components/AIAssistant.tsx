import React from 'react';
import { 
  Send, 
  Mic, 
  Bot, 
  User, 
  Loader2, 
  Volume2, 
  VolumeX,
  Sparkles
} from 'lucide-react';
import { Message, FarmSettings, SensorData, WaterBudget } from '../types';
import { getAgroFlowAdvice } from '../services/geminiService';
import { Language, translations } from '../i18n';
import ReactMarkdown from 'react-markdown';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface AIAssistantProps {
  farmSettings: FarmSettings;
  sensorData: SensorData;
  waterBudget: WaterBudget;
  language: Language;
  initialPrompt?: string;
}

export default function AIAssistant({ farmSettings, sensorData, waterBudget, language, initialPrompt }: AIAssistantProps) {
  const t = translations[language];
  const [messages, setMessages] = React.useState<Message[]>([
    { 
      role: 'model', 
      text: t.helloAssistant
    }
  ]);
  const [input, setInput] = React.useState('');
  const [isLoading, setIsLoading] = React.useState(false);
  const [isSpeaking, setIsSpeaking] = React.useState(true); // Default to true for voice output
  const [isListening, setIsListening] = React.useState(false);
  const scrollRef = React.useRef<HTMLDivElement>(null);

  // Web Speech API - Text to Speech
  const speak = (text: string) => {
    if (!isSpeaking) return;
    
    // Cancel any ongoing speech
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-US';
    utterance.rate = 1;
    utterance.pitch = 1;
    
    window.speechSynthesis.speak(utterance);
  };

  // Web Speech API Setup
  const startListening = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Speech recognition is not supported in this browser.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    recognition.onerror = () => setIsListening(false);
    
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setInput(transcript);
      // Automatically send if it's a clear command
      if (transcript.length > 5) {
        setTimeout(() => {
          // We need to use a ref or a closure-safe way to get the latest input
          // but for simplicity in this demo, we'll just set it and let the user click send
          // or we can trigger the send logic directly with the transcript
          handleVoiceCommand(transcript);
        }, 500);
      }
    };

    recognition.start();
  };

  const handleVoiceCommand = async (text: string) => {
    const userMsg: Message = { role: 'user', text };
    setMessages(prev => [...prev, userMsg]);
    setIsLoading(true);

    const response = await getAgroFlowAdvice(
      text,
      messages,
      farmSettings,
      sensorData,
      waterBudget
    );

    setMessages(prev => [...prev, { role: 'model', text: response }]);
    setIsLoading(false);
    speak(response); // Trigger TTS
  };

  React.useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  React.useEffect(() => {
    if (initialPrompt && messages.length === 1) {
      handleSend(initialPrompt);
    }
  }, [initialPrompt]);

  const handleSend = async (overrideInput?: string | React.MouseEvent) => {
    const textToSend = typeof overrideInput === 'string' ? overrideInput : input;
    if (!textToSend.trim() || isLoading) return;

    const userMsg: Message = { role: 'user', text: textToSend };
    setMessages(prev => [...prev, userMsg]);
    if (typeof overrideInput !== 'string') setInput('');
    setIsLoading(true);

    const response = await getAgroFlowAdvice(
      textToSend,
      messages,
      farmSettings,
      sensorData,
      waterBudget
    );

    setMessages(prev => [...prev, { role: 'model', text: response }]);
    setIsLoading(false);
    speak(response); // Trigger TTS
  };

  const toggleSpeech = () => {
    const newSpeaking = !isSpeaking;
    setIsSpeaking(newSpeaking);
    if (!newSpeaking) {
      window.speechSynthesis.cancel();
    }
  };

  return (
    <div className="max-w-4xl mx-auto h-[calc(100vh-16rem)] md:h-[calc(100vh-12rem)] flex flex-col bg-white border border-zinc-200 rounded-3xl overflow-hidden shadow-xl animate-in fade-in duration-500">
      {/* Chat Header */}
      <div className="p-6 border-b border-zinc-100 bg-zinc-50/50 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-600/20">
            <Bot className="text-white w-7 h-7" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-zinc-900 tracking-tight flex items-center gap-2">
              {t.agroFlowIntelligence}
              <Sparkles className="w-4 h-4 text-emerald-600" />
            </h3>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs text-zinc-400 font-medium">{t.aiReasoningActive}</span>
            </div>
          </div>
        </div>
        <button 
          onClick={toggleSpeech}
          className={cn(
            "p-3 rounded-xl border transition-all duration-200",
            isSpeaking ? "bg-emerald-50 border-emerald-100 text-emerald-600" : "bg-zinc-50 border-zinc-200 text-zinc-400 hover:text-zinc-600"
          )}
        >
          {isSpeaking ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
        </button>
      </div>

      {/* Messages Area */}
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-thin scrollbar-thumb-zinc-200 scrollbar-track-transparent"
      >
        {messages.map((msg, idx) => (
          <div 
            key={idx} 
            className={cn(
              "flex gap-4 max-w-[85%]",
              msg.role === 'user' ? "ml-auto flex-row-reverse" : ""
            )}
          >
            <div className={cn(
              "w-10 h-10 rounded-xl flex-shrink-0 flex items-center justify-center",
              msg.role === 'user' ? "bg-zinc-100 text-zinc-600" : "bg-emerald-50 text-emerald-600"
            )}>
              {msg.role === 'user' ? <User className="w-5 h-5" /> : <Bot className="w-5 h-5" />}
            </div>
            <div className={cn(
              "p-4 rounded-2xl text-sm leading-relaxed shadow-sm",
              msg.role === 'user' 
                ? "bg-emerald-600 text-white rounded-tr-none" 
                : "bg-white border border-zinc-100 text-zinc-700 rounded-tl-none"
            )}>
              <div className="markdown-body">
                <ReactMarkdown>{msg.text}</ReactMarkdown>
              </div>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex gap-4">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Loader2 className="w-5 h-5 animate-spin" />
            </div>
            <div className="bg-white border border-zinc-100 p-4 rounded-2xl rounded-tl-none shadow-sm">
              <div className="flex gap-1">
                <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-bounce" />
                <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-bounce [animation-delay:0.2s]" />
                <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-bounce [animation-delay:0.4s]" />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="p-6 border-t border-zinc-100 bg-zinc-50/50">
        <div className="flex gap-4">
          <div className="flex-1 relative">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder={t.askAboutFarm}
              className="w-full bg-white border border-zinc-200 rounded-2xl py-4 pl-6 pr-14 text-zinc-900 focus:outline-none focus:border-emerald-500/50 transition-all shadow-sm"
            />
            <button 
              onClick={startListening}
              className={cn(
                "absolute right-3 top-1/2 -translate-y-1/2 p-2 transition-all duration-200 rounded-full",
                isListening ? "bg-red-50 text-red-500 animate-pulse" : "text-zinc-400 hover:text-emerald-600"
              )}
            >
              <Mic className={cn("w-5 h-5", isListening && "fill-current")} />
            </button>
          </div>
          <button
            onClick={handleSend}
            disabled={isLoading || !input.trim()}
            className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:hover:bg-emerald-600 text-white p-4 rounded-2xl transition-all duration-200 shadow-lg shadow-emerald-600/20"
          >
            <Send className="w-6 h-6" />
          </button>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          {[t.shouldIIrrigate, t.whyIsBalanceLow, t.howToSaveWater].map((suggestion) => (
            <button
              key={suggestion}
              onClick={() => setInput(suggestion)}
              className="text-xs font-bold text-zinc-500 bg-white border border-zinc-200 px-3 py-1.5 rounded-lg hover:border-emerald-500/50 hover:text-emerald-600 transition-all shadow-sm"
            >
              {suggestion}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
