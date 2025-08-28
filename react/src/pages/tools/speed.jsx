import { useEffect, useState } from 'react'
import { Card, Button, Select, Slider, message } from 'antd'
import { listFiles, speedAudio } from '../../api'

export default function SpeedPage() {
  const [files, setFiles] = useState([])
  const [fileId, setFileId] = useState()
  const [factor, setFactor] = useState(1)
  const [loading, setLoading] = useState(false)

  const refresh = async () => {
    const data = await listFiles()
    setFiles(data.uploads)
  }
  useEffect(() => { refresh() }, [])

  const onSpeed = async () => {
    if (!fileId) return message.warning('请选择文件')
    try {
      setLoading(true)
      const res = await speedAudio({ fileId, factor })
      message.success('变速完成')
      window.open(res.url, '_blank')
    } catch (e) {
      console.error(e)
      message.error('变速失败')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card title={<span className="title-strong">变速</span>} bordered className="glass-card">
      <div style={{ display: 'grid', gap: 16 }}>
        <Select style={{ width: 360 }} placeholder="请选择文件" value={fileId} onChange={setFileId}
                options={files.map(f => ({ value: f.id, label: f.name }))} />
        <div>
          <div>速度: {factor.toFixed(2)}x</div>
          <Slider min={0.25} max={3} step={0.05} value={factor} onChange={setFactor} style={{ width: 360 }} />
        </div>
        <Button type="primary" onClick={onSpeed} loading={loading}>开始变速</Button>
      </div>
    </Card>
  )
}


