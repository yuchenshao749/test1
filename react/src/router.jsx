import { createBrowserRouter } from 'react-router-dom'
import AppLayout from './layout'
import Workbench from './pages/workbench'
import TrimPage from './pages/tools/trim'
import SpeedPage from './pages/tools/speed'
import NormalizePage from './pages/tools/normalize'
import SilencePage from './pages/tools/silence'
import MergePage from './pages/tools/merge'
import PitchPage from './pages/tools/pitch'
import VolumePage from './pages/tools/volume'
import InsertPage from './pages/tools/insert'
import WaveformPage from './pages/visualize/waveform'
import SpectrogramPage from './pages/visualize/spectrogram'
import FilesPage from './pages/files'

export const router = createBrowserRouter([
  {
    path: '/',
    element: <AppLayout />,
    children: [
      { index: true, element: <Workbench /> },
      { path: 'workbench', element: <Workbench /> },
      {
        path: 'tools',
        children: [
          { path: 'trim', element: <TrimPage /> },
          { path: 'speed', element: <SpeedPage /> },
          { path: 'normalize', element: <NormalizePage /> },
          { path: 'silence', element: <SilencePage /> },
          { path: 'merge', element: <MergePage /> },
          { path: 'pitch', element: <PitchPage /> },
          { path: 'volume', element: <VolumePage /> },
          { path: 'insert', element: <InsertPage /> },
        ],
      },
      {
        path: 'visualize',
        children: [
          { path: 'waveform', element: <WaveformPage /> },
          { path: 'spectrogram', element: <SpectrogramPage /> },
        ],
      },
      { path: 'files', element: <FilesPage /> },
    ],
  },
])


