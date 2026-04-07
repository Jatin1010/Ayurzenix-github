import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'in.ayurzenix.app',
  appName: 'Ayurzenix',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  }
};

export default config;
