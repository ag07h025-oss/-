const SPEEDS = [0.5, 1, 2, 4];

export function createControls(container) {
  const root = document.createElement('div');
  root.className = 'controls';
  root.innerHTML = `
    <button type="button" data-role="toggle">▶ 再生</button>
    <button type="button" data-role="restart">⟲ 最初から</button>
    <input type="range" data-role="seek" min="0" max="1000" value="0" aria-label="再生位置" />
    <select data-role="speed" aria-label="再生速度">
      ${SPEEDS.map((s) => `<option value="${s}"${s === 1 ? ' selected' : ''}>${s}x</option>`).join('')}
    </select>
    <span data-role="clock" class="controls__clock"></span>
    <button type="button" data-role="export">⬇ mp4</button>
  `;
  container.appendChild(root);

  const $ = (role) => root.querySelector(`[data-role="${role}"]`);
  const toggleBtn = $('toggle');
  const seek = $('seek');
  const clock = $('clock');
  const timeFormat = new Intl.DateTimeFormat('ja-JP', {
    month: 'numeric',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  return {
    bind(animation, { onExport }) {
      const exportBtn = $('export');
      exportBtn.addEventListener('click', async () => {
        root.classList.add('controls--busy');
        try {
          await onExport((ratio) => {
            exportBtn.textContent = `書き出し中 ${Math.round(ratio * 100)}%`;
          });
        } catch (err) {
          alert(`書き出しに失敗しました: ${err.message}`);
        } finally {
          root.classList.remove('controls--busy');
          exportBtn.textContent = '⬇ mp4';
        }
      });
      toggleBtn.addEventListener('click', () => animation.toggle());
      $('restart').addEventListener('click', () => animation.restart());
      $('speed').addEventListener('change', (e) => animation.setSpeed(Number(e.target.value)));
      seek.addEventListener('input', () => {
        animation.pause();
        animation.seek(Number(seek.value) / 1000);
      });
    },
    update({ progress, time, playing }) {
      toggleBtn.textContent = playing ? '❚❚ 一時停止' : '▶ 再生';
      seek.value = String(Math.round(progress * 1000));
      clock.textContent = timeFormat.format(time);
    },
  };
}
