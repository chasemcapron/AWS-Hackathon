import { useState, useCallback, useRef } from 'react';
// import { TranscribeStreamingClient, StartStreamTranscriptionCommand } from "@aws-sdk/client-transcribe-streaming";

/**
 * Custom hook to handle raw audio capture and AWS Transcribe WebSocket streaming.
 */
export const useAudioCapture = (onTranscriptReceived) => {
  const [isRecording, setIsRecording] = useState(false);
  const [analyser, setAnalyser] = useState(null);
  
  const audioContextRef = useRef(null);
  const streamRef = useRef(null);
  // const processorRef = useRef(null);
  // const transcribeClientRef = useRef(null);
  const isRecordingRef = useRef(false); // Ref for precise loop control

  const startRecording = useCallback(async () => {
    try {
      // 1. Initialize Microphone (Speaker Method Config)
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false,
        },
      });

      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      const audioContext = new AudioContextClass();
      const source = audioContext.createMediaStreamSource(stream);
      
      // Setup Visualizer Node
      const analyserNode = audioContext.createAnalyser();
      analyserNode.fftSize = 256;
      source.connect(analyserNode);

      // // 2. Setup PCM Audio Processor for AWS Transcribe
      // // Using ScriptProcessor (easiest for hackathon single-file setups)
      // const processor = audioContext.createScriptProcessor(4096, 1, 1);

      // // Prevent feedback loop while keeping processor active
      // const gainNode = audioContext.createGain();
      // gainNode.gain.value = 0;

      // source.connect(processor);
      // processor.connect(gainNode);
      // gainNode.connect(audioContext.destination);

      // // Create an Async Generator to yield audio chunks to AWS
      // let resolveQueue = [];
      // processor.onaudioprocess = (e) => {
      //   if (!isRecordingRef.current) return;

      //   // Convert Float32 audio to Int16 PCM (Required by AWS)
      //   const inputData = e.inputBuffer.getChannelData(0);
      //   const pcm16 = new Int16Array(inputData.length);
      //   for (let i = 0; i < inputData.length; i++) {
      //       pcm16[i] = Math.max(-1, Math.min(1, inputData[i])) * 0x7FFF;
      //   }

      //   if (resolveQueue.length > 0) {
      //       const resolve = resolveQueue.shift();
      //       resolve({ AudioEvent: { AudioChunk: new Uint8Array(pcm16.buffer) } });
      //   }
      // };

      // const audioStream = async function* () {
      //   while (isRecordingRef.current) {
      //       yield await new Promise(resolve => resolveQueue.push(resolve));
      //   }
      // };

      // // 3. Initialize AWS Transcribe Client
      // const client = new TranscribeStreamingClient({
      //   region: import.meta.env.VITE_AWS_REGION || 'us-east-1',
      //   credentials: {
      //     accessKeyId: import.meta.env.VITE_AWS_ACCESS_KEY_ID,
      //     secretAccessKey: import.meta.env.VITE_AWS_SECRET_ACCESS_KEY,
      //   }
      // });

      // const command = new StartStreamTranscriptionCommand({
      //   LanguageCode: "en-US",
      //   MediaSampleRateHertz: audioContext.sampleRate,
      //   MediaEncoding: "pcm",
      //   AudioStream: audioStream(),
      //   ShowSpeakerLabel: true,
      // });

      // // Start the WebSocket connection
      // client.send(command).then(async (response) => {
      //   console.log("Nova: AWS Transcribe Stream Connected (speaker diarization enabled).");
      //   for await (const event of response.TranscriptResultStream) {
      //       if (event.TranscriptEvent) {
      //           const results = event.TranscriptEvent.Transcript.Results;
      //           if (results.length > 0) {
      //               const isPartial = results[0].IsPartial;
      //               const items = results[0].Alternatives[0].Items || [];

      //               // Group consecutive items by speaker
      //               const speakerChunks = [];
      //               let currentSpeaker = null;
      //               let currentWords = [];

      //               for (const item of items) {
      //                   if (item.Type === 'punctuation') {
      //                       if (currentWords.length > 0) {
      //                           currentWords[currentWords.length - 1] += item.Content;
      //                       }
      //                       continue;
      //                   }
      //                   const speaker = item.Speaker || 'spk_0';
      //                   if (speaker !== currentSpeaker) {
      //                       if (currentWords.length > 0) {
      //                           speakerChunks.push({ speaker: currentSpeaker, text: currentWords.join(' ') });
      //                       }
      //                       currentSpeaker = speaker;
      //                       currentWords = [item.Content];
      //                   } else {
      //                       currentWords.push(item.Content);
      //                   }
      //               }
      //               if (currentWords.length > 0) {
      //                   speakerChunks.push({ speaker: currentSpeaker, text: currentWords.join(' ') });
      //               }

      //               for (const chunk of speakerChunks) {
      //                   if (onTranscriptReceived) onTranscriptReceived(chunk.text, chunk.speaker, isPartial);
      //               }
      //           }
      //       }
      //   }
      // }).catch((err) => {
      //     console.error("AWS Transcribe Error:", err);
      // });

      // Save refs
      streamRef.current = stream;
      audioContextRef.current = audioContext;
      // processorRef.current = processor;
      // transcribeClientRef.current = client;
      isRecordingRef.current = true;
      
      setAnalyser(analyserNode);
      setIsRecording(true);
      
    } catch (err) {
      console.error("Nova Error: Could not initialize audio pipeline.", err);
    }
  }, [onTranscriptReceived]);

  const stopRecording = useCallback(() => {
    isRecordingRef.current = false;

    // if (processorRef.current) {
    //     processorRef.current.disconnect();
    // }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
    }
    
    streamRef.current = null;
    audioContextRef.current = null;
    // processorRef.current = null;
    // transcribeClientRef.current = null;
    
    setAnalyser(null);
    setIsRecording(false);
    
    console.log("Nova: Audio capture and AWS Stream stopped.");
  }, []);

  return { isRecording, analyser, startRecording, stopRecording };
};