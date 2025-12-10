import { useState, useRef, useEffect } from 'react';
import { Send, X, Minimize2, Maximize2, Bot, User, Loader2, Volume2, VolumeX, Music, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import ReactMarkdown from 'react-markdown';

const API_BASE = 'https://www.n8nbalao.com/api';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  audioUrl?: string;
  musicData?: {
    title: string;
    audioUrl: string;
    imageUrl?: string;
  }[];
}

interface LorenzoChatProps {
  isOpen: boolean;
  onClose: () => void;
  customerId?: string;
}

const LorenzoChat = ({ isOpen, onClose, customerId }: LorenzoChatProps) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: 'Olá! 🎈 Sou o **Lorenzo**, assistente virtual da Balão da Informática!\n\nComo posso ajudar você hoje?\n\n- 🖥️ Montar um PC\n- 💰 Ver produtos e preços\n- ❓ Tirar dúvidas técnicas\n- 📦 Consultar pedidos\n- 🎵 Me pedir uma música!',
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [generatingMusic, setGeneratingMusic] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    if (isOpen && !isMinimized && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen, isMinimized]);

  const playAudio = async (text: string): Promise<string | null> => {
    try {
      console.log('🔊 Requesting TTS for:', text.substring(0, 50) + '...');
      const response = await fetch(`${API_BASE}/text-to-speech.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text })
      });

      const data = await response.json();
      console.log('🔊 TTS response:', data.success ? 'Audio received' : data.error);

      if (data.success && data.audio) {
        const audioBlob = base64ToBlob(data.audio, data.contentType || 'audio/mpeg');
        const audioUrl = URL.createObjectURL(audioBlob);
        
        // Play audio
        if (audioRef.current) {
          audioRef.current.pause();
        }
        audioRef.current = new Audio(audioUrl);
        setIsPlayingAudio(true);
        audioRef.current.onended = () => setIsPlayingAudio(false);
        audioRef.current.onerror = () => setIsPlayingAudio(false);
        await audioRef.current.play();
        
        return audioUrl;
      } else {
        console.warn('🔊 TTS failed:', data.error || 'Unknown error');
      }
    } catch (error) {
      console.error('🔊 TTS error:', error);
    }
    return null;
  };

  const base64ToBlob = (base64: string, contentType: string): Blob => {
    const byteCharacters = atob(base64);
    const byteArrays = [];

    for (let offset = 0; offset < byteCharacters.length; offset += 512) {
      const slice = byteCharacters.slice(offset, offset + 512);
      const byteNumbers = new Array(slice.length);
      for (let i = 0; i < slice.length; i++) {
        byteNumbers[i] = slice.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      byteArrays.push(byteArray);
    }

    return new Blob(byteArrays, { type: contentType });
  };

  const stopAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setIsPlayingAudio(false);
    }
  };

  // Check if message contains music generation command
  const checkForMusicGeneration = async (text: string): Promise<Message | null> => {
    const musicMatch = text.match(/\[GERAR_MUSICA\]\s*tema:\s*([^|]+)\s*\|\s*estilo:\s*([^|]+)\s*\|\s*titulo:\s*(.+)/i);
    
    if (musicMatch) {
      const [, tema, estilo, titulo] = musicMatch;
      setGeneratingMusic(true);
      
      try {
        // Start music generation
        const response = await fetch(`${API_BASE}/suno-generate.php`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            prompt: tema.trim(),
            style: estilo.trim(),
            title: titulo.trim()
          })
        });
        
        const data = await response.json();
        
        if (data.success && data.taskId) {
          // Poll for completion
          let attempts = 0;
          const maxAttempts = 60; // 2 minutes max
          
          while (attempts < maxAttempts) {
            await new Promise(r => setTimeout(r, 2000)); // Wait 2 seconds
            
            const statusResponse = await fetch(`${API_BASE}/suno-status.php?taskId=${data.taskId}`);
            const statusData = await statusResponse.json();
            
            if (statusData.status === 'COMPLETED' && statusData.music) {
              setGeneratingMusic(false);
              return {
                id: Date.now().toString(),
                role: 'assistant',
                content: `🎵 **A música ficou pronta!**\n\n"${titulo.trim()}" está disponível para download!`,
                timestamp: new Date(),
                musicData: statusData.music
              };
            } else if (statusData.status === 'FAILED') {
              throw new Error('Falha na geração da música');
            }
            
            attempts++;
          }
          
          throw new Error('Tempo limite excedido');
        }
      } catch (error) {
        console.error('Music generation error:', error);
        setGeneratingMusic(false);
        return {
          id: Date.now().toString(),
          role: 'assistant',
          content: '😅 Ops! A banda teve um probleminha técnico... Tenta pedir a música de novo?',
          timestamp: new Date()
        };
      }
    }
    
    return null;
  };

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch(`${API_BASE}/chat-ai.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...messages.slice(1), userMessage].map(m => ({
            role: m.role,
            content: m.content
          })),
          customerId
        })
      });

      const data = await response.json();

      if (data.success && data.message) {
        // Check if AI wants to generate music
        const musicMessage = await checkForMusicGeneration(data.message);
        
        if (musicMessage) {
          // Remove the [GERAR_MUSICA] command from displayed message
          const cleanContent = data.message.replace(/\*\*\[GERAR_MUSICA\]\*\*.*/s, '').trim();
          
          const assistantMessage: Message = {
            id: (Date.now() + 1).toString(),
            role: 'assistant',
            content: cleanContent || '🎸 A banda está tocando sua música...',
            timestamp: new Date()
          };
          setMessages(prev => [...prev, assistantMessage, musicMessage]);
        } else {
          const assistantMessage: Message = {
            id: (Date.now() + 1).toString(),
            role: 'assistant',
            content: data.message,
            timestamp: new Date()
          };
          setMessages(prev => [...prev, assistantMessage]);

          // Play voice response if enabled
          if (voiceEnabled) {
            // Clean markdown for better audio
            const cleanText = data.message
              .replace(/\*\*/g, '')
              .replace(/\*/g, '')
              .replace(/#{1,6}\s/g, '')
              .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
              .replace(/`[^`]+`/g, '')
              .replace(/\n+/g, ' ')
              .replace(/\[GERAR_MUSICA\].*/gi, '')
              .trim();
            
            if (cleanText.length > 0 && cleanText.length < 5000) {
              playAudio(cleanText);
            }
          }
        }
      } else {
        throw new Error(data.error || 'Erro ao processar mensagem');
      }
    } catch (error) {
      console.error('Chat error:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Desculpe, tive um problema ao processar sua mensagem. 😅 Pode tentar novamente?',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  if (!isOpen) return null;

  return (
    <div className={`fixed bottom-4 right-4 z-50 flex flex-col bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden transition-all duration-300 ${
      isMinimized ? 'w-80 h-16' : 'w-96 h-[600px] max-h-[80vh]'
    }`}>
      {/* Header */}
      <div className="bg-gradient-to-r from-red-600 to-red-700 text-white p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
            <Bot className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-bold">Lorenzo</h3>
            <p className="text-xs text-white/80">
              {isPlayingAudio ? '🔊 Falando...' : 'Assistente Virtual 🎈'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <Button 
            variant="ghost" 
            size="icon" 
            className="text-white hover:bg-white/20 h-8 w-8"
            onClick={() => {
              if (isPlayingAudio) {
                stopAudio();
              }
              setVoiceEnabled(!voiceEnabled);
            }}
            title={voiceEnabled ? 'Desativar voz' : 'Ativar voz'}
          >
            {voiceEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </Button>
          <Button 
            variant="ghost" 
            size="icon" 
            className="text-white hover:bg-white/20 h-8 w-8"
            onClick={() => setIsMinimized(!isMinimized)}
          >
            {isMinimized ? <Maximize2 className="w-4 h-4" /> : <Minimize2 className="w-4 h-4" />}
          </Button>
          <Button 
            variant="ghost" 
            size="icon" 
            className="text-white hover:bg-white/20 h-8 w-8"
            onClick={onClose}
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {!isMinimized && (
        <>
          {/* Messages */}
          <ScrollArea className="flex-1 p-4" ref={scrollRef}>
            <div className="space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex gap-3 ${message.role === 'user' ? 'flex-row-reverse' : ''}`}
                >
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                    message.role === 'user' 
                      ? 'bg-blue-500 text-white' 
                      : 'bg-red-100 text-red-600'
                  }`}>
                    {message.role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                  </div>
                  <div className={`max-w-[80%] rounded-2xl px-4 py-2 ${
                    message.role === 'user'
                      ? 'bg-blue-500 text-white rounded-tr-sm'
                      : 'bg-gray-100 text-gray-800 rounded-tl-sm'
                  }`}>
                    <div className={`prose prose-sm max-w-none ${message.role === 'user' ? 'prose-invert' : ''}`}>
                      <ReactMarkdown
                        components={{
                          p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                          ul: ({ children }) => <ul className="list-disc ml-4 mb-2">{children}</ul>,
                          li: ({ children }) => <li className="mb-1">{children}</li>,
                          strong: ({ children }) => <strong className="font-bold">{children}</strong>,
                          a: ({ href, children }) => (
                            <a 
                              href={href} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-blue-600 underline hover:text-blue-800"
                            >
                              {children}
                            </a>
                          ),
                        }}
                      >
                        {message.content}
                      </ReactMarkdown>
                    </div>
                    
                    {/* Music player if music data exists */}
                    {message.musicData && message.musicData.length > 0 && (
                      <div className="mt-3 space-y-2">
                        {message.musicData.map((music, idx) => (
                          <div key={idx} className="bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg p-3 text-white">
                            <div className="flex items-center gap-3">
                              {music.imageUrl && (
                                <img src={music.imageUrl} alt={music.title} className="w-12 h-12 rounded-lg object-cover" />
                              )}
                              <div className="flex-1">
                                <p className="font-bold flex items-center gap-2">
                                  <Music className="w-4 h-4" />
                                  {music.title}
                                </p>
                                <audio controls className="w-full mt-2 h-8" src={music.audioUrl}>
                                  Seu navegador não suporta áudio
                                </audio>
                              </div>
                            </div>
                            <a
                              href={music.audioUrl}
                              download={`${music.title}.mp3`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="mt-2 flex items-center justify-center gap-2 bg-white/20 hover:bg-white/30 rounded-lg py-2 text-sm font-medium transition-colors"
                            >
                              <Download className="w-4 h-4" />
                              Download
                            </a>
                          </div>
                        ))}
                      </div>
                    )}
                    
                    <p className={`text-xs mt-1 ${message.role === 'user' ? 'text-white/70' : 'text-gray-400'}`}>
                      {message.timestamp.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              ))}
              
              {(isLoading || generatingMusic) && (
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-red-100 text-red-600 flex items-center justify-center">
                    <Bot className="w-4 h-4" />
                  </div>
                  <div className="bg-gray-100 rounded-2xl rounded-tl-sm px-4 py-3">
                    <div className="flex items-center gap-2 text-gray-500">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span className="text-sm">
                        {generatingMusic ? '🎸 A banda está tocando sua música...' : 'Lorenzo está digitando...'}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>

          {/* Input */}
          <div className="p-4 border-t border-gray-200 bg-gray-50">
            <div className="flex gap-2">
              <Input
                ref={inputRef}
                placeholder="Digite sua mensagem..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                disabled={isLoading}
                className="flex-1 rounded-full border-gray-300 focus:border-red-500 focus:ring-red-500"
              />
              <Button 
                onClick={sendMessage} 
                disabled={!input.trim() || isLoading}
                className="rounded-full bg-red-600 hover:bg-red-700 w-10 h-10 p-0"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
            <p className="text-xs text-center text-gray-400 mt-2">
              {voiceEnabled ? '🔊 Voz ativada' : '🔇 Voz desativada'} • Powered by Lorenzo AI 🎈
            </p>
          </div>
        </>
      )}
    </div>
  );
};

export default LorenzoChat;
