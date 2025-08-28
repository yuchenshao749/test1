import os
import uuid
import math
import json
from datetime import datetime
from typing import Tuple, Dict, Any

import numpy as np
import librosa
import soundfile as sf
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from werkzeug.utils import secure_filename


BASE_DIR = os.path.dirname(os.path.abspath(__file__))
UPLOAD_FOLDER = os.path.join(BASE_DIR, 'uploads')
PROCESSED_FOLDER = os.path.join(BASE_DIR, 'processed')
ALLOWED_EXTENSIONS = {'.wav', '.mp3', '.flac', '.ogg', '.m4a', '.aac'}
DEFAULT_SR = 44100


def ensure_dirs() -> None:
    os.makedirs(UPLOAD_FOLDER, exist_ok=True)
    os.makedirs(PROCESSED_FOLDER, exist_ok=True)


def allowed_file(filename: str) -> bool:
    _, ext = os.path.splitext(filename.lower())
    return ext in ALLOWED_EXTENSIONS


def generate_id() -> str:
    return uuid.uuid4().hex[:12]


def id_to_file_path(file_id: str) -> str:
    """Finds a file by id in uploads or processed folder by prefix match."""
    for folder in (UPLOAD_FOLDER, PROCESSED_FOLDER):
        for name in os.listdir(folder):
            if name.startswith(file_id + '__'):
                return os.path.join(folder, name)
    raise FileNotFoundError(f'File with id {file_id} not found')


def save_upload(file_storage) -> Dict[str, Any]:
    original_name = secure_filename(file_storage.filename)
    if not original_name or not allowed_file(original_name):
        raise ValueError('不支持的文件类型')
    file_id = generate_id()
    name_no_spaces = original_name.replace(' ', '_')
    filename = f"{file_id}__{name_no_spaces}"
    path = os.path.join(UPLOAD_FOLDER, filename)
    file_storage.save(path)
    return {
        'id': file_id,
        'filename': filename,
        'path': path,
        'original_name': original_name
    }


def load_audio(path: str, sr: int = DEFAULT_SR, mono: bool = True) -> Tuple[np.ndarray, int]:
    y, sr_loaded = librosa.load(path, sr=sr, mono=mono)
    return y, sr_loaded


def save_audio_wav(y: np.ndarray, sr: int, out_path: str) -> str:
    if not out_path.lower().endswith('.wav'):
        out_path = out_path + '.wav'
    sf.write(out_path, y, sr)
    return out_path


def create_processed_name(prefix: str, source_id: str, ext: str = '.wav') -> str:
    stamp = datetime.utcnow().strftime('%Y%m%dT%H%M%S')
    new_id = generate_id()
    return f"{new_id}__{prefix}_from_{source_id}_{stamp}{ext}"


def create_upload_name(prefix: str, ext: str = '.wav') -> str:
    stamp = datetime.utcnow().strftime('%Y%m%dT%H%M%S')
    new_id = generate_id()
    return f"{new_id}__{prefix}_{stamp}{ext}"


def compute_waveform_points(y: np.ndarray, points: int = 1000) -> np.ndarray:
    if y.ndim > 1:
        y = np.mean(y, axis=1)
    n = y.shape[0]
    if n <= points:
        # pad to requested length
        pad = points - n
        if pad > 0:
            y = np.pad(y, (0, pad), mode='constant')
        return y[:points]
    # peak envelope per window
    window = math.floor(n / points)
    y = y[:window * points]
    y = y.reshape(points, window)
    return y.max(axis=1)


def compute_mel_spectrogram(y: np.ndarray, sr: int, n_mels: int = 96, hop_length: int = 512, max_frames: int = 600) -> np.ndarray:
    S = librosa.feature.melspectrogram(y=y, sr=sr, n_mels=n_mels, hop_length=hop_length)
    S_db = librosa.power_to_db(S, ref=np.max)
    if S_db.shape[1] > max_frames:
        S_db = S_db[:, :max_frames]
    return S_db


app = Flask(__name__)
app.config['MAX_CONTENT_LENGTH'] = 100 * 1024 * 1024  # 100MB
ensure_dirs()
CORS(app, resources={r"/api/*": {"origins": "*"}})


@app.route('/')
def root_ok():
    return 'Audio Processing API is running'


@app.post('/api/upload')
def api_upload():
    if 'file' not in request.files:
        return jsonify({'error': '未找到文件字段 file'}), 400
    file_storage = request.files['file']
    try:
        record = save_upload(file_storage)
        return jsonify({
            'id': record['id'],
            'filename': record['filename'],
            'url': f"/api/download/uploads/{record['filename']}"
        })
    except ValueError as e:
        return jsonify({'error': str(e)}), 400


@app.get('/api/files')
def api_files():
    def list_dir(folder: str):
        items = []
        for name in sorted(os.listdir(folder)):
            path = os.path.join(folder, name)
            if os.path.isfile(path):
                file_id = name.split('__', 1)[0] if '__' in name else name
                items.append({
                    'id': file_id,
                    'name': name,
                    'url': f"/api/download/{os.path.basename(folder)}/{name}",
                    'size': os.path.getsize(path)
                })
        return items

    return jsonify({
        'uploads': list_dir(UPLOAD_FOLDER),
        'processed': list_dir(PROCESSED_FOLDER)
    })


@app.get('/api/download/<kind>/<path:filename>')
def api_download(kind: str, filename: str):
    if kind not in ('uploads', 'processed'):
        return jsonify({'error': 'bad kind'}), 400
    folder = UPLOAD_FOLDER if kind == 'uploads' else PROCESSED_FOLDER
    return send_from_directory(folder, filename, as_attachment=True)


@app.get('/api/stream/<file_id>')
def api_stream(file_id: str):
    try:
        path = id_to_file_path(file_id)
        return send_from_directory(os.path.dirname(path), os.path.basename(path), as_attachment=False)
    except FileNotFoundError as e:
        return jsonify({'error': str(e)}), 404


@app.post('/api/generate_tone')
def api_generate_tone():
    data = request.get_json(force=True, silent=True) or {}
    seconds = float(data.get('seconds', 3))
    freq = float(data.get('freq', 440))
    sr = int(data.get('sr', DEFAULT_SR))
    t = np.linspace(0, seconds, int(sr * seconds), endpoint=False)
    y = (0.3 * np.sin(2 * np.pi * freq * t)).astype(np.float32)
    filename = create_upload_name('tone')
    out_path = os.path.join(UPLOAD_FOLDER, filename)
    save_audio_wav(y, sr, out_path)
    return jsonify({'id': filename.split('__', 1)[0], 'filename': filename, 'url': f"/api/download/uploads/{filename}"})


@app.get('/api/metadata/<file_id>')
def api_metadata(file_id: str):
    try:
        path = id_to_file_path(file_id)
        y, sr = load_audio(path, sr=DEFAULT_SR, mono=True)
        duration = float(len(y) / sr)
        return jsonify({
            'id': file_id,
            'sampleRate': sr,
            'duration': duration,
            'channels': 1,
            'format': os.path.splitext(path)[1].lower().lstrip('.')
        })
    except FileNotFoundError as e:
        return jsonify({'error': str(e)}), 404


@app.get('/api/waveform/<file_id>')
def api_waveform(file_id: str):
    points = int(request.args.get('points', '1000'))
    try:
        path = id_to_file_path(file_id)
        y, sr = load_audio(path, sr=DEFAULT_SR, mono=True)
        env = compute_waveform_points(y, points=points).tolist()
        return jsonify({'id': file_id, 'sampleRate': sr, 'points': env})
    except FileNotFoundError as e:
        return jsonify({'error': str(e)}), 404


@app.get('/api/spectrogram/<file_id>')
def api_spectrogram(file_id: str):
    n_mels = int(request.args.get('n_mels', '96'))
    hop_length = int(request.args.get('hop_length', '512'))
    max_frames = int(request.args.get('max_frames', '600'))
    try:
        path = id_to_file_path(file_id)
        y, sr = load_audio(path, sr=DEFAULT_SR, mono=True)
        S_db = compute_mel_spectrogram(y, sr, n_mels=n_mels, hop_length=hop_length, max_frames=max_frames)
        # normalize to 0-1 for client-side coloring convenience
        min_val = float(np.min(S_db))
        max_val = float(np.max(S_db))
        rng = max_val - min_val if max_val != min_val else 1.0
        norm = (S_db - min_val) / rng
        return jsonify({
            'id': file_id,
            'sampleRate': sr,
            'n_mels': n_mels,
            'hop_length': hop_length,
            'frames': int(norm.shape[1]),
            'min': min_val,
            'max': max_val,
            'data': norm.astype(float).tolist()
        })
    except FileNotFoundError as e:
        return jsonify({'error': str(e)}), 404


@app.post('/api/trim')
def api_trim():
    data = request.get_json(force=True, silent=True) or {}
    file_id = data.get('fileId')
    start_ms = float(data.get('startMs', 0))
    end_ms = data.get('endMs')
    try:
        src_path = id_to_file_path(file_id)
        y, sr = load_audio(src_path, sr=DEFAULT_SR, mono=True)
        n = len(y)
        start = max(0, int(start_ms / 1000.0 * sr))
        if end_ms is None:
            end = n
        else:
            end = min(n, int(float(end_ms) / 1000.0 * sr))
        if end <= start:
            return jsonify({'error': '结束时间必须大于开始时间'}), 400
        y_out = y[start:end]

        new_name = create_processed_name('trim', file_id)
        out_path = os.path.join(PROCESSED_FOLDER, new_name)
        save_audio_wav(y_out, sr, out_path)
        return jsonify({'id': new_name.split('__', 1)[0], 'filename': new_name, 'url': f"/api/download/processed/{new_name}"})
    except FileNotFoundError as e:
        return jsonify({'error': str(e)}), 404


@app.post('/api/speed')
def api_speed():
    data = request.get_json(force=True, silent=True) or {}
    file_id = data.get('fileId')
    factor = float(data.get('factor', 1.0))
    if factor <= 0:
        return jsonify({'error': 'factor 必须为正数'}), 400
    try:
        src_path = id_to_file_path(file_id)
        y, sr = load_audio(src_path, sr=DEFAULT_SR, mono=True)
        y_out = librosa.effects.time_stretch(y, rate=factor)
        new_name = create_processed_name('speed', file_id)
        out_path = os.path.join(PROCESSED_FOLDER, new_name)
        save_audio_wav(y_out, sr, out_path)
        return jsonify({'id': new_name.split('__', 1)[0], 'filename': new_name, 'url': f"/api/download/processed/{new_name}"})
    except FileNotFoundError as e:
        return jsonify({'error': str(e)}), 404


@app.post('/api/normalize')
def api_normalize():
    data = request.get_json(force=True, silent=True) or {}
    file_id = data.get('fileId')
    try:
        src_path = id_to_file_path(file_id)
        y, sr = load_audio(src_path, sr=DEFAULT_SR, mono=True)
        peak = np.max(np.abs(y))
        if peak > 0:
            y_out = y / peak * 0.999
        else:
            y_out = y
        new_name = create_processed_name('normalize', file_id)
        out_path = os.path.join(PROCESSED_FOLDER, new_name)
        save_audio_wav(y_out, sr, out_path)
        return jsonify({'id': new_name.split('__', 1)[0], 'filename': new_name, 'url': f"/api/download/processed/{new_name}"})
    except FileNotFoundError as e:
        return jsonify({'error': str(e)}), 404


@app.post('/api/remove_silence')
def api_remove_silence():
    data = request.get_json(force=True, silent=True) or {}
    file_id = data.get('fileId')
    top_db = float(data.get('topDb', 30))
    try:
        src_path = id_to_file_path(file_id)
        y, sr = load_audio(src_path, sr=DEFAULT_SR, mono=True)
        intervals = librosa.effects.split(y, top_db=top_db)
        if len(intervals) == 0:
            return jsonify({'error': '未检测到非静音片段'}), 400
        y_out = np.concatenate([y[s:e] for s, e in intervals])
        new_name = create_processed_name('nosilence', file_id)
        out_path = os.path.join(PROCESSED_FOLDER, new_name)
        save_audio_wav(y_out, sr, out_path)
        return jsonify({'id': new_name.split('__', 1)[0], 'filename': new_name, 'url': f"/api/download/processed/{new_name}"})
    except FileNotFoundError as e:
        return jsonify({'error': str(e)}), 404


@app.post('/api/merge')
def api_merge():
    data = request.get_json(force=True, silent=True) or {}
    file_ids = data.get('fileIds') or []
    mode = (data.get('mode') or 'concat').lower()  # concat | mix
    if not isinstance(file_ids, list) or len(file_ids) < 2:
        return jsonify({'error': '需要至少两个文件进行合并'}), 400
    try:
        tracks = []
        for fid in file_ids:
            path = id_to_file_path(fid)
            y, sr = load_audio(path, sr=DEFAULT_SR, mono=True)
            tracks.append(y)

        if mode == 'mix':
            max_len = max(len(t) for t in tracks)
            mixed = np.zeros(max_len, dtype=np.float32)
            for t in tracks:
                if len(t) < max_len:
                    t = np.pad(t, (0, max_len - len(t)))
                mixed += t
            # avoid clipping
            peak = np.max(np.abs(mixed))
            if peak > 1:
                mixed = mixed / peak
            y_out = mixed
        else:
            y_out = np.concatenate(tracks)

        new_name = create_processed_name('merge', file_ids[0])
        out_path = os.path.join(PROCESSED_FOLDER, new_name)
        save_audio_wav(y_out, DEFAULT_SR, out_path)
        return jsonify({'id': new_name.split('__', 1)[0], 'filename': new_name, 'url': f"/api/download/processed/{new_name}"})
    except FileNotFoundError as e:
        return jsonify({'error': str(e)}), 404


@app.post('/api/pitch')
def api_pitch():
    data = request.get_json(force=True, silent=True) or {}
    file_id = data.get('fileId')
    semitones = float(data.get('semitones', 0))
    try:
        src_path = id_to_file_path(file_id)
        y, sr = load_audio(src_path, sr=DEFAULT_SR, mono=True)
        y_out = librosa.effects.pitch_shift(y, sr=sr, n_steps=semitones)
        new_name = create_processed_name('pitch', file_id)
        out_path = os.path.join(PROCESSED_FOLDER, new_name)
        save_audio_wav(y_out, sr, out_path)
        return jsonify({'id': new_name.split('__', 1)[0], 'filename': new_name, 'url': f"/api/download/processed/{new_name}"})
    except FileNotFoundError as e:
        return jsonify({'error': str(e)}), 404


if __name__ == '__main__':
    # 开发环境运行
    app.run(host='127.0.0.1', port=5000, debug=True)
