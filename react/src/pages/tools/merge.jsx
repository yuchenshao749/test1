import { useEffect, useState } from 'react'
import { Card, Button, Select, Radio, message } from 'antd'
import { listFiles, mergeAudio } from '../../api'

export default function MergePage() {
  const [files, setFiles] = useState([])
  const [fileIds, setFileIds] = useState([])
  const [mode, setMode] = useState('concat')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    (async () => {
      const data = await listFiles()
      setFiles(data.uploads)
    })()
  }, [])

  const onRun = async () => {
    if (!fileIds.length) return message.warning('请选择文件')
    try {
      setLoading(true)
      const res = await mergeAudio({ fileIds, mode })
      message.success('合并完成')
      window.open(res.url, '_blank')
    } catch (e) {
      console.error(e)
      message.error('合并失败')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card title={<span className="title-strong">合并音频</span>} bordered className="glass-card">
      <div style={{ display: 'grid', gap: 16 }}>
        <Select mode="multiple" style={{ width: 480 }} placeholder="请选择至少两个文件" value={fileIds} onChange={setFileIds}
                options={files.map(f => ({ value: f.id, label: f.name }))} />
        <Radio.Group value={mode} onChange={(e) => setMode(e.target.value)}>
          <Radio.Button value="concat">拼接</Radio.Button>
          <Radio.Button value="mix">混音</Radio.Button>
        </Radio.Group>
        <Button type="primary" onClick={onRun} loading={loading}>开始合并</Button>
      </div>
    </Card>
  )
}


