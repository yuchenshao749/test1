import { useEffect, useState } from 'react'
import { Card, Button, Select, InputNumber, Radio, message } from 'antd'
import { listFiles, insertAudioSegment } from '../../api'

export default function InsertPage() {
  const [files, setFiles] = useState([])
  const [baseId, setBaseId] = useState()
  const [insertId, setInsertId] = useState()
  const [positionMs, setPositionMs] = useState(0)
  const [mode, setMode] = useState('mix')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    (async () => {
      const data = await listFiles()
      setFiles(data.uploads)
    })()
  }, [])

  const onRun = async () => {
    if (!baseId || !insertId) return message.warning('请选择文件')
    try {
      setLoading(true)
      const res = await insertAudioSegment({ baseId, insertId, positionMs, mode })
      message.success('插入完成')
      window.open(res.url, '_blank')
    } catch (e) {
      console.error(e)
      message.error('插入失败')
    } finally {
      setLoading(false)
    }
  }

  const options = files.map(f => ({ value: f.id, label: f.name }))

  return (
    <Card title={<span className="title-strong">插入音频片段</span>} bordered className="glass-card">
      <div style={{ display: 'grid', gap: 16 }}>
        <Select style={{ width: 360 }} placeholder="原始文件" value={baseId} onChange={setBaseId} options={options} />
        <Select style={{ width: 360 }} placeholder="插入文件" value={insertId} onChange={setInsertId} options={options} />
        <InputNumber
          addonBefore="位置 (毫秒)"
          min={0}
          step={50}
          value={positionMs}
          onChange={setPositionMs}
          style={{ width: 360 }}
        />
        <Radio.Group value={mode} onChange={e => setMode(e.target.value)}>
          <Radio value="mix">混合播放</Radio>
          <Radio value="replace">暂停原音</Radio>
        </Radio.Group>
        <Button type="primary" onClick={onRun} loading={loading}>开始插入</Button>
      </div>
    </Card>
  )
}

