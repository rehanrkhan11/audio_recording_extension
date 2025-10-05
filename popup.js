// Lightweight popup script to capture tab audio (Google Meet) and microphone,
// mix them with WebAudio and record using MediaRecorder.

const startBtn = document.getElementById('startBtn');
const stopBtn = document.getElementById('stopBtn');
const statusEl = document.getElementById('status');
const play = document.getElementById('play');

let mediaRecorder;
let recordedChunks = [];
let audioContext;
let dest;
let micStream;
let tabStream;

function setStatus(s) { statusEl.textContent = s; }

async function startRecording() {
  setStatus('Requesting microphone...');
  try {
    micStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
  } catch (err) {
    setStatus('Microphone access denied or not available: ' + err.message);
    return;
  }

  setStatus('Requesting tab audio (Google Meet tab)...');

  // Use chrome.tabCapture to get the active tab's audio.
  // This requires the tabCapture permission in manifest.
  chrome.tabCapture.capture({ audio: true, video: false }, function(stream) {
    if (!stream) {
      setStatus('Tab capture failed: ' + (chrome.runtime.lastError && chrome.runtime.lastError.message));
      return;
    }
    tabStream = stream;
    setStatus('Captured mic + tab. Setting up audio graph...');
    mixAndRecord();
  });
}

function mixAndRecord() {
  audioContext = new (window.AudioContext || window.webkitAudioContext)();
  dest = audioContext.createMediaStreamDestination();

  const micSource = audioContext.createMediaStreamSource(micStream);
  const tabSource = audioContext.createMediaStreamSource(tabStream);

  // Simple gain nodes for each source so user could later expose controls.
  const micGain = audioContext.createGain();
  const tabGain = audioContext.createGain();
  micGain.gain.value = 1.0;
  tabGain.gain.value = 1.0;

  micSource.connect(micGain).connect(dest);
  tabSource.connect(tabGain).connect(dest);

  // Also create analyser/mixer if needed (kept minimal here).

  const mixedStream = dest.stream;

  // Setup MediaRecorder on the mixed stream
  try {
    mediaRecorder = new MediaRecorder(mixedStream, { mimeType: 'audio/webm' });
  } catch (e) {
    // Fallback without mimeType
    mediaRecorder = new MediaRecorder(mixedStream);
  }

  recordedChunks = [];
  mediaRecorder.ondataavailable = (e) => {
    if (e.data && e.data.size > 0) recordedChunks.push(e.data);
  };
  mediaRecorder.onstart = () => setStatus('Recording...');
  mediaRecorder.onstop = onRecordingStop;

  mediaRecorder.start();

  startBtn.disabled = true;
  stopBtn.disabled = false;
}

function onRecordingStop() {
  setStatus('Processing recording...');
  const blob = new Blob(recordedChunks, { type: 'audio/webm' });
  const url = URL.createObjectURL(blob);
  play.src = url;

  // Create a temporary anchor to download
  const a = document.createElement('a');
  a.href = url;
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  a.download = `meet-recording-${timestamp}.webm`;
  a.textContent = 'Download recording';
  a.style.display = 'block';
  a.style.marginTop = '8px';
  // Remove any previous anchors
  const prev = document.getElementById('downloadLink');
  if (prev) prev.remove();
  a.id = 'downloadLink';
  document.body.appendChild(a);

  setStatus('Recording ready. Play or download.');

  // Clean up streams
  try { micStream.getTracks().forEach(t => t.stop()); } catch(e){}
  try { tabStream.getTracks().forEach(t => t.stop()); } catch(e){}
  try { audioContext.close(); } catch(e){}

  startBtn.disabled = false;
  stopBtn.disabled = true;
}

function stopRecording() {
  if (mediaRecorder && mediaRecorder.state === 'recording') mediaRecorder.stop();
  setStatus('Stopping...');
}

startBtn.addEventListener('click', () => startRecording());
stopBtn.addEventListener('click', () => stopRecording());

// Cleanup when popup closes (best-effort)
window.addEventListener('unload', () => {
  try { if (mediaRecorder && mediaRecorder.state === 'recording') mediaRecorder.stop(); } catch(e){}
  try { micStream && micStream.getTracks().forEach(t => t.stop()); } catch(e){}
  try { tabStream && tabStream.getTracks().forEach(t => t.stop()); } catch(e){}
});
