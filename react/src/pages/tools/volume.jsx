import { useEffect, useState } from 'react'
import { Card, Button, Select, InputNumber, Slider, message } from 'antd'
import { listFiles, adjustVolume } from '../../api'

export default function VolumePage() {
  const [files, setFiles] = useState([])
  const [fileId, setFileId] = useState()
  const [startMs, setStartMs] = useState(0)
  const [endMs, setEndMs] = useState()
  const [gainDb, setGainDb] = useState(0)
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
      const res = await adjustVolume({ fileId, startMs, endMs, gainDb })
      message.success('音量调整完成')
      window.open(res.url, '_blank')
    } catch (e) {
      console.error(e)
      message.error('调整失败')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card title={<span className="title-strong">片段音量调整</span>} bordered className="glass-card">
      <div style={{ display: 'grid', gap: 16 }}>
        <Select style={{ width: 360 }} placeholder="请选择文件" value={fileId} onChange={setFileId}
                options={files.map(f => ({ value: f.id, label: f.name }))} />
        <div style={{ display: 'flex', gap: 12 }}>
          <InputNumber addonBefore="开始" min={0} step={50} value={startMs} onChange={setStartMs} style={{ width: 180 }} />
          <InputNumber addonBefore="结束" min={0} step={50} value={endMs} onChange={setEndMs} style={{ width: 180 }} />
        </div>
        <div>
          <div>增益 (dB): {gainDb}</div>
          <Slider min={-24} max={24} step={1} value={gainDb} onChange={setGainDb} style={{ width: 360 }} />
        </div>
        <Button type="primary" onClick={onRun} loading={loading}>开始处理</Button>
      </div>
    </Card>
  )
}
