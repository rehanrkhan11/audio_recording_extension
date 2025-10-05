# audio_recording_extension
Meet Audio Recorder is a Chrome extension designed to record audio directly from your Google Meet or any active browser tab. It provides a simple and efficient way to capture important meeting discussions, lectures, or presentations.

The extension includes three main actions — Start Recording, Stop Recording, and Download Recording.

When you click Start Recording, the extension begins capturing the tab’s audio stream using Chrome’s built-in tabCapture API. This API allows the extension to access and record only the sound coming from the active tab, ensuring clear, high-quality recordings.

Once the recording is stopped, the captured audio data is processed and converted into a downloadable file format (such as .webm or .mp3). The Download Recording button then appears, enabling you to instantly save the file to your computer.

This method ensures privacy and performance — the recording runs locally in your browser without uploading data to any external servers.

In short:

Click Start Recording → Begin capturing audio.

Click Stop Recording → Finalize the recording.

Click Download Recording → Save the audio file instantly.

Approach Summary:

Uses Chrome’s tabCapture API to access tab audio streams.

Employs the MediaRecorder interface to encode the captured stream.

Provides a clean and minimal UI for start, stop, and download actions.

Ensures user privacy by keeping all processing local.
