import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  User,
  SubscriptionStatus,
  Question,
  GeneratedPaper,
  PaperGenerationConfig,
  PaymentRequest,
  Subject,
} from '../types';

// Default API host: uses EXPO_PUBLIC_API_URL if set, else fallbacks for local dev
const DEFAULT_HOST =
  process.env.EXPO_PUBLIC_API_URL ||
  (Platform.OS === 'android' ? 'http://10.0.2.2:5000' : 'http://localhost:5000');

class ApiClient {
  private baseUrl: string = DEFAULT_HOST;
  private token: string | null = null;

  constructor() {
    AsyncStorage.getItem('@qpg_custom_api_url').then((saved) => {
      if (saved && saved.trim()) {
        this.baseUrl = saved.trim().replace(/\/+$/, '');
      }
    }).catch(() => {});
  }

  public async setBaseUrl(url: string) {
    this.baseUrl = url.replace(/\/+$/, '');
    await AsyncStorage.setItem('@qpg_custom_api_url', this.baseUrl);
  }

  public getBaseUrl(): string {
    return this.baseUrl;
  }

  public setToken(token: string | null) {
    this.token = token;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    if (!this.token) {
      this.token = await AsyncStorage.getItem('@qpg_auth_token');
    }

    const savedUrl = await AsyncStorage.getItem('@qpg_custom_api_url');
    if (savedUrl && savedUrl.trim()) {
      this.baseUrl = savedUrl.trim().replace(/\/+$/, '');
    }

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...(options.headers as Record<string, string>),
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    const url = `${this.baseUrl}${endpoint}`;
    try {
      const response = await fetch(url, { ...options, headers });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || data.error || `Request failed with status ${response.status}`);
      }

      return data as T;
    } catch (err: any) {
      console.warn(`API Error [${endpoint}]:`, err.message);
      const isHttps = typeof window !== 'undefined' && window.location?.protocol === 'https:';
      if (isHttps && this.baseUrl.startsWith('http://localhost')) {
        throw new Error(
          `Cannot reach ${this.baseUrl} from HTTPS. Please tap "Change Backend URL" below and enter your live Render backend URL.`
        );
      }
      if (err.message === 'Failed to fetch' || err.message?.includes('NetworkError') || err.message?.includes('Network request failed')) {
        throw new Error(
          `Unable to connect to backend at ${this.baseUrl}. Check that your backend is running and CORS is enabled.`
        );
      }
      throw err;
    }
  }

  // Auth Endpoints
  public async sendOtp(email: string): Promise<{ success: boolean; message: string; devOtp?: string }> {
    return this.request('/api/auth/send-otp', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  }

  public async verifyOtp(
    email: string,
    otp: string,
    subject?: Subject,
    name?: string,
    institution?: string
  ): Promise<{ success: boolean; token: string; user: User; subscription: SubscriptionStatus }> {
    const res = await this.request<{
      success: boolean;
      token: string;
      user: User;
      subscription: SubscriptionStatus;
    }>('/api/auth/verify-otp', {
      method: 'POST',
      body: JSON.stringify({ email, otp, subject, name, institution }),
    });

    if (res.token) {
      this.token = res.token;
      await AsyncStorage.setItem('@qpg_auth_token', res.token);
    }

    return res;
  }

  public async loginWithPassword(
    email: string,
    password: string
  ): Promise<{ success: boolean; token: string; user: User; subscription: SubscriptionStatus }> {
    const res = await this.request<{
      success: boolean;
      token: string;
      user: User;
      subscription: SubscriptionStatus;
    }>('/api/auth/login-password', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });

    if (res.token) {
      this.token = res.token;
      await AsyncStorage.setItem('@qpg_auth_token', res.token);
    }

    return res;
  }

  public async getProfile(): Promise<{ user: User; subscription: SubscriptionStatus }> {
    return this.request('/api/auth/me');
  }

  // Subscription Endpoints
  public async getSubscriptionStatus(): Promise<SubscriptionStatus & { success: boolean }> {
    return this.request('/api/subscription/status');
  }

  public async getUpiQr(): Promise<{
    success: boolean;
    amount: number;
    upiId: string;
    payeeName: string;
    upiIntentUri: string;
    qrCodeDataUrl: string;
    instructions: string[];
  }> {
    return this.request('/api/subscription/qr');
  }

  public async submitPayment(
    utr: string,
    paymentTime?: string,
    note?: string
  ): Promise<{ success: boolean; message: string; paymentRequest: PaymentRequest }> {
    return this.request('/api/subscription/submit-payment', {
      method: 'POST',
      body: JSON.stringify({ utr, paymentTime, note }),
    });
  }

  public async getMyPaymentRequests(): Promise<{ success: boolean; requests: PaymentRequest[] }> {
    return this.request('/api/subscription/my-requests');
  }

  // Question Bank Endpoints
  public async getChapters(
    classLevel?: '11' | '12' | 'both'
  ): Promise<{ success: boolean; chapters: { name: string; count: number; classLevel: string }[] }> {
    const q = classLevel ? `?classLevel=${classLevel}` : '';
    return this.request(`/api/questions/chapters${q}`);
  }

  public async queryQuestions(params: {
    classLevel?: string;
    chapter?: string;
    qType?: string;
    difficulty?: string;
    search?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ success: boolean; questions: Question[]; total: number; hasMore: boolean }> {
    const query = new URLSearchParams();
    if (params.classLevel) query.append('classLevel', params.classLevel);
    if (params.chapter) query.append('chapter', params.chapter);
    if (params.qType) query.append('qType', params.qType);
    if (params.difficulty) query.append('difficulty', params.difficulty);
    if (params.search) query.append('search', params.search);
    if (params.limit) query.append('limit', String(params.limit));
    if (params.offset) query.append('offset', String(params.offset));

    return this.request(`/api/questions?${query.toString()}`);
  }

  // Paper Generation Endpoints
  public async generatePaper(
    config: PaperGenerationConfig
  ): Promise<{ success: boolean; paper: GeneratedPaper }> {
    return this.request('/api/papers/generate', {
      method: 'POST',
      body: JSON.stringify(config),
    });
  }

  public async getPaperHtml(
    paper: GeneratedPaper,
    includeAnswerKey = true,
    includeSolutions = false
  ): Promise<{ success: boolean; html: string }> {
    return this.request('/api/papers/preview-html', {
      method: 'POST',
      body: JSON.stringify({ paper, includeAnswerKey, includeSolutions }),
    });
  }

  public async getCatalogStats(): Promise<{
    success: boolean;
    subject: Subject;
    stats: { class11: number; class12: number; total: number; supportedExams: string[] };
    grandTotalQuestionsInBank: number;
  }> {
    return this.request('/api/papers/catalog-stats');
  }
}

export const api = new ApiClient();
