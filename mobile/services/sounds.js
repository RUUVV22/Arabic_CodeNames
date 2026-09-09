import * as Haptics from 'expo-haptics';

class SoundService {
  constructor() {
    this.muted = false;
    this.players = new Map();
  }

  setMuted(value) {
    this.muted = Boolean(value);
  }

  register(name, player) {
    this.players.set(name, player);
  }

  unregister(name, player) {
    if (this.players.get(name) === player) this.players.delete(name);
  }

  async play(name) {
    if (this.muted) return;
    const player = this.players.get(name);
    if (player) {
      try {
        await player.seekTo?.(0);
        player.play?.();
      } catch {
        // Audio may be blocked until the first browser interaction; haptics still run on native.
      }
    }

    const feedback = ['victory', 'correct'].includes(name)
      ? Haptics.NotificationFeedbackType.Success
      : ['defeat', 'assassin', 'wrong'].includes(name)
        ? Haptics.NotificationFeedbackType.Error
        : null;
    if (feedback) {
      await Haptics.notificationAsync(feedback).catch(() => {});
    } else {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    }
  }
}

export const soundService = new SoundService();
