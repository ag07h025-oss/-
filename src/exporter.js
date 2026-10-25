import {
  BufferTarget,
  CanvasSource,
  Mp4OutputFormat,
  Output,
  QUALITY_HIGH,
  canEncodeVideo,
} from 'mediabunny';

const timeFormat = new Intl.DateTimeFormat('ja-JP', {
  month: 'numeric',
  day: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
});

// Steps the animation frame by frame (not in real time), so the video is smooth
// regardless of how fast the map actually renders.
export async function exportMp4(map, animation, { fps = 30, onProgress } = {}) {
  const src = map.getCanvas();
  // H.264 requires even dimensions.
  const width = src.width & ~1;
  const height = src.height & ~1;
  if (!(await canEncodeVideo('avc', { width, height }))) {
    throw new Error('このブラウザは H.264 (mp4) のエンコードに対応していません。');
  }

  const frameCanvas = document.createElement('canvas');
  frameCanvas.width = width;
  frameCanvas.height = height;
  const ctx = frameCanvas.getContext('2d');

  const output = new Output({ format: new Mp4OutputFormat({ fastStart: 'in-memory' }), target: new BufferTarget() });
  const source = new CanvasSource(frameCanvas, { codec: 'avc', bitrate: QUALITY_HIGH });
  output.addVideoTrack(source, { frameRate: fps });
  await output.start();

  const totalFrames = Math.max(1, Math.round((animation.durationMs / animation.speed / 1000) * fps));
  try {
    for (let i = 0; i <= totalFrames; i++) {
      const frame = animation.seek(i / totalFrames);
      map.triggerRepaint();
      await map.once('idle');
      ctx.drawImage(src, 0, 0, width, height, 0, 0, width, height);
      drawClock(ctx, frame.time, window.devicePixelRatio || 1);
      await source.add(i / fps, 1 / fps);
      onProgress?.(i / totalFrames);
    }
    await output.finalize();
  } catch (err) {
    await output.cancel();
    throw err;
  }
  return new Blob([output.target.buffer], { type: 'video/mp4' });
}

function drawClock(ctx, time, scale) {
  const text = timeFormat.format(time);
  const pad = 10 * scale;
  ctx.font = `600 ${20 * scale}px system-ui, sans-serif`;
  const w = ctx.measureText(text).width + pad * 2;
  const h = 32 * scale;
  ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
  ctx.fillRect(16 * scale, 16 * scale, w, h);
  ctx.fillStyle = '#222';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, 16 * scale + pad, 16 * scale + h / 2);
}

export function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
