import AsyncStorage from '@react-native-async-storage/async-storage';
import { GeneratedPaper, User } from '../types';

const PAPERS_STORAGE_KEY = '@qpg_local_saved_papers';
const USER_STORAGE_KEY = '@qpg_local_user';
const TOKEN_STORAGE_KEY = '@qpg_auth_token';

export class LocalStorageService {
  /**
   * Save a newly generated paper into local storage only
   */
  public static async savePaper(paper: GeneratedPaper): Promise<void> {
    try {
      const existing = await this.getAllRawPapers();
      const filtered = existing.filter((p) => p.id !== paper.id);
      filtered.unshift(paper); // newest first
      await AsyncStorage.setItem(PAPERS_STORAGE_KEY, JSON.stringify(filtered));
    } catch (err) {
      console.error('Failed to save paper locally:', err);
      throw new Error('Could not save paper to device storage.');
    }
  }

  /**
   * Retrieve all raw papers from device storage
   */
  private static async getAllRawPapers(): Promise<GeneratedPaper[]> {
    try {
      const data = await AsyncStorage.getItem(PAPERS_STORAGE_KEY);
      if (!data) return [];
      return JSON.parse(data) as GeneratedPaper[];
    } catch (err) {
      console.warn('Error reading local papers:', err);
      return [];
    }
  }

  /**
   * Get saved papers with subscription enforcement.
   * "once the subscription is over none of the things such as the already created papers should be available"
   */
  public static async getSavedPapers(hasActiveSubscription: boolean): Promise<{
    isLocked: boolean;
    totalStoredCount: number;
    papers: GeneratedPaper[];
    message?: string;
  }> {
    const rawPapers = await this.getAllRawPapers();

    if (!hasActiveSubscription) {
      return {
        isLocked: true,
        totalStoredCount: rawPapers.length,
        papers: [],
        message: 'Your ₹299 monthly subscription is inactive or expired. Renew your subscription to access your saved papers library.',
      };
    }

    return {
      isLocked: false,
      totalStoredCount: rawPapers.length,
      papers: rawPapers,
    };
  }

  /**
   * Delete a saved paper from device storage
   */
  public static async deletePaper(paperId: string): Promise<void> {
    try {
      const existing = await this.getAllRawPapers();
      const updated = existing.filter((p) => p.id !== paperId);
      await AsyncStorage.setItem(PAPERS_STORAGE_KEY, JSON.stringify(updated));
    } catch (err) {
      console.error('Failed to delete paper locally:', err);
    }
  }

  /**
   * Session Management
   */
  public static async saveSession(token: string, user: User): Promise<void> {
    await AsyncStorage.setItem(TOKEN_STORAGE_KEY, token);
    await AsyncStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
  }

  public static async getSession(): Promise<{ token: string | null; user: User | null }> {
    const token = await AsyncStorage.getItem(TOKEN_STORAGE_KEY);
    const rawUser = await AsyncStorage.getItem(USER_STORAGE_KEY);
    const user = rawUser ? (JSON.parse(rawUser) as User) : null;
    return { token, user };
  }

  public static async clearSession(): Promise<void> {
    await AsyncStorage.removeItem(TOKEN_STORAGE_KEY);
    await AsyncStorage.removeItem(USER_STORAGE_KEY);
  }
}
