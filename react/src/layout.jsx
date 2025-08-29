import { Layout, Menu, Input, Space, Button } from 'antd'
import { Outlet, Link, useLocation } from 'react-router-dom'
import {
  CustomerServiceOutlined,
  BarChartOutlined,
  FolderOpenOutlined,
  ToolOutlined,
} from '@ant-design/icons'

const { Header, Sider, Content, Footer } = Layout

export default function AppLayout() {
  const location = useLocation()
  const selected = [location.pathname]

  const items = [
    {
      key: '/workbench',
      icon: <CustomerServiceOutlined />,
      label: <Link to="/workbench">工作台</Link>,
    },
    {
      key: '/tools',
      icon: <ToolOutlined />,
      label: '工具箱',
      children: [
        { key: '/tools/trim', label: <Link to="/tools/trim">裁剪</Link> },
        { key: '/tools/speed', label: <Link to="/tools/speed">变速</Link> },
        { key: '/tools/normalize', label: <Link to="/tools/normalize">归一化</Link> },
        { key: '/tools/silence', label: <Link to="/tools/silence">静音清理</Link> },
        { key: '/tools/merge', label: <Link to="/tools/merge">合并</Link> },
        { key: '/tools/pitch', label: <Link to="/tools/pitch">变调</Link> },
        { key: '/tools/volume', label: <Link to="/tools/volume">音量</Link> },
        { key: '/tools/insert', label: <Link to="/tools/insert">插入</Link> },
      ],
    },
    {
      key: '/visualize',
      icon: <BarChartOutlined />,
      label: '可视化',
      children: [
        { key: '/visualize/waveform', label: <Link to="/visualize/waveform">波形</Link> },
        { key: '/visualize/spectrogram', label: <Link to="/visualize/spectrogram">频谱图</Link> },
      ],
    },
    {
      key: '/files',
      icon: <FolderOpenOutlined />,
      label: <Link to="/files">文件管理</Link>,
    },
  ]

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider
        width={240}
        theme="dark"
        style={{
          position: 'sticky',
          top: 0,
          height: '100vh',
          background: 'linear-gradient(180deg, #1f1c2c 0%, #1e3c72 100%)',
          boxShadow: '2px 0 8px rgba(0,0,0,0.15)',
        }}
      >
        <div
          style={{
            height: 64,
            color: '#e8edff',
            display: 'flex',
            alignItems: 'center',
            paddingLeft: 18,
            fontWeight: 700,
            letterSpacing: 0.3,
            fontSize: 18,
          }}
        >
           Aural Studio
        </div>
        <Menu
          mode="inline"
          items={items}
          selectedKeys={selected}
          defaultOpenKeys={["/tools", "/visualize"]}
          style={{ background: 'transparent', color: '#d1d9ff', fontWeight: 500 }}
          theme="dark"
        />
      </Sider>
      <Layout>
        <Header
          style={{
            padding: '0 20px',
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            background: 'rgba(255,255,255,0.75)',
            backdropFilter: 'blur(12px)',
            boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
            borderBottom: '1px solid rgba(0,0,0,0.06)',
          }}
        >
          <Space.Compact style={{ width: 360 }}>
            <Input.Search placeholder="搜索功能或文件" allowClear />
          </Space.Compact>
          <div style={{ marginLeft: 'auto' }}>
            <Space>
              <Button type="text">反馈</Button>
              <Button type="primary" shape="round">新建项目</Button>
            </Space>
          </div>
        </Header>
        <Content style={{ margin: 16 }}>
          <div className="glass-card" style={{ padding: 20, minHeight: 360 }}>
            <Outlet />
          </div>
        </Content>
        <Footer style={{ textAlign: 'center', background: 'transparent' }}>Aural Studio © {new Date().getFullYear()}</Footer>
      </Layout>
    </Layout>
  )
}


