import React, { useEffect, useRef, useState } from 'react';
import { Mic, MicOff, Volume2, VolumeX, X, Loader2, Waves } from 'lucide-react';
import { GoogleGenAI, Modality } from "@google/genai";
import { FarmSettings, SensorData, WaterBudget } from '../types';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface VoiceAssistantProps {
  isOpen: boolean;
  onClose: () => void;
  farmSettings: FarmSettings;
  sensorData?: SensorData;
  waterBudget?: WaterBudget;
}

export default function VoiceAssistant({ isOpen, onClose, farmSettings, sensorData, waterBudget }: VoiceAssistantProps) {
  const [isActive, setIsActive] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [transcript, setTranscript] = useState("");
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const sessionRef = useRef<any>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const audioQueueRef = useRef<Int16Array[]>([]);
  const isPlayingRef = useRef(false);

  const systemInstruction = `
    You are AgroFlow AI, a specialized voice assistant for precision agriculture.
    You have access to the following real-time farm data:
    - Location: ${farmSettings.location}
    - Crop: ${farmSettings.crop}
    - Irrigation Method: ${farmSettings.irrigationMethod}
    - Soil Moisture: ${sensorData?.soilMoisture?.toFixed(1) || 'N/A'}%
    - Rainfall (24h): ${sensorData?.rainfall?.toFixed(1) || 'N/A'} mm
    - Groundwater Level: ${sensorData?.groundwaterLevel?.toFixed(1) || 'N/A'} m
    - Water Balance: ${waterBudget?.balance?.toFixed(1) || 'N/A'} m³
    - Groundwater Status: ${waterBudget?.groundwaterStatus || 'N/A'}
    
    Your goal is to help the farmer manage their water budget and irrigation schedule.
    Be concise, technical, and authoritative. Use a helpful and professional tone.
    If the farmer asks about their data, refer to the values provided above.
    If they ask for advice, give specific recommendations based on their current soil moisture and water balance.
  `;

  const startSession = async () => {
    try {
      setIsConnecting(true);
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      
      const session = await ai.live.connect({
        model: "gemini-2.5-flash-native-audio-preview-09-2025",
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: "Zephyr" } },
          },
          systemInstruction,
        },
        callbacks: {
          onopen: () => {
            setIsActive(true);
            setIsConnecting(false);
            startMicrophone();
          },
          onmessage: async (message) => {
            if (message.serverContent?.modelTurn?.parts) {
              for (const part of message.serverContent.modelTurn.parts) {
                if (part.inlineData?.data) {
                  const base64Audio = part.inlineData.data;
                  const binaryString = window.atob(base64Audio);
                  const bytes = new Uint8Array(binaryString.length);
                  for (let i = 0; i < binaryString.length; i++) {
                    bytes[i] = binaryString.charCodeAt(i);
                  }
                  const pcmData = new Int16Array(bytes.buffer);
                  audioQueueRef.current.push(pcmData);
                  if (!isPlayingRef.current) {
                    playNextInQueue();
                  }
                }
              }
            }
            if (message.serverContent?.interrupted) {
              audioQueueRef.current = [];
              isPlayingRef.current = false;
            }
          },
          onclose: () => {
            stopSession();
          },
          onerror: (err) => {
            console.error("Gemini Live Error:", err);
            stopSession();
          }
        }
      });
      
      sessionRef.current = session;
    } catch (error) {
      console.error("Failed to connect to Gemini Live:", error);
      setIsConnecting(false);
    }
  };

  const startMicrophone = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      
      if (!audioContextRef.current) {
        audioContextRef.current = new AudioContext({ sampleRate: 16000 });
      }
      
      const source = audioContextRef.current.createMediaStreamSource(stream);
      const processor = audioContextRef.current.createScriptProcessor(4096, 1, 1);
      processorRef.current = processor;
      
      processor.onaudioprocess = (e) => {
        if (!sessionRef.current || isMuted) return;
        
        const inputData = e.inputBuffer.getChannelData(0);
        // Convert Float32 to Int16 PCM
        const pcmData = new Int16Array(inputData.length);
        for (let i = 0; i < inputData.length; i++) {
          pcmData[i] = Math.max(-1, Math.min(1, inputData[i])) * 0x7FFF;
        }
        
        // Convert to Base64
        const base64Data = btoa(String.fromCharCode(...new Uint8Array(pcmData.buffer)));
        sessionRef.current.sendRealtimeInput({
          media: { data: base64Data, mimeType: 'audio/pcm;rate=16000' }
        });
      };
      
      source.connect(processor);
      processor.connect(audioContextRef.current.destination);
    } catch (error) {
      console.error("Microphone access denied:", error);
    }
  };

  const playNextInQueue = async () => {
    if (audioQueueRef.current.length === 0) {
      isPlayingRef.current = false;
      return;
    }

    isPlayingRef.current = true;
    const pcmData = audioQueueRef.current.shift()!;
    
    if (!audioContextRef.current) {
      audioContextRef.current = new AudioContext({ sampleRate: 24000 });
    }

    const audioBuffer = audioContextRef.current.createBuffer(1, pcmData.length, 24000);
    const channelData = audioBuffer.getChannelData(0);
    for (let i = 0; i < pcmData.length; i++) {
      channelData[i] = pcmData[i] / 0x7FFF;
    }

    const source = audioContextRef.current.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(audioContextRef.current.destination);
    source.onended = () => playNextInQueue();
    source.start();
  };

  const stopSession = () => {
    if (sessionRef.current) {
      sessionRef.current.close();
      sessionRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (processorRef.current) {
      processorRef.current.disconnect();
      processorRef.current = null;
    }
    setIsActive(false);
    setIsConnecting(false);
    audioQueueRef.current = [];
    isPlayingRef.current = false;
  };

  useEffect(() => {
    if (!isOpen && isActive) {
      stopSession();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-end md:items-center justify-center p-0 md:p-4 bg-zinc-900/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white w-full max-w-md rounded-t-[3rem] md:rounded-3xl shadow-2xl overflow-hidden animate-in slide-in-from-bottom md:zoom-in-95 duration-300">
        <div className="p-6 border-b border-zinc-100 flex items-center justify-between bg-emerald-600 text-white">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-xl">
              <Mic className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold">AgroFlow Voice Assistant</h3>
              <p className="text-xs text-emerald-100">Gemini 2.5 Flash Live</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-xl transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-12 flex flex-col items-center justify-center gap-8 min-h-[300px]">
          {isActive ? (
            <div className="relative">
              <div className="absolute inset-0 bg-emerald-500/20 rounded-full animate-ping" />
              <div className="relative w-32 h-32 bg-emerald-600 rounded-full flex items-center justify-center shadow-xl shadow-emerald-600/40">
                <Waves className="w-16 h-16 text-white animate-pulse" />
              </div>
            </div>
          ) : (
            <div className="w-32 h-32 bg-zinc-100 rounded-full flex items-center justify-center">
              <MicOff className="w-16 h-16 text-zinc-300" />
            </div>
          )}

          <div className="text-center space-y-2">
            <h4 className="text-xl font-bold text-zinc-900">
              {isConnecting ? "Connecting to AI..." : isActive ? "Listening..." : "Voice Assistant Ready"}
            </h4>
            <p className="text-zinc-500 text-sm max-w-[250px]">
              {isActive 
                ? "Ask me about your farm's soil moisture, rainfall, or irrigation advice." 
                : "Click the button below to start a real-time voice conversation."}
            </p>
          </div>

          <div className="flex items-center gap-4">
            {!isActive ? (
              <button
                onClick={startSession}
                disabled={isConnecting}
                className="px-8 py-4 bg-emerald-600 hover:bg-emerald-500 disabled:bg-zinc-400 text-white font-bold rounded-2xl transition-all shadow-lg shadow-emerald-600/20 flex items-center gap-3"
              >
                {isConnecting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Mic className="w-5 h-5" />}
                {isConnecting ? "Initializing..." : "Start Conversation"}
              </button>
            ) : (
              <>
                <button
                  onClick={() => setIsMuted(!isMuted)}
                  className={cn(
                    "p-4 rounded-2xl transition-all shadow-lg",
                    isMuted ? "bg-red-50 text-red-600 shadow-red-600/10" : "bg-zinc-50 text-zinc-600 shadow-zinc-600/10"
                  )}
                >
                  {isMuted ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
                </button>
                <button
                  onClick={stopSession}
                  className="px-8 py-4 bg-red-600 hover:bg-red-500 text-white font-bold rounded-2xl transition-all shadow-lg shadow-red-600/20"
                >
                  End Session
                </button>
              </>
            )}
          </div>
        </div>

        <div className="p-6 bg-zinc-50 border-t border-zinc-100">
          <div className="flex items-center justify-between text-xs font-bold text-zinc-400 uppercase tracking-widest">
            <span>Data Access</span>
            <span className="text-emerald-600">Live Sync Active</span>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            <span className="px-2 py-1 bg-white border border-zinc-200 rounded-md text-[10px] text-zinc-500">Soil: {sensorData?.soilMoisture?.toFixed(0) || '--'}%</span>
            <span className="px-2 py-1 bg-white border border-zinc-200 rounded-md text-[10px] text-zinc-500">Rain: {sensorData?.rainfall?.toFixed(1) || '--'}mm</span>
            <span className="px-2 py-1 bg-white border border-zinc-200 rounded-md text-[10px] text-zinc-500">Budget: {waterBudget?.balance?.toFixed(0) || '--'}m³</span>
          </div>
        </div>
      </div>
    </div>
  );
}
