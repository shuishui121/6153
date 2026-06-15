<script>
  import * as d3 from 'd3'
  import { onMount, afterUpdate } from 'svelte'

  export let frames = []
  export let currentFrame = 0
  export let selection = { start: 0, end: 100 }
  export let keyframes = []
  export let isPlaying = false
  export let width = 900
  export let height = 120

  let svgEl
  let isDragging = false
  let dragType = null

  const margin = { top: 10, right: 20, bottom: 30, left: 50 }

  let xScale
  let yScale

  function updateScales() {
    xScale = d3.scaleLinear()
      .domain([0, Math.max(frames.length - 1, 1)])
      .range([margin.left, width - margin.right])

    yScale = d3.scaleLinear()
      .domain([0, 2.5])
      .range([height - margin.bottom, margin.top])
  }

  function getX(frame) {
    return xScale(frame)
  }

  function handleMouseDown(e) {
    const x = d3.pointer(e)[0]
    const frame = Math.round(xScale.invert(x))
    
    const startX = xScale(selection.start)
    const endX = xScale(selection.end)
    
    if (Math.abs(x - startX) < 10) {
      isDragging = true
      dragType = 'start'
    } else if (Math.abs(x - endX) < 10) {
      isDragging = true
      dragType = 'end'
    } else if (x > startX && x < endX) {
      isDragging = true
      dragType = 'both'
    } else {
      currentFrame = Math.max(0, Math.min(frames.length - 1, frame))
      const event = new CustomEvent('frameChange', { detail: { frame: currentFrame } })
      svgEl.dispatchEvent(event)
    }
  }

  function handleMouseMove(e) {
    if (!isDragging) return
    
    const x = d3.pointer(e)[0]
    let frame = Math.round(xScale.invert(x))
    frame = Math.max(0, Math.min(frames.length - 1, frame))

    if (dragType === 'start') {
      selection.start = Math.min(frame, selection.end - 1)
    } else if (dragType === 'end') {
      selection.end = Math.max(frame, selection.start + 1)
    } else if (dragType === 'both') {
      const width = selection.end - selection.start
      const newStart = Math.max(0, Math.min(frames.length - 1 - width, frame - width / 2))
      selection.start = Math.round(newStart)
      selection.end = selection.start + width
    }

    const event = new CustomEvent('selectionChange', { 
      detail: { start: selection.start, end: selection.end } 
    })
    svgEl.dispatchEvent(event)
  }

  function handleMouseUp() {
    isDragging = false
    dragType = null
  }

  function handleKeyframeClick(keyframe, e) {
    e.stopPropagation()
    const event = new CustomEvent('keyframeClick', { detail: { keyframe } })
    svgEl.dispatchEvent(event)
  }

  function handleDoubleClick(e) {
    e.preventDefault()
    const x = d3.pointer(e)[0]
    const frame = Math.round(xScale.invert(x))
    
    const existingIdx = keyframes.findIndex(k => Math.abs(k.frame - frame) < 5)
    if (existingIdx >= 0) {
      keyframes.splice(existingIdx, 1)
    } else {
      keyframes.push({
        frame,
        time: frames[frame]?.time || frame / 60,
        label: `关键帧 ${keyframes.length + 1}`,
        color: '#fbbf24'
      })
      keyframes.sort((a, b) => a.frame - b.frame)
    }
    keyframes = [...keyframes]
    
    const event = new CustomEvent('keyframesChange', { detail: { keyframes } })
    svgEl.dispatchEvent(event)
  }

  function draw() {
    if (!frames || frames.length === 0) return
    
    updateScales()
    
    const svg = d3.select(svgEl)
    svg.selectAll('*').remove()

    svg.on('mousedown', handleMouseDown)
      .on('mousemove', handleMouseMove)
      .on('mouseup', handleMouseUp)
      .on('mouseleave', handleMouseUp)
      .on('dblclick', handleDoubleClick)

    const g = svg.append('g')

    const heights = frames.map(f => f.jumpHeight || 0)
    const velocities = frames.map(f => f.velocity || 0)

    const area = d3.area()
      .x((d, i) => xScale(i))
      .y0(yScale(0))
      .y1(d => yScale(d))
      .curve(d3.curveMonotoneX)

    const velLine = d3.line()
      .x((d, i) => xScale(i))
      .y(d => yScale(d / 4))
      .curve(d3.curveMonotoneX)

    g.append('path')
      .datum(heights)
      .attr('fill', '#3b82f6')
      .attr('fill-opacity', 0.2)
      .attr('d', area)

    g.append('path')
      .datum(velocities)
      .attr('fill', 'none')
      .attr('stroke', '#10b981')
      .attr('stroke-width', 1.5)
      .attr('stroke-dasharray', '4,3')
      .attr('d', velLine)

    const selG = g.append('g').attr('class', 'selection')

    selG.append('rect')
      .attr('x', xScale(selection.start))
      .attr('y', margin.top)
      .attr('width', xScale(selection.end) - xScale(selection.start))
      .attr('height', height - margin.top - margin.bottom)
      .attr('fill', '#60a5fa')
      .attr('fill-opacity', 0.15)
      .attr('stroke', '#60a5fa')
      .attr('stroke-width', 1)
      .attr('stroke-dasharray', '3,3')
      .attr('rx', 2)

    selG.append('rect')
      .attr('x', xScale(selection.start) - 4)
      .attr('y', margin.top)
      .attr('width', 8)
      .attr('height', height - margin.top - margin.bottom)
      .attr('fill', '#60a5fa')
      .attr('rx', 2)
      .attr('cursor', 'ew-resize')

    selG.append('rect')
      .attr('x', xScale(selection.end) - 4)
      .attr('y', margin.top)
      .attr('width', 8)
      .attr('height', height - margin.top - margin.bottom)
      .attr('fill', '#60a5fa')
      .attr('rx', 2)
      .attr('cursor', 'ew-resize')

    keyframes.forEach(kf => {
      const x = xScale(kf.frame)
      
      const kfG = g.append('g')
        .attr('class', 'keyframe')
        .style('cursor', 'pointer')
        .on('click', (e) => handleKeyframeClick(kf, e))

      kfG.append('line')
        .attr('x1', x)
        .attr('y1', margin.top)
        .attr('x2', x)
        .attr('y2', height - margin.bottom)
        .attr('stroke', kf.color || '#fbbf24')
        .attr('stroke-width', 2)
        .attr('stroke-dasharray', '4,2')

      kfG.append('polygon')
        .attr('points', `${x - 6},${margin.top} ${x + 6},${margin.top} ${x},${margin.top + 8}`)
        .attr('fill', kf.color || '#fbbf24')

      kfG.append('text')
        .attr('x', x)
        .attr('y', margin.top + 20)
        .attr('text-anchor', 'middle')
        .attr('fill', kf.color || '#fbbf24')
        .attr('font-size', '10px')
        .attr('font-weight', '500')
        .text(kf.label)
    })

    const playheadG = g.append('g').attr('class', 'playhead')

    playheadG.append('line')
      .attr('x1', xScale(currentFrame))
      .attr('y1', margin.top - 5)
      .attr('x2', xScale(currentFrame))
      .attr('y2', height - margin.bottom + 5)
      .attr('stroke', '#ef4444')
      .attr('stroke-width', 2)

    playheadG.append('polygon')
      .attr('points', `${xScale(currentFrame) - 7},${margin.top - 10} ${xScale(currentFrame) + 7},${margin.top - 10} ${xScale(currentFrame)},${margin.top}`)
      .attr('fill', '#ef4444')

    const xAxis = d3.axisBottom(xScale)
      .ticks(10)
      .tickFormat(d => {
        const time = (d / 60).toFixed(1)
        return `${time}s`
      })

    g.append('g')
      .attr('transform', `translate(0, ${height - margin.bottom})`)
      .call(xAxis)
      .selectAll('text')
      .attr('fill', '#64748b')
      .attr('font-size', '11px')

    g.selectAll('.domain, .tick line')
      .attr('stroke', '#334155')

    const legendG = g.append('g').attr('transform', `translate(${margin.left + 10}, ${margin.top + 5})`)

    legendG.append('rect')
      .attr('x', 0)
      .attr('y', 0)
      .attr('width', 12)
      .attr('height', 12)
      .attr('fill', '#3b82f6')
      .attr('fill-opacity', 0.3)

    legendG.append('text')
      .attr('x', 18)
      .attr('y', 10)
      .attr('fill', '#94a3b8')
      .attr('font-size', '11px')
      .text('跳跃高度')

    legendG.append('line')
      .attr('x1', 0)
      .attr('y1', 22)
      .attr('x2', 14)
      .attr('y2', 22)
      .attr('stroke', '#10b981')
      .attr('stroke-width', 1.5)
      .attr('stroke-dasharray', '4,3')

    legendG.append('text')
      .attr('x', 20)
      .attr('y', 26)
      .attr('fill', '#94a3b8')
      .attr('font-size', '11px')
      .text('速度 (缩放)')
  }

  onMount(() => {
    draw()
  })

  afterUpdate(() => {
    draw()
  })
</script>

<svg bind:this={svgEl} {width} {height}>
</svg>

<style>
  svg {
    background: #1e293b;
    border-radius: 8px;
    cursor: crosshair;
  }
</style>
