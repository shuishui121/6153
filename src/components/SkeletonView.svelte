<script>
  import * as d3 from 'd3'
  import { onMount, afterUpdate } from 'svelte'
  import { JOINTS, SKELETON_LINKS } from '../data/motionData.js'

  export let frame
  export let view = 'side'
  export let width = 800
  export let height = 500
  export let selectedJoint = null
  export let trailData = []
  export let comparisonFrame = null
  export let color = '#60a5fa'
  export let comparisonColor = '#f472b6'

  let svgEl
  let gEl
  let xScale, yScale

  function updateScales() {
    if (view === 'side') {
      xScale = d3.scaleLinear().domain([-1, 10]).range([80, width - 40])
      yScale = d3.scaleLinear().domain([-0.2, 2.5]).range([height - 60, 40])
    } else {
      xScale = d3.scaleLinear().domain([-1, 10]).range([80, width - 40])
      yScale = d3.scaleLinear().domain([-3, 3]).range([height - 60, 40])
    }
  }

  function project(pos) {
    if (view === 'side') {
      return { x: xScale(pos.x), y: yScale(pos.y) }
    } else {
      return { x: xScale(pos.x), y: yScale(pos.z) }
    }
  }

  function handleJointClick(jointId) {
    selectedJoint = selectedJoint === jointId ? null : jointId
    const event = new CustomEvent('jointSelect', { detail: { jointId } })
    svgEl.dispatchEvent(event)
  }

  function draw() {
    if (!frame) return
    updateScales()

    const svg = d3.select(svgEl)
    const g = d3.select(gEl)

    g.selectAll('*').remove()

    const gridG = g.append('g').attr('class', 'grid')
    
    if (view === 'side') {
      const xTicks = d3.range(0, 11, 1)
      const yTicks = d3.range(0, 3, 0.5)
      
      xTicks.forEach(t => {
        gridG.append('line')
          .attr('x1', xScale(t))
          .attr('y1', yScale.range()[0])
          .attr('x2', xScale(t))
          .attr('y2', yScale.range()[1])
          .attr('stroke', '#1e293b')
          .attr('stroke-width', 1)
      })
      
      yTicks.forEach(t => {
        gridG.append('line')
          .attr('x1', xScale.range()[0])
          .attr('y1', yScale(t))
          .attr('x2', xScale.range()[1])
          .attr('y2', yScale(t))
          .attr('stroke', '#1e293b')
          .attr('stroke-width', 1)
      })

      gridG.append('line')
        .attr('x1', xScale.range()[0])
        .attr('y1', yScale(0))
        .attr('x2', xScale.range()[1])
        .attr('y2', yScale(0))
        .attr('stroke', '#334155')
        .attr('stroke-width', 2)
    } else {
      const xTicks = d3.range(0, 11, 1)
      const zTicks = d3.range(-3, 4, 1)
      
      xTicks.forEach(t => {
        gridG.append('line')
          .attr('x1', xScale(t))
          .attr('y1', yScale.range()[0])
          .attr('x2', xScale(t))
          .attr('y2', yScale.range()[1])
          .attr('stroke', '#1e293b')
          .attr('stroke-width', 1)
      })
      
      zTicks.forEach(t => {
        gridG.append('line')
          .attr('x1', xScale.range()[0])
          .attr('y1', yScale(t))
          .attr('x2', xScale.range()[1])
          .attr('y2', yScale(t))
          .attr('stroke', '#1e293b')
          .attr('stroke-width', 1)
      })

      gridG.append('line')
        .attr('x1', xScale(0))
        .attr('y1', yScale.range()[0])
        .attr('x2', xScale(0))
        .attr('y2', yScale.range()[1])
        .attr('stroke', '#334155')
        .attr('stroke-width', 1)
        .attr('stroke-dasharray', '5,5')
    }

    const axisG = g.append('g').attr('class', 'axes')
    
    axisG.append('g')
      .attr('transform', `translate(0, ${yScale.range()[0]})`)
      .call(d3.axisBottom(xScale).ticks(10))
      .selectAll('text')
      .attr('fill', '#64748b')
      .attr('font-size', '11px')
    
    axisG.selectAll('.domain, .tick line')
      .attr('stroke', '#334155')

    axisG.append('g')
      .attr('transform', `translate(${xScale.range()[0]}, 0)`)
      .call(d3.axisLeft(yScale).ticks(6))
      .selectAll('text')
      .attr('fill', '#64748b')
      .attr('font-size', '11px')

    const xLabel = view === 'side' ? '前进方向 (m)' : '前进方向 (m)'
    const yLabel = view === 'side' ? '高度 (m)' : '侧向 (m)'
    
    axisG.append('text')
      .attr('x', width / 2)
      .attr('y', height - 15)
      .attr('text-anchor', 'middle')
      .attr('fill', '#94a3b8')
      .attr('font-size', '12px')
      .text(xLabel)

    axisG.append('text')
      .attr('transform', 'rotate(-90)')
      .attr('x', -height / 2)
      .attr('y', 20)
      .attr('text-anchor', 'middle')
      .attr('fill', '#94a3b8')
      .attr('font-size', '12px')
      .text(yLabel)

    if (trailData && trailData.length > 0) {
      const trailG = g.append('g').attr('class', 'trails')
      
      const trailJoints = ['r_foot', 'l_foot', 'r_hand', 'head']
      trailJoints.forEach((jointId, idx) => {
        const trail = trailData.map(f => project(f.joints[jointId]))
        
        const line = d3.line()
          .x(d => d.x)
          .y(d => d.y)
          .curve(d3.curveCatmullRom)

        trailG.append('path')
          .datum(trail)
          .attr('fill', 'none')
          .attr('stroke', color)
          .attr('stroke-width', 1.5)
          .attr('stroke-opacity', 0.4 - idx * 0.08)
          .attr('stroke-dasharray', idx > 1 ? '3,3' : null)
          .attr('d', line)
      })
    }

    if (comparisonFrame) {
      const compG = g.append('g').attr('class', 'comparison')
      
      SKELETON_LINKS.forEach(([from, to]) => {
        const fromPos = project(comparisonFrame.joints[from])
        const toPos = project(comparisonFrame.joints[to])
        
        compG.append('line')
          .attr('x1', fromPos.x)
          .attr('y1', fromPos.y)
          .attr('x2', toPos.x)
          .attr('y2', toPos.y)
          .attr('stroke', comparisonColor)
          .attr('stroke-width', 3)
          .attr('stroke-opacity', 0.75)
          .attr('stroke-dasharray', '6,3')
      })

      JOINTS.forEach(joint => {
        const pos = project(comparisonFrame.joints[joint.id])
        
        compG.append('circle')
          .attr('cx', pos.x)
          .attr('cy', pos.y)
          .attr('r', 7)
          .attr('fill', comparisonColor)
          .attr('fill-opacity', 0.8)
          .attr('stroke', comparisonColor)
          .attr('stroke-width', 2)
          .attr('stroke-opacity', 1)
      })
    }

    const skeletonG = g.append('g').attr('class', 'skeleton')

    SKELETON_LINKS.forEach(([from, to]) => {
      const fromPos = project(frame.joints[from])
      const toPos = project(frame.joints[to])
      
      skeletonG.append('line')
        .attr('x1', fromPos.x)
        .attr('y1', fromPos.y)
        .attr('x2', toPos.x)
        .attr('y2', toPos.y)
        .attr('stroke', color)
        .attr('stroke-width', 2.5)
        .attr('stroke-linecap', 'round')
    })

    JOINTS.forEach(joint => {
      const pos = project(frame.joints[joint.id])
      const isSelected = selectedJoint === joint.id
      
      const jointG = skeletonG.append('g')
        .attr('class', 'joint')
        .attr('cursor', 'pointer')
        .on('click', () => handleJointClick(joint.id))

      if (isSelected) {
        jointG.append('circle')
          .attr('cx', pos.x)
          .attr('cy', pos.y)
          .attr('r', 10)
          .attr('fill', 'none')
          .attr('stroke', '#fbbf24')
          .attr('stroke-width', 2)
      }

      jointG.append('circle')
        .attr('cx', pos.x)
        .attr('cy', pos.y)
        .attr('r', isSelected ? 7 : 5)
        .attr('fill', joint.color)
        .attr('stroke', '#fff')
        .attr('stroke-width', 1.5)

      if (isSelected) {
        jointG.append('text')
          .attr('x', pos.x + 12)
          .attr('y', pos.y - 8)
          .attr('fill', '#e2e8f0')
          .attr('font-size', '11px')
          .attr('font-weight', '500')
          .text(joint.name)
      }
    })

    if (view === 'side') {
      const comX = xScale(frame.joints.torso.x)
      const comY = yScale(frame.joints.torso.y - 0.1)
      
      g.append('line')
        .attr('x1', comX)
        .attr('y1', comY)
        .attr('x2', comX)
        .attr('y2', yScale(0))
        .attr('stroke', '#fbbf24')
        .attr('stroke-width', 1)
        .attr('stroke-dasharray', '4,4')
        .attr('opacity', 0.6)

      g.append('text')
        .attr('x', comX + 5)
        .attr('y', yScale(0) - 5)
        .attr('fill', '#fbbf24')
        .attr('font-size', '10px')
        .text('重心投影')
    }
  }

  onMount(() => {
    draw()
  })

  afterUpdate(() => {
    draw()
  })
</script>

<svg bind:this={svgEl} {width} {height}>
  <g bind:this={gEl}></g>
</svg>

<style>
  svg {
    background: #0f172a;
    border-radius: 8px;
  }
</style>
