import { useEffect, useMemo, useState } from 'react'
import { Card, Select } from 'antd'
import { listFiles, getSpectrogram } from '../../api'

export default function SpectrogramPage() {
  const [files, setFiles] = useState([])
  const [fileId, setFileId] = useState()
  const [matrix, setMatrix] = useState([])

  useEffect(() => {
    (async () => {
      const list = await listFiles()
      setFiles(list.uploads)
    })()
  }, [])

  useEffect(() => {
    (async () => {
      if (!fileId) return
      const sp = await getSpectrogram(fileId, { n_mels: 96 })
      setMatrix(sp.data || [])
    })()
  }, [fileId])

  const svg = useMemo(() => {
    if (!matrix.length) return null
    const nMels = matrix.length
    const frames = matrix[0].length
    const cell = 5
    const width = frames * cell
    const height = nMels * cell

    const rects = []
    for (let i = 0; i < nMels; i++) {
      for (let j = 0; j < frames; j++) {
        const v = matrix[i][j]
        const hue = 240 - Math.floor(v * 240)
        const fill = `hsl(${hue}, 80%, 50%)`
        rects.push(<rect key={`${i}-${j}`} x={j * cell} y={(nMels - 1 - i) * cell} width={cell} height={cell} fill={fill} />)
      }
    }
    return (
      <svg width={width} height={height} style={{ background: '#000', borderRadius: 8 }}>
        {rects}
      </svg>
    )
  }, [matrix])

  return (
    <Card title={<span className="title-strong">频谱图</span>} bordered className="glass-card">
      <div style={{ display: 'grid', gap: 16 }}>
        <Select style={{ width: 360 }} placeholder="请选择文件" value={fileId} onChange={setFileId}
                options={files.map(f => ({ value: f.id, label: f.name }))} />
        <div style={{ overflow: 'auto' }}>
          {svg}
        </div>
      </div>
    </Card>
  )
}


