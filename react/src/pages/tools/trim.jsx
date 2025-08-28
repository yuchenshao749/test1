import { useEffect, useState } from 'react'
import { Card, Button, InputNumber, Select, message } from 'antd'
import { listFiles, trimAudio } from '../../api'

export default function TrimPage() {
  const [files, setFiles] = useState([])
  const [fileId, setFileId] = useState()
  const [startMs, setStartMs] = useState(0)
  const [endMs, setEndMs] = useState()
  const [loading, setLoading] = useState(false)

  const refresh = async () => {
    const data = await listFiles()
    setFiles(data.uploads)
  }
  useEffect(() => { refresh() }, [])

  const onTrim = async () => {
    if (!fileId) return message.warning('请选择文件')
    try {
      setLoading(true)
      const res = await trimAudio({ fileId, startMs, endMs })
      message.success('裁剪完成')
      window.open(res.url, '_blank')
    } catch (e) {
      console.error(e)
      message.error('裁剪失败')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card title={<span className="title-strong">裁剪音频</span>} bordered className="glass-card">
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <div>
          <div style={{ marginBottom: 12 }}>选择文件</div>
          <Select style={{ width: '100%' }} placeholder="请选择文件" value={fileId} onChange={setFileId}
                  options={files.map(f => ({ value: f.id, label: f.name }))} />
        </div>
        <div>
          <div style={{ marginBottom: 12 }}>开始/结束（毫秒）</div>
          <div style={{ display: 'flex', gap: 12 }}>
            <InputNumber addonBefore="开始" min={0} step={50} value={startMs} onChange={setStartMs} style={{ width: '100%' }} />
            <InputNumber addonBefore="结束" min={0} step={50} value={endMs} onChange={setEndMs} style={{ width: '100%' }} />
          </div>
        </div>
      </div>
      <div style={{ marginTop: 16 }}>
        <Button type="primary" onClick={onTrim} loading={loading}>开始裁剪</Button>
      </div>
    </Card>
  )
}


