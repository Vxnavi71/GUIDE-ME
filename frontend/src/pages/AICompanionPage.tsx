import React, { useState, useEffect, useRef } from 'react';
import {
  MessageSquareHeart,
  Send,
  Sparkles,
  Shield,
  Trash2,
  Clock,
  Brain,
  AlertTriangle,
  Keyboard,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Plus,
  Menu,
  X,
  CheckCircle2,
  Target,
  Flame,
  Moon,
  Smile,
  RefreshCw,
  Search,
  Check,
  ChevronRight,
  ExternalLink,
} from 'lucide-react';
import { ApiService } from '../services/api';
import { MarkdownRenderer } from '../components/MarkdownRenderer';
import { useConsent } from '../contexts/ConsentContext';
import { useToast } from '../components/ToastNotification';

interface PendingAction {
  action_id: string;
  tool: string;
  description: string;
  parameters: any;
  status: 'pending' | 'confirmed' | 'cancelled';
}

export const AICompanionPage: React.FC = () => {
  // Session & Message State
  const [conversations, setConversations] = useState<any[]>([]);
  const [activeConvId, setActiveConvId] = useState<string | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [streamingText, setStreamingText] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Tabs & Memories
  const [activeTab, setActiveTab] = useState<'chat' | 'memories'>('chat');
  const [memories, setMemories] = useState<any[]>([]);
  const [memorySearch, setMemorySearch] = useState('');
  const [selectedMemoryType, setSelectedMemoryType] = useState<string>('all');
  const [newMemoryKey, setNewMemoryKey] = useState('');
  const [newMemoryContent, setNewMemoryContent] = useState('');
  const [showAddMemory, setShowAddMemory] = useState(false);

  // Ecosystem Pulse State for Contextual Home
  const [userProfile, setUserProfile] = useState<any>(null);
  const [dashboardSummary, setDashboardSummary] = useState<any>(null);
  const [activeProvider, setActiveProvider] = useState<string>('Mindful AI');

  const { consent } = useConsent();
  const { showToast } = useToast();

  // Typing dynamics
  const [trackTyping, setTrackTyping] = useState(false);
  const [typingStats, setTypingStats] = useState({ keyCount: 0, backspaces: 0, wpm: 0 });
  const typingStartTimeRef = useRef<number | null>(null);
  const lastKeyTimeRef = useRef<number | null>(null);
  const pauseCountRef = useRef<number>(0);
  const keyCountRef = useRef<number>(0);
  const backspaceCountRef = useRef<number>(0);

  // Automatically enable typing tracking when user consent is granted
  useEffect(() => {
    if (consent?.typing_dynamics_consent) {
      setTrackTyping(true);
    }
  }, [consent?.typing_dynamics_consent]);

  // Voice state
  const [isListening, setIsListening] = useState(false);
  const [speakingMsgId, setSpeakingMsgId] = useState<string | null>(null);
  const [autoSpeak, setAutoSpeak] = useState(false);

  // Destructive Actions Pending Confirmation
  const [pendingActions, setPendingActions] = useState<Record<string, PendingAction>>({});
  const [activeToolInfo, setActiveToolInfo] = useState<{ tool: string; args?: any } | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    loadInitialData();

    return () => {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
    };
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamingText, activeToolInfo]);

  const loadInitialData = async () => {
    try {
      // Load user profile & dashboard summary for contextual home state
      const me = await ApiService.getMe().catch(() => null);
      if (me) setUserProfile(me);

      const summary = await ApiService.getDashboardSummary().catch(() => null);
      if (summary) setDashboardSummary(summary);

      // Load conversations
      const convList = await ApiService.listConversations().catch(() => []);
      setConversations(convList);

      if (convList.length > 0) {
        const firstId = convList[0].id;
        setActiveConvId(firstId);
        loadConversationDetails(firstId);
      } else {
        // Create default active conversation
        const defConv = await ApiService.getConversation().catch(() => null);
        if (defConv) {
          setActiveConvId(defConv.id);
          setMessages(defConv.messages || []);
          setConversations([
            {
              id: defConv.id,
              title: defConv.title || 'Mindful Companion Dialogue',
              updated_at: defConv.updated_at || new Date().toISOString(),
              message_count: (defConv.messages || []).length,
            },
          ]);
        }
      }

      loadMemories();
    } catch (err) {
      console.error('Error loading companion data:', err);
    }
  };

  const loadConversationDetails = async (convId: string) => {
    try {
      const conv = await ApiService.getConversationById(convId);
      if (conv?.messages) {
        setMessages(conv.messages);
      }
    } catch (e) {
      console.error('Failed to load conversation messages:', e);
    }
  };

  const loadMemories = async () => {
    try {
      const mems = await ApiService.listMemories();
      setMemories(mems || []);
    } catch (e) {
      console.error('Error loading memories', e);
    }
  };

  const handleSelectConversation = (convId: string) => {
    if (activeConvId === convId) return;
    setActiveConvId(convId);
    setStreamingText('');
    setActiveToolInfo(null);
    loadConversationDetails(convId);
    setSidebarOpen(false);
  };

  const handleCreateNewConversation = async () => {
    try {
      const newConv = await ApiService.createConversation('New Reflection Session');
      setConversations((prev) => [
        {
          id: newConv.id,
          title: newConv.title,
          updated_at: newConv.updated_at,
          message_count: 0,
        },
        ...prev,
      ]);
      setActiveConvId(newConv.id);
      setMessages([]);
      setStreamingText('');
      setActiveToolInfo(null);
      setSidebarOpen(false);
      showToast('Started new reflection session', 'success');
    } catch (e) {
      showToast('Could not start a new session.', 'error');
    }
  };

  const handleDeleteConversation = async (e: React.MouseEvent, convId: string) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to delete this conversation session?')) return;
    try {
      await ApiService.deleteConversation(convId);
      const updated = conversations.filter((c) => c.id !== convId);
      setConversations(updated);
      if (activeConvId === convId) {
        if (updated.length > 0) {
          setActiveConvId(updated[0].id);
          loadConversationDetails(updated[0].id);
        } else {
          setActiveConvId(null);
          setMessages([]);
        }
      }
      showToast('Conversation session deleted.', 'info');
    } catch (err) {
      showToast('Could not delete session.', 'error');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!trackTyping) return;
    const now = Date.now();
    if (!typingStartTimeRef.current) {
      typingStartTimeRef.current = now;
    }
    if (lastKeyTimeRef.current && (now - lastKeyTimeRef.current > 1200)) {
      pauseCountRef.current += 1;
    }
    lastKeyTimeRef.current = now;

    if (e.key === 'Backspace') {
      backspaceCountRef.current += 1;
      setTypingStats((prev) => ({ ...prev, backspaces: prev.backspaces + 1 }));
    } else if (e.key.length === 1) {
      keyCountRef.current += 1;
      const durationMin = (now - (typingStartTimeRef.current || now)) / 60000;
      const currentWpm = durationMin > 0.01 ? Math.min(Math.round((keyCountRef.current / 5) / durationMin), 250) : 0;
      setTypingStats((prev) => ({ ...prev, keyCount: prev.keyCount + 1, wpm: currentWpm }));
    }
  };

  // Main Send with SSE Streaming
  const handleSend = async (e?: React.FormEvent, overrideText?: string) => {
    if (e) e.preventDefault();
    const textToSend = (overrideText || input).trim();
    if (!textToSend || loading) return;

    // Calculate typing dynamics payload
    let typingDynamicsPayload: any = undefined;
    if (trackTyping && keyCountRef.current > 0) {
      const now = Date.now();
      const startTime = typingStartTimeRef.current || now;
      const durationMs = Math.max(now - startTime, 500);
      const minutes = durationMs / 60000;
      const wpm = Math.min(Math.round((keyCountRef.current / 5) / Math.max(minutes, 0.02)), 250);
      const totalKeys = keyCountRef.current + backspaceCountRef.current;
      const backspaceRate = totalKeys > 0 ? Number((backspaceCountRef.current / totalKeys).toFixed(2)) : 0;

      typingDynamicsPayload = {
        typing_speed_wpm: wpm,
        backspace_rate: backspaceRate,
        pause_frequency: pauseCountRef.current,
        session_duration_ms: durationMs,
      };
    }

    // Reset typing counters
    typingStartTimeRef.current = null;
    lastKeyTimeRef.current = null;
    pauseCountRef.current = 0;
    keyCountRef.current = 0;
    backspaceCountRef.current = 0;
    setTypingStats({ keyCount: 0, backspaces: 0, wpm: 0 });

    setInput('');
    setLoading(true);
    setStreamingText('');
    setActiveToolInfo(null);

    const tempUserMsg = {
      id: `temp-${Date.now()}`,
      sender_role: 'user',
      content: textToSend,
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, tempUserMsg]);

    let accumulatedStream = '';

    try {
      await ApiService.streamChatMessage(textToSend, activeConvId || undefined, (event: any) => {
        if (event.type === 'delta') {
          accumulatedStream += event.content;
          setStreamingText(accumulatedStream);
        } else if (event.type === 'tool_start') {
          setActiveToolInfo({ tool: event.tool, args: event.args });
        } else if (event.type === 'tool_done') {
          setActiveToolInfo(null);
        } else if (event.type === 'confirmation_required') {
          setPendingActions((prev) => ({
            ...prev,
            [event.action_id]: {
              action_id: event.action_id,
              tool: event.tool,
              description: event.description,
              parameters: event.parameters,
              status: 'pending',
            },
          }));
        } else if (event.type === 'crisis') {
          // Crisis trigger
          accumulatedStream = event.content;
          setStreamingText(event.content);
        } else if (event.type === 'done') {
          // Finished streaming
          if (event.conversation_id) {
            setActiveConvId(event.conversation_id);
          }
          if (event.provider) {
            setActiveProvider(event.provider);
          }
          const finalMsg = {
            id: `asst-${Date.now()}`,
            sender_role: 'assistant',
            content: event.full_text || accumulatedStream,
            created_at: new Date().toISOString(),
          };
          setMessages((prev) => [...prev, finalMsg]);
          setStreamingText('');
          setActiveToolInfo(null);

          if (autoSpeak && finalMsg.content) {
            speakText(finalMsg.content, finalMsg.id);
          }
        }
      }, typingDynamicsPayload);

      // Refresh memory list & session summaries
      loadMemories();
      const updatedList = await ApiService.listConversations().catch(() => []);
      if (updatedList.length > 0) setConversations(updatedList);
    } catch (err: any) {
      console.warn('Streaming error; attempting non-streaming fallback:', err);
      try {
        const fallbackMsg = await ApiService.sendChatMessage(textToSend, activeConvId || undefined, typingDynamicsPayload);
        if (fallbackMsg?.conversation_id) {
          setActiveConvId(fallbackMsg.conversation_id);
        }
        if (fallbackMsg?.metadata_json?.provider) {
          setActiveProvider(fallbackMsg.metadata_json.provider);
        }
        setMessages((prev) => [...prev, fallbackMsg]);
        if (autoSpeak && fallbackMsg?.content) {
          speakText(fallbackMsg.content, fallbackMsg.id);
        }
        loadMemories();
      } catch (fallbackErr: any) {
        setMessages((prev) => [
          ...prev,
          {
            id: `err-${Date.now()}`,
            sender_role: 'assistant',
            content: "I'm having a brief connection pause. Please try asking again in a moment.",
            metadata_json: { error: true },
            created_at: new Date().toISOString(),
          },
        ]);
      }
    } finally {
      setLoading(false);
      setStreamingText('');
      setActiveToolInfo(null);
    }
  };

  // Confirm / Cancel Destructive Actions
  const handleConfirmAction = async (actionId: string) => {
    try {
      const res = await ApiService.confirmAction(actionId);
      setPendingActions((prev) => ({
        ...prev,
        [actionId]: { ...prev[actionId], status: 'confirmed' },
      }));
      setMessages((prev) => [
        ...prev,
        {
          id: `conf-${Date.now()}`,
          sender_role: 'assistant',
          content: `✅ **Action Confirmed**: ${res.message || 'Operation executed successfully.'}`,
          created_at: new Date().toISOString(),
        },
      ]);
    } catch (err: any) {
      showToast(err.message || 'Action confirmation failed.', 'error');
    }
  };

  const handleCancelAction = async (actionId: string) => {
    try {
      await ApiService.cancelAction(actionId);
      setPendingActions((prev) => ({
        ...prev,
        [actionId]: { ...prev[actionId], status: 'cancelled' },
      }));
      setMessages((prev) => [
        ...prev,
        {
          id: `cancel-${Date.now()}`,
          sender_role: 'assistant',
          content: 'The requested action has been safely cancelled. No changes were made.',
          created_at: new Date().toISOString(),
        },
      ]);
    } catch (err: any) {
      console.error('Cancel error:', err);
    }
  };

  // Web Speech API: Speech-to-Text
  const toggleListening = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      showToast('Speech recognition is not supported in this browser. Please use Chrome, Edge, or Safari.', 'warning');
      return;
    }

    if (isListening) {
      if (recognitionRef.current) recognitionRef.current.stop();
      setIsListening(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onstart = () => setIsListening(true);
      recognition.onresult = (event: any) => {
        let transcript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript;
        }
        setInput(transcript);
      };
      recognition.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
      };
      recognition.onend = () => setIsListening(false);

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err) {
      console.error('Failed to start speech recognition:', err);
      setIsListening(false);
    }
  };

  // Text-to-Speech (TTS)
  const speakText = (text: string, msgId: string) => {
    if (!('speechSynthesis' in window)) {
      showToast('Text-to-speech is not supported in this browser.', 'warning');
      return;
    }

    if (speakingMsgId === msgId) {
      window.speechSynthesis.cancel();
      setSpeakingMsgId(null);
      return;
    }

    window.speechSynthesis.cancel();
    const cleanText = text.replace(/[*_#`[\]()]/g, '');
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.rate = 0.95;
    utterance.pitch = 1.0;

    utterance.onend = () => setSpeakingMsgId(null);
    utterance.onerror = () => setSpeakingMsgId(null);

    setSpeakingMsgId(msgId);
    window.speechSynthesis.speak(utterance);
  };

  // Memory Handlers
  const handleAddMemory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMemoryKey.trim() || !newMemoryContent.trim()) return;
    try {
      const created = await ApiService.createMemory({
        key: newMemoryKey.trim(),
        content: newMemoryContent.trim(),
        memory_type: 'preference',
        confidence: 0.95,
      });
      setMemories((prev) => [created, ...prev]);
      setNewMemoryKey('');
      setNewMemoryContent('');
      setShowAddMemory(false);
      showToast('Memory insight saved.', 'success');
    } catch (e) {
      showToast('Could not add memory.', 'error');
    }
  };

  const handleDeleteMemory = async (id: string) => {
    try {
      await ApiService.deleteMemory(id);
      setMemories((prev) => prev.filter((m) => m.id !== id));
      showToast('Memory item removed.', 'info');
    } catch (e) {
      showToast('Could not delete memory item.', 'error');
    }
  };

  const handleClearChat = async () => {
    if (!confirm('Are you sure you want to clear messages in this session?')) return;
    try {
      if ('speechSynthesis' in window) window.speechSynthesis.cancel();
      setSpeakingMsgId(null);
      await ApiService.clearCompanionChat();
      setMessages([]);
      showToast('Session messages cleared.', 'info');
    } catch (e) {
      showToast('Could not clear chat history.', 'error');
    }
  };

  const filteredMemories = memories.filter((m) => {
    const matchesSearch =
      m.key.toLowerCase().includes(memorySearch.toLowerCase()) ||
      m.content.toLowerCase().includes(memorySearch.toLowerCase());
    const matchesType = selectedMemoryType === 'all' || m.memory_type === selectedMemoryType;
    return matchesSearch && matchesType;
  });

  const userName = userProfile?.profile?.preferred_name || userProfile?.full_name?.split(' ')[0] || 'Friend';

  return (
    <div className="bg-white dark:bg-forest-900 border border-earth-200 dark:border-forest-800 rounded-2xl shadow-sm overflow-hidden flex h-[calc(100vh-7.5rem)] relative">
      {/* 1. Left Sidebar: Conversations Session List */}
      <div
        className={`fixed inset-y-0 left-0 z-30 w-72 bg-earth-50 dark:bg-forest-950 border-r border-earth-200 dark:border-forest-800 flex flex-col transition-transform duration-200 md:relative md:translate-x-0 ${
          sidebarOpen ? 'translate-x-0 shadow-xl' : '-translate-x-full md:translate-x-0'
        }`}
      >
        {/* Sidebar Header */}
        <div className="p-4 border-b border-earth-200 dark:border-forest-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MessageSquareHeart className="w-5 h-5 text-sage-600 dark:text-sage-400" />
            <h2 className="text-sm font-bold text-forest-950 dark:text-sage-100">AI Companion</h2>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="md:hidden p-1 text-earth-500 hover:text-forest-900 dark:hover:text-sage-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* New Session Button */}
        <div className="p-3">
          <button
            onClick={handleCreateNewConversation}
            className="w-full py-2.5 px-3 rounded-xl bg-sage-600 hover:bg-sage-700 text-white text-xs font-semibold flex items-center justify-center gap-2 shadow-sm transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>New Reflection Session</span>
          </button>
        </div>

        {/* Session Thread List */}
        <div className="flex-1 overflow-y-auto px-3 py-2 space-y-1.5">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-earth-400 dark:text-sage-400 px-2 mb-1">
            Recent Sessions ({conversations.length})
          </div>

          {conversations.length === 0 ? (
            <div className="p-4 text-center text-xs text-earth-400 dark:text-sage-400">
              No sessions yet. Click "+ New Reflection Session".
            </div>
          ) : (
            conversations.map((c) => {
              const isActive = c.id === activeConvId;
              return (
                <div
                  key={c.id}
                  onClick={() => handleSelectConversation(c.id)}
                  className={`group w-full p-2.5 rounded-xl text-left text-xs transition-all cursor-pointer flex items-center justify-between ${
                    isActive
                      ? 'bg-sage-100 dark:bg-forest-800 border border-sage-300 dark:border-forest-700 text-forest-950 dark:text-sage-100 font-semibold shadow-xs'
                      : 'hover:bg-earth-100 dark:hover:bg-forest-800/60 text-earth-700 dark:text-sage-300 border border-transparent'
                  }`}
                >
                  <div className="truncate pr-2 flex-1">
                    <p className="truncate">{c.title || 'Mindful Companion Dialogue'}</p>
                    <span className="text-[10px] text-earth-400 dark:text-sage-400 flex items-center gap-1 mt-0.5">
                      <Clock className="w-2.5 h-2.5" />
                      {new Date(c.updated_at).toLocaleDateString([], { month: 'short', day: 'numeric' })} · {c.message_count || 0} msgs
                    </span>
                  </div>

                  <button
                    onClick={(e) => handleDeleteConversation(e, c.id)}
                    className="opacity-0 group-hover:opacity-100 p-1 text-earth-400 hover:text-rose-600 dark:hover:text-rose-400 transition-opacity"
                    title="Delete session"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            })
          )}
        </div>

        {/* Gemini Engine Connected Badge */}
        <div className="p-3 border-t border-earth-200 dark:border-forest-800 bg-earth-100/50 dark:bg-forest-900/50 flex items-center justify-between text-[11px] text-earth-600 dark:text-sage-400">
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="font-medium">Google Gemini Engine</span>
          </div>
          <span className="text-[10px] bg-sage-200/60 dark:bg-forest-800 px-1.5 py-0.5 rounded font-mono">1.5 Flash</span>
        </div>
      </div>

      {/* Mobile Overlay backdrop */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 bg-black/40 z-20 md:hidden"
        />
      )}

      {/* 2. Main Workstation Area */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Top Header */}
        <div className="p-3.5 md:px-5 border-b border-earth-200 dark:border-forest-800 flex items-center justify-between bg-earth-50/60 dark:bg-forest-900/60">
          <div className="flex items-center gap-2.5">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="md:hidden p-1.5 rounded-lg border border-earth-200 dark:border-forest-800 hover:bg-earth-100 dark:hover:bg-forest-800 text-forest-900 dark:text-sage-200"
              title="Toggle sessions"
            >
              <Menu className="w-4 h-4" />
            </button>

            <div>
              <h1 className="text-sm font-semibold text-forest-950 dark:text-sage-100 flex items-center gap-2">
                <span>Personal AI Companion</span>
                <span className="text-[10px] bg-sage-100 dark:bg-forest-800 text-sage-800 dark:text-sage-200 border border-sage-300 dark:border-forest-700 px-2 py-0.5 rounded-full font-medium">
                  Tool-Enabled
                </span>
                <span className="text-[10px] bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 px-2 py-0.5 rounded-full font-medium flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  {activeProvider}
                </span>
              </h1>
              <p className="text-[11px] text-earth-500 dark:text-sage-400 hidden sm:block">
                Ecosystem aware: Goals, habits, journals, sleep & stress reflections
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Auto-Speak Toggle */}
            <button
              onClick={() => setAutoSpeak(!autoSpeak)}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-medium transition-colors ${
                autoSpeak
                  ? 'bg-sage-100 dark:bg-forest-800 border-sage-300 dark:border-forest-700 text-sage-800 dark:text-sage-200'
                  : 'border-earth-200 dark:border-forest-800 text-earth-500 dark:text-sage-400 hover:bg-earth-100 dark:hover:bg-forest-800'
              }`}
              title="Read responses aloud automatically"
            >
              {autoSpeak ? <Volume2 className="w-3.5 h-3.5 text-sage-600" /> : <VolumeX className="w-3.5 h-3.5" />}
              <span className="hidden sm:inline">{autoSpeak ? 'Voice: On' : 'Voice: Off'}</span>
            </button>

            {/* Clear Chat Button */}
            {activeTab === 'chat' && messages.length > 0 && (
              <button
                onClick={handleClearChat}
                className="p-1.5 sm:px-2.5 sm:py-1.5 rounded-lg border border-earth-300 dark:border-forest-700 hover:bg-earth-100 dark:hover:bg-forest-800 text-earth-600 dark:text-sage-300 text-xs transition-colors flex items-center gap-1"
                title="Clear current session messages"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Clear</span>
              </button>
            )}

            {/* Tab Switcher */}
            <div className="flex p-0.5 rounded-lg bg-earth-200/70 dark:bg-forest-800 text-xs font-medium">
              <button
                onClick={() => setActiveTab('chat')}
                className={`px-3 py-1 rounded-md transition-all ${
                  activeTab === 'chat'
                    ? 'bg-white dark:bg-forest-700 text-forest-950 dark:text-sage-100 shadow-xs'
                    : 'text-earth-600 dark:text-sage-400'
                }`}
              >
                Dialogue
              </button>
              <button
                onClick={() => setActiveTab('memories')}
                className={`px-3 py-1 rounded-md transition-all flex items-center gap-1.5 ${
                  activeTab === 'memories'
                    ? 'bg-white dark:bg-forest-700 text-forest-950 dark:text-sage-100 shadow-xs'
                    : 'text-earth-600 dark:text-sage-400'
                }`}
              >
                <Brain className="w-3.5 h-3.5 text-sage-600 dark:text-sage-400" />
                <span>Memories ({memories.length})</span>
              </button>
            </div>
          </div>
        </div>

        {/* Tab 1: Chat Stream View */}
        {activeTab === 'chat' ? (
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Messages Scroll Area */}
            <div className="flex-1 p-4 md:p-6 overflow-y-auto space-y-4">
              {/* Contextual Home State (When empty) */}
              {messages.length === 0 && !streamingText ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-4 max-w-xl mx-auto">
                  <div className="w-12 h-12 rounded-2xl bg-sage-100 dark:bg-forest-800 flex items-center justify-center text-sage-600 dark:text-sage-300 mb-3 shadow-sm">
                    <Sparkles className="w-6 h-6" />
                  </div>

                  <h2 className="text-base font-bold text-forest-950 dark:text-sage-100">
                    Welcome back, {userName}
                  </h2>
                  <p className="text-xs text-earth-500 dark:text-sage-400 mt-1 mb-5">
                    How is your energy flowing today? The companion connects directly with your real goals, habits, and reflections.
                  </p>

                  {/* Live Ecosystem Summary Badges */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 w-full mb-6">
                    <div className="p-2.5 rounded-xl border border-earth-200 dark:border-forest-800 bg-earth-50/60 dark:bg-forest-800/40 text-left">
                      <div className="flex items-center gap-1.5 text-[10px] font-semibold text-earth-500 dark:text-sage-400 mb-0.5">
                        <Target className="w-3 h-3 text-sage-600" />
                        <span>Goals</span>
                      </div>
                      <p className="text-xs font-bold text-forest-900 dark:text-sage-200">
                        {dashboardSummary?.active_goals_count !== undefined ? `${dashboardSummary.active_goals_count} Active` : '—'}
                      </p>
                    </div>

                    <div className="p-2.5 rounded-xl border border-earth-200 dark:border-forest-800 bg-earth-50/60 dark:bg-forest-800/40 text-left">
                      <div className="flex items-center gap-1.5 text-[10px] font-semibold text-earth-500 dark:text-sage-400 mb-0.5">
                        <Flame className="w-3 h-3 text-amber-500" />
                        <span>Habits</span>
                      </div>
                      <p className="text-xs font-bold text-forest-900 dark:text-sage-200">
                        {dashboardSummary?.habits_completed_today !== undefined ? `${dashboardSummary.habits_completed_today} Done` : '—'}
                      </p>
                    </div>

                    <div className="p-2.5 rounded-xl border border-earth-200 dark:border-forest-800 bg-earth-50/60 dark:bg-forest-800/40 text-left">
                      <div className="flex items-center gap-1.5 text-[10px] font-semibold text-earth-500 dark:text-sage-400 mb-0.5">
                        <Smile className="w-3 h-3 text-emerald-500" />
                        <span>Mood</span>
                      </div>
                      <p className="text-xs font-bold text-forest-900 dark:text-sage-200">
                        {dashboardSummary?.latest_mood ? `${dashboardSummary.latest_mood}/10` : '—'}
                      </p>
                    </div>

                    <div className="p-2.5 rounded-xl border border-earth-200 dark:border-forest-800 bg-earth-50/60 dark:bg-forest-800/40 text-left">
                      <div className="flex items-center gap-1.5 text-[10px] font-semibold text-earth-500 dark:text-sage-400 mb-0.5">
                        <Moon className="w-3 h-3 text-indigo-500" />
                        <span>Sleep</span>
                      </div>
                      <p className="text-xs font-bold text-forest-900 dark:text-sage-200">
                        {dashboardSummary?.sleep_hours ? `${dashboardSummary.sleep_hours}h` : '—'}
                      </p>
                    </div>
                  </div>

                  {/* Quick Action Chips */}
                  <div className="space-y-2 w-full">
                    <p className="text-[11px] font-semibold text-earth-400 dark:text-sage-400 uppercase tracking-wider text-left px-1">
                      Quick Reflection Prompts
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {[
                        'Review my active goals and give me an encouraging nudge',
                        'Create a goal to walk 20 minutes daily',
                        'Guide me through a calming 4-7-8 breathing exercise',
                        'I feel mentally scattered with competing deadlines today',
                      ].map((prompt, idx) => (
                        <button
                          key={idx}
                          onClick={() => handleSend(undefined, prompt)}
                          className="text-left text-xs p-3 rounded-xl border border-earth-200 dark:border-forest-800 hover:bg-earth-100 dark:hover:bg-forest-800 text-earth-800 dark:text-sage-200 transition-colors flex items-center justify-between group"
                        >
                          <span className="truncate pr-2">"{prompt}"</span>
                          <ChevronRight className="w-3.5 h-3.5 text-earth-400 group-hover:text-sage-600 transition-colors flex-shrink-0" />
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                /* Message History */
                messages.map((msg) => {
                  const isUser = msg.sender_role === 'user';
                  const isCrisis = msg.metadata_json?.crisis || msg.metadata_json?.safety_triggered;
                  const isSpeakingThis = speakingMsgId === msg.id;

                  return (
                    <div key={msg.id} className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
                      <div
                        className={`max-w-[88%] md:max-w-2xl p-4 rounded-2xl text-sm leading-relaxed ${
                          isUser
                            ? 'bg-sage-600 text-white rounded-br-none shadow-sm'
                            : isCrisis
                            ? 'bg-rose-50 dark:bg-rose-950/60 border border-rose-300 dark:border-rose-900 text-rose-950 dark:text-rose-100 rounded-bl-none shadow-xs'
                            : 'bg-earth-100 dark:bg-forest-800 text-forest-950 dark:text-sage-100 rounded-bl-none shadow-xs'
                        }`}
                      >
                        {/* Crisis Emergency Banner */}
                        {isCrisis && (
                          <div className="flex items-center gap-1.5 text-xs font-bold text-rose-700 dark:text-rose-300 mb-2.5 pb-2 border-b border-rose-200 dark:border-rose-800">
                            <AlertTriangle className="w-4 h-4 text-rose-600 animate-pulse" />
                            <span>Clinical Safety Guardrail Activated (India Crisis Resources)</span>
                          </div>
                        )}

                        {/* Message Content Rendered with Markdown */}
                        {isUser ? (
                          <p className="whitespace-pre-line">{msg.content}</p>
                        ) : (
                          <MarkdownRenderer content={msg.content} />
                        )}

                        {/* Footer with Voice & Timestamp */}
                        <div
                          className={`flex items-center justify-between mt-2.5 pt-1.5 border-t ${
                            isUser
                              ? 'border-sage-500/40 text-sage-200'
                              : 'border-earth-200/60 dark:border-forest-700/60 text-earth-400 dark:text-sage-400'
                          }`}
                        >
                          {!isUser ? (
                            <button
                              onClick={() => speakText(msg.content, msg.id)}
                              className={`flex items-center gap-1 text-[11px] font-medium transition-colors ${
                                isSpeakingThis ? 'text-emerald-600 font-bold' : 'hover:text-forest-900 dark:hover:text-sage-200'
                              }`}
                              title={isSpeakingThis ? 'Stop speaking' : 'Read aloud with voice'}
                            >
                              {isSpeakingThis ? (
                                <>
                                  <VolumeX className="w-3.5 h-3.5 text-emerald-600 animate-pulse" />
                                  <span>Stop</span>
                                </>
                              ) : (
                                <>
                                  <Volume2 className="w-3.5 h-3.5" />
                                  <span>Listen</span>
                                </>
                              )}
                            </button>
                          ) : (
                            <span />
                          )}
                          <span className="text-[10px]">
                            {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}

              {/* Tool Execution In-Progress Indicator */}
              {activeToolInfo && (
                <div className="flex justify-start">
                  <div className="p-3 rounded-xl bg-sage-50 dark:bg-forest-800/80 border border-sage-300 dark:border-forest-700 text-xs text-sage-900 dark:text-sage-200 flex items-center gap-2">
                    <RefreshCw className="w-3.5 h-3.5 animate-spin text-sage-600" />
                    <span>
                      Executing <strong>{activeToolInfo.tool.replace(/_/g, ' ')}</strong> on your GuideMe workspace...
                    </span>
                  </div>
                </div>
              )}

              {/* Streaming Output Indicator */}
              {streamingText && (
                <div className="flex justify-start">
                  <div className="max-w-[88%] md:max-w-2xl p-4 rounded-2xl text-sm leading-relaxed bg-earth-100 dark:bg-forest-800 text-forest-950 dark:text-sage-100 rounded-bl-none shadow-xs">
                    <MarkdownRenderer content={streamingText} />
                    <span className="inline-block w-2 h-4 ml-1 bg-sage-600 animate-pulse align-middle" />
                  </div>
                </div>
              )}

              {/* Destructive Action Inline Confirmation Cards */}
              {Object.values(pendingActions).map((act) => {
                if (act.status !== 'pending') return null;
                return (
                  <div key={act.action_id} className="flex justify-start w-full">
                    <div className="w-full max-w-lg p-4 rounded-2xl border-2 border-amber-300 dark:border-amber-700 bg-amber-50/80 dark:bg-amber-950/40 text-forest-950 dark:text-amber-100 shadow-sm">
                      <div className="flex items-center gap-2 text-xs font-bold text-amber-800 dark:text-amber-300 mb-1.5">
                        <AlertTriangle className="w-4 h-4 text-amber-600" />
                        <span>Explicit Confirmation Required</span>
                      </div>
                      <p className="text-xs text-amber-900 dark:text-amber-200 mb-3">
                        The AI Companion is requesting to execute: <strong>{act.description}</strong>. This cannot be undone.
                      </p>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleConfirmAction(act.action_id)}
                          className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-xs"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>Confirm Permanent Action</span>
                        </button>
                        <button
                          onClick={() => handleCancelAction(act.action_id)}
                          className="px-3 py-1.5 rounded-lg border border-earth-300 dark:border-forest-700 hover:bg-earth-200 dark:hover:bg-forest-800 text-earth-700 dark:text-sage-200 text-xs font-medium transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}

              <div ref={messagesEndRef} />
            </div>

            {/* Typing dynamics toggle */}
            <div className="px-4 py-1.5 bg-earth-50 dark:bg-forest-950/40 border-t border-earth-200 dark:border-forest-800 flex items-center justify-between text-[11px] text-earth-500 dark:text-sage-400">
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={trackTyping}
                  onChange={(e) => setTrackTyping(e.target.checked)}
                  className="rounded border-earth-300 text-sage-600 focus:ring-sage-500 w-3 h-3"
                />
                <Keyboard className="w-3 h-3" />
                <span>Typing cadence signal</span>
              </label>
              {trackTyping && (
                <span>
                  Keys: {typingStats.keyCount} · Corrections: {typingStats.backspaces}
                </span>
              )}
            </div>

            {/* Input Bar with Microphone & Voice STT */}
            <form onSubmit={handleSend} className="p-3.5 border-t border-earth-200 dark:border-forest-800 flex items-center gap-2 bg-white dark:bg-forest-900">
              <button
                type="button"
                onClick={toggleListening}
                className={`p-2.5 rounded-xl transition-all ${
                  isListening
                    ? 'bg-rose-500 text-white animate-pulse shadow-md ring-2 ring-rose-300'
                    : 'bg-earth-100 hover:bg-earth-200 dark:bg-forest-800 dark:hover:bg-forest-700 text-earth-700 dark:text-sage-200'
                }`}
                title={isListening ? 'Stop microphone' : 'Click to speak via microphone'}
              >
                {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
              </button>

              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={isListening ? 'Listening to your voice...' : 'Ask companion, create a goal, or log a reflection...'}
                className="flex-1 px-4 py-2.5 text-sm rounded-xl border border-earth-300 dark:border-forest-700 bg-white dark:bg-forest-800 text-forest-950 dark:text-sage-100 focus:ring-2 focus:ring-sage-500 outline-none"
              />

              <button
                type="submit"
                disabled={loading || !input.trim()}
                className="px-4 py-2.5 rounded-xl bg-sage-600 hover:bg-sage-700 text-white transition-colors disabled:opacity-40 flex items-center gap-1.5 text-sm font-medium shadow-xs"
              >
                <span>Send</span>
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        ) : (
          /* Tab 2: Memories & Transparency Management */
          <div className="flex-1 p-4 md:p-6 overflow-y-auto space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-earth-200 dark:border-forest-800">
              <div>
                <h2 className="text-sm font-bold text-forest-950 dark:text-sage-100 flex items-center gap-2">
                  <span>Transparent AI Memory</span>
                  <span className="text-[10px] bg-sage-100 dark:bg-forest-800 text-sage-800 dark:text-sage-200 px-2 py-0.5 rounded-full font-medium">
                    Zero Secret Storage
                  </span>
                </h2>
                <p className="text-xs text-earth-500 dark:text-sage-400 mt-0.5">
                  Insights explicitly remembered from your dialogues. You maintain full sovereignty to edit or delete them.
                </p>
              </div>

              <button
                onClick={() => setShowAddMemory(!showAddMemory)}
                className="px-3 py-1.5 rounded-xl bg-sage-600 hover:bg-sage-700 text-white text-xs font-semibold flex items-center gap-1.5 self-start sm:self-auto transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Memory</span>
              </button>
            </div>

            {/* Add Memory Form */}
            {showAddMemory && (
              <form onSubmit={handleAddMemory} className="p-4 rounded-xl border border-sage-200 dark:border-forest-700 bg-sage-50/50 dark:bg-forest-800/60 space-y-3">
                <h3 className="text-xs font-bold text-forest-950 dark:text-sage-100">Add New Personal Insight</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <input
                    type="text"
                    placeholder="Key (e.g. morning_routine)"
                    value={newMemoryKey}
                    onChange={(e) => setNewMemoryKey(e.target.value)}
                    className="px-3 py-2 text-xs rounded-lg border border-earth-300 dark:border-forest-700 bg-white dark:bg-forest-900 text-forest-900 dark:text-sage-100 outline-none"
                    required
                  />
                  <input
                    type="text"
                    placeholder="Content (e.g. Enjoys 15 minutes of quiet tea before work)"
                    value={newMemoryContent}
                    onChange={(e) => setNewMemoryContent(e.target.value)}
                    className="px-3 py-2 text-xs rounded-lg border border-earth-300 dark:border-forest-700 bg-white dark:bg-forest-900 text-forest-900 dark:text-sage-100 outline-none"
                    required
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowAddMemory(false)}
                    className="px-3 py-1.5 rounded-lg border border-earth-300 dark:border-forest-700 text-xs text-earth-600 dark:text-sage-300"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-3 py-1.5 rounded-lg bg-sage-600 hover:bg-sage-700 text-white text-xs font-semibold"
                  >
                    Save Memory
                  </button>
                </div>
              </form>
            )}

            {/* Search & Filter */}
            <div className="flex flex-col sm:flex-row gap-2 items-center justify-between">
              <div className="relative w-full sm:w-64">
                <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-earth-400" />
                <input
                  type="text"
                  placeholder="Search memories..."
                  value={memorySearch}
                  onChange={(e) => setMemorySearch(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border border-earth-200 dark:border-forest-800 bg-earth-50 dark:bg-forest-800 text-forest-950 dark:text-sage-100 outline-none"
                />
              </div>

              <div className="flex gap-1.5 w-full sm:w-auto overflow-x-auto">
                {['all', 'preference', 'wellness_goal', 'stressor'].map((type) => (
                  <button
                    key={type}
                    onClick={() => setSelectedMemoryType(type)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-colors ${
                      selectedMemoryType === type
                        ? 'bg-sage-600 text-white'
                        : 'bg-earth-100 dark:bg-forest-800 text-earth-600 dark:text-sage-300 hover:bg-earth-200 dark:hover:bg-forest-700'
                    }`}
                  >
                    {type.replace('_', ' ').toUpperCase()}
                  </button>
                ))}
              </div>
            </div>

            {/* Memories List */}
            {filteredMemories.length === 0 ? (
              <div className="p-8 text-center text-xs text-earth-400 dark:text-sage-400 border border-dashed border-earth-300 dark:border-forest-700 rounded-xl">
                No memories match your query. Talk with your companion or add a memory above.
              </div>
            ) : (
              <div className="space-y-2.5">
                {filteredMemories.map((m) => (
                  <div
                    key={m.id}
                    className="p-3.5 rounded-xl border border-earth-200 dark:border-forest-800 bg-earth-50/70 dark:bg-forest-800/40 flex items-center justify-between group hover:border-sage-300 transition-colors"
                  >
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[10px] uppercase font-bold text-sage-700 dark:text-sage-300 bg-sage-100 dark:bg-forest-700 px-2 py-0.5 rounded">
                          {m.memory_type}
                        </span>
                        <span className="text-xs font-semibold text-forest-900 dark:text-sage-100">{m.key}</span>
                        <span className="text-[11px] text-earth-400 dark:text-sage-400">
                          ({Math.round((m.confidence || 0.9) * 100)}% confidence)
                        </span>
                      </div>
                      <p className="text-xs text-earth-700 dark:text-sage-200">{m.content}</p>
                    </div>

                    <button
                      onClick={() => handleDeleteMemory(m.id)}
                      className="p-2 text-earth-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-lg transition-colors"
                      title="Permanently delete this memory"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
