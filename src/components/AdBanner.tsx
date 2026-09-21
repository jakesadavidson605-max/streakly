import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { BannerAd, BannerAdSize, TestIds } from 'react-native-google-mobile-ads';
import { AD_IDS, USE_REAL_ADS } from '../ads';

/**
 * Bottom banner ad, pinned above the safe-area inset by its parent.
 *
 * Uses Google's official TEST banner unit while USE_REAL_ADS is false
 * (see src/ads.ts). Wrapped defensively: if the native ad module fails at
 * runtime, a clearly labeled placeholder keeps the layout intact.
 */
export function AdBanner() {
  const [failed, setFailed] = useState(false);
  const unitId = USE_REAL_ADS ? AD_IDS.banner : TestIds.ADAPTIVE_BANNER;

  const placeholder = (
    <View style={[styles.wrap, styles.placeholder]}>
      <Text style={styles.placeholderText}>AD PLACEHOLDER — banner unavailable</Text>
    </View>
  );

  if (failed) return placeholder;

  try {
    return (
      <View style={styles.wrap}>
        <BannerAd
          unitId={unitId}
          size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER}
          requestOptions={{ requestNonPersonalizedAdsOnly: true }}
          onAdFailedToLoad={() => setFailed(true)}
        />
      </View>
    );
  } catch {
    return placeholder;
  }
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFF6E9',
    minHeight: 52,
  },
  placeholder: {
    borderTopWidth: 1,
    borderTopColor: '#F0DCC3',
  },
  placeholderText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
    color: '#C9A88F',
    paddingVertical: 16,
  },
});
