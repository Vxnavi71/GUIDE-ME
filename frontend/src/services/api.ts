export class ApiService {
  public static getApiBaseUrl(): string {
    const isProductionWeb =
      import.meta.env.PROD &&
      typeof window !== 'undefined' &&
      window.location.hostname !== 'localhost' &&
      window.location.hostname !== '127.0.0.1';

    const custom = localStorage.getItem('guideme_custom_api_url');
    if (custom && custom.trim()) {
      const trimmed = custom.trim().replace(/\/+$/, '');
      if (
        isProductionWeb &&
        (trimmed.includes('localhost') ||
          trimmed.includes('127.0.0.1') ||
          trimmed.includes('192.168.') ||
          trimmed.includes('10.') ||
          trimmed.includes('172.'))
      ) {
        localStorage.removeItem('guideme_custom_api_url');
      } else {
        return trimmed;
      }
    }
    return (import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000/api/v1').replace(/\/+$/, '');
  }

  public static setCustomApiBaseUrl(url: string): void {
    if (!url || !url.trim()) {
      localStorage.removeItem('guideme_custom_api_url');
    } else {
      let cleaned = url.trim().replace(/\/+$/, '');
      if (!cleaned.endsWith('/api/v1')) {
        cleaned += '/api/v1';
      }
      localStorage.setItem('guideme_custom_api_url', cleaned);
    }
  }

  public static async testConnection(url?: string): Promise<{ ok: boolean; message: string }> {
    try {
      const base = (url || this.getApiBaseUrl()).replace(/\/+$/, '');
      const healthUrl = base.replace(/\/api\/v1$/, '') + '/health';
      const res = await fetch(healthUrl, { method: 'GET', signal: AbortSignal.timeout(4000) });
      if (res.ok) {
        const data = await res.json().catch(() => ({}));
        return { ok: true, message: `Connected to ${data.service || 'GUIDE ME'} (${data.status || 'healthy'})` };
      }
      return { ok: false, message: `Server responded with status ${res.status}` };
    } catch (e: any) {
      return { ok: false, message: e?.message || 'Server unreachable. Check IP and Wi-Fi.' };
    }
  }

  private static getToken(): string | null {
    return localStorage.getItem('guideme_token');
  }

  private static setToken(token: string): void {
    localStorage.setItem('guideme_token', token);
  }

  private static clearTokens(): void {
    localStorage.removeItem('guideme_token');
    localStorage.removeItem('guideme_refresh_token');
    localStorage.removeItem('guideme_user');
  }

  public static async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const token = this.getToken();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const apiBase = this.getApiBaseUrl();
    const response = await fetch(`${apiBase}${endpoint}`, {
      ...options,
      headers,
    });

    if (response.status === 401) {
      // Attempt refresh or logout
      this.clearTokens();
      if (!window.location.pathname.includes('/login') && !window.location.pathname.includes('/register')) {
        window.location.href = '/login';
      }
      throw new Error('Session expired or unauthorized. Please log in.');
    }

    if (!response.ok) {
      const errData = await response.json().catch(() => ({ detail: response.statusText }));
      throw new Error(errData.detail || 'An unexpected error occurred.');
    }

    return response.json();
  }

  // ==========================================
  // Auth
  // ==========================================
  public static async register(data: any): Promise<any> {
    const res = await this.request<any>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    this.setToken(res.access_token);
    localStorage.setItem('guideme_refresh_token', res.refresh_token);
    localStorage.setItem('guideme_user', JSON.stringify(res));
    return res;
  }

  public static async login(data: any): Promise<any> {
    const res = await this.request<any>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    this.setToken(res.access_token);
    localStorage.setItem('guideme_refresh_token', res.refresh_token);
    localStorage.setItem('guideme_user', JSON.stringify(res));
    return res;
  }

  public static logout(): void {
    this.clearTokens();
    window.location.href = '/login';
  }

  public static async getMe(): Promise<any> {
    return this.request<any>('/auth/me');
  }

  // ==========================================
  // Profile & Privacy
  // ==========================================
  public static async getProfile(): Promise<any> {
    return this.request<any>('/profile');
  }

  public static async updateProfile(data: any): Promise<any> {
    return this.request<any>('/profile', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  public static async getConsent(): Promise<any> {
    return this.request<any>('/profile/consent');
  }

  public static async updateConsent(data: any): Promise<any> {
    return this.request<any>('/profile/consent', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  public static async exportData(): Promise<any> {
    return this.request<any>('/profile/export-data');
  }

  public static async deleteAccount(): Promise<any> {
    const res = await this.request<any>('/profile/delete-account', {
      method: 'DELETE',
    });
    this.clearTokens();
    return res;
  }

  // ==========================================
  // Personality & Assessment (OCEAN Big 5)
  // ==========================================
  public static async getOceanQuestions(): Promise<any[]> {
    return this.request<any[]>('/assessments/ocean/questions');
  }

  public static async submitOcean(assessmentId: string, answers: any[]): Promise<any> {
    return this.request<any>('/assessments/ocean/submit', {
      method: 'POST',
      body: JSON.stringify({ assessment_id: assessmentId, answers }),
    });
  }

  public static async getLatestPersonality(): Promise<any> {
    return this.request<any>('/assessments/ocean/latest');
  }

  // ==========================================
  // Journal & Reflection
  // ==========================================
  public static async listJournals(): Promise<any[]> {
    return this.request<any[]>('/journal');
  }

  public static async createJournal(data: any): Promise<any> {
    return this.request<any>('/journal', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  public static async deleteJournal(id: string): Promise<any> {
    return this.request<any>(`/journal/${id}`, {
      method: 'DELETE',
    });
  }

  // ==========================================
  // Mood & Stress
  // ==========================================
  public static async logMood(data: any): Promise<any> {
    return this.request<any>('/moods', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  public static async listMoods(): Promise<any[]> {
    return this.request<any[]>('/moods');
  }

  public static async evaluateStress(): Promise<any> {
    return this.request<any>('/stress/evaluate', {
      method: 'POST',
    });
  }

  public static async reportDistress(data: any): Promise<any> {
    return this.request<any>('/distress/report', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // ==========================================
  // AI Companion & Memory
  // ==========================================
  public static async sendChatMessage(content: string, conversationId?: string, typingDynamics?: any): Promise<any> {
    return this.request<any>('/companion/chat', {
      method: 'POST',
      body: JSON.stringify({ content, conversation_id: conversationId, typing_dynamics: typingDynamics }),
    });
  }

  public static async streamChatMessage(
    content: string,
    conversationId: string | undefined,
    onChunk: (event: any) => void
  ): Promise<void> {
    const token = this.getToken();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const apiBase = this.getApiBaseUrl();
    const response = await fetch(`${apiBase}/companion/chat/stream`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ content, conversation_id: conversationId }),
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({ detail: response.statusText }));
      throw new Error(errData.detail || 'Streaming connection failed.');
    }

    if (!response.body) {
      throw new Error('ReadableStream not supported by response.');
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder('utf-8');
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed.startsWith('data:')) {
          const jsonStr = trimmed.slice(5).trim();
          if (jsonStr) {
            try {
              const eventData = JSON.parse(jsonStr);
              onChunk(eventData);
            } catch (e) {
              console.error('Error parsing SSE event data:', e);
            }
          }
        }
      }
    }
  }

  public static async listConversations(): Promise<any[]> {
    return this.request<any[]>('/companion/conversations');
  }

  public static async createConversation(title?: string): Promise<any> {
    return this.request<any>('/companion/conversations', {
      method: 'POST',
      body: JSON.stringify({ title: title || 'Mindful Companion Dialogue' }),
    });
  }

  public static async getConversationById(conversationId: string): Promise<any> {
    return this.request<any>(`/companion/conversations/${conversationId}`);
  }

  public static async deleteConversation(conversationId: string): Promise<any> {
    return this.request<any>(`/companion/conversations/${conversationId}`, {
      method: 'DELETE',
    });
  }

  public static async confirmAction(actionId: string): Promise<any> {
    return this.request<any>(`/companion/actions/${actionId}/confirm`, {
      method: 'POST',
    });
  }

  public static async cancelAction(actionId: string): Promise<any> {
    return this.request<any>(`/companion/actions/${actionId}/cancel`, {
      method: 'POST',
    });
  }

  public static async getConversation(): Promise<any> {
    return this.request<any>('/companion/conversation');
  }

  public static async listMemories(): Promise<any[]> {
    return this.request<any[]>('/companion/memories');
  }

  public static async createMemory(data: { key: string; content: string; memory_type?: string; confidence?: number }): Promise<any> {
    return this.request<any>('/companion/memories', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  public static async updateMemory(id: string, data: { content?: string; is_active?: boolean }): Promise<any> {
    return this.request<any>(`/companion/memories/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  public static async deleteMemory(id: string): Promise<any> {
    return this.request<any>(`/companion/memories/${id}`, {
      method: 'DELETE',
    });
  }

  public static async clearCompanionChat(): Promise<any> {
    return this.request<any>('/companion/clear', {
      method: 'POST',
    });
  }


  // ==========================================
  // Camera & Facial Analysis
  // ==========================================
  public static async processFacialFrame(imageBase64: string): Promise<any> {
    return this.request<any>('/facial-analysis/process-frame', {
      method: 'POST',
      body: JSON.stringify({ image_base64: imageBase64, client_timestamp: new Date().toISOString() }),
    });
  }

  // ==========================================
  // Wellness, Wearables & Digital Wellbeing
  // ==========================================
  public static async getWellnessMetrics(): Promise<any[]> {
    return this.request<any[]>('/wellness/metrics');
  }

  public static async logWellnessMetric(data: any): Promise<any> {
    return this.request<any>('/wellness/metrics', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  public static async syncWearables(): Promise<any> {
    return this.request<any>('/wellness/sync-wearables', {
      method: 'POST',
    });
  }

  public static async getSleepSummary(): Promise<any> {
    return this.request<any>('/wellness/sleep/summary');
  }

  public static async getDashboardSummary(): Promise<any> {
    return this.request<any>('/wellness/dashboard-summary');
  }

  public static async getLatestStress(): Promise<any> {
    return this.request<any>('/stress/latest');
  }

  public static async getStressHistory(): Promise<any[]> {
    return this.request<any[]>('/stress/history');
  }

  public static async getDigitalWellbeing(): Promise<any> {
    return this.request<any>('/wellness/digital-wellbeing');
  }

  public static async updateDigitalWellbeing(data: any): Promise<any> {
    return this.request<any>('/wellness/digital-wellbeing', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // ==========================================
  // Goals & Habits
  // ==========================================
  public static async listGoals(): Promise<any[]> {
    return this.request<any[]>('/goals');
  }

  public static async createGoal(data: any): Promise<any> {
    return this.request<any>('/goals', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  public static async updateGoal(goalId: string, data: any): Promise<any> {
    return this.request<any>(`/goals/${goalId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  public static async deleteGoal(goalId: string): Promise<any> {
    return this.request<any>(`/goals/${goalId}`, {
      method: 'DELETE',
    });
  }

  public static async toggleMilestone(milestoneId: string): Promise<any> {
    return this.request<any>(`/goals/milestones/${milestoneId}/toggle`, {
      method: 'POST',
    });
  }

  public static async listHabits(date?: string): Promise<any[]> {
    const query = date ? `?date=${encodeURIComponent(date)}` : '';
    return this.request<any[]>(`/habits${query}`);
  }

  public static async createHabit(data: any): Promise<any> {
    return this.request<any>('/habits', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  public static async updateHabit(habitId: string, data: any): Promise<any> {
    return this.request<any>(`/habits/${habitId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  public static async deleteHabit(habitId: string): Promise<any> {
    return this.request<any>(`/habits/${habitId}`, {
      method: 'DELETE',
    });
  }

  public static async toggleHabit(habitId: string, date?: string): Promise<any> {
    const query = date ? `?date=${encodeURIComponent(date)}` : '';
    return this.request<any>(`/habits/${habitId}/toggle${query}`, {
      method: 'POST',
    });
  }

  // ==========================================
  // Career Guidance
  // ==========================================
  public static async getCareerRecommendations(): Promise<any[]> {
    return this.request<any[]>('/career/recommendations');
  }

  // ==========================================
  // Safety Center & Recommendations
  // ==========================================
  public static async listEmergencyContacts(): Promise<any[]> {
    return this.request<any[]>('/safety/emergency-contacts');
  }

  public static async addEmergencyContact(data: any): Promise<any> {
    return this.request<any>('/safety/emergency-contacts', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  public static async triggerEmergencyAlert(): Promise<any> {
    return this.request<any>('/safety/trigger-alert', {
      method: 'POST',
    });
  }

  public static async getRecommendations(): Promise<any[]> {
    return this.request<any[]>('/recommendations');
  }
}
