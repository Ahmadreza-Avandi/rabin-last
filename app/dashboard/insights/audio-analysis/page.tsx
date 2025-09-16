'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Square,
  Loader2,
  MessageCircle,
  BarChart3,
  TrendingUp,
  Users,
  AlertCircle,
  CheckCircle,
  Activity,
  Clock
} from 'lucide-react';

// Audio services - will be loaded client-side only
let audioIntelligenceService: any = null;
let sahabTTSV2: any = null;
let sahabSpeechRecognition: any = null;

export default function AudioAnalysisPage() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [aiResponse, setAiResponse] = useState('');
  const [systemStatus, setSystemStatus] = useState<any>(null);
  const [processingProgress, setProcessingProgress] = useState(0);
  const [currentTask, setCurrentTask] = useState('');

  // Wake word detection
  const [isWakeWordListening, setIsWakeWordListening] = useState(false);
  const [microphonePermission, setMicrophonePermission] = useState<'granted' | 'denied' | 'prompt'>('prompt');

  // TTS Status
  const [ttsStatus, setTtsStatus] = useState({
    isLoading: false,
    error: null as string | null,
    currentService: 'sahab'
  });

  // Voice commands history
  const [commandHistory, setCommandHistory] = useState<Array<{
    timestamp: string;
    command: string;
    response: string;
    success: boolean;
  }>>([]);



  // Request microphone permission and start wake word detection
  const requestMicrophonePermission = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach(track => track.stop()); // Stop the stream, we just needed permission
      setMicrophonePermission('granted');
      startWakeWordDetection();
      return true;
    } catch (error) {
      console.error('❌ Microphone permission denied:', error);
      setMicrophonePermission('denied');
      return false;
    }
  };

  // Wake word detection function
  const startWakeWordDetection = async () => {
    if (!sahabSpeechRecognition || isWakeWordListening) return;

    setIsWakeWordListening(true);
    console.log('🎤 شروع تشخیص کلمه بیداری "رابین درود"...');

    try {
      // Start continuous listening for wake word
      const recognition = new (window as any).webkitSpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true; // Enable interim results for better responsiveness
      recognition.lang = 'fa-IR';

      let isCollectingCommand = false;
      let commandBuffer = '';
      let silenceTimer: NodeJS.Timeout | null = null;

      recognition.onresult = (event: any) => {
        // Get the latest result
        const lastResult = event.results[event.results.length - 1];
        const transcript = lastResult[0].transcript.toLowerCase().trim();
        console.log('🔍 Detected speech:', transcript, 'isFinal:', lastResult.isFinal);

        // Check if this contains wake word
        if (!isCollectingCommand && (transcript.includes('رابین درود') || transcript.includes('robin dorod'))) {
          console.log('✅ Wake word detected! Starting command collection...');
          isCollectingCommand = true;
          commandBuffer = '';
          setCurrentTask('منتظر دستور شما... (بعد از 3 ثانیه سکوت اجرا می‌شود)');

          // Extract command from the same sentence if exists (robust strip)
          let command = transcript
            .replace(/\bرابین\s*درود\b/gi, '')
            .replace(/\bروبین\s*درود\b/gi, '')
            .replace(/\brobin\s*dorood?\b/gi, '')
            .replace(/\brob\s*in\s*dorod\b/gi, '')
            .trim();
          if (command && command.length > 2) { // At least 3 characters
            commandBuffer = command;
            console.log('📝 Command found in same sentence:', commandBuffer);
            setTranscript(commandBuffer); // Show the command immediately
          }

          // Clear any existing timer
          if (silenceTimer) clearTimeout(silenceTimer);

          // Start silence timer (shorter if we already have a command)
          const timerDuration = commandBuffer ? 2000 : 4000; // 2 or 4 seconds
          silenceTimer = setTimeout(() => {
            console.log('⏰ Silence timeout, processing command:', commandBuffer);
            recognition.stop();
            setIsWakeWordListening(false);
            setCurrentTask('');

            if (commandBuffer.trim()) {
              processWakeWordCommand(commandBuffer.trim());
            } else {
              console.log('❌ No command received after wake word');
              setCurrentTask('دستوری دریافت نشد - دوباره تلاش کنید');
              setTimeout(() => {
                setCurrentTask('');
                if (microphonePermission === 'granted' && !isProcessing) {
                  startWakeWordDetection();
                }
              }, 2000);
            }
          }, timerDuration);

        } else if (isCollectingCommand && lastResult.isFinal) {
          // Only process final results when collecting commands
          if (!commandBuffer) {
            // First command after wake word
            commandBuffer = transcript
              .replace(/\bرابین\s*درود\b/gi, '')
              .replace(/\bروبین\s*درود\b/gi, '')
              .replace(/\brobin\s*dorood?\b/gi, '')
              .trim();
          } else {
            // Additional commands
            commandBuffer += ' ' + transcript.trim();
          }

          commandBuffer = commandBuffer.trim();
          console.log('📝 Command buffer updated:', commandBuffer);

          // Show current command in UI
          setTranscript(commandBuffer);

          // Reset silence timer
          if (silenceTimer) clearTimeout(silenceTimer);
          silenceTimer = setTimeout(() => {
            console.log('⏰ Final processing command:', commandBuffer);
            recognition.stop();
            setIsWakeWordListening(false);
            setCurrentTask('');

            if (commandBuffer.trim()) {
              processWakeWordCommand(commandBuffer.trim());
            }
          }, 3000);
        }
      };

      recognition.onerror = (event: any) => {
        console.error('❌ Wake word detection error:', event.error);
        setIsWakeWordListening(false);
        setCurrentTask('');

        if (silenceTimer) {
          clearTimeout(silenceTimer);
        }

        // Retry after error
        setTimeout(() => {
          if (microphonePermission === 'granted' && !isProcessing) {
            startWakeWordDetection();
          }
        }, 2000);
      };

      recognition.onend = () => {
        console.log('🔄 Wake word detection ended');
        if (silenceTimer) {
          clearTimeout(silenceTimer);
        }

        if (microphonePermission === 'granted' && !isProcessing && !isCollectingCommand) {
          setTimeout(() => startWakeWordDetection(), 1000);
        }
      };

      recognition.start();
    } catch (error) {
      console.error('❌ Failed to start wake word detection:', error);
      setIsWakeWordListening(false);
      setCurrentTask('');
    }
  };

  // Process wake word command
  const processWakeWordCommand = async (command: string) => {
    console.log('🎯 Processing wake word command:', command);

    if (!audioIntelligenceService) {
      console.error('❌ audioIntelligenceService is not available');
      return;
    }

    setIsProcessing(true);
    setTranscript(command);
    setAiResponse('');
    setProcessingProgress(0);
    setCurrentTask('پردازش دستور...');

    try {
      const progressInterval = setInterval(() => {
        setProcessingProgress(prev => {
          if (prev < 90) return prev + 10;
          return prev;
        });
      }, 500);

      // Clean possible duplicate wake phrase before processing
      const finalCommand = command
        .replace(/\bرابین\s*درود\b/gi, '')
        .replace(/\bروبین\s*درود\b/gi, '')
        .replace(/\brobin\s*dorood?\b/gi, '')
        .trim();
      // Process the command directly with the audio intelligence service
      const result = await audioIntelligenceService.processVoiceCommand(finalCommand);

      clearInterval(progressInterval);
      setProcessingProgress(100);
      setCurrentTask('تکمیل شد');

      setAiResponse(result.response.text);

      // Add to command history
      const historyEntry = {
        timestamp: new Date().toLocaleString('fa-IR'),
        command: command,
        response: result.response.text,
        success: result.success
      };
      setCommandHistory(prev => [historyEntry, ...prev.slice(0, 9)]);

      if (result.success) {
        console.log('✅ Wake word command processed successfully');
      } else {
        console.error('❌ Wake word command failed');
      }

    } catch (error) {
      console.error('❌ Error processing wake word command:', error);
      const errorMessage = error instanceof Error ? error.message : 'خطای نامشخص';
      setAiResponse(`خطا: ${errorMessage}`);
      setCurrentTask('خطا رخ داد');
    } finally {
      setTimeout(() => {
        setIsProcessing(false);
        setProcessingProgress(0);
        setCurrentTask('');

        // Restart wake word detection after processing is complete
        if (microphonePermission === 'granted') {
          setTimeout(() => {
            startWakeWordDetection();
          }, 1000);
        }
      }, 1000);
    }
  };

  useEffect(() => {
    // Load audio services dynamically
    const loadServices = async () => {
      try {
        if (typeof window !== 'undefined') {
          const audioModule = await import('@/lib/audio-intelligence-service');
          const sahabTTSModule = await import('@/lib/sahab-tts-v2');
          const sahabSpeechModule = await import('@/lib/sahab-speech-recognition');

          audioIntelligenceService = audioModule.audioIntelligenceService;
          sahabTTSV2 = sahabTTSModule.sahabTTSV2;
          sahabSpeechRecognition = sahabSpeechModule.sahabSpeechRecognition;

          console.log('✅ Audio services loaded');

          // Auto-request microphone permission and start wake word detection
          setTimeout(() => {
            requestMicrophonePermission();
          }, 1000);
        }
      } catch (error) {
        console.error('❌ Failed to load audio services:', error);
      }
    };

    loadServices();

    // Initialize system status
    const updateSystemStatus = () => {
      if (!audioIntelligenceService) {
        return;
      }

      try {
        const status = audioIntelligenceService.getSystemStatus();
        setSystemStatus(status);
        setIsSpeaking(status.isSpeaking);

        // Update TTS status from Sahab
        if (status.sahabTTSStatus) {
          setTtsStatus(prev => ({
            ...prev,
            isLoading: status.sahabTTSStatus.isLoading,
            currentService: status.sahabTTSStatus.isSpeaking ? 'sahab' : prev.currentService
          }));
        }
      } catch (error) {
        console.error('❌ Error getting system status:', error);
      }
    };

    // Start status updates after a short delay to allow services to load
    let interval: NodeJS.Timeout;
    const timer = setTimeout(() => {
      updateSystemStatus();
      interval = setInterval(updateSystemStatus, 2000);
    }, 1000);

    return () => {
      clearTimeout(timer);
      if (interval) {
        clearInterval(interval);
      }
    };
  }, []);

  const handleVoiceInteraction = async () => {
    if (!audioIntelligenceService) {
      console.error('❌ audioIntelligenceService is not available');
      return;
    }

    if (isProcessing) {
      try {
        setCurrentTask('در حال پردازش صدای ضبط شده...');
        await audioIntelligenceService.stopCurrentRecording();
      } catch (error) {
        console.error('خطا در توقف ضبط:', error);
        audioIntelligenceService.stopAudioProcessing();
        setIsProcessing(false);
        setIsListening(false);
        setIsSpeaking(false);
        setProcessingProgress(0);
        setCurrentTask('');
      }
      return;
    }

    setIsProcessing(true);
    setIsListening(true);
    setTranscript('');
    setAiResponse('');
    setProcessingProgress(0);
    setCurrentTask('آماده‌سازی سیستم...');

    try {
      const progressInterval = setInterval(() => {
        setProcessingProgress(prev => {
          if (prev < 90) return prev + 10;
          return prev;
        });
      }, 500);

      setCurrentTask('در حال گوش دادن...');
      const result = await audioIntelligenceService.handleVoiceInteraction();

      clearInterval(progressInterval);
      setProcessingProgress(100);
      setCurrentTask('تکمیل شد');

      setTranscript(result.transcript);
      setAiResponse(result.response.text);

      // Add to command history
      const historyEntry = {
        timestamp: new Date().toLocaleString('fa-IR'),
        command: result.transcript,
        response: result.response.text,
        success: result.success
      };
      setCommandHistory(prev => [historyEntry, ...prev.slice(0, 9)]);

      if (result.success) {
        console.log('Voice interaction completed successfully');
      } else {
        console.error('Voice interaction failed');
      }

    } catch (error) {
      console.error('Error in voice interaction:', error);
      const errorMessage = error instanceof Error ? error.message : 'خطای نامشخص';
      setAiResponse(`خطا: ${errorMessage}`);
      setCurrentTask('خطا رخ داد');
    } finally {
      setTimeout(() => {
        setIsProcessing(false);
        setIsListening(false);
        setIsSpeaking(false);
        setProcessingProgress(0);
        setCurrentTask('');
      }, 1000);
    }
  };

  const stopAllAudio = () => {
    if (audioIntelligenceService) {
      audioIntelligenceService.stopAudioProcessing();
    }
    if (sahabTTSV2) {
      sahabTTSV2.stop();
    }
    setIsProcessing(false);
    setIsListening(false);
    setIsSpeaking(false);
    setTtsStatus(prev => ({ ...prev, isLoading: false, error: null }));
  };

  const testSahabSpeech = async () => {
    if (!sahabSpeechRecognition) {
      setAiResponse('❌ سرویس تشخیص گفتار ساهاب در دسترس نیست.');
      return;
    }

    try {
      setCurrentTask('تست سیستم تشخیص گفتار ساهاب...');
      setIsProcessing(true);

      if (!sahabSpeechRecognition.isSupported()) {
        setAiResponse('سیستم ضبط در این مرورگر پشتیبانی نمی‌شود.');
        return;
      }

      setCurrentTask('شروع ضبط... (5 ثانیه صحبت کنید)');
      const result = await sahabSpeechRecognition.recordAndConvert(5000);

      setTranscript(result);
      setAiResponse(`✅ تست ساهاب موفق! متن تشخیص داده شده: "${result}"`);

    } catch (error) {
      console.error('خطا در تست ساهاب:', error);
      const errorMessage = error instanceof Error ? error.message : 'خطای نامشخص';
      setAiResponse(`❌ خطا در تست ساهاب: ${errorMessage}`);
    } finally {
      setIsProcessing(false);
      setCurrentTask('');
    }
  };

  const testSahabTTS = async () => {
    if (!sahabTTSV2) {
      console.error('❌ sahabTTSV2 is not available');
      return;
    }

    const testText = 'سلام! این یک تست سیستم صوتی جدید ساهاب است. کیفیت صدا بسیار عالی است.';

    setTtsStatus(prev => ({ ...prev, isLoading: true, error: null, currentService: 'sahab' }));

    try {
      await sahabTTSV2.speak(testText, {
        speaker: '3',
        onLoadingStart: () => {
          setTtsStatus(prev => ({ ...prev, isLoading: true }));
        },
        onLoadingEnd: () => {
          setTtsStatus(prev => ({ ...prev, isLoading: false }));
        },
        onError: (error) => {
          setTtsStatus(prev => ({ ...prev, error, isLoading: false }));
        }
      });



    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'خطای نامشخص';
      setTtsStatus(prev => ({ ...prev, error: errorMessage, isLoading: false }));


    }
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-2 text-gray-800">
          تحلیل صوتی هوشمند
        </h1>
        <p className="text-gray-600">
          سیستم پیشرفته تعامل صوتی با پشتیبانی کامل از زبان فارسی
        </p>
      </div>

      {/* System Status */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-lg">وضعیت سیستم</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
              <span className="text-sm">تشخیص گفتار:</span>
              <Badge variant={systemStatus?.speechRecognitionSupported ? "default" : "destructive"}>
                {systemStatus?.speechRecognitionSupported ? 'فعال' : 'غیرفعال'}
              </Badge>
            </div>

            <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
              <span className="text-sm">تبدیل متن به گفتار:</span>
              <Badge variant={systemStatus?.ttsSupported ? "default" : "destructive"}>
                {systemStatus?.ttsSupported ? 'فعال' : 'غیرفعال'}
              </Badge>
            </div>

            <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
              <span className="text-sm">ساهاب (اصلی):</span>
              <Badge variant={systemStatus?.sahabSpeechStatus?.isSupported ? "default" : "destructive"}>
                {systemStatus?.sahabSpeechStatus?.isSupported ? 'فعال' : 'غیرفعال'}
              </Badge>
            </div>

            <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
              <span className="text-sm">در حال پردازش:</span>
              <Badge variant={systemStatus?.isProcessing || ttsStatus.isLoading || systemStatus?.sahabSpeechStatus?.isRecording ? "secondary" : "outline"}>
                {systemStatus?.isProcessing || ttsStatus.isLoading || systemStatus?.sahabSpeechStatus?.isRecording ? 'بله' : 'خیر'}
              </Badge>
            </div>

            <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
              <span className="text-sm">تشخیص "رابین درود":</span>
              <Badge variant={isWakeWordListening ? "default" : microphonePermission === 'denied' ? "destructive" : "outline"}>
                {isWakeWordListening ? 'فعال' : microphonePermission === 'denied' ? 'مجوز ندارد' : 'غیرفعال'}
              </Badge>
            </div>
          </div>

          {/* Status Details */}
          {(ttsStatus.isLoading || ttsStatus.error || systemStatus?.sahabSpeechStatus?.isRecording) && (
            <div className="mt-4 p-3 rounded-lg border">
              {systemStatus?.sahabSpeechStatus?.isRecording && (
                <div className="flex items-center gap-2 text-green-600 mb-2">
                  <Mic className="h-4 w-4 animate-pulse" />
                  <span className="text-sm">در حال ضبط صدا با ساهاب...</span>
                </div>
              )}

              {ttsStatus.isLoading && (
                <div className="flex items-center gap-2 text-blue-600 mb-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="text-sm">در حال ارسال متن به سرویس صوتی...</span>
                </div>
              )}

              {ttsStatus.error && (
                <div className="flex items-center gap-2 text-red-600">
                  <AlertCircle className="h-4 w-4" />
                  <span className="text-sm">خطا در سرویس صوتی: {ttsStatus.error}</span>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Processing Progress */}
      {(isProcessing || currentTask) && (
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>{currentTask || 'در حال پردازش...'}</span>
                {processingProgress > 0 && <span>{processingProgress}%</span>}
              </div>
              {processingProgress > 0 ? (
                <Progress value={processingProgress} className="w-full" />
              ) : (
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-blue-600 h-2 rounded-full animate-pulse" style={{ width: '60%' }}></div>
                </div>
              )}
              {isListening && (
                <div className="flex items-center justify-center gap-2 text-green-600 mt-2">
                  <div className="w-2 h-2 bg-green-600 rounded-full animate-ping"></div>
                  <span className="text-sm">در حال ضبط...</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Control Panel */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-lg">کنترل‌های اصلی</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center gap-6">
            {/* Primary Action Button */}
            <Button
              onClick={handleVoiceInteraction}
              disabled={!systemStatus?.speechRecognitionSupported || !systemStatus?.ttsSupported}
              className={`w-24 h-24 rounded-full transition-all duration-300 ${isProcessing
                ? 'bg-red-500 hover:bg-red-600 animate-pulse'
                : 'bg-primary hover:bg-primary/90'
                }`}
              size="lg"
            >
              {isProcessing ? (
                <Square className="h-10 w-10 text-white" />
              ) : isListening ? (
                <MicOff className="h-10 w-10 text-white" />
              ) : (
                <Mic className="h-10 w-10 text-white" />
              )}
            </Button>

            {/* Status Indicator */}
            <div className="text-center">
              {isProcessing && (
                <p className="text-lg font-medium">
                  {isListening ? 'در حال ضبط صدا...' : isSpeaking ? 'در حال پخش پاسخ...' : 'در حال پردازش...'}
                </p>
              )}
              <p className="text-sm text-muted-foreground mt-1">
                {isProcessing
                  ? isListening
                    ? 'برای توقف ضبط و پردازش کلیک کنید'
                    : 'در حال پردازش...'
                  : 'برای شروع ضبط صدا کلیک کنید'}
              </p>
            </div>

            {/* Control Buttons */}
            <div className="flex gap-3 mt-4">
              {/* Stop All Button */}
              {(isProcessing || isListening || isSpeaking || ttsStatus.isLoading) && (
                <Button
                  onClick={stopAllAudio}
                  variant="destructive"
                >
                  توقف اضطراری
                </Button>
              )}

              {/* Manual Stop Recording Button */}
              {isListening && (
                <Button
                  onClick={async () => {
                    if (!audioIntelligenceService) {
                      console.error('❌ audioIntelligenceService is not available');
                      return;
                    }
                    try {
                      await audioIntelligenceService.stopCurrentRecording();
                    } catch (error) {
                      console.error('خطا در توقف ضبط:', error);
                    }
                  }}
                  variant="secondary"
                >
                  پایان ضبط و پردازش
                </Button>
              )}

              {/* Test Sahab TTS Button */}
              <Button
                onClick={testSahabTTS}
                variant="outline"
                disabled={ttsStatus.isLoading || isProcessing}
                className="flex items-center gap-2"
              >
                {ttsStatus.isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Volume2 className="h-4 w-4" />
                )}
                تست TTS
              </Button>

              {/* Test Sahab Speech Recognition Button */}
              <Button
                onClick={testSahabSpeech}
                variant="outline"
                disabled={isProcessing || systemStatus?.sahabSpeechStatus?.isRecording}
                className="flex items-center gap-2"
              >
                {systemStatus?.sahabSpeechStatus?.isRecording ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Mic className="h-4 w-4" />
                )}
                تست ساهاب
              </Button>

              {/* Wake Word Toggle Button */}
              <Button
                onClick={() => {
                  if (isWakeWordListening) {
                    setIsWakeWordListening(false);
                  } else if (microphonePermission === 'granted') {
                    startWakeWordDetection();
                  } else {
                    requestMicrophonePermission();
                  }
                }}
                variant={isWakeWordListening ? "default" : "outline"}
                className="flex items-center gap-2"
              >
                {isWakeWordListening ? (
                  <Volume2 className="h-4 w-4 animate-pulse" />
                ) : (
                  <VolumeX className="h-4 w-4" />
                )}
                {isWakeWordListening ? 'رابین درود فعال' : 'فعال‌سازی رابین درود'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Transcript and Response */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* Transcript */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Mic className="h-4 w-4" />
              متن شناسایی شده
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="min-h-[120px]">
              {transcript ? (
                <p className="text-gray-800 leading-relaxed">{transcript}</p>
              ) : (
                <p className="text-gray-500 text-center italic">
                  متن شناسایی شده در اینجا نمایش داده می‌شود
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* AI Response */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              {isSpeaking ? (
                <Volume2 className="h-4 w-4 animate-pulse" />
              ) : (
                <VolumeX className="h-4 w-4" />
              )}
              پاسخ هوش مصنوعی
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="min-h-[120px]">
              {aiResponse ? (
                <p className="text-gray-800 leading-relaxed whitespace-pre-wrap">{aiResponse}</p>
              ) : (
                <p className="text-gray-500 text-center italic">
                  پاسخ هوش مصنوعی در اینجا نمایش داده می‌شود
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Voice Commands Guide */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Mic className="h-5 w-5" />
            دستورات صوتی
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-4 p-3 bg-green-50 rounded-lg border border-green-200">
            <p className="text-sm text-green-700">
              💡 <strong>نکته:</strong> بعد از فعال شدن "رابین درود"، فقط کافیه بگید:
              <span className="font-medium">"رابین درود"</span> و بعد دستورتون رو بدید.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div>
              <h3 className="font-medium mb-3 text-gray-700 flex items-center gap-2">
                <Users className="h-4 w-4" />
                گزارشات همکاران:
              </h3>
              <div className="space-y-1 text-sm">
                <p>• "گزارش خودم"</p>
                <p>• "گزارش کار احمد"</p>
                <p>• "گزارش احمد"</p>
                <p>• "گزارش علی"</p>
                <p>• "report sara"</p>
                <p>• "گزارش سارا"</p>
                <p>• "گزارش محمد"</p>
                <p>• "فعالیت همکار احمد" (فعالیت‌های یک همکار)</p>
              </div>
            </div>

            <div>
              <h3 className="font-medium mb-3 text-gray-700 flex items-center gap-2">
                <Users className="h-4 w-4" />
                گزارشات تیم:
              </h3>
              <div className="space-y-1 text-sm">
                <p>• "گزارشات امروز"</p>
                <p>• "همه گزارشات"</p>
                <p>• "کل گزارشات امروز"</p>
                <p>• "تمام گزارشات امروز"</p>
              </div>
            </div>

            <div>
              <h3 className="font-medium mb-3 text-gray-700 flex items-center gap-2">
                <BarChart3 className="h-4 w-4" />
                تحلیل‌ها:
              </h3>
              <div className="space-y-1 text-sm">
                <p>• "تحلیل فروش یک هفته"</p>
                <p>• "فروش ماه گذشته"</p>
                <p>• "آمار فروش سه ماه"</p>
                <p>• "تحلیل بازخورد هفتگی"</p>
                <p>• "نظرات ماه گذشته"</p>
                <p>• "بازخورد سه ماه"</p>
                <p>• "تحلیل سودآوری هفتگی"</p>
                <p>• "سودآوری ماه گذشته"</p>
                <p>• "سود سه ماه"</p>
              </div>
            </div>

            <div>
              <h3 className="font-medium mb-3 text-gray-700 flex items-center gap-2">
                <MessageCircle className="h-4 w-4" />
                ارسال فایل:
              </h3>
              <div className="space-y-1 text-sm">
                <p>• "فایل گزارش برای احمد"</p>
                <p>• "سند پروژه برای علی"</p>
                <p>• "ارسال قرارداد برای سارا"</p>
                <p>• "فایل مالی برای محمد"</p>
                <p>• "ارسال سند برای مدیر"</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>





      {/* Command History */}
      {commandHistory.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Clock className="h-4 w-4" />
              تاریخچه دستورات صوتی
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-60 overflow-y-auto">
              {commandHistory.map((entry, index) => (
                <div key={index} className="border rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-muted-foreground">{entry.timestamp}</span>
                    <Badge variant={entry.success ? "default" : "destructive"}>
                      {entry.success ? 'موفق' : 'ناموفق'}
                    </Badge>
                  </div>
                  <div className="space-y-2">
                    <div>
                      <span className="text-xs font-medium text-muted-foreground">دستور:</span>
                      <p className="text-sm">{entry.command}</p>
                    </div>
                    <div>
                      <span className="text-xs font-medium text-muted-foreground">پاسخ:</span>
                      <p className="text-sm text-muted-foreground">{entry.response}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}