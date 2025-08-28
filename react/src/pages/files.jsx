import { useEffect, useState } from 'react'
import { Card, List, Typography, Input } from 'antd'
import { listFiles } from '../api'

export default function FilesPage() {
  const [data, setData] = useState({ uploads: [], processed: [] })
  const [q, setQ] = useState('')

  const refresh = async () => {
    const res = await listFiles()
    setData(res)
  }
  useEffect(() => { refresh() }, [])

  const filter = (list) => list.filter(i => i.name.toLowerCase().includes(q.toLowerCase()))

  const renderItem = (item) => (
    <List.Item actions={[<a key="dl" href={item.url} target="_blank" rel="noreferrer">下载</a>] }>
      <List.Item.Meta title={<Typography.Text>{item.name}</Typography.Text>} description={`${(item.size / 1024).toFixed(1)} KB`} />
    </List.Item>
  )

  return (
    <div style={{ display: 'grid', gap: 16 }}>
      <Input.Search allowClear placeholder="搜索文件名" value={q} onChange={e => setQ(e.target.value)} />
      <Card title={<span className="title-strong">上传目录</span>} bordered className="glass-card">
        <List dataSource={filter(data.uploads)} renderItem={renderItem} />
      </Card>
      <Card title={<span className="title-strong">处理目录</span>} bordered className="glass-card">
        <List dataSource={filter(data.processed)} renderItem={renderItem} />
      </Card>
    </div>
  )
}


