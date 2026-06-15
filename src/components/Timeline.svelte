<script>
  import * as d3 from 'd3'
  import { onMount, afterUpdate, onDestroy } from 'svelte'

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
  let dragLocked = false
  let dragOffset = 0

  const margin = { top: 10, right: 20, bottom: 30, left: 50 }
  const MIN_SELECTION_WIDTH = 5
  const SHORT_SAMPLE_THRESHOLD = 20

  let xScale
  let yScale

  let highlightEdge = null
  let highlightTimer = null
  let dragDirection = null

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

  function clampFrame(frame) {
    if (!frames || frames.length === 0) return 0
    return Math.max(0, Math.min(frames.length - 1, Math.round(frame)))
  }

  function validateSelection() {
    if (!frames || frames.length === 0) return
    const maxFrame = frames.length - 1
    const totalFrames = frames.length

    let s = Math.max(0, Math.min(selection.start, maxFrame))
    let e = Math.max(0, Math.min(selection.end, maxFrame))

    if (s > e) {
      ;[s, e] = [e, s]
    }

    if (totalFrames < MIN_SELECTION_WIDTH) {
      s = 0
      e = maxFrame
    } else if (e - s < MIN_SELECTION_WIDTH) {
      if (s <= maxFrame - MIN_SELECTION_WIDTH) {
        e = s + MIN_SELECTION_WIDTH
      } else {
        s = maxFrame - MIN_SELECTION_WIDTH
        e = maxFrame
      }
    }

    if (totalFrames < SHORT_SAMPLE_THRESHOLD && selection.start === 0 && selection.end >= 100) {
      s = 0
      e = maxFrame
    }

    s = Math.max(0, Math.min(s, maxFrame))
    e = Math.max(0, Math.min(e, maxFrame))
    if (s > e) {
      ;[s, e] = [e, s]
    }

    selection = { start: s, end: e }
  }

  function handleMouseDown(e) {
    const x = d3.pointer(e)[0]
    const frame = clampFrame(Math.round(xScale.invert(x)))

    validateSelection()

    const startX = xScale(selection.start)
    const endX = xScale(selection.end)

    if (Math.abs(x - startX) < 10) {
      isDragging = true
      dragType = 'start'
      dragLocked = false
      dragDirection = null
    } else if (Math.abs(x - endX) < 10) {
      isDragging = true
      dragType = 'end'
      dragLocked = false
      dragDirection = null
    } else if (x >= startX && x <= endX) {
      isDragging = true
      dragType = 'both'
      dragLocked = false
      dragDirection = null
      dragOffset = frame - selection.start
    } else {
      currentFrame = clampFrame(frame)
      const event = new CustomEvent('frameChange', { detail: { frame: currentFrame } })
      svgEl.dispatchEvent(event)
    }
  }

  function handleMouseMove(e) {
    if (!isDragging) return

    const x = d3.pointer(e)[0]
    let frame = Math.round(xScale.invert(x))
    frame = clampFrame(frame)
    const maxFrame = frames.length - 1

    if (dragType === 'start') {
      const currentWidth = selection.end - selection.start
      const maxStart = Math.max(0, selection.end - MIN_SELECTION_WIDTH)

      if (dragDirection === null) {
        dragDirection = frame < selection.start ? 'left' : (frame > selection.start ? 'right' : null)
      }

      if (currentWidth <= MIN_SELECTION_WIDTH && dragDirection === 'right') {
        selection = { start: Math.max(0, maxStart), end: selection.end }
      } else {
        const newStart = Math.max(0, Math.min(frame, maxStart))
        selection = { start: newStart, end: selection.end }
      }
    } else if (dragType === 'end') {
      const currentWidth = selection.end - selection.start
      const minEnd = Math.min(maxFrame, selection.start + MIN_SELECTION_WIDTH)

      if (dragDirection === null) {
        dragDirection = frame > selection.end ? 'right' : (frame < selection.end ? 'left' : null)
      }

      if (currentWidth <= MIN_SELECTION_WIDTH && dragDirection === 'left') {
        selection = { start: selection.start, end: minEnd }
      } else {
        const newEnd = Math.min(maxFrame, Math.max(frame, minEnd))
        selection = { start: selection.start, end: newEnd }
      }
    } else if (dragType === 'both') {
      const currentWidth = selection.end - selection.start
      const safeWidth = Math.max(MIN_SELECTION_WIDTH, currentWidth)
      let newStart = frame - dragOffset
      const maxStart = Math.max(0, maxFrame - safeWidth)
      newStart = Math.max(0, Math.min(maxStart, newStart))
      selection = { start: newStart, end: Math.min(maxFrame, newStart + safeWidth) }
    }

    validateSelection()

    const event = new CustomEvent('selectionChange', {
      detail: { start: selection.start, end: selection.end }
    })
    svgEl.dispatchEvent(event)
  }

  function handleMouseUp() {
    isDragging = false
    dragType = null
    dragLocked = false
    dragDirection = null
    dragOffset = 0
    validateSelection()
  }

  function handleKeyframeClick(keyframe, e) {
    e.stopPropagation()
    const event = new CustomEvent('keyframeClick', { detail: { keyframe } })
    svgEl.dispatchEvent(event)
  }

  function handleDoubleClick(e) {
    e.preventDefault()
    const x = d3.pointer(e)[0]
    const frame = clampFrame(Math.round(xScale.invert(x)))

    const insideSelection = frame >= selection.start && frame <= selection.end
    const nearStart = frame >= selection.start && frame <= selection.start + 5
    const nearEnd = frame >= selection.end - 5 && frame <= selection.end

    if (insideSelection && (nearStart || nearEnd)) {
      highlightEdge = nearStart ? 'start' : 'end'
      if (highlightTimer) clearTimeout(highlightTimer)
      highlightTimer = setTimeout(() => {
        highlightEdge = null
        highlightTimer = null
        if (!isDragging) draw()
      }, 800)
      draw()
    }

    const existingIdx = keyframes.findIndex(k => Math.abs(k.frame - frame) < 5)
    if (existingIdx >= 0) {
      keyframes.splice(existingIdx, 1)
    } else {
      const clampedFrame = clampFrame(frame)
      keyframes.push({
        frame: clampedFrame,
        time: frames[clampedFrame]?.time || clampedFrame / 60,
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

    validateSelection()
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

    const selStartX = xScale(selection.start)
    const selEndX = xScale(selection.end)
    const selWidth = Math.max(0, selEndX - selStartX)

    selG.append('rect')
      .attr('x', selStartX)
      .attr('y', margin.top)
      .attr('width', selWidth)
      .attr('height', height - margin.top - margin.bottom)
      .attr('fill', '#60a5fa')
      .attr('fill-opacity', 0.15)
      .attr('stroke', '#60a5fa')
      .attr('stroke-width', 1)
      .attr('stroke-dasharray', '3,3')
      .attr('rx', 2)

    const startHandleColor = highlightEdge === 'start' ? '#fbbf24' : '#60a5fa'
    const endHandleColor = highlightEdge === 'end' ? '#fbbf24' : '#60a5fa'

    if (highlightEdge === 'start') {
      selG.append('rect')
        .attr('x', selStartX - 10)
        .attr('y', margin.top - 3)
        .attr('width', 20)
        .attr('height', height - margin.top - margin.bottom + 6)
        .attr('fill', 'none')
        .attr('stroke', '#fbbf24')
        .attr('stroke-width', 2.5)
        .attr('stroke-dasharray', '5,3')
        .attr('rx', 4)
        .attr('opacity', 0.85)
    }

    selG.append('rect')
      .attr('x', selStartX - 4)
      .attr('y', margin.top)
      .attr('width', 8)
      .attr('height', height - margin.top - margin.bottom)
      .attr('fill', startHandleColor)
      .attr('rx', 2)
      .attr('cursor', 'ew-resize')

    if (highlightEdge === 'end') {
      selG.append('rect')
        .attr('x', selEndX - 10)
        .attr('y', margin.top - 3)
        .attr('width', 20)
        .attr('height', height - margin.top - margin.bottom + 6)
        .attr('fill', 'none')
        .attr('stroke', '#fbbf24')
        .attr('stroke-width', 2.5)
        .attr('stroke-dasharray', '5,3')
        .attr('rx', 4)
        .attr('opacity', 0.85)
    }

    selG.append('rect')
      .attr('x', selEndX - 4)
      .attr('y', margin.top)
      .attr('width', 8)
      .attr('height', height - margin.top - margin.bottom)
      .attr('fill', endHandleColor)
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

    const playheadX = xScale(clampFrame(currentFrame))

    playheadG.append('line')
      .attr('x1', playheadX)
      .attr('y1', margin.top - 5)
      .attr('x2', playheadX)
      .attr('y2', height - margin.bottom + 5)
      .attr('stroke', '#ef4444')
      .attr('stroke-width', 2)

    playheadG.append('polygon')
      .attr('points', `${playheadX - 7},${margin.top - 10} ${playheadX + 7},${margin.top - 10} ${playheadX},${margin.top}`)
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
    validateSelection()
    draw()
  })

  afterUpdate(() => {
    validateSelection()
    draw()
  })

  onDestroy(() => {
    if (highlightTimer) {
      clearTimeout(highlightTimer)
      highlightTimer = null
    }
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
