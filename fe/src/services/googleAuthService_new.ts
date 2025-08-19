/**
 * Google OAuth Service for authentication
 */

interface GoogleAuthResponse {
  user: {
    _id: string;
    email: string;
    name: string;
    role: string;
    avatar?: string;
    isVerified: boolean;
  };
  token: string;
  isNewUser: boolean;
}

class GoogleAuthService {
  private isInitialized = false;
  private clientId: string;

  constructor() {
    this.clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '';
  }

  async initialize(): Promise<void> {
    if (this.isInitialized || typeof window === 'undefined') return;

    try {
      // Load Google Identity Services script
      await this.loadGoogleScript();
      
      // Initialize Google Sign-In
      window.google?.accounts.id.initialize({
        client_id: this.clientId,
        callback: () => {}, // We'll handle this manually
      });

      this.isInitialized = true;
      console.log('Google Auth initialized successfully');
    } catch (error) {
      console.error('Failed to initialize Google Auth:', error);
      throw new Error('Google authentication initialization failed');
    }
  }

  private loadGoogleScript(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (document.querySelector('script[src*="accounts.google.com"]')) {
        resolve();
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error('Failed to load Google script'));
      document.head.appendChild(script);
    });
  }

  async signIn(): Promise<GoogleAuthResponse> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    return new Promise((resolve, reject) => {
      try {
        // Set up callback for credential response
        window.google?.accounts.id.initialize({
          client_id: this.clientId,
          callback: async (response: any) => {
            try {
              const result = await this.handleCredentialResponse(response.credential);
              resolve(result);
            } catch (error) {
              reject(error);
            }
          },
        });

        // Show the One Tap prompt
        window.google?.accounts.id.prompt((notification: any) => {
          if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
            reject(new Error('Google Sign-In không khả dụng. Vui lòng thử lại.'));
          }
        });
      } catch (error) {
        reject(error);
      }
    });
  }

  private async handleCredentialResponse(credential: string): Promise<GoogleAuthResponse> {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/google`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          credential: credential,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Google authentication failed');
      }

      const data = await response.json();
      return data.data;
    } catch (error) {
      console.error('Google auth API error:', error);
      throw error instanceof Error ? error : new Error('Xác thực Google thất bại');
    }
  }

  decodeJWT(token: string): any {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
      return JSON.parse(jsonPayload);
    } catch (error) {
      console.error('Failed to decode JWT:', error);
      return null;
    }
  }
}

export default new GoogleAuthService();
