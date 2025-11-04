import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.746200beef3c4fc08a6d1f8297e609fe',
  appName: 'Orion Intelligence',
  webDir: 'dist',
  bundledWebRuntime: false,
  server: {
    // Para desenvolvimento: hot-reload direto do sandbox
    // Comente isso para builds de produção
    url: 'https://746200be-ef3c-4fc0-8a6d-1f8297e609fe.lovableproject.com?forceHideBadge=true',
    cleartext: true
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: '#000000',
      androidScaleType: 'CENTER_CROP',
      showSpinner: false,
      androidSpinnerStyle: 'large',
      iosSpinnerStyle: 'small',
      spinnerColor: '#3B82F6',
    },
    StatusBar: {
      style: 'dark',
      backgroundColor: '#000000',
    },
  },
  android: {
    buildOptions: {
      keystorePath: undefined,
      keystorePassword: undefined,
      keystoreAlias: undefined,
      keystoreAliasPassword: undefined,
      releaseType: 'AAB',
    },
  },
};

export default config;
