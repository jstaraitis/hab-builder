import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.habitatbuilder.app',
  appName: 'Habitat Builder',
  webDir: 'dist',
  plugins: {
    PushNotifications: {
      presentationOptions: ['badge', 'sound', 'alert'],
    },
    SplashScreen: {
      launchShowDuration: 1500,
      backgroundColor: '#059669', // emerald-600
      showSpinner: false,
    },
  },
  ios: {
    // No contentInset — web view fills full screen (including behind status bar).
    // We use env(safe-area-inset-top) in CSS to push content below the status bar.
    scrollEnabled: true,
    allowsLinkPreview: false,
  },
};

export default config;
