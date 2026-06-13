import { useRef, useState } from 'react';
import { formatClockTime } from '../domain/cues.js';
import { pxDeltaToSeconds, clampDuration, clampFadeIn, clampFadeOut } from '../domain/clip.js';

export function TrackClip({
  cue,
  durationSeconds,
  selected,
  trackLineRef,
  onSelect,
  onResizeCue,
  onFadeCue,
}) {
  const [dragType, setDragType] = useState(null); // null | 'resize' | 'fadeIn' | 'fadeOut'
  const [localDuration, setLocalDuration] = useState(cue.duration);
  const [localFadeIn, setLocalFadeIn] = useState(cue.fadeIn);
  const [localFadeOut, setLocalFadeOut] = useState(cue.fadeOut);
  const dragOrigin = useRef({
    startX: 0,
    startDuration: 0,
    startFadeIn: 0,
    startFadeOut: 0,
    lineWidth: 0,
  });

  // While dragging, render from local state; otherwise from the cue.
  const duration = dragType ? localDuration : cue.duration;
  const fadeIn = dragType ? localFadeIn : cue.fadeIn;
  const fadeOut = dragType ? localFadeOut : cue.fadeOut;

  function beginDrag(type, event) {
    event.stopPropagation();
    onSelect();
    const lineWidth = trackLineRef.current?.getBoundingClientRect().width ?? 0;
    dragOrigin.current = {
      startX: event.clientX,
      startDuration: cue.duration,
      startFadeIn: cue.fadeIn,
      startFadeOut: cue.fadeOut,
      lineWidth,
    };
    setLocalDuration(cue.duration);
    setLocalFadeIn(cue.fadeIn);
    setLocalFadeOut(cue.fadeOut);
    setDragType(type);
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function handlePointerMove(event) {
    if (!dragType) return;
    const { startX, startDuration, startFadeIn, startFadeOut, lineWidth } = dragOrigin.current;
    const delta = pxDeltaToSeconds(event.clientX - startX, lineWidth, durationSeconds);
    // Only one handle drags at a time, so the other fields stay at their start values.
    if (dragType === 'resize') {
      setLocalDuration(clampDuration(startDuration + delta, cue.time, durationSeconds));
    } else if (dragType === 'fadeIn') {
      setLocalFadeIn(clampFadeIn(startFadeIn + delta, startDuration, startFadeOut));
    } else if (dragType === 'fadeOut') {
      setLocalFadeOut(clampFadeOut(startFadeOut - delta, startDuration, startFadeIn));
    }
  }

  function endDrag() {
    if (!dragType) return;
    if (dragType === 'resize') onResizeCue(cue.id, Math.round(localDuration));
    else if (dragType === 'fadeIn') onFadeCue(cue.id, { fadeIn: Math.round(localFadeIn) });
    else if (dragType === 'fadeOut') onFadeCue(cue.id, { fadeOut: Math.round(localFadeOut) });
    setDragType(null);
  }

  function cancelDrag() {
    setDragType(null);
  }

  const clipWidth = (duration / durationSeconds) * 100;
  const rampInWidth = duration > 0 ? (fadeIn / duration) * 100 : 0;
  const rampOutWidth = duration > 0 ? (fadeOut / duration) * 100 : 0;

  const handleEvents = (type) => ({
    onPointerDown: (e) => beginDrag(type, e),
    onPointerMove: handlePointerMove,
    onPointerUp: endDrag,
    onPointerCancel: cancelDrag,
  });

  const className = `track-clip${selected ? ' selected' : ''}${dragType ? ' dragging' : ''}`;

  return (
    <div
      className={className}
      style={{
        left: `${(cue.time / durationSeconds) * 100}%`,
        width: `${clipWidth}%`,
        '--cue-color': cue.color,
      }}
    >
      <div className="clip-ramp-in" style={{ width: `${rampInWidth}%` }} />
      <div className="clip-ramp-out" style={{ width: `${rampOutWidth}%` }} />
      <span>{formatClockTime(cue.time)}</span>
      <strong>{cue.name}</strong>
      <div className="clip-fade-in-handle" {...handleEvents('fadeIn')} />
      <div className="clip-fade-out-handle" {...handleEvents('fadeOut')} />
      <div className="clip-resize-handle" {...handleEvents('resize')} />
    </div>
  );
}
