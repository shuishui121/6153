export const JOINTS = [
  { id: 'head', name: '头部', color: '#f87171' },
  { id: 'neck', name: '颈部', color: '#fb923c' },
  { id: 'l_shoulder', name: '左肩', color: '#fbbf24' },
  { id: 'r_shoulder', name: '右肩', color: '#facc15' },
  { id: 'l_elbow', name: '左肘', color: '#a3e635' },
  { id: 'r_elbow', name: '右肘', color: '#4ade80' },
  { id: 'l_hand', name: '左手', color: '#34d399' },
  { id: 'r_hand', name: '右手', color: '#2dd4bf' },
  { id: 'torso', name: '躯干', color: '#22d3ee' },
  { id: 'l_hip', name: '左髋', color: '#38bdf8' },
  { id: 'r_hip', name: '右髋', color: '#60a5fa' },
  { id: 'l_knee', name: '左膝', color: '#818cf8' },
  { id: 'r_knee', name: '右膝', color: '#a78bfa' },
  { id: 'l_ankle', name: '左踝', color: '#c084fc' },
  { id: 'r_ankle', name: '右踝', color: '#e879f9' },
  { id: 'l_foot', name: '左脚', color: '#f472b6' },
  { id: 'r_foot', name: '右脚', color: '#fb7185' }
]

export const SKELETON_LINKS = [
  ['head', 'neck'],
  ['neck', 'l_shoulder'],
  ['neck', 'r_shoulder'],
  ['neck', 'torso'],
  ['l_shoulder', 'l_elbow'],
  ['l_elbow', 'l_hand'],
  ['r_shoulder', 'r_elbow'],
  ['r_elbow', 'r_hand'],
  ['torso', 'l_hip'],
  ['torso', 'r_hip'],
  ['l_hip', 'l_knee'],
  ['l_knee', 'l_ankle'],
  ['l_ankle', 'l_foot'],
  ['r_hip', 'r_knee'],
  ['r_knee', 'r_ankle'],
  ['r_ankle', 'r_foot']
]

function generateJumpMotion(baseOffset = 0, variation = 0) {
  const frames = []
  const totalFrames = 180
  const fps = 60

  for (let i = 0; i < totalFrames; i++) {
    const t = i / totalFrames
    const frame = { frame: i, time: i / fps, joints: {} }

    const runPhase = t < 0.4
    const takeoffPhase = t >= 0.4 && t < 0.55
    const airPhase = t >= 0.55 && t < 0.8
    const landingPhase = t >= 0.8

    const runX = t < 0.4 ? t * 8 : (t < 0.55 ? 3.2 + (t - 0.4) * 2 : (t < 0.8 ? 3.5 + (t - 0.55) * 0.5 : 3.8 - (t - 0.8) * 0.2))
    const baseY = runPhase ? 0 : (takeoffPhase ? (t - 0.4) / 0.15 * 1.2 : (airPhase ? 1.2 - Math.pow((t - 0.55) / 0.25, 2) * 0.3 : Math.max(0, 1.0 - (t - 0.8) / 0.2 * 1.0)))

    const runBob = runPhase ? Math.sin(t * Math.PI * 8) * 0.05 : 0

    const hipY = 0.9 + baseY + runBob + variation * 0.15
    const hipX = runX + Math.sin(t * Math.PI * 6) * 0.05 + baseOffset

    frame.joints.torso = { x: hipX, y: hipY + 0.3, z: 0 + Math.sin(t * 2) * 0.05 }
    frame.joints.neck = { x: hipX, y: hipY + 0.7, z: 0 + Math.sin(t * 2 + 0.5) * 0.03 }
    frame.joints.head = { x: hipX, y: hipY + 0.9, z: 0 + Math.sin(t * 2 + 0.3) * 0.04 }

    const armSwing = runPhase ? Math.sin(t * Math.PI * 8) * 0.4 : (takeoffPhase ? -0.3 + (t - 0.4) / 0.15 * 0.8 : (airPhase ? 0.6 - (t - 0.55) / 0.25 * 0.2 : 0.3 - (t - 0.8) / 0.2 * 0.3))

    frame.joints.l_shoulder = { x: hipX - 0.2, y: hipY + 0.65, z: 0.25 }
    frame.joints.r_shoulder = { x: hipX + 0.2, y: hipY + 0.65, z: -0.25 }

    frame.joints.l_elbow = {
      x: hipX - 0.2 + Math.sin(armSwing) * 0.45,
      y: hipY + 0.45 + Math.cos(armSwing) * 0.15,
      z: 0.35 + Math.sin(armSwing) * 0.15
    }
    frame.joints.r_elbow = {
      x: hipX + 0.2 - Math.sin(armSwing + Math.PI) * 0.45,
      y: hipY + 0.45 + Math.cos(armSwing + Math.PI) * 0.15,
      z: -0.35 - Math.sin(armSwing + Math.PI) * 0.15
    }

    const handExtend = airPhase ? 0.35 + (t - 0.55) / 0.25 * 0.25 : 0.35
    frame.joints.l_hand = {
      x: frame.joints.l_elbow.x + Math.sin(armSwing + 0.3) * handExtend,
      y: frame.joints.l_elbow.y - 0.15 + Math.cos(armSwing + 0.3) * 0.15,
      z: frame.joints.l_elbow.z + 0.18
    }
    frame.joints.r_hand = {
      x: frame.joints.r_elbow.x - Math.sin(armSwing + Math.PI - 0.3) * handExtend,
      y: frame.joints.r_elbow.y - 0.15 + Math.cos(armSwing + Math.PI - 0.3) * 0.15,
      z: frame.joints.r_elbow.z - 0.18
    }

    frame.joints.l_hip = { x: hipX - 0.18, y: hipY, z: 0.2 }
    frame.joints.r_hip = { x: hipX + 0.18, y: hipY, z: -0.2 }

    const legSwing = runPhase ? Math.sin(t * Math.PI * 8) * 0.5 : (takeoffPhase ? 0.2 - (t - 0.4) / 0.15 * 0.6 : (airPhase ? -0.6 + (t - 0.55) / 0.25 * 0.3 : -0.2 + (t - 0.8) / 0.2 * 0.4))

    const kneeBend = takeoffPhase ? 0.3 + (t - 0.4) / 0.15 * 0.4 : (landingPhase ? 0.2 + (t - 0.8) / 0.2 * 0.5 : 0.15)

    frame.joints.l_knee = {
      x: hipX - 0.18 + Math.sin(legSwing) * 0.45,
      y: hipY - 0.45 + Math.cos(legSwing) * kneeBend - 0.1,
      z: 0.2 + Math.sin(legSwing) * 0.08
    }
    frame.joints.r_knee = {
      x: hipX + 0.18 + Math.sin(legSwing + Math.PI) * 0.45,
      y: hipY - 0.45 + Math.cos(legSwing + Math.PI) * kneeBend - 0.1,
      z: -0.2 + Math.sin(legSwing + Math.PI) * 0.08
    }

    const footLift = takeoffPhase ? (t - 0.4) / 0.15 * 0.2 : (airPhase ? 0.2 + (t - 0.55) / 0.25 * 0.15 : Math.max(0, 0.35 - (t - 0.8) / 0.2 * 0.35))

    frame.joints.l_ankle = {
      x: frame.joints.l_knee.x + Math.sin(legSwing - 0.2) * 0.5,
      y: Math.max(footLift, frame.joints.l_knee.y - 0.4 + footLift * 0.5),
      z: frame.joints.l_knee.z + 0.08
    }
    frame.joints.r_ankle = {
      x: frame.joints.r_knee.x + Math.sin(legSwing + Math.PI - 0.2) * 0.5,
      y: Math.max(footLift, frame.joints.r_knee.y - 0.4 + footLift * 0.5),
      z: frame.joints.r_knee.z - 0.08
    }

    frame.joints.l_foot = {
      x: frame.joints.l_ankle.x + 0.15,
      y: frame.joints.l_ankle.y - 0.02,
      z: frame.joints.l_ankle.z + 0.1
    }
    frame.joints.r_foot = {
      x: frame.joints.r_ankle.x + 0.15,
      y: frame.joints.r_ankle.y - 0.02,
      z: frame.joints.r_ankle.z - 0.1
    }

    frame.velocity = runPhase ? (6 + variation * 1.5) + Math.sin(t * Math.PI * 4) * 1 : (takeoffPhase ? (8 + variation * 1.5) - (t - 0.4) / 0.15 * 3 : (airPhase ? (4 + variation) - (t - 0.55) / 0.25 * 2 : (2 + variation * 0.5) + (t - 0.8) / 0.2 * 1))
    frame.verticalVelocity = takeoffPhase ? (t - 0.4) / 0.15 * (5 + variation * 1.5) : (airPhase ? (5 + variation * 1.5) - (t - 0.55) / 0.25 * (9 + variation) : -(4 + variation) + (t - 0.8) / 0.2 * 4)
    frame.jumpHeight = Math.max(0, baseY + variation * 0.2)
    frame.leftFootPressure = runPhase ? (Math.sin(t * Math.PI * 8) > 0 ? 0.8 : 0.2) : (takeoffPhase ? 0.9 - (t - 0.4) / 0.15 * 0.9 : (airPhase ? 0 : Math.min(1, (t - 0.8) / 0.1 * 1.5)))
    frame.rightFootPressure = runPhase ? (Math.sin(t * Math.PI * 8 + Math.PI) > 0 ? 0.8 : 0.2) : (takeoffPhase ? 0.9 - (t - 0.4) / 0.15 * 0.9 : (airPhase ? 0 : Math.min(1, (t - 0.8) / 0.1 * 1.5)))
    frame.kneeAngle = (160 - variation * 15) - kneeBend * 100
    frame.armAngle = 90 + armSwing * 30
    frame.torsoAngle = runPhase ? (10 + variation * 5) + Math.sin(t * Math.PI * 4) * 2 : (takeoffPhase ? 15 + variation * 3 : 5)

    frames.push(frame)
  }

  return frames
}

export const athleteAData = {
  id: 'athlete_a',
  name: '运动员A',
  fps: 60,
  frames: generateJumpMotion(0, 0)
}

export const athleteBData = {
  id: 'athlete_b',
  name: '运动员B',
  fps: 60,
  frames: generateJumpMotion(1.5, 0.6)
}

export function getFrameData(dataset, frameIndex) {
  const idx = Math.max(0, Math.min(dataset.frames.length - 1, Math.floor(frameIndex)))
  return dataset.frames[idx]
}

export function getJointPosition(frame, jointId) {
  return frame.joints[jointId] || { x: 0, y: 0, z: 0 }
}

export function calculateMetrics(dataset) {
  const frames = dataset.frames
  const takeoffFrame = frames.find(f => f.verticalVelocity > 3 && f.leftFootPressure < 0.3)
  const maxHeight = Math.max(...frames.map(f => f.jumpHeight))
  const maxHeightFrame = frames.find(f => f.jumpHeight === maxHeight)
  const landingFrame = frames.find((f, i) => i > frames.length * 0.7 && f.leftFootPressure > 0.7)

  return {
    totalTime: frames[frames.length - 1].time,
    maxVelocity: Math.max(...frames.map(f => f.velocity)),
    avgVelocity: frames.reduce((sum, f) => sum + f.velocity, 0) / frames.length,
    maxJumpHeight: maxHeight,
    takeoffTime: takeoffFrame ? takeoffFrame.time : null,
    landingTime: landingFrame ? landingFrame.time : null,
    airTime: takeoffFrame && landingFrame ? landingFrame.time - takeoffFrame.time : null,
    maxKneeAngle: Math.max(...frames.map(f => f.kneeAngle)),
    minKneeAngle: Math.min(...frames.map(f => f.kneeAngle)),
    strideFrequency: 6,
    strideLength: 1.2
  }
}
