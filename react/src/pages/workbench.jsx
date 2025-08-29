import { useEffect, useState } from 'react'
import { Card, Upload, Button, message, List, Typography, Space, Row, Col } from 'antd'
import { UploadOutlined, PlusOutlined, PlayCircleFilled } from '@ant-design/icons'
import { uploadFile, listFiles, getMetadata } from '../api'
import { api } from '../api'

export default function Workbench() {
  const [loading, setLoading] = useState(false)
  const [files, setFiles] = useState({ uploads: [], processed: [] })
  const [metaMap, setMetaMap] = useState({})

  const refresh = async () => {
    const data = await listFiles()
    setFiles(data)
  }

  useEffect(() => { refresh() }, [])

  const props = {
    name: 'file',
    showUploadList: false,
    customRequest: async ({ file, onSuccess, onError }) => {
      try {
        setLoading(true)
        const res = await uploadFile(file)
        message.success('上传成功')
        onSuccess(res, file)
        await refresh()
      } catch (e) {
        console.error(e)
        message.error('上传失败')
        onError(e)
      } finally {
        setLoading(false)
      }
    },
  }

  const fetchMeta = async (id) => {
    if (metaMap[id]) return
    const meta = await getMetadata(id)
    setMetaMap((m) => ({ ...m, [id]: meta }))
  }

  const renderItem = (item) => {
    const id = item.id
    const meta = metaMap[id]
    return (
      <List.Item actions={[
        <a key="play" href={`/api/stream/${id}`} target="_blank" rel="noreferrer"><PlayCircleFilled /> 播放</a>,
        <a key="dl" href={item.url} target="_blank" rel="noreferrer">下载</a>,
        <a key="meta" onClick={() => fetchMeta(id)}>元数据</a>,
      ]}>
        <List.Item.Meta
          title={<Typography.Text>{item.name}</Typography.Text>}
          description={meta ? `${(meta.duration || 0).toFixed(2)}s • ${meta.sampleRate}Hz` : '点击“元数据”查看'}
        />
      </List.Item>
    )
  }

  return (
    <div style={{ display: 'grid', gap: 16 }}>
      <Card title={<span className="title-strong">快速开始</span>} bordered className="glass-card">
        <Space>
          <Upload.Dragger {...props} disabled={loading} style={{ padding: 16, background: 'rgba(255,255,255,0.4)' }}>
            <p className="ant-upload-drag-icon">
              <UploadOutlined />
            </p>
            <p className="ant-upload-text">拖拽文件到此处或点击上传</p>
          </Upload.Dragger>
          <Button
            icon={<PlusOutlined />}
            type="primary"
            shape="round"
            onClick={async () => {
              try {
                setLoading(true)
                await api.post('/generate_tone', { seconds: 3, freq: 440 })
                await refresh()
                message.success('已生成示例音频')
              } catch (e) {
                console.error(e)
                message.error('生成失败')
              } finally {
                setLoading(false)
              }
            }}
          >
            生成示例音频
          </Button>
        </Space>
      </Card>

      <Row gutter={16}>
        <Col span={8}>
          <Card hoverable className="glass-card" title={<span className="title-strong">智能处理</span>}>
            <p>一键静音清理与归一化，让人声更清晰。</p>
            <Space>
              <Button size="small"><a href="/tools/silence">静音清理</a></Button>
              <Button size="small"><a href="/tools/normalize">归一化</a></Button>
            </Space>
          </Card>
        </Col>
        <Col span={8}>
          <Card hoverable className="glass-card" title={<span className="title-强">编辑</span>}>
            <p>基础编辑操作：裁剪、变速、变调与合并。</p>
            <Space>
              <Button size="small"><a href="/tools/trim">裁剪</a></Button>
              <Button size="small"><a href="/tools/speed">变速</a></Button>
              <Button size="small"><a href="/tools/pitch">变调</a></Button>
              <Button size="small"><a href="/tools/merge">合并</a></Button>
            </Space>
          </Card>
        </Col>
        <Col span={8}>
          <Card hoverable className="glass-card" title={<span className="title-strong">可视化</span>}>
            <p>波形与频谱图，快速定位问题与精彩片段。</p>
            <Space>
              <Button size="small"><a href="/visualize/waveform">波形</a></Button>
              <Button size="small"><a href="/visualize/spectrogram">频谱图</a></Button>
            </Space>
          </Card>
        </Col>
      </Row>

      <Card title={<span className="title-strong">已上传文件</span>} bordered className="glass-card">
        <List
          dataSource={files.uploads}
          renderItem={renderItem}
        />
      </Card>

      <Card title={<span className="title-strong">已处理文件</span>} bordered className="glass-card">
        <List
          dataSource={files.processed}
          renderItem={renderItem}
        />
      </Card>
    </div>
  )
}


