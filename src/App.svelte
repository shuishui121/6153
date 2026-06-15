<script>
  import { onMount, onDestroy, afterUpdate } from 'svelte'
  import SkeletonView from './components/SkeletonView.svelte'
  import Timeline from './components/Timeline.svelte'
  import ControlBar from './components/ControlBar.svelte'
  import DetailPanel from './components/DetailPanel.svelte'
  import KeyframeList from './components/KeyframeList.svelte'
  import { athleteAData, athleteBData, calculateMetrics } from './data/motionData.js'
  import { generateReport, exportReportAsText, downloadTextFile, exportCSV } from './utils/reportGenerator.js'

  let currentDataset = athleteAData
  let compareDataset = athleteBData
  
  let currentFrame = 0
  let isPlaying = false
  let playSpeed = 1
  let view = 'side'
  let selectedJoint = null
  let showTrail = true
  let compareMode = false
  
  const SHORT_SAMPLE_THRESHOLD = 20

  function adaptSelectionToDataset(dataset) {
    const maxFrame = dataset.frames.length - 1
    if (dataset.frames.length < SHORT_SAMPLE_THRESHOLD) {
      return { start: 0, end: maxFrame }
    }
    return { start: 0, end: Math.min(100, maxFrame) }
  }

  let selection = adaptSelectionToDataset(athleteAData)
  let keyframes = [
    { frame: 40, time: 40/60, label: '助跑中期', color: '#60a5fa' },
    { frame: 72, time: 72/60, label: '起跳瞬间', color: '#f59e0b' },
    { frame: 90, time: 90/60, label: '最高点', color: '#ef4444' },
    { frame: 130, time: 130/60, label: '落地瞬间', color: '#10b981' }
  ]
  
  let playInterval = null
  let metrics = null
  let compareMetrics = null
  
  let viewWidth = 800
  let viewHeight = 500
  let timelineWidth = 900
  let containerEl
  
  $: frameData = currentDataset.frames[currentFrame]
  $: compareFrameData = compareMode ? compareDataset.frames[currentFrame] : null
  
  $: trailFrames = showTrail ? currentDataset.frames.slice(Math.max(0, currentFrame - 60), currentFrame + 1) : []
  
  function updateSize() {
    if (containerEl) {
      const rect = containerEl.getBoundingClientRect()
      viewWidth = Math.max(500, rect.width - 340)
      viewHeight = Math.max(350, rect.height - 280)
      timelineWidth = Math.max(500, rect.width - 40)
    }
  }

  function togglePlay() {
    isPlaying = !isPlaying
    if (isPlaying) {
      startPlayback()
    } else {
      stopPlayback()
    }
  }

  function startPlayback() {
    stopPlayback()
    const frameTime = 1000 / (currentDataset.fps * playSpeed)
    playInterval = setInterval(() => {
      currentFrame++
      if (currentFrame >= currentDataset.frames.length - 1) {
        currentFrame = 0
      }
    }, frameTime)
  }

  function stopPlayback() {
    if (playInterval) {
      clearInterval(playInterval)
      playInterval = null
    }
  }

  function setFrame(frame) {
    currentFrame = Math.max(0, Math.min(currentDataset.frames.length - 1, Math.round(frame)))
  }

  function handleFrameChange(e) {
    setFrame(e.detail.frame)
  }

  function handleSelectionChange(e) {
    selection = { ...e.detail }
  }

  function handleKeyframesChange(e) {
    keyframes = e.detail.keyframes
  }

  function handleKeyframeClick(e) {
    setFrame(e.detail.keyframe.frame)
  }

  function handleGoToKeyframe(e) {
    setFrame(e.detail.frame)
  }

  function handleViewChange(e) {
    view = e.detail.view
  }

  function handleTrailToggle(e) {
    showTrail = e.detail.show
  }

  function handleCompareToggle(e) {
    compareMode = e.detail.enabled
  }

  function handleSpeedChange(e) {
    playSpeed = e.detail.speed
    if (isPlaying) {
      startPlayback()
    }
  }

  function handleJointSelect(e) {
    selectedJoint = e.detail.jointId
  }

  function handleExportReport() {
    const report = generateReport(currentDataset, keyframes, selection)
    const text = exportReportAsText(report)
    const filename = `${currentDataset.name}_运动分析报告_${new Date().toISOString().slice(0, 10)}.txt`
    downloadTextFile(text, filename)
  }

  function handleResetView() {
    currentFrame = 0
    selection = adaptSelectionToDataset(currentDataset)
    selectedJoint = null
  }

  function switchDataset(dataset) {
    currentDataset = dataset
    currentFrame = 0
    metrics = calculateMetrics(dataset)
    selection = adaptSelectionToDataset(dataset)
  }

  onMount(() => {
    updateSize()
    window.addEventListener('resize', updateSize)
    metrics = calculateMetrics(currentDataset)
    compareMetrics = calculateMetrics(compareDataset)
    
    document.addEventListener('frameChange', handleFrameChange)
    document.addEventListener('togglePlay', togglePlay)
    document.addEventListener('viewChange', handleViewChange)
    document.addEventListener('trailToggle', handleTrailToggle)
    document.addEventListener('compareToggle', handleCompareToggle)
    document.addEventListener('speedChange', handleSpeedChange)
    document.addEventListener('exportReport', handleExportReport)
    document.addEventListener('resetView', handleResetView)
    document.addEventListener('goToKeyframe', handleGoToKeyframe)
    document.addEventListener('keyframesChange', handleKeyframesChange)
    document.addEventListener('selectionChange', handleSelectionChange)
  })

  onDestroy(() => {
    stopPlayback()
    window.removeEventListener('resize', updateSize)
    document.removeEventListener('frameChange', handleFrameChange)
    document.removeEventListener('togglePlay', togglePlay)
    document.removeEventListener('viewChange', handleViewChange)
    document.removeEventListener('trailToggle', handleTrailToggle)
    document.removeEventListener('compareToggle', handleCompareToggle)
    document.removeEventListener('speedChange', handleSpeedChange)
    document.removeEventListener('exportReport', handleExportReport)
    document.removeEventListener('resetView', handleResetView)
    document.removeEventListener('goToKeyframe', handleGoToKeyframe)
    document.removeEventListener('keyframesChange', handleKeyframesChange)
    document.removeEventListener('selectionChange', handleSelectionChange)
  })

  afterUpdate(() => {
    updateSize()
  })
</script>

<div class="app" bind:this={containerEl}>
  <header class="app-header">
    <div class="header-left">
      <div class="logo">
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="4" r="2"/>
          <line x1="12" y1="6" x2="12" y2="14"/>
          <line x1="12" y1="9" x2="8" y2="7"/>
          <line x1="12" y1="9" x2="16" y2="7"/>
          <line x1="12" y1="14" x2="9" y2="20"/>
          <line x1="12" y1="14" x2="15" y2="20"/>
        </svg>
      </div>
      <div class="header-title">
        <h1>运动捕捉数据分析系统</h1>
        <p>Motion Capture Analysis Platform</p>
      </div>
    </div>
    
    <div class="header-right">
      <div class="dataset-selector">
        <span class="selector-label">当前数据:</span>
        <button 
          class="dataset-btn {currentDataset.id === 'athlete_a' ? 'active' : ''}"
          on:click={() => switchDataset(athleteAData)}
        >
          运动员A
        </button>
        <button 
          class="dataset-btn {currentDataset.id === 'athlete_b' ? 'active' : ''}"
          on:click={() => switchDataset(athleteBData)}
        >
          运动员B
        </button>
      </div>
    </div>
  </header>

  <main class="main-content">
    <div class="view-area">
      <div class="view-header">
        <div class="view-tabs">
          <button class="view-tab {view === 'side' ? 'active' : ''}" on:click={() => view = 'side'}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M4 18h16v-2H4v2zm0-5h16v-2H4v2zm0-7v2h16V6H4z"/>
            </svg>
            侧视图 (X-Y)
          </button>
          <button class="view-tab {view === 'top' ? 'active' : ''}" on:click={() => view = 'top'}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M4 4v16h16V4H4zm2 14V6h6v12H6zm8 0v-5h6v5h-6zm0-7V6h6v5h-6z"/>
            </svg>
            俯视图 (X-Z)
          </button>
        </div>
        
        <div class="view-stats">
          <div class="stat-item">
            <span class="stat-label">速度</span>
            <span class="stat-value">{frameData?.velocity?.toFixed(2) || '--'} m/s</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">高度</span>
            <span class="stat-value">{(frameData?.jumpHeight * 100)?.toFixed(1) || '--'} cm</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">膝角</span>
            <span class="stat-value">{frameData?.kneeAngle?.toFixed(1) || '--'}°</span>
          </div>
        </div>
      </div>

      <div class="view-canvas">
        <SkeletonView
          frame={frameData}
          {view}
          width={viewWidth}
          height={viewHeight}
          bind:selectedJoint
          trailData={trailFrames}
          comparisonFrame={compareFrameData}
          on:jointSelect={handleJointSelect}
        />
        
        {#if compareMode}
          <div class="compare-legend">
            <div class="legend-item">
              <span class="legend-dot" style="background: #60a5fa"></span>
              {currentDataset.name}
            </div>
            <div class="legend-item">
              <span class="legend-dot" style="background: #f472b6"></span>
              {compareDataset.name}
            </div>
          </div>
        {/if}
      </div>

      <div class="timeline-area">
        <ControlBar
          bind:currentFrame
          totalFrames={currentDataset.frames.length}
          bind:isPlaying
          bind:playSpeed
          bind:view
          bind:showTrail
          bind:compareMode
        />
        
        <div class="timeline-wrapper">
          <Timeline
            frames={currentDataset.frames}
            bind:currentFrame
            bind:selection
            bind:keyframes
            width={timelineWidth}
            on:frameChange={handleFrameChange}
            on:selectionChange={handleSelectionChange}
            on:keyframesChange={handleKeyframesChange}
            on:keyframeClick={handleKeyframeClick}
          />
        </div>
      </div>
    </div>

    <aside class="sidebar">
      <DetailPanel
        frame={frameData}
        {selectedJoint}
        {metrics}
        athleteName={currentDataset.name}
      />
      
      <div class="sidebar-divider"></div>
      
      <KeyframeList
        bind:keyframes
        {currentFrame}
      />

      {#if compareMode}
        <div class="sidebar-divider"></div>
        <div class="compare-panel">
          <h4>数据对比</h4>
          <div class="compare-table">
            <div class="compare-row header">
              <span>指标</span>
              <span>{currentDataset.name}</span>
              <span>{compareDataset.name}</span>
              <span>差值</span>
            </div>
            <div class="compare-row">
              <span class="row-label">最大跳跃高度</span>
              <span>{(metrics?.maxJumpHeight * 100)?.toFixed(1)} cm</span>
              <span>{(compareMetrics?.maxJumpHeight * 100)?.toFixed(1)} cm</span>
              <span class={metrics?.maxJumpHeight > compareMetrics?.maxJumpHeight ? 'pos' : 'neg'}>
                {((metrics?.maxJumpHeight - compareMetrics?.maxJumpHeight) * 100)?.toFixed(1)} cm
              </span>
            </div>
            <div class="compare-row">
              <span class="row-label">最大速度</span>
              <span>{metrics?.maxVelocity?.toFixed(2)} m/s</span>
              <span>{compareMetrics?.maxVelocity?.toFixed(2)} m/s</span>
              <span class={metrics?.maxVelocity > compareMetrics?.maxVelocity ? 'pos' : 'neg'}>
                {(metrics?.maxVelocity - compareMetrics?.maxVelocity)?.toFixed(2)} m/s
              </span>
            </div>
            <div class="compare-row">
              <span class="row-label">平均速度</span>
              <span>{metrics?.avgVelocity?.toFixed(2)} m/s</span>
              <span>{compareMetrics?.avgVelocity?.toFixed(2)} m/s</span>
              <span class={metrics?.avgVelocity > compareMetrics?.avgVelocity ? 'pos' : 'neg'}>
                {(metrics?.avgVelocity - compareMetrics?.avgVelocity)?.toFixed(2)} m/s
              </span>
            </div>
            <div class="compare-row">
              <span class="row-label">空中时间</span>
              <span>{metrics?.airTime?.toFixed(3)} s</span>
              <span>{compareMetrics?.airTime?.toFixed(3)} s</span>
              <span class={metrics?.airTime > compareMetrics?.airTime ? 'pos' : 'neg'}>
                {(metrics?.airTime - compareMetrics?.airTime)?.toFixed(3)} s
              </span>
            </div>
          </div>
        </div>
      {/if}
    </aside>
  </main>
</div>

<style>
  .app {
    width: 100vw;
    height: 100vh;
    display: flex;
    flex-direction: column;
    background: #0f172a;
    overflow: hidden;
  }

  .app-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 12px 20px;
    background: #1e293b;
    border-bottom: 1px solid #334155;
    flex-shrink: 0;
  }

  .header-left {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .logo {
    width: 44px;
    height: 44px;
    background: linear-gradient(135deg, #3b82f6, #8b5cf6);
    border-radius: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
  }

  .header-title h1 {
    font-size: 18px;
    font-weight: 700;
    color: #f1f5f9;
    margin: 0;
    line-height: 1.2;
  }

  .header-title p {
    font-size: 11px;
    color: #64748b;
    margin: 2px 0 0 0;
    letter-spacing: 0.5px;
  }

  .dataset-selector {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .selector-label {
    font-size: 12px;
    color: #94a3b8;
  }

  .dataset-btn {
    padding: 6px 14px;
    border: 1px solid #334155;
    border-radius: 6px;
    background: #0f172a;
    color: #94a3b8;
    font-size: 12px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .dataset-btn:hover {
    border-color: #475569;
    color: #e2e8f0;
  }

  .dataset-btn.active {
    background: #3b82f6;
    border-color: #3b82f6;
    color: white;
  }

  .main-content {
    flex: 1;
    display: flex;
    overflow: hidden;
    padding: 16px;
    gap: 16px;
  }

  .view-area {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 12px;
    min-width: 0;
  }

  .view-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .view-tabs {
    display: flex;
    gap: 4px;
    background: #1e293b;
    padding: 4px;
    border-radius: 10px;
    border: 1px solid #334155;
  }

  .view-tab {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 8px 16px;
    border: none;
    border-radius: 8px;
    background: transparent;
    color: #64748b;
    font-size: 13px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .view-tab:hover {
    color: #e2e8f0;
  }

  .view-tab.active {
    background: #3b82f6;
    color: white;
  }

  .view-stats {
    display: flex;
    gap: 20px;
  }

  .stat-item {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: 2px;
  }

  .stat-label {
    font-size: 11px;
    color: #64748b;
  }

  .stat-value {
    font-size: 15px;
    font-weight: 700;
    color: #60a5fa;
    font-family: 'SF Mono', 'Consolas', monospace;
  }

  .view-canvas {
    flex: 1;
    position: relative;
    background: #0f172a;
    border-radius: 12px;
    border: 1px solid #334155;
    overflow: hidden;
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 0;
  }

  .compare-legend {
    position: absolute;
    top: 12px;
    right: 12px;
    background: rgba(15, 23, 42, 0.9);
    border: 1px solid #334155;
    border-radius: 8px;
    padding: 10px 14px;
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .legend-item {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 12px;
    color: #94a3b8;
  }

  .legend-dot {
    width: 10px;
    height: 10px;
    border-radius: 50%;
  }

  .timeline-area {
    display: flex;
    flex-direction: column;
    gap: 10px;
    flex-shrink: 0;
  }

  .timeline-wrapper {
    display: flex;
    justify-content: center;
  }

  .sidebar {
    width: 300px;
    flex-shrink: 0;
    display: flex;
    flex-direction: column;
    gap: 0;
    overflow-y: auto;
  }

  .sidebar-divider {
    height: 12px;
  }

  .compare-panel {
    background: #1e293b;
    border-radius: 12px;
    padding: 16px;
  }

  .compare-panel h4 {
    font-size: 14px;
    font-weight: 600;
    color: #e2e8f0;
    margin-bottom: 12px;
  }

  .compare-table {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .compare-row {
    display: grid;
    grid-template-columns: 1fr 0.8fr 0.8fr 0.8fr;
    gap: 6px;
    padding: 8px 6px;
    font-size: 11px;
    border-radius: 6px;
  }

  .compare-row.header {
    color: #64748b;
    font-weight: 600;
    border-bottom: 1px solid #334155;
    padding-bottom: 6px;
  }

  .compare-row:not(.header) {
    color: #94a3b8;
    font-family: 'SF Mono', 'Consolas', monospace;
  }

  .compare-row .row-label {
    color: #64748b;
    font-family: -apple-system, BlinkMacSystemFont, sans-serif;
  }

  .compare-row .pos {
    color: #10b981;
  }

  .compare-row .neg {
    color: #ef4444;
  }
</style>
