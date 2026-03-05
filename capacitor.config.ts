import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
    appId: 'com.arreglados.genovesi.app',
    appName: 'Arreglados',
    webDir: 'dist',
    server: {
        androidScheme: 'https',
    },
};

export default config;
