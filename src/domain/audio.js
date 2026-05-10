export class AudioRegistry {
  constructor({ basePath = '/audio/' } = {}) {
    this.basePath = basePath;
    this.sources = new Map();
  }

  get activeCount() {
    let count = 0;
    this.sources.forEach((items) => {
      count += items.size;
    });
    return count;
  }

  track(cueId, audio) {
    if (!this.sources.has(cueId)) {
      this.sources.set(cueId, new Set());
    }
    this.sources.get(cueId).add(audio);
    audio.addEventListener?.('ended', () => this.untrack(cueId, audio), { once: true });
  }

  untrack(cueId, audio) {
    const group = this.sources.get(cueId);
    if (!group) return;
    group.delete(audio);
    if (group.size === 0) {
      this.sources.delete(cueId);
    }
  }

  playCue(cue, { volumeScale = 1, muted = false } = {}) {
    if (muted) return null;
    if (typeof Audio === 'undefined') return null;
    const audio = new Audio(`${this.basePath}${cue.sound}`);
    audio.volume = Math.max(0, Math.min(1, (cue.volume / 100) * volumeScale));
    this.track(cue.id, audio);
    audio.play?.().catch(() => {});
    return audio;
  }

  stopCue(cueId) {
    const group = this.sources.get(cueId);
    if (!group) return;
    group.forEach((audio) => {
      audio.pause();
      audio.currentTime = 0;
    });
    this.sources.delete(cueId);
  }

  stopAll() {
    this.sources.forEach((group) => {
      group.forEach((audio) => {
        audio.pause();
        audio.currentTime = 0;
      });
    });
    this.sources.clear();
  }
}
