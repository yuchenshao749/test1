import { useEffect, useMemo, useState } from 'react'
import { Card, Select } from 'antd'
import { listFiles, getWaveform } from '../../api'

export default function WaveformPage() {
  const [files, setFiles] = useState([])
  const [fileId, setFileId] = useState()
  const [data, setData] = useState([])

  useEffect(() => {
    (async () => {
      const list = await listFiles()
      setFiles(list.uploads)
    })()
  }, [])

  useEffect(() => {
    (async () => {
      if (!fileId) return
      const w = await getWaveform(fileId, 1200)
      setData(w.points || [])
    })()
  }, [fileId])

  const path = useMemo(() => {
    if (!data.length) return ''
    const h = 120
    const w = 1200
    const max = Math.max(...data.map(v => Math.abs(v))) || 1
    const points = data.map((v, i) => {
      const x = (i / (data.length - 1)) * w
      const y = h / 2 - (v / max) * (h / 2)
      return `${i === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`
    })
    return points.join(' ')
  }, [data])

  return (
    <Card title={<span className="title-strong">波形</span>} bordered className="glass-card">
      <div style={{ display: 'grid', gap: 16 }}>
        <Select style={{ width: 360 }} placeholder="请选择文件" value={fileId} onChange={setFileId}
                options={files.map(f => ({ value: f.id, label: f.name }))} />
        <svg width={1200} height={120} style={{ background: '#111', borderRadius: 8 }}>
          <path d={path} stroke="#69c0ff" strokeWidth={1} fill="none" />
        </svg>
      </div>
    </Card>
  )
}


