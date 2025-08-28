import { useEffect, useState } from 'react'
import { Card, Button, Select, Slider, message } from 'antd'
import { listFiles, removeSilence } from '../../api'

export default function SilencePage() {
  const [files, setFiles] = useState([])
  const [fileId, setFileId] = useState()
  const [topDb, setTopDb] = useState(30)
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
      const res = await removeSilence({ fileId, topDb })
      message.success('静音清理完成')
      window.open(res.url, '_blank')
    } catch (e) {
      console.error(e)
      message.error('静音清理失败')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card title={<span className="title-strong">静音清理</span>} bordered className="glass-card">
      <div style={{ display: 'grid', gap: 16 }}>
        <Select style={{ width: 360 }} placeholder="请选择文件" value={fileId} onChange={setFileId}
                options={files.map(f => ({ value: f.id, label: f.name }))} />
        <div>
          <div>阈值 top_db: {topDb} dB</div>
          <Slider min={10} max={60} step={1} value={topDb} onChange={setTopDb} style={{ width: 360 }} />
        </div>
        <Button type="primary" onClick={onRun} loading={loading}>开始处理</Button>
      </div>
    </Card>
  )
}


