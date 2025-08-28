import { useEffect, useState } from 'react'
import { Card, Button, Select, Slider, message } from 'antd'
import { listFiles, } from '../../api'
import { api } from '../../api'

export default function PitchPage() {
  const [files, setFiles] = useState([])
  const [fileId, setFileId] = useState()
  const [semitones, setSemitones] = useState(0)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    (async () => {
      const data = await listFiles()
      setFiles(data.uploads)
    })()
  }, [])

  const onRun = async () => {
    if (!fileId) return message.warning('请选择文件')
    try {
      setLoading(true)
      const { data } = await api.post('/pitch', { fileId, semitones })
      message.success('变调完成')
      window.open(data.url, '_blank')
    } catch (e) {
      console.error(e)
      message.error('变调失败')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card title={<span className="title-strong">变调（半音）</span>} bordered className="glass-card">
      <div style={{ display: 'grid', gap: 16 }}>
        <Select style={{ width: 360 }} placeholder="请选择文件" value={fileId} onChange={setFileId}
                options={files.map(f => ({ value: f.id, label: f.name }))} />
        <div>
          <div>半音变化: {semitones}</div>
          <Slider min={-12} max={12} step={1} value={semitones} onChange={setSemitones} style={{ width: 360 }} />
        </div>
        <Button type="primary" onClick={onRun} loading={loading}>开始变调</Button>
      </div>
    </Card>
  )
}


