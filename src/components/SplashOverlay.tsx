import React from 'react';
import { Animated, Easing, Image, StyleSheet, Text, View } from 'react-native';
import { colors } from '../theme/ifood';
import { fetchPlatformBranding, PlatformBranding } from '../services/platformApi';
import { resolveImageUrl } from '../utils/imageUrl';

const MIN_VISIBLE_MS = 2200;

export function SplashOverlay({ onFinish }: { onFinish: () => void }) {
  const [branding, setBranding] = React.useState<PlatformBranding | null>(null);
  const [contentReady, setContentReady] = React.useState(false);

  const overlayOpacity = React.useRef(new Animated.Value(1)).current;
  const logoScale = React.useRef(new Animated.Value(0.55)).current;
  const logoOpacity = React.useRef(new Animated.Value(0)).current;
  const ringScale = React.useRef(new Animated.Value(0.6)).current;
  const ringOpacity = React.useRef(new Animated.Value(0.5)).current;
  const nameOpacity = React.useRef(new Animated.Value(0)).current;
  const nameTranslateY = React.useRef(new Animated.Value(18)).current;
  const taglineOpacity = React.useRef(new Animated.Value(0)).current;

  const logoUri = resolveImageUrl(branding?.logoUrl);
  const platformName = branding?.platformName?.trim() || 'Dino Eats';
  const showImage = Boolean(logoUri);

  React.useEffect(() => {
    let cancelled = false;

    const timeout = setTimeout(() => {
      if (!cancelled) setContentReady(true);
    }, 2800);

    fetchPlatformBranding()
      .then(async (data) => {
        if (cancelled) return;
        setBranding(data);
        const uri = resolveImageUrl(data.logoUrl);
        if (uri) {
          try {
            await Image.prefetch(uri);
          } catch {
            // usa fallback com inicial do nome
          }
        }
        if (!cancelled) setContentReady(true);
      })
      .catch(() => {
        if (!cancelled) {
          setBranding({
            logoUrl: null,
            contactEmail: '',
            contactPhone: '',
            platformName: 'Dino Eats',
          });
          setContentReady(true);
        }
      });

    return () => {
      cancelled = true;
      clearTimeout(timeout);
    };
  }, []);

  React.useEffect(() => {
    if (!contentReady) return;

    const startedAt = Date.now();

    const ringPulse = Animated.loop(
      Animated.sequence([
        Animated.parallel([
          Animated.timing(ringScale, {
            toValue: 1.35,
            duration: 900,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
          Animated.timing(ringOpacity, {
            toValue: 0,
            duration: 900,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
        ]),
        Animated.parallel([
          Animated.timing(ringScale, {
            toValue: 0.6,
            duration: 0,
            useNativeDriver: true,
          }),
          Animated.timing(ringOpacity, {
            toValue: 0.45,
            duration: 0,
            useNativeDriver: true,
          }),
        ]),
      ]),
      { iterations: 2 }
    );

    Animated.sequence([
      Animated.parallel([
        ringPulse,
        Animated.spring(logoScale, {
          toValue: 1,
          friction: 5,
          tension: 90,
          useNativeDriver: true,
        }),
        Animated.timing(logoOpacity, {
          toValue: 1,
          duration: 480,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]),
      Animated.parallel([
        Animated.timing(nameOpacity, {
          toValue: 1,
          duration: 420,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.spring(nameTranslateY, {
          toValue: 0,
          friction: 7,
          tension: 80,
          useNativeDriver: true,
        }),
        Animated.timing(taglineOpacity, {
          toValue: 1,
          duration: 500,
          delay: 120,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]),
      Animated.delay(520),
      Animated.timing(overlayOpacity, {
        toValue: 0,
        duration: 500,
        easing: Easing.inOut(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start(() => {
      const elapsed = Date.now() - startedAt;
      const wait = Math.max(0, MIN_VISIBLE_MS - elapsed);
      setTimeout(onFinish, wait);
    });
  }, [
    contentReady,
    logoOpacity,
    logoScale,
    nameOpacity,
    nameTranslateY,
    onFinish,
    overlayOpacity,
    ringOpacity,
    ringScale,
    taglineOpacity,
  ]);

  return (
    <Animated.View style={[styles.overlay, { opacity: overlayOpacity }]} pointerEvents="box-none">
      <View style={styles.center}>
        <Animated.View
          style={[
            styles.ring,
            {
              opacity: ringOpacity,
              transform: [{ scale: ringScale }],
            },
          ]}
        />

        <Animated.View
          style={[
            styles.logoBlock,
            {
              opacity: logoOpacity,
              transform: [{ scale: logoScale }],
            },
          ]}
        >
          <View style={styles.logoMark}>
            {showImage ? (
              <Image source={{ uri: logoUri! }} style={styles.logoImage} resizeMode="contain" />
            ) : (
              <Text style={styles.logoFallback}>{platformName.charAt(0).toUpperCase()}</Text>
            )}
          </View>
        </Animated.View>

        <Animated.Text
          style={[
            styles.brand,
            {
              opacity: nameOpacity,
              transform: [{ translateY: nameTranslateY }],
            },
          ]}
        >
          {platformName}
        </Animated.Text>

        <Animated.Text style={[styles.tagline, { opacity: taglineOpacity }]}>
          Seu delivery favorito
        </Animated.Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9999,
  },
  center: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  ring: {
    position: 'absolute',
    width: 140,
    height: 140,
    borderRadius: 70,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.35)',
  },
  logoBlock: {
    alignItems: 'center',
    marginBottom: 18,
  },
  logoMark: {
    width: 104,
    height: 104,
    borderRadius: 52,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.22,
    shadowRadius: 16,
    elevation: 10,
    overflow: 'hidden',
  },
  logoImage: {
    width: 88,
    height: 88,
  },
  logoFallback: {
    fontSize: 40,
    fontWeight: '800',
    color: colors.primary,
  },
  brand: {
    fontSize: 32,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: 0.4,
    textAlign: 'center',
    paddingHorizontal: 24,
  },
  tagline: {
    marginTop: 10,
    fontSize: 15,
    color: 'rgba(255,255,255,0.9)',
    fontWeight: '500',
    letterSpacing: 0.2,
  },
});
