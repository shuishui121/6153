<script>
  export let currentFrame = 0
  export let totalFrames = 100
  export let isPlaying = false
  export let playSpeed = 1
  export let view = 'side'
  export let showTrail = true
  export let compareMode = false

  function togglePlay() {
    isPlaying = !isPlaying
    const event = new CustomEvent('togglePlay', { detail: { isPlaying } })
    document.dispatchEvent(event)
  }

  function stepFrame(delta) {
    const newFrame = Math.max(0, Math.min(totalFrames - 1, currentFrame + delta))
    const event = new CustomEvent('frameChange', { detail: { frame: newFrame } })
    document.dispatchEvent(event)
  }

  function changeSpeed() {
    const speeds = [0.25, 0.5, 1, 2, 3]
    const idx = speeds.indexOf(playSpeed)
    playSpeed = speeds[(idx + 1) % speeds.length]
    const event = new CustomEvent('speedChange', { detail: { speed: playSpeed } })
    document.dispatchEvent(event)
  }

  function toggleView() {
    view = view === 'side' ? 'top' : 'side'
    const event = new CustomEvent('viewChange', { detail: { view } })
    document.dispatchEvent(event)
  }

  function toggleTrail() {
    showTrail = !showTrail
    const event = new CustomEvent('trailToggle', { detail: { show: showTrail } })
    document.dispatchEvent(event)
  }

  function toggleCompare() {
    compareMode = !compareMode
    const event = new CustomEvent('compareToggle', { detail: { enabled: compareMode } })
    document.dispatchEvent(event)
  }

  function exportReport() {
    const event = new CustomEvent('exportReport')
    document.dispatchEvent(event)
  }

  function resetView() {
    const event = new CustomEvent('resetView')
    document.dispatchEvent(event)
  }
</script>

<div class="control-bar">
  <div class="control-group">
    <button class="ctrl-btn" on:click={() => stepFrame(-10)} title="后退10帧">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
        <path d="M6 6h2v12H6zm3.5 6l8.5 6V6z"/>
      </svg>
    </button>
    <button class="ctrl-btn" on:click={() => stepFrame(-1)} title="后退1帧">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
        <path d="M15.5 12L6 6v12l9.5-6zM19 6h2v12h-2z"/>
      </svg>
    </button>
    <button class="ctrl-btn play-btn" on:click={togglePlay} title={isPlaying ? '暂停' : '播放'}>
      {#if isPlaying}
        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
          <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z"/>
        </svg>
      {:else}
        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
          <path d="M8 5v14l11-7z"/>
        </svg>
      {/if}
    </button>
    <button class="ctrl-btn" on:click={() => stepFrame(1)} title="前进1帧">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
        <path d="M8.5 12L17 6v12l-8.5-6zM5 6h2v12H5z"/>
      </svg>
    </button>
    <button class="ctrl-btn" on:click={() => stepFrame(10)} title="前进10帧">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
        <path d="M16 6h2v12h-2zM6 18l8.5-6L6 6v12z"/>
      </svg>
    </button>
  </div>

  <div class="control-group">
    <button class="ctrl-btn speed-btn" on:click={changeSpeed} title="播放速度">
      <span class="speed-label">{playSpeed}x</span>
    </button>
  </div>

  <div class="divider"></div>

  <div class="control-group">
    <button 
      class="toggle-btn {view === 'side' ? 'active' : ''}" 
      on:click={toggleView}
      title="切换视图"
    >
      {view === 'side' ? '侧视图' : '俯视图'}
    </button>
  </div>

  <div class="control-group">
    <button 
      class="toggle-btn {showTrail ? 'active' : ''}" 
      on:click={toggleTrail}
      title="显示运动轨迹"
    >
      轨迹
    </button>
  </div>

  <div class="control-group">
    <button 
      class="toggle-btn {compareMode ? 'active' : ''}" 
      on:click={toggleCompare}
      title="数据对比模式"
    >
      对比
    </button>
  </div>

  <div class="divider"></div>

  <div class="control-group">
    <button class="ctrl-btn" on:click={resetView} title="重置视图">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
        <path d="M17.65 6.35C16.2 4.9 14.21 4 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08c-.82 2.33-3.04 4-5.65 4-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z"/>
      </svg>
    </button>
  </div>

  <div class="spacer"></div>

  <div class="control-group">
    <button class="export-btn" on:click={exportReport} title="导出分析报告">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
        <path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"/>
      </svg>
      导出报告
    </button>
  </div>

  <div class="frame-info-display">
    <span class="frame-num">帧 {currentFrame + 1}/{totalFrames}</span>
    <span class="time-display">{(currentFrame / 60).toFixed(2)}s</span>
  </div>
</div>

<style>
  .control-bar {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 10px 16px;
    background: #1e293b;
    border-radius: 12px;
    border: 1px solid #334155;
  }

  .control-group {
    display: flex;
    align-items: center;
    gap: 4px;
  }

  .ctrl-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 36px;
    height: 36px;
    border: none;
    border-radius: 8px;
    background: #334155;
    color: #e2e8f0;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .ctrl-btn:hover {
    background: #475569;
    transform: translateY(-1px);
  }

  .ctrl-btn:active {
    transform: translateY(0);
  }

  .play-btn {
    background: #3b82f6;
    color: white;
    width: 42px;
    height: 42px;
  }

  .play-btn:hover {
    background: #2563eb;
  }

  .speed-btn {
    width: auto;
    padding: 0 12px;
    min-width: 56px;
  }

  .speed-label {
    font-size: 13px;
    font-weight: 600;
  }

  .toggle-btn {
    padding: 8px 14px;
    border: none;
    border-radius: 8px;
    background: #334155;
    color: #94a3b8;
    cursor: pointer;
    font-size: 13px;
    font-weight: 500;
    transition: all 0.2s ease;
  }

  .toggle-btn:hover {
    background: #475569;
    color: #e2e8f0;
  }

  .toggle-btn.active {
    background: #3b82f6;
    color: white;
  }

  .divider {
    width: 1px;
    height: 28px;
    background: #334155;
    margin: 0 4px;
  }

  .spacer {
    flex: 1;
  }

  .export-btn {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 8px 16px;
    border: none;
    border-radius: 8px;
    background: linear-gradient(135deg, #10b981, #059669);
    color: white;
    cursor: pointer;
    font-size: 13px;
    font-weight: 600;
    transition: all 0.2s ease;
  }

  .export-btn:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
  }

  .frame-info-display {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: 2px;
    padding-left: 12px;
    border-left: 1px solid #334155;
  }

  .frame-num {
    font-size: 13px;
    font-weight: 600;
    color: #e2e8f0;
    font-family: 'SF Mono', 'Consolas', monospace;
  }

  .time-display {
    font-size: 11px;
    color: #64748b;
    font-family: 'SF Mono', 'Consolas', monospace;
  }
</style>
