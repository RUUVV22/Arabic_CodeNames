import React, { useEffect } from 'react';
import { setAudioModeAsync, useAudioPlayer } from 'expo-audio';
import { soundService } from '../services/sounds';

const sources = {
  select: require('../../assets/sounds/select.wav'),
  turn: require('../../assets/sounds/turn.wav'),
  clue: require('../../assets/sounds/clue.wav'),
  correct: require('../../assets/sounds/correct.wav'),
  wrong: require('../../assets/sounds/wrong.wav'),
  assassin: require('../../assets/sounds/assassin.wav'),
  victory: require('../../assets/sounds/victory.wav'),
  defeat: require('../../assets/sounds/defeat.wav'),
  join: require('../../assets/sounds/join.wav'),
  leave: require('../../assets/sounds/leave.wav'),
};

export function GameAudio() {
  const select = useAudioPlayer(sources.select);
  const turn = useAudioPlayer(sources.turn);
  const clue = useAudioPlayer(sources.clue);
  const correct = useAudioPlayer(sources.correct);
  const wrong = useAudioPlayer(sources.wrong);
  const assassin = useAudioPlayer(sources.assassin);
  const victory = useAudioPlayer(sources.victory);
  const defeat = useAudioPlayer(sources.defeat);
  const join = useAudioPlayer(sources.join);
  const leave = useAudioPlayer(sources.leave);

  useEffect(() => {
    setAudioModeAsync({ playsInSilentMode: true, shouldPlayInBackground: false }).catch(() => {});
  }, []);

  useEffect(() => {
    const players = { select, turn, clue, correct, wrong, assassin, victory, defeat, join, leave };
    Object.entries(players).forEach(([name, player]) => soundService.register(name, player));
    return () => Object.entries(players).forEach(([name, player]) => soundService.unregister(name, player));
  }, [assassin, clue, correct, defeat, join, leave, select, turn, victory, wrong]);

  return null;
}
