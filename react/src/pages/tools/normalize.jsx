import { useEffect, useState } from 'react'
import { Card, Button, Select, message } from 'antd'
import { listFiles, normalizeAudio } from '../../api'

export default function NormalizePage() {
  const [files, setFiles] = useState([])
  const [fileId, setFileId] = useState()
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    (async () => {
      const data = await listFiles()
      setFiles(data.uploads)
    })()
  }, [])

  const onNormalize = async () => {
    if (!fileId) return message.warning('请选择文件')
    try {
      setLoading(true)
      const res = await normalizeAudio({ fileId })
      message.success('归一化完成')
      window.open(res.url, '_blank')
    } catch (e) {
      console.error(e)
      message.error('归一化失败')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card title={<span className="title-strong">归一化</span>} bordered className="glass-card">
      <div style={{ display: 'grid', gap: 16 }}>
        <Select style={{ width: 360 }} placeholder="请选择文件" value={fileId} onChange={setFileId}
                options={files.map(f => ({ value: f.id, label: f.name }))} />
        <Button type="primary" onClick={onNormalize} loading={loading}>开始归一化</Button>
      </div>
    </Card>
  )
}


