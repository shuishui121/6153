<script>
  export let keyframes = []
  export let currentFrame = 0

  function goToKeyframe(kf) {
    const event = new CustomEvent('goToKeyframe', { detail: { frame: kf.frame } })
    document.dispatchEvent(event)
  }

  function removeKeyframe(kf) {
    const idx = keyframes.indexOf(kf)
    if (idx >= 0) {
      keyframes.splice(idx, 1)
      keyframes = [...keyframes]
      const event = new CustomEvent('keyframesChange', { detail: { keyframes } })
      document.dispatchEvent(event)
    }
  }

  function updateLabel(kf, label) {
    kf.label = label
    keyframes = [...keyframes]
    const event = new CustomEvent('keyframesChange', { detail: { keyframes } })
    document.dispatchEvent(event)
  }
</script>

<div class="keyframe-list">
  <div class="list-header">
    <h4>关键帧标记</h4>
    <span class="count">{keyframes.length} 个</span>
  </div>
  
  {#if keyframes.length === 0}
    <div class="empty-hint">
      <p>💡 双击时间轴添加关键帧</p>
    </div>
  {:else}
    <div class="list-content">
      {#each keyframes as kf, idx}
        <div class="keyframe-item {kf.frame === currentFrame ? 'active' : ''}" on:click={() => goToKeyframe(kf)}>
          <div class="kf-indicator" style="background: {kf.color || '#fbbf24'}">
            {idx + 1}
          </div>
          <div class="kf-info">
            <input 
              class="kf-label" 
              type="text" 
              value={kf.label}
              on:change={(e) => updateLabel(kf, e.target.value)}
              on:click|stopPropagation
            />
            <span class="kf-time">帧 {kf.frame} · {kf.time.toFixed(2)}s</span>
          </div>
          <button class="kf-delete" on:click|stopPropagation={() => removeKeyframe(kf)} title="删除">
            ×
          </button>
        </div>
      {/each}
    </div>
  {/if}
</div>

<style>
  .keyframe-list {
    background: #1e293b;
    border-radius: 12px;
    padding: 14px;
  }

  .list-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 12px;
  }

  .list-header h4 {
    font-size: 14px;
    font-weight: 600;
    color: #e2e8f0;
  }

  .count {
    font-size: 12px;
    color: #64748b;
    background: #0f172a;
    padding: 2px 8px;
    border-radius: 10px;
  }

  .empty-hint {
    text-align: center;
    padding: 20px 0;
    color: #64748b;
    font-size: 13px;
  }

  .list-content {
    display: flex;
    flex-direction: column;
    gap: 6px;
    max-height: 200px;
    overflow-y: auto;
  }

  .keyframe-item {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 8px 10px;
    background: #0f172a;
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.2s ease;
    border: 1px solid transparent;
  }

  .keyframe-item:hover {
    background: #1e293b;
    border-color: #334155;
  }

  .keyframe-item.active {
    border-color: #3b82f6;
    background: #1e3a8a33;
  }

  .kf-indicator {
    width: 24px;
    height: 24px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 12px;
    font-weight: 700;
    color: #1e293b;
    flex-shrink: 0;
  }

  .kf-info {
    flex: 1;
    min-width: 0;
  }

  .kf-label {
    width: 100%;
    background: transparent;
    border: none;
    color: #e2e8f0;
    font-size: 13px;
    font-weight: 500;
    padding: 2px 0;
    outline: none;
    border-bottom: 1px dashed transparent;
  }

  .kf-label:focus {
    border-bottom-color: #3b82f6;
  }

  .kf-time {
    font-size: 11px;
    color: #64748b;
    font-family: 'SF Mono', 'Consolas', monospace;
  }

  .kf-delete {
    width: 22px;
    height: 22px;
    border: none;
    border-radius: 4px;
    background: transparent;
    color: #64748b;
    cursor: pointer;
    font-size: 18px;
    line-height: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s ease;
  }

  .kf-delete:hover {
    background: #ef444433;
    color: #ef4444;
  }
</style>
