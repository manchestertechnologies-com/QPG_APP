// API Client for Manchester Technologies Exam Architect OS

const API_BASE_URL = (import.meta.env.VITE_API_URL as string) || 
  (typeof window !== 'undefined' && window.location.hostname === 'localhost' ? 'http://localhost:5000/api' : '/api');

export interface StoredUser {
  id: string;
  email: string;
  name?: string;
  institution?: string;
  subject: 'Mathematics' | 'Physics' | 'Chemistry' | 'Biology';
  role: 'teacher' | 'admin';
  paperCredits?: number;
  papersCreatedCount?: number;
}

export interface StoredSubscription {
  isActive: boolean;
  status: 'active' | 'expired' | 'none';
  plan: string;
  amount: number;
  daysRemaining?: number;
}

class ApiService {
  private token: string | null = null;
  private user: StoredUser | null = null;

  constructor() {
    if (typeof window !== 'undefined') {
      this.token = localStorage.getItem('mtech_token');
      const savedUser = localStorage.getItem('mtech_user');
      if (savedUser) {
        try {
          this.user = JSON.parse(savedUser);
        } catch (e) {}
      }
    }
  }

  public setSession(token: string, user: StoredUser) {
    this.token = token;
    this.user = user;
    if (typeof window !== 'undefined') {
      localStorage.setItem('mtech_token', token);
      localStorage.setItem('mtech_user', JSON.stringify(user));
    }
  }

  public clearSession() {
    this.token = null;
    this.user = null;
    if (typeof window !== 'undefined') {
      localStorage.removeItem('mtech_token');
      localStorage.removeItem('mtech_user');
    }
  }

  public getToken() {
    return this.token;
  }

  public getUser() {
    return this.user;
  }

  private async request(endpoint: string, options: RequestInit = {}): Promise<any> {
    const url = `${API_BASE_URL}${endpoint}`;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.message || data.error || `HTTP error ${response.status}`);
      }
      return data;
    } catch (err: any) {
      console.warn(`API call failed [${endpoint}]:`, err.message);
      throw err;
    }
  }

  // Auth Endpoints
  public async loginPassword(email: string, password: string) {
    const res = await this.request('/auth/login-password', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    if (res.token && res.user) {
      this.setSession(res.token, res.user);
    }
    return res;
  }

  public async register(email: string, password: string, name: string, subject: string, ref?: string) {
    const res = await this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, name, subject, ref }),
    });
    if (res.token && res.user) {
      this.setSession(res.token, res.user);
    }
    return res;
  }

  public async getMe() {
    return await this.request('/auth/me');
  }

  // Catalog & Questions Endpoints
  public async getCatalogStats() {
    return await this.request('/papers/catalog-stats');
  }

  public async getChapters(classLevel: string = 'both') {
    return await this.request(`/questions/chapters?classLevel=${classLevel}`);
  }

  public async getConcepts(chapter: string) {
    return await this.request(`/questions/concepts?chapter=${encodeURIComponent(chapter)}`);
  }

  public async getAlternatives(
    chapter: string,
    excludeId: string,
    difficulty?: string,
    qType?: string
  ) {
    return await this.request(
      `/questions/alternatives?chapter=${encodeURIComponent(chapter)}&excludeId=${excludeId}&difficulty=${difficulty || ''}&qType=${qType || ''}`
    );
  }

  // Paper Generation & Workbench Endpoints
  public async generatePaper(config: any) {
    return await this.request('/papers/generate', {
      method: 'POST',
      body: JSON.stringify(config),
    });
  }

  public async swapQuestion(paper: any, targetQuestionId: string, replacementQuestion: any) {
    return await this.request('/papers/swap-question', {
      method: 'POST',
      body: JSON.stringify({ paper, targetQuestionId, replacementQuestion }),
    });
  }

  public async saveDraft(paper: any, title?: string, header?: any) {
    return await this.request('/papers/save-draft', {
      method: 'POST',
      body: JSON.stringify({ paper, title, header }),
    });
  }

  public async getDrafts() {
    return await this.request('/papers/drafts');
  }

  public async getDraftById(paperId: string) {
    return await this.request(`/papers/drafts/${paperId}`);
  }

  public async deleteDraft(paperId: string) {
    return await this.request(`/papers/drafts/${paperId}`, {
      method: 'DELETE',
    });
  }

  public async getPreviewHtml(paper: any, includeAnswerKey: boolean = true) {
    return await this.request('/papers/preview-html', {
      method: 'POST',
      body: JSON.stringify({ paper, includeAnswerKey }),
    });
  }

  // Subscription & Referral Endpoints
  public async getSubscriptionQr(plan: 'starter' | 'elite' = 'starter', months: number = 1) {
    return await this.request(`/subscription/qr?plan=${plan}&months=${months}`);
  }

  public async submitPayment(utr: string, plan: string, amount: number) {
    return await this.request('/subscription/submit-payment', {
      method: 'POST',
      body: JSON.stringify({ utr, plan, amount }),
    });
  }

  public async referColleague(data: {
    colleagueName: string;
    colleagueDepartment: string;
    colleagueInstitution: string;
    colleagueEmail: string;
  }) {
    return await this.request('/papers/referral-invite', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  public async getReferralStats() {
    return await this.request('/papers/referral-stats');
  }
}

export const api = new ApiService();
