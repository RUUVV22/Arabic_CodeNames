import React, { useEffect, useState } from 'react';
import { Alert, Platform } from 'react-native';
import { PrimaryButton } from './PrimaryButton';

let installPrompt = null;
const listeners = new Set();

function emitChange() {
  listeners.forEach((listener) => listener(Boolean(installPrompt)));
}

if (Platform.OS === 'web' && typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (event) => {
    event.preventDefault();
    installPrompt = event;
    emitChange();
  });
  window.addEventListener('appinstalled', () => {
    installPrompt = null;
    emitChange();
  });
}

function isStandalone() {
  if (Platform.OS !== 'web' || typeof window === 'undefined') return false;
  return window.matchMedia?.('(display-mode: standalone)').matches || window.navigator.standalone === true;
}

export function InstallAppButton() {
  const [available, setAvailable] = useState(Boolean(installPrompt));
  const [installed, setInstalled] = useState(isStandalone());

  useEffect(() => {
    if (Platform.OS !== 'web' || typeof window === 'undefined') return undefined;
    const listener = (value) => setAvailable(value);
    listeners.add(listener);
    const media = window.matchMedia?.('(display-mode: standalone)');
    const handleDisplayMode = () => setInstalled(isStandalone());
    media?.addEventListener?.('change', handleDisplayMode);
    return () => {
      listeners.delete(listener);
      media?.removeEventListener?.('change', handleDisplayMode);
    };
  }, []);

  if (Platform.OS !== 'web' || installed) return null;

  const install = async () => {
    if (installPrompt) {
      await installPrompt.prompt();
      await installPrompt.userChoice;
      installPrompt = null;
      setAvailable(false);
      return;
    }

    const userAgent = String(window.navigator.userAgent || '');
    const ios = /iPhone|iPad|iPod/i.test(userAgent);
    Alert.alert(
      'تثبيت اللعبة',
      ios
        ? 'في Safari اضغط زر المشاركة، ثم اختر «إضافة إلى الشاشة الرئيسية».'
        : 'افتح قائمة المتصفح واختر «تثبيت التطبيق» أو «إضافة إلى الشاشة الرئيسية».',
    );
  };

  return (
    <PrimaryButton
      title={available ? 'تثبيت اللعبة على الشاشة' : 'إضافة اللعبة للشاشة الرئيسية'}
      icon="download-outline"
      variant="ghost"
      onPress={install}
    />
  );
}
