export class AudioRegistry {
  constructor({ basePath = '/audio/' } = {}) {
    this.basePath = basePath;
    this.sources = new Map();
    this._masterVolumeScale = 1;
    this._muted = false;
  }

  get activeCount() {
    let count = 0;
    this.sources.forEach((items) => {
      count += items.size;
    });
    return count;
  }

  track(cueId, entry) {
    if (!this.sources.has(cueId)) {
      this.sources.set(cueId, new Set());
    }
    this.sources.get(cueId).add(entry);
    entry.audio.addEventListener?.('ended', () => this.untrack(cueId, entry), { once: true });
  }

  untrack(cueId, entry) {
    const group = this.sources.get(cueId);
    if (!group) return;
    group.delete(entry);
    if (group.size === 0) {
      this.sources.delete(cueId);
    }
  }

  _rampVolume(entry, fromScale, toScale, durationMs) {
    const startTime = performance.now();
    const step = () => {
      if (entry.audio.paused) return;
      const elapsed = performance.now() - startTime;
      const progress = Math.min(1, elapsed / durationMs);
      entry.cueVolumeScale = fromScale + (toScale - fromScale) * progress;
      entry.audio.volume = this._muted ? 0 : entry.cueVolumeScale * this._masterVolumeScale;
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }

  playCue(cue, { volumeScale = 1, muted = false } = {}) {
    if (muted) return null;
    if (typeof Audio === 'undefined') return null;

    const audio = new Audio(`${this.basePath}${cue.sound}`);
    const targetVolume = Math.max(0, Math.min(1, (cue.volume / 100) * volumeScale));
    const fadeIn = cue.fadeIn ?? 0;
    const fadeOut = cue.fadeOut ?? 0;
    const duration = cue.duration ?? 0;

    audio.volume = fadeIn > 0 ? 0 : targetVolume;
    this.track(cue.id, audio, cue.volume);
    audio.play?.().catch(() => {});

    if (fadeIn > 0) {
      this._rampVolume(audio, 0, targetVolume, fadeIn * 1000);
    }

    if (fadeOut > 0 && duration > fadeOut) {
      window.setTimeout(() => {
        if (!audio.paused) {
          this._rampVolume(audio, audio.volume, 0, fadeOut * 1000);
        }
      }, (duration - fadeOut) * 1000);
    }

    return audio;
  }

  applyMasterVolume(volumeScale, muted) {
    this._masterVolumeScale = volumeScale;
    this._muted = muted;
    this.sources.forEach((group) => {
      group.forEach((entry) => {
        entry.audio.volume = muted ? 0 : entry.cueVolumeScale * volumeScale;
      });
    });
  }

  stopCue(cueId) {
    const group = this.sources.get(cueId);
    if (!group) return;
    group.forEach(({ audio }) => {
      audio.pause();
      audio.currentTime = 0;
    });
    this.sources.delete(cueId);
  }

  stopInstance(cueId, audio) {
    const group = this.sources.get(cueId);
    if (!group) return;
    const entry = [...group].find((e) => e.audio === audio);
    if (!entry) return;
    audio.pause();
    audio.currentTime = 0;
    this.untrack(cueId, entry);
  }

  stopAll() {
    this.sources.forEach((group) => {
      group.forEach(({ audio }) => {
        audio.pause();
        audio.currentTime = 0;
      });
    });
    this.sources.clear();
  }
}
