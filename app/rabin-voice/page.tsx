'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Mic, MicOff, Send, Volume2, VolumeX } from 'lucide-react';

interface ChatMessage {
  user: string;
  robin: string;
  timestamp: Date;
}

export default function RabinVoicePage() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [audioEnabled, setAudioEnabled] = useState(true);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  // Auto scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Initialize speech recognition
  useEffect(() => {
    if (typeof window !== 'undefined' && 'webkitSpeechRecognition' in window) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = 'fa-IR';

      recognitionRef.current.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInputText(transcript);
        setIsListening(false);
      };

      recognitionRef.current.onerror = () => {
        setIsListening(false);
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
      };
    }
  }, []);

  // Send message to AI
  const sendMessage = async () => {
    if (!inputText.trim() || isLoading) return;

    const userMessage = inputText.trim();
    setInputText('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/rabin-voice/ai', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userMessage,
          history: messages.slice(-5) // Send last 5 messages for context
        }),
      });

      if (!response.ok) {
        throw new Error('خطا در ارسال پیام');
      }

      const data = await response.json();
      
      const newMessage: ChatMessage = {
        user: userMessage,
        robin: data.response,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, newMessage]);

      // Text to speech if enabled
      if (audioEnabled && data.response) {
        await playAudio(data.response);
      }

    } catch (error) {
      console.error('Error:', error);
      const errorMessage: ChatMessage = {
        user: userMessage,
        robin: 'متأسفم، مشکلی پیش آمد. لطفاً دوباره تلاش کنید.',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  // Text to speech
  const playAudio = async (text: string) => {
    if (!audioEnabled || isSpeaking) return;

    try {
      setIsSpeaking(true);
      
      const response = await fetch('/api/tts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text }),
      });

      if (!response.ok) {
        throw new Error('خطا در تبدیل متن به صدا');
      }

      const data = await response.json();
      
      if (data.success && data.audioUrl) {
        if (audioRef.current) {
          audioRef.current.src = data.audioUrl;
          audioRef.current.onended = () => setIsSpeaking(false);
          audioRef.current.onerror = () => setIsSpeaking(false);
          await audioRef.current.play();
        }
      }
    } catch (error) {
      console.error('TTS Error:', error);
      setIsSpeaking(false);
    }
  };

  // Start/stop voice recognition
  const toggleListening = () => {
    if (!recognitionRef.current) {
      alert('مرورگر شما از تشخیص صدا پشتیبانی نمی‌کند');
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      recognitionRef.current.start();
      setIsListening(true);
    }
  };

  // Handle enter key
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <Card className="mb-6">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold text-gray-800 flex items-center justify-center gap-2">
              🤖 دستیار هوشمند رابین
            </CardTitle>
            <p className="text-gray-600">
              سلام! من رابین هستم، دستیار هوشمند شما. چطور می‌تونم کمکتون کنم؟
            </p>
          </CardHeader>
        </Card>

        {/* Chat Messages */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="h-96 overflow-y-auto space-y-4 mb-4">
              {messages.length === 0 ? (
                <div className="text-center text-gray-500 mt-20">
                  <p>هنوز پیامی ارسال نشده. سوال خود را بپرسید!</p>
                </div>
              ) : (
                messages.map((message, index) => (
                  <div key={index} className="space-y-2">
                    {/* User Message */}
                    <div className="flex justify-end">
                      <div className="bg-blue-500 text-white rounded-lg px-4 py-2 max-w-xs lg:max-w-md">
                        <p className="text-sm">{message.user}</p>
                        <span className="text-xs opacity-75">
                          {message.timestamp.toLocaleTimeString('fa-IR')}
                        </span>
                      </div>
                    </div>
                    
                    {/* Robin Response */}
                    <div className="flex justify-start">
                      <div className="bg-gray-100 text-gray-800 rounded-lg px-4 py-2 max-w-xs lg:max-w-md">
                        <p className="text-sm whitespace-pre-wrap">{message.robin}</p>
                        <div className="flex items-center justify-between mt-1">
                          <span className="text-xs text-gray-500">
                            {message.timestamp.toLocaleTimeString('fa-IR')}
                          </span>
                          {audioEnabled && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => playAudio(message.robin)}
                              disabled={isSpeaking}
                              className="h-6 w-6 p-0"
                            >
                              <Volume2 className="h-3 w-3" />
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
              
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-gray-100 text-gray-800 rounded-lg px-4 py-2">
                    <div className="flex items-center space-x-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
                      <span className="text-sm">رابین در حال تایپ...</span>
                    </div>
                  </div>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="flex items-end space-x-2 space-x-reverse">
              <div className="flex-1">
                <Textarea
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="پیام خود را بنویسید یا از میکروفون استفاده کنید..."
                  className="min-h-[60px] resize-none"
                  disabled={isLoading}
                />
              </div>
              
              <div className="flex flex-col space-y-2">
                {/* Voice Recognition Button */}
                <Button
                  onClick={toggleListening}
                  disabled={isLoading}
                  variant={isListening ? "destructive" : "outline"}
                  size="sm"
                  className="h-10 w-10 p-0"
                >
                  {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                </Button>
                
                {/* Audio Toggle Button */}
                <Button
                  onClick={() => setAudioEnabled(!audioEnabled)}
                  variant="outline"
                  size="sm"
                  className="h-10 w-10 p-0"
                >
                  {audioEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
                </Button>
                
                {/* Send Button */}
                <Button
                  onClick={sendMessage}
                  disabled={!inputText.trim() || isLoading}
                  className="h-10 w-10 p-0"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {isListening && (
              <div className="mt-2 text-center">
                <span className="text-sm text-blue-600 animate-pulse">
                  🎤 در حال گوش دادن...
                </span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Audio Element */}
        <audio ref={audioRef} className="hidden" />
      </div>
    </div>
  );
}