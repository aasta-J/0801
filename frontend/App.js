import { Audio } from 'expo-av';
import Constants from 'expo-constants';
import { useState } from 'react';
import { ActivityIndicator, Button, StyleSheet, Text, View } from 'react-native';

const API_BASE_URL = Constants.manifest.extra.API_BASE_URL;

export default function App() {
  const [recording, setRecording] = useState(null);
  const [transcript, setTranscript] = useState('');
  const [isUploading, setIsUploading] = useState(false);

  const startRecording = async () => {
    try {
      const permission = await Audio.requestPermissionsAsync();
      if (!permission.granted) {
        alert('請允許錄音權限');
        return;
      }
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      setRecording(recording);
    } catch (err) {
      console.error('Failed to start recording', err);
    }
  };

  const stopRecording = async () => {
    try {
      if (!recording) return;
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      setRecording(null);
      uploadRecording(uri);
    } catch (err) {
      console.error('Failed to stop recording', err);
    }
  };

  const uploadRecording = async (uri) => {
    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', {
        uri,
        name: 'audio.wav',
        type: 'audio/wav',
      });

      const response = await fetch(`${API_BASE_URL}/transcribe`, {
        method: 'POST',
        // 不設 Content-Type 讓 fetch 自動加
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setTranscript(data.text);
    } catch (error) {
      console.error('Upload error:', error);
      alert('上傳失敗，請稍後再試');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>🎤 語音轉文字</Text>
      <Button
        title={recording ? '🛑 停止錄音' : '🎙️ 開始錄音'}
        onPress={recording ? stopRecording : startRecording}
      />
      {isUploading && <ActivityIndicator size="large" color="#0000ff" style={{ marginTop: 20 }} />}
      <Text style={styles.transcript}>{transcript}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 20 },
  header: { fontSize: 24, fontWeight: 'bold', marginBottom: 20 },
  transcript: { marginTop: 20, fontSize: 18, textAlign: 'center' },
});
