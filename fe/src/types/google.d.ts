// Google Identity Services types
declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: any) => void;
          prompt: (callback?: (notification: any) => void) => void;
          renderButton: (element: HTMLElement, config: any) => void;
          disableAutoSelect: () => void;
          storeCredential: (credential: any) => void;
          cancel: () => void;
        };
        oauth2: {
          initTokenClient: (config: any) => any;
          hasGrantedAllScopes: (token: any, scopes: string) => boolean;
          hasGrantedAnyScope: (token: any, scopes: string) => boolean;
          revoke: (token: string, callback: () => void) => void;
        };
      };
    };
  }
}

export {};
