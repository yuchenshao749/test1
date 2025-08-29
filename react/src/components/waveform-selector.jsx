import { useEffect, useMemo, useRef, useState } from 'react'
import { getWaveform, getMetadata } from '../api'

export default function WaveformSelector({ fileId, mode = 'range', startMs = 0, endMs, positionMs = 0, onChange }) {
  const [points, setPoints] = useState([])
  const [duration, setDuration] = useState(0)
  const [playTime, setPlayTime] = useState(0)
  const audioRef = useRef(null)
  const svgRef = useRef(null)
  const draggingRef = useRef(null)
  const width = 600
  const height = 100

  useEffect(() => {
    if (!fileId) return
    ;(async () => {
      const w = await getWaveform(fileId, width)
      setPoints(w.points || [])
      const meta = await getMetadata(fileId)
      setDuration(meta.duration)
      if (mode === 'range' && endMs == null) {
        onChange?.(0, meta.duration * 1000)
      }
    })()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fileId])

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return
    const handler = () => setPlayTime(audio.currentTime)
    audio.addEventListener('timeupdate', handler)
    return () => audio.removeEventListener('timeupdate', handler)
  }, [fileId])

  const max = useMemo(() => Math.max(...points.map(v => Math.abs(v))) || 1, [points])
  const path = useMemo(() => {
    if (!points.length) return ''
    return points
      .map((v, i) => {
        const x = (i / (points.length - 1)) * width
        const y = height / 2 - (v / max) * (height / 2)
        return `${i === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`
      })
      .join(' ')
  }, [points, max])

  const timeToX = t => (t / duration) * width
  const xToTime = x => (x / width) * duration

  const startX = timeToX(startMs / 1000)
  const endX = timeToX((endMs ?? duration * 1000) / 1000)
  const posX = timeToX(positionMs / 1000)
  const playX = timeToX(playTime)

  const onMouseDown = type => e => {
    draggingRef.current = type
    e.preventDefault()
  }

  const onMouseUp = () => {
    draggingRef.current = null
  }

  const onMouseMove = e => {
    if (!draggingRef.current || !svgRef.current) return
    const rect = svgRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left
    const t = Math.max(0, Math.min(duration, xToTime(x))) * 1000
    if (mode === 'range') {
      if (draggingRef.current === 'start') {
        const s = Math.min(t, endMs)
        onChange?.(s, endMs)
      } else if (draggingRef.current === 'end') {
        const eTime = Math.max(t, startMs)
        onChange?.(startMs, eTime)
      }
    } else {
      onChange?.(t)
    }
  }

  const onClick = e => {
    if (!svgRef.current || !audioRef.current) return
    const rect = svgRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left
    const t = xToTime(x)
    audioRef.current.currentTime = t
  }

  return (
    <div onMouseMove={onMouseMove} onMouseUp={onMouseUp} onMouseLeave={onMouseUp} style={{ width }}>
      {fileId && (
        <audio ref={audioRef} src={`/api/stream/${fileId}`} controls style={{ width: '100%' }} />
      )}
      <svg
        ref={svgRef}
        width={width}
        height={height}
        style={{ background: '#111', borderRadius: 8, cursor: 'pointer', display: 'block' }}
        onClick={onClick}
      >
        <path d={path} stroke="#69c0ff" strokeWidth={1} fill="none" />
        {mode === 'range' && (
          <>
            <rect
              x={Math.min(startX, endX)}
              y={0}
              width={Math.abs(endX - startX)}
              height={height}
              fill="rgba(250,140,22,0.15)"
            />
            <line
              x1={startX}
              x2={startX}
              y1={0}
              y2={height}
              stroke="#fa8c16"
              strokeWidth={2}
              onMouseDown={onMouseDown('start')}
            />
            <line
              x1={endX}
              x2={endX}
              y1={0}
              y2={height}
              stroke="#fa8c16"
              strokeWidth={2}
              onMouseDown={onMouseDown('end')}
            />
          </>
        )}
        {mode === 'point' && (
          <line
            x1={posX}
            x2={posX}
            y1={0}
            y2={height}
            stroke="#fa8c16"
            strokeWidth={2}
            onMouseDown={onMouseDown('pos')}
          />
        )}
        <line x1={playX} x2={playX} y1={0} y2={height} stroke="#fff" strokeWidth={1} />
      </svg>
    </div>
  )
}

