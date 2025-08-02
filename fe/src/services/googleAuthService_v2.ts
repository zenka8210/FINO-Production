/**
 * Google OAuth Service for authentication - Updated for better compatibility
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
  private currentCallback: ((response: GoogleAuthResponse) => void) | null = null;
  private currentErrorCallback: ((error: Error) => void) | null = null;

  constructor() {
    this.clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '';
  }

  async initialize(): Promise<void> {
    if (this.isInitialized || typeof window === 'undefined') return;

    try {
      // Load Google Identity Services script
      await this.loadGoogleScript();
      
      // Initialize Google Sign-In with renderButton approach
      window.google?.accounts.id.initialize({
        client_id: this.clientId,
        callback: (response: any) => {
          this.handleCredentialResponse(response.credential);
        },
        cancel_on_tap_outside: false,
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
      this.currentCallback = resolve;
      this.currentErrorCallback = reject;

      try {
        // Create a temporary button container
        const buttonContainer = document.createElement('div');
        buttonContainer.style.position = 'fixed';
        buttonContainer.style.top = '-9999px';
        buttonContainer.style.left = '-9999px';
        buttonContainer.style.visibility = 'hidden';
        document.body.appendChild(buttonContainer);

        // Render the Google Sign-In button
        window.google?.accounts.id.renderButton(buttonContainer, {
          theme: 'outline',
          size: 'large',
          text: 'signin_with',
          shape: 'rectangular',
          width: '300',
        });

        // Trigger click programmatically
        setTimeout(() => {
          const button = buttonContainer.querySelector('div[role="button"]') as HTMLElement;
          if (button) {
            button.click();
          } else {
            // Fallback to One Tap if button doesn't render
            this.tryOneTap();
          }
          
          // Clean up the hidden button
          setTimeout(() => {
            if (buttonContainer.parentNode) {
              buttonContainer.parentNode.removeChild(buttonContainer);
            }
          }, 1000);
        }, 100);

      } catch (error) {
        reject(error instanceof Error ? error : new Error('Google Sign-In initialization failed'));
      }

      // Timeout after 30 seconds
      setTimeout(() => {
        reject(new Error('Google Sign-In timeout - vui lòng thử lại'));
      }, 30000);
    });
  }

  private tryOneTap(): void {
    try {
      window.google?.accounts.id.prompt((notification: any) => {
        if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
          this.currentErrorCallback?.(new Error('Google Sign-In không khả dụng. Vui lòng thử lại.'));
        }
      });
    } catch (error) {
      this.currentErrorCallback?.(new Error('Google One Tap failed'));
    }
  }

  private async handleCredentialResponse(credential: string): Promise<void> {
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
      this.currentCallback?.(data.data);
    } catch (error) {
      console.error('Google auth API error:', error);
      this.currentErrorCallback?.(error instanceof Error ? error : new Error('Xác thực Google thất bại'));
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
