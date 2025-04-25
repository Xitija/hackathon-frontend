import React, { useEffect, useRef, useState } from "react";

const TranscriptionWithAssemblyAI = () => {
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const [isRecording, setIsRecording] = useState(false);

  useEffect(() => {
    return () => {
      stopRecording();
    };
  }, []);

  const startRecording = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const mediaRecorder = new MediaRecorder(stream);
    mediaRecorderRef.current = mediaRecorder;

    mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        audioChunksRef.current.push(event.data);
      }
    };

    mediaRecorder.onstop = async () => {
      const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
      await sendToAssemblyAI(audioBlob);
      audioChunksRef.current = [];
    };

    mediaRecorder.start();

    setInterval(() => {
      if (mediaRecorder.state === "recording") {
        mediaRecorder.stop(); // stop current chunk
        mediaRecorder.start(); // immediately start next chunk
      }
    }, 20000); // every 60 seconds

    setIsRecording(true);
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
  };

  const sendToAssemblyAI = async (audioBlob) => {
    const apiKey = "API_KEY"; // Replace with actual API_KEY

    // Step 1: Upload audio
    const uploadResponse = await fetch("https://api.assemblyai.com/v2/upload", {
      method: "POST",
      headers: { authorization: apiKey },
      body: audioBlob,
    });

    const { upload_url } = await uploadResponse.json();

    // Step 2: Request transcription
    const transcriptResponse = await fetch("https://api.assemblyai.com/v2/transcript", {
      method: "POST",
      headers: {
        authorization: apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ audio_url: upload_url }),
    });

    const transcriptData = await transcriptResponse.json();

    // Step 3: Poll for result
    let completedTranscript = null;
    while (!completedTranscript) {
      const pollingResponse = await fetch(
        `https://api.assemblyai.com/v2/transcript/${transcriptData.id}`,
        {
          headers: { authorization: apiKey },
        }
      );
      const pollingData = await pollingResponse.json();
      if (pollingData.status === "completed") {
        completedTranscript = pollingData.text;

        // Send final transcript to your backend API
        await fetch("https://your-api.com/save-transcript", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ transcript: completedTranscript }),
        });
      } else if (pollingData.status === "failed") {
        console.error("Transcription failed");
        break;
      }
      await new Promise((res) => setTimeout(res, 3000)); // wait 3s before polling again
    }
  };

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">AssemblyAI Real-Time Transcription</h2>
      <button
        onClick={startRecording}
        disabled={isRecording}
        className="bg-blue-600 text-white px-4 py-2 rounded"
      >
        Start Interview
      </button>
      <button
        onClick={stopRecording}
        disabled={!isRecording}
        className="bg-red-600 text-white px-4 py-2 ml-2 rounded"
      >
        Stop Interview
      </button>
    </div>
  );
};

export default TranscriptionWithAssemblyAI;
