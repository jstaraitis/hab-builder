import { useEffect, useState } from 'react';
import { Capacitor } from '@capacitor/core';

export type Platform = 'ios' | 'android' | 'desktop' | 'mobile-web';

function detectPlatform(): Platform {
  if (Capacitor.isNativePlatform()) {
    return Capacitor.getPlatform() as 'ios' | 'android';
  }
  return window.innerWidth >= 1024 ? 'desktop' : 'mobile-web';
}

/**
 * Detects the current platform and applies a data-platform attribute + css class to <html>.
 *
 * Platforms:
 *  - 'ios'        — Running inside the native Capacitor iOS app
 *  - 'android'    — Running inside the native Capacitor Android app
 *  - 'desktop'    — Web browser, viewport ≥ 1024px
 *  - 'mobile-web' — Web browser, viewport < 1024px
 *
 * The <html> element gets:
 *  - data-platform="ios" / "android" / "desktop" / "mobile-web"
 *  - class "ios-app" when platform === 'ios'  (enables Tailwind ios: variant)
 *  - class "native-app" when running in Capacitor (ios or android)
 */
export function usePlatform() {
  const [platform, setPlatform] = useState<Platform>(detectPlatform);

  useEffect(() => {
    function apply(p: Platform) {
      document.documentElement.setAttribute('data-platform', p);
      document.documentElement.classList.toggle('ios-app', p === 'ios');
      document.documentElement.classList.toggle('native-app', p === 'ios' || p === 'android');
    }

    if (Capacitor.isNativePlatform()) {
      // Native platform never changes at runtime
      const p = Capacitor.getPlatform() as 'ios' | 'android';
      setPlatform(p);
      apply(p);
      return;
    }

    // Web: re-evaluate on resize
    const update = () => {
      const p = window.innerWidth >= 1024 ? 'desktop' : ('mobile-web' as Platform);
      setPlatform(p);
      apply(p);
    };

    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  return {
    platform,
    isNative: platform === 'ios' || platform === 'android',
    isIOS: platform === 'ios',
    isAndroid: platform === 'android',
    isDesktop: platform === 'desktop',
    isMobileWeb: platform === 'mobile-web',
  };
}
