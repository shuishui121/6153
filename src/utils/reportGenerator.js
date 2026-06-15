import { calculateMetrics } from '../data/motionData.js'

export function generateReport(dataset, keyframes, selection) {
  const metrics = calculateMetrics(dataset)
  const maxFrame = dataset.frames.length - 1
  const MIN_SELECTION_WIDTH = 5

  let s = selection?.start ?? 0
  let e = selection?.end ?? maxFrame

  if (s > e) {
    ;[s, e] = [e, s]
  }

  s = Math.max(0, Math.min(Math.round(s), maxFrame))
  e = Math.max(0, Math.min(Math.round(e), maxFrame))

  if (e - s < MIN_SELECTION_WIDTH) {
    if (s <= maxFrame - MIN_SELECTION_WIDTH) {
      e = s + MIN_SELECTION_WIDTH
    } else {
      s = Math.max(0, maxFrame - MIN_SELECTION_WIDTH)
      e = maxFrame
    }
  }

  s = Math.max(0, Math.min(s, maxFrame))
  e = Math.max(0, Math.min(e, maxFrame))
  if (s > e) {
    ;[s, e] = [e, s]
  }

  const selectedFrames = dataset.frames.slice(s, e + 1)
  
  const report = {
    title: '运动捕捉数据分析报告',
    generatedAt: new Date().toLocaleString('zh-CN'),
    athlete: dataset.name,
    totalFrames: dataset.frames.length,
    fps: dataset.fps,
    duration: dataset.frames[dataset.frames.length - 1].time,
    
    selection: {
      startFrame: s,
      endFrame: e,
      startTime: dataset.frames[s]?.time || 0,
      endTime: dataset.frames[e]?.time || 0,
      duration: Math.max(0, (dataset.frames[e]?.time || 0) - (dataset.frames[s]?.time || 0))
    },
    
    overallMetrics: metrics,
    
    selectionMetrics: selectedFrames.length > 0 ? {
      avgVelocity: selectedFrames.reduce((s, f) => s + f.velocity, 0) / selectedFrames.length,
      maxVelocity: Math.max(...selectedFrames.map(f => f.velocity)),
      avgJumpHeight: selectedFrames.reduce((s, f) => s + f.jumpHeight, 0) / selectedFrames.length,
      maxJumpHeight: Math.max(...selectedFrames.map(f => f.jumpHeight)),
      avgKneeAngle: selectedFrames.reduce((s, f) => s + f.kneeAngle, 0) / selectedFrames.length
    } : null,
    
    keyframes: keyframes.map(kf => {
      const frame = dataset.frames[kf.frame]
      return {
        ...kf,
        velocity: frame?.velocity,
        jumpHeight: frame?.jumpHeight,
        kneeAngle: frame?.kneeAngle,
        verticalVelocity: frame?.verticalVelocity
      }
    }),
    
    phases: analyzePhases(dataset)
  }
  
  return report
}

function analyzePhases(dataset) {
  const frames = dataset.frames
  const phases = []
  
  let approachEnd = Math.floor(frames.length * 0.4)
  let takeoffEnd = Math.floor(frames.length * 0.55)
  let flightEnd = Math.floor(frames.length * 0.8)
  
  phases.push({
    name: '助跑阶段',
    startFrame: 0,
    endFrame: approachEnd,
    startTime: frames[0].time,
    endTime: frames[approachEnd].time,
    avgVelocity: frames.slice(0, approachEnd).reduce((s, f) => s + f.velocity, 0) / approachEnd,
    description: '运动员加速助跑，积累动能'
  })
  
  phases.push({
    name: '起跳阶段',
    startFrame: approachEnd,
    endFrame: takeoffEnd,
    startTime: frames[approachEnd].time,
    endTime: frames[takeoffEnd].time,
    maxVerticalVelocity: Math.max(...frames.slice(approachEnd, takeoffEnd).map(f => f.verticalVelocity)),
    minKneeAngle: Math.min(...frames.slice(approachEnd, takeoffEnd).map(f => f.kneeAngle)),
    description: '蹬地发力，垂直速度迅速增加'
  })
  
  phases.push({
    name: '腾空阶段',
    startFrame: takeoffEnd,
    endFrame: flightEnd,
    startTime: frames[takeoffEnd].time,
    endTime: frames[flightEnd].time,
    maxHeight: Math.max(...frames.slice(takeoffEnd, flightEnd).map(f => f.jumpHeight)),
    airTime: frames[flightEnd].time - frames[takeoffEnd].time,
    description: '身体腾空，到达最高点后开始下落'
  })
  
  phases.push({
    name: '落地阶段',
    startFrame: flightEnd,
    endFrame: frames.length - 1,
    startTime: frames[flightEnd].time,
    endTime: frames[frames.length - 1].time,
    maxFootPressure: Math.max(...frames.slice(flightEnd).map(f => f.leftFootPressure + f.rightFootPressure)),
    description: '双脚落地，缓冲吸收冲击力'
  })
  
  return phases
}

export function exportReportAsText(report) {
  let text = ''
  
  text += '='.repeat(60) + '\n'
  text += '           运动捕捉数据分析报告\n'
  text += '='.repeat(60) + '\n\n'
  
  text += `生成时间: ${report.generatedAt}\n`
  text += `运动员: ${report.athlete}\n`
  text += `总帧数: ${report.totalFrames} 帧\n`
  text += `采样率: ${report.fps} FPS\n`
  text += `总时长: ${report.duration.toFixed(3)} 秒\n\n`
  
  text += '-'.repeat(60) + '\n'
  text += '【选中区间分析】\n'
  text += '-'.repeat(60) + '\n'
  text += `帧范围: ${report.selection.startFrame} - ${report.selection.endFrame}\n`
  text += `时间范围: ${report.selection.startTime.toFixed(3)}s - ${report.selection.endTime.toFixed(3)}s\n`
  text += `区间时长: ${report.selection.duration.toFixed(3)} 秒\n\n`
  
  if (report.selectionMetrics) {
    text += `平均速度: ${report.selectionMetrics.avgVelocity.toFixed(2)} m/s\n`
    text += `最大速度: ${report.selectionMetrics.maxVelocity.toFixed(2)} m/s\n`
    text += `平均跳跃高度: ${(report.selectionMetrics.avgJumpHeight * 100).toFixed(1)} cm\n`
    text += `最大跳跃高度: ${(report.selectionMetrics.maxJumpHeight * 100).toFixed(1)} cm\n`
    text += `平均膝关节角度: ${report.selectionMetrics.avgKneeAngle.toFixed(1)}°\n\n`
  }
  
  text += '-'.repeat(60) + '\n'
  text += '【整体统计指标】\n'
  text += '-'.repeat(60) + '\n'
  text += `最大跳跃高度: ${(report.overallMetrics.maxJumpHeight * 100).toFixed(1)} cm\n`
  text += `最大水平速度: ${report.overallMetrics.maxVelocity.toFixed(2)} m/s\n`
  text += `平均水平速度: ${report.overallMetrics.avgVelocity.toFixed(2)} m/s\n`
  if (report.overallMetrics.airTime) {
    text += `空中滞留时间: ${report.overallMetrics.airTime.toFixed(3)} s\n`
  }
  text += `最大膝关节角度: ${report.overallMetrics.maxKneeAngle.toFixed(1)}°\n`
  text += `最小膝关节角度: ${report.overallMetrics.minKneeAngle.toFixed(1)}°\n`
  text += `步频: ${report.overallMetrics.strideFrequency} 步/秒\n`
  text += `步长: ${report.overallMetrics.strideLength} 米\n\n`
  
  text += '-'.repeat(60) + '\n'
  text += '【动作阶段分析】\n'
  text += '-'.repeat(60) + '\n\n'
  
  report.phases.forEach((phase, i) => {
    text += `${i + 1}. ${phase.name}\n`
    text += `   时间: ${phase.startTime.toFixed(3)}s - ${phase.endTime.toFixed(3)}s\n`
    text += `   描述: ${phase.description}\n`
    if (phase.avgVelocity !== undefined) {
      text += `   平均速度: ${phase.avgVelocity.toFixed(2)} m/s\n`
    }
    if (phase.maxVerticalVelocity !== undefined) {
      text += `   最大垂直速度: ${phase.maxVerticalVelocity.toFixed(2)} m/s\n`
    }
    if (phase.maxHeight !== undefined) {
      text += `   最大高度: ${(phase.maxHeight * 100).toFixed(1)} cm\n`
    }
    if (phase.airTime !== undefined) {
      text += `   腾空时间: ${phase.airTime.toFixed(3)} s\n`
    }
    text += '\n'
  })
  
  if (report.keyframes.length > 0) {
    text += '-'.repeat(60) + '\n'
    text += '【关键帧标记】\n'
    text += '-'.repeat(60) + '\n\n'
    
    report.keyframes.forEach((kf, i) => {
      text += `${i + 1}. ${kf.label}\n`
      text += `   帧号: ${kf.frame}  时间: ${kf.time.toFixed(3)}s\n`
      if (kf.velocity !== undefined) {
        text += `   速度: ${kf.velocity.toFixed(2)} m/s\n`
      }
      if (kf.jumpHeight !== undefined) {
        text += `   跳跃高度: ${(kf.jumpHeight * 100).toFixed(1)} cm\n`
      }
      if (kf.verticalVelocity !== undefined) {
        text += `   垂直速度: ${kf.verticalVelocity.toFixed(2)} m/s\n`
      }
      text += '\n'
    })
  }
  
  text += '='.repeat(60) + '\n'
  text += '              报告结束\n'
  text += '='.repeat(60) + '\n'
  
  return text
}

export function downloadTextFile(content, filename) {
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

export function exportCSV(dataset, selectedJoints = ['head', 'torso', 'l_foot', 'r_foot']) {
  const headers = ['frame', 'time', ...selectedJoints.map(j => `${j}_x`), ...selectedJoints.map(j => `${j}_y`), ...selectedJoints.map(j => `${j}_z`), 'velocity', 'jump_height']
  
  const rows = dataset.frames.map(frame => {
    const row = [frame.frame, frame.time.toFixed(4)]
    selectedJoints.forEach(j => {
      row.push(frame.joints[j]?.x.toFixed(4) || '')
    })
    selectedJoints.forEach(j => {
      row.push(frame.joints[j]?.y.toFixed(4) || '')
    })
    selectedJoints.forEach(j => {
      row.push(frame.joints[j]?.z.toFixed(4) || '')
    })
    row.push(frame.velocity?.toFixed(4) || '')
    row.push(frame.jumpHeight?.toFixed(4) || '')
    return row.join(',')
  })
  
  return [headers.join(','), ...rows].join('\n')
}
