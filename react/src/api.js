import axios from 'axios'

export const api = axios.create({
  baseURL: '/api',
  timeout: 60000,
})

export async function uploadFile(file) {
  const form = new FormData()
  form.append('file', file)
  const { data } = await api.post('/upload', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return data
}

export async function listFiles() {
  const { data } = await api.get('/files')
  return data
}

export async function getMetadata(fileId) {
  const { data } = await api.get(`/metadata/${fileId}`)
  return data
}

export async function getWaveform(fileId, points = 1200) {
  const { data } = await api.get(`/waveform/${fileId}`, { params: { points } })
  return data
}

export async function getSpectrogram(fileId, params = {}) {
  const { data } = await api.get(`/spectrogram/${fileId}`, { params })
  return data
}

export async function trimAudio(payload) {
  const { data } = await api.post('/trim', payload)
  return data
}

export async function speedAudio(payload) {
  const { data } = await api.post('/speed', payload)
  return data
}

export async function normalizeAudio(payload) {
  const { data } = await api.post('/normalize', payload)
  return data
}

export async function removeSilence(payload) {
  const { data } = await api.post('/remove_silence', payload)
  return data
}

export async function mergeAudio(payload) {
  const { data } = await api.post('/merge', payload)
  return data
}


