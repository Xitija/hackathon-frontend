import React, { useState, useEffect, useRef } from "react";

const TranscriptionApp = () => {
  const [transcript, setTranscript] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [error, setError] = useState(null);
  const recognitionRef = useRef(null); // Use useRef to persist recognition instance

  // Initialize SpeechRecognition
  useEffect(() => {
    if (
      !("webkitSpeechRecognition" in window || "SpeechRecognition" in window)
    ) {
      setError("Speech Recognition API is not supported in this browser.");
      return;
    }

    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-IN"; // "en-US";

    recognition.onresult = (event) => {
      let interimTranscript = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcriptChunk = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          setTranscript((prev) => prev + transcriptChunk);
        } else {
          interimTranscript += transcriptChunk;
        }
      }
    };

    recognition.onerror = (event) => {
      setError(`Error occurred: ${event.error}`);
    };

    recognitionRef.current = recognition; // Store the recognition instance in useRef

    return () => {
      recognition.stop();
    };
  }, []);

  const startListening = () => {
    if (recognitionRef.current) {
      setIsListening(true);
      recognitionRef.current.start();
    }
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      setIsListening(false);
      recognitionRef.current.stop();
    }
  };

  return (
    <div className="p-4 max-w-md mx-auto">
      <h1 className="text-2xl font-bold mb-4">Real-Time Transcription</h1>
      <textarea
        className="w-full h-40 p-2 border rounded"
        value={transcript}
        readOnly
        placeholder="Your transcription will appear here..."
      />
      <div className="mt-4 flex gap-2">
        <button
          onClick={startListening}
          disabled={isListening}
          className="px-4 py-2 bg-blue-500 text-white rounded disabled:opacity-50"
        >
          Start
        </button>
        <button
          onClick={stopListening}
          disabled={!isListening}
          className="px-4 py-2 bg-red-500 text-white rounded disabled:opacity-50"
        >
          Stop
        </button>
      </div>
      {error && <p className="text-red-500 mt-2">{error}</p>}
    </div>
  );
};

export default TranscriptionApp;
