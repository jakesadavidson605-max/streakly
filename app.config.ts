import { ExpoConfig, ConfigContext } from 'expo/config';

// The AdMob config plugin is only wired up when the native ads library is
// actually installed. If the library had to be omitted (see src/ads.ts), the
// build stays green without it.
function hasAdsLib(): boolean {
  try {
    require.resolve('react-native-google-mobile-ads');
    return true;
  } catch {
    return false;
  }
}

export default ({ config }: ConfigContext): ExpoConfig => {
  const plugins: NonNullable<ExpoConfig['plugins']> = [
    [
      'expo-splash-screen',
      {
        image: './assets/images/splash-icon.png',
        imageWidth: 200,
        resizeMode: 'contain',
        backgroundColor: '#FFF6E9',
      },
    ],
    [
      'expo-notifications',
      {
        icon: './assets/images/icon.png',
        color: '#ff8c42',
        mode: 'production',
        androidMode: 'default',
      },
    ],
  ];
  if (hasAdsLib()) {
    plugins.push([
      'react-native-google-mobile-ads',
      {
        androidAppId: 'ca-app-pub-3940256099942544~3347511713',
        iosAppId: 'ca-app-pub-3940256099942544~1458002511',
      },
    ]);
  }
  return {
    ...config,
  name: 'Streakly: Habit Tracker',
  slug: 'streakly',
  version: '1.0.0',
  orientation: 'portrait',
  icon: './assets/images/icon.png',
  scheme: 'streakly',
  newArchEnabled: true,
  userInterfaceStyle: 'light',
  plugins,
  android: {
    package: 'com.jakesadavidson.streakly',
    adaptiveIcon: {
      backgroundColor: '#FFF6E9',
      foregroundImage: './assets/images/android-icon-foreground.png',
      backgroundImage: './assets/images/android-icon-background.png',
    },
    edgeToEdgeEnabled: true,
  },
  ios: {
    bundleIdentifier: 'com.jakesadavidson.streakly',
  },
  extra: {
    eas: {
      projectId: '52df5b88-92b0-409e-8b72-11a4334ec4a4',
    },
  },
  };
};
