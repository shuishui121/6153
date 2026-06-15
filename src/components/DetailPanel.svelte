<script>
  import { JOINTS } from '../data/motionData.js'

  export let frame = null
  export let selectedJoint = null
  export let metrics = null
  export let athleteName = ''

  function getJointInfo() {
    if (!frame || !selectedJoint) return null
    const joint = JOINTS.find(j => j.id === selectedJoint)
    const pos = frame.joints[selectedJoint]
    return { joint, pos }
  }

  $: jointInfo = getJointInfo()
</script>

<div class="detail-panel">
  <div class="panel-header">
    <h3>运动参数详情</h3>
    <span class="athlete-tag">{athleteName}</span>
  </div>

  {#if frame}
    <div class="frame-info">
      <div class="info-row">
        <span class="label">帧号</span>
        <span class="value">{frame.frame}</span>
      </div>
      <div class="info-row">
        <span class="label">时间</span>
        <span class="value">{frame.time.toFixed(3)} s</span>
      </div>
    </div>

    <div class="section">
      <h4>运动学参数</h4>
      <div class="info-grid">
        <div class="info-card">
          <span class="card-label">水平速度</span>
          <span class="card-value">{frame.velocity?.toFixed(2) || '--'} m/s</span>
        </div>
        <div class="info-card">
          <span class="card-label">垂直速度</span>
          <span class="card-value">{frame.verticalVelocity?.toFixed(2) || '--'} m/s</span>
        </div>
        <div class="info-card">
          <span class="card-label">跳跃高度</span>
          <span class="card-value">{(frame.jumpHeight * 100)?.toFixed(1) || '--'} cm</span>
        </div>
        <div class="info-card">
          <span class="card-label">膝关节角</span>
          <span class="card-value">{frame.kneeAngle?.toFixed(1) || '--'}°</span>
        </div>
        <div class="info-card">
          <span class="card-label">手臂摆动角</span>
          <span class="card-value">{frame.armAngle?.toFixed(1) || '--'}°</span>
        </div>
        <div class="info-card">
          <span class="card-label">躯干倾角</span>
          <span class="card-value">{frame.torsoAngle?.toFixed(1) || '--'}°</span>
        </div>
      </div>
    </div>

    <div class="section">
      <h4>足底压力</h4>
      <div class="pressure-bars">
        <div class="pressure-item">
          <span class="pressure-label">左脚</span>
          <div class="pressure-bar-bg">
            <div 
              class="pressure-bar-fill" 
              style="width: {(frame.leftFootPressure || 0) * 100}%"
            ></div>
          </div>
          <span class="pressure-value">{((frame.leftFootPressure || 0) * 100).toFixed(0)}%</span>
        </div>
        <div class="pressure-item">
          <span class="pressure-label">右脚</span>
          <div class="pressure-bar-bg">
            <div 
              class="pressure-bar-fill right" 
              style="width: {(frame.rightFootPressure || 0) * 100}%"
            ></div>
          </div>
          <span class="pressure-value">{((frame.rightFootPressure || 0) * 100).toFixed(0)}%</span>
        </div>
      </div>
    </div>

    {#if jointInfo}
      <div class="section">
        <h4>
          <span class="joint-dot" style="background: {jointInfo.joint.color}"></span>
          {jointInfo.joint.name} 位置
        </h4>
        <div class="joint-coords">
          <div class="coord-item">
            <span class="coord-label">X (前进)</span>
            <span class="coord-value">{jointInfo.pos.x.toFixed(3)} m</span>
          </div>
          <div class="coord-item">
            <span class="coord-label">Y (高度)</span>
            <span class="coord-value">{jointInfo.pos.y.toFixed(3)} m</span>
          </div>
          <div class="coord-item">
            <span class="coord-label">Z (侧向)</span>
            <span class="coord-value">{jointInfo.pos.z.toFixed(3)} m</span>
          </div>
        </div>
      </div>
    {:else}
      <div class="section hint">
        <p>💡 点击视图中的关节点查看详细位置信息</p>
      </div>
    {/if}
  {:else}
    <div class="empty-state">
      <p>选择数据帧查看详情</p>
    </div>
  {/if}

  {#if metrics}
    <div class="section metrics-section">
      <h4>整体统计指标</h4>
      <div class="metrics-grid">
        <div class="metric-item">
          <span class="metric-value">{metrics.maxJumpHeight?.toFixed(2) || '--'} m</span>
          <span class="metric-label">最大跳跃高度</span>
        </div>
        <div class="metric-item">
          <span class="metric-value">{metrics.maxVelocity?.toFixed(2) || '--'} m/s</span>
          <span class="metric-label">最大速度</span>
        </div>
        <div class="metric-item">
          <span class="metric-value">{metrics.airTime?.toFixed(2) || '--'} s</span>
          <span class="metric-label">空中时间</span>
        </div>
        <div class="metric-item">
          <span class="metric-value">{metrics.avgVelocity?.toFixed(2) || '--'} m/s</span>
          <span class="metric-label">平均速度</span>
        </div>
      </div>
    </div>
  {/if}
</div>

<style>
  .detail-panel {
    background: #1e293b;
    border-radius: 12px;
    padding: 16px;
    height: 100%;
    overflow-y: auto;
  }

  .panel-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16px;
    padding-bottom: 12px;
    border-bottom: 1px solid #334155;
  }

  .panel-header h3 {
    font-size: 16px;
    font-weight: 600;
    color: #f1f5f9;
  }

  .athlete-tag {
    background: #3b82f6;
    color: white;
    padding: 4px 10px;
    border-radius: 12px;
    font-size: 12px;
    font-weight: 500;
  }

  .frame-info {
    display: flex;
    gap: 16px;
    margin-bottom: 16px;
    padding: 10px 12px;
    background: #0f172a;
    border-radius: 8px;
  }

  .info-row {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .info-row .label {
    font-size: 11px;
    color: #64748b;
  }

  .info-row .value {
    font-size: 14px;
    font-weight: 600;
    color: #e2e8f0;
    font-family: 'SF Mono', 'Consolas', monospace;
  }

  .section {
    margin-bottom: 16px;
  }

  .section h4 {
    font-size: 13px;
    font-weight: 600;
    color: #cbd5e1;
    margin-bottom: 10px;
    display: flex;
    align-items: center;
    gap: 6px;
  }

  .joint-dot {
    width: 10px;
    height: 10px;
    border-radius: 50%;
    display: inline-block;
  }

  .info-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 8px;
  }

  .info-card {
    background: #0f172a;
    padding: 10px;
    border-radius: 8px;
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .card-label {
    font-size: 11px;
    color: #64748b;
  }

  .card-value {
    font-size: 14px;
    font-weight: 600;
    color: #60a5fa;
    font-family: 'SF Mono', 'Consolas', monospace;
  }

  .pressure-bars {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .pressure-item {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .pressure-label {
    font-size: 12px;
    color: #94a3b8;
    width: 40px;
  }

  .pressure-bar-bg {
    flex: 1;
    height: 8px;
    background: #0f172a;
    border-radius: 4px;
    overflow: hidden;
  }

  .pressure-bar-fill {
    height: 100%;
    background: linear-gradient(90deg, #3b82f6, #60a5fa);
    border-radius: 4px;
    transition: width 0.3s ease;
  }

  .pressure-bar-fill.right {
    background: linear-gradient(90deg, #f472b6, #fb7185);
  }

  .pressure-value {
    font-size: 12px;
    color: #e2e8f0;
    width: 40px;
    text-align: right;
    font-family: 'SF Mono', 'Consolas', monospace;
  }

  .joint-coords {
    background: #0f172a;
    padding: 12px;
    border-radius: 8px;
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .coord-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .coord-label {
    font-size: 12px;
    color: #64748b;
  }

  .coord-value {
    font-size: 13px;
    color: #a7f3d0;
    font-family: 'SF Mono', 'Consolas', monospace;
  }

  .hint p {
    font-size: 12px;
    color: #64748b;
    text-align: center;
    padding: 12px;
    background: #0f172a;
    border-radius: 8px;
  }

  .empty-state {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 200px;
    color: #64748b;
    font-size: 14px;
  }

  .metrics-section {
    border-top: 1px solid #334155;
    padding-top: 16px;
  }

  .metrics-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 10px;
  }

  .metric-item {
    background: linear-gradient(135deg, #1e40af22, #7c3aed22);
    padding: 12px;
    border-radius: 8px;
    border: 1px solid #334155;
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .metric-value {
    font-size: 15px;
    font-weight: 700;
    color: #fbbf24;
    font-family: 'SF Mono', 'Consolas', monospace;
  }

  .metric-label {
    font-size: 11px;
    color: #94a3b8;
  }
</style>
