import * as Haptics from 'expo-haptics';

// نقطة مركزية يمكن لاحقاً ربط ملفات صوتية بها من دون تغيير الشاشات.
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

  async play(name) {
    if (this.muted) return;
    const player = this.players.get(name);
    if (player) await player.replayAsync?.();

    const feedback = name === 'victory'
      ? Haptics.NotificationFeedbackType.Success
      : name === 'defeat'
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
