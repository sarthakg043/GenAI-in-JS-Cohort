"use client";
import Image from "next/image";
import { useState, useEffect } from "react";
import AiServiceSelectModal from "./components/aiServiceSelectModal";

export default function Home() {

  const [message, setMessage] = useState("");
  const [summary, setSummary] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [apiKey, setAPIKey] = useState("");
  const [service, setService] = useState("");
  const [isClient, setIsClient] = useState(false);

  // Modal States
  const [apiModalOpen, setApiModalOpen] = useState(false)

  const [streaming, setStreaming] = useState(false);
  const [streamingResponse, setStreamingResponse] = useState("");

  // Load localstorage data
  useEffect(() => {
    setIsClient(true);
    const savedApiKey = localStorage.getItem('apiKey');
    const savedService = localStorage.getItem('service')
    if (savedApiKey && savedService) {
      setAPIKey(savedApiKey);
      setService(savedService)
    } else {
      setApiModalOpen(true)
    }
  }, []);

  useEffect(() => {
    if (isClient && apiKey) {
      localStorage.setItem('apiKey', apiKey);
    }
  }, [apiKey, isClient]);

  useEffect(()=>{
    if (isClient && service){
      localStorage.setItem('service', service)
    }
  }, [isClient, service])

  const summarizeText = async () => {
    if (!message.trim()) {
      setError("Please enter some text to summarize.");
      return;
    }
    if (!apiKey.trim()) {
      setError("Please enter an API key.");
      return;
    }
    if (!service) {
      setError("Please select an AI service.");
      return;
    }
    
    setLoading(true);
    setError("");
    try{
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ 
          message, 
          apiKey, 
          service 
        }),
      });

      if (!response.ok) {
        throw new Error("Network response was not ok");
      }

      const data = await response.json();
      setSummary(data.response);

    } catch (error) {
      console.error("Error summarizing text:", error);
      setError("Failed to summarize text. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-between p-24">
      <main className="flex w-full flex-1 flex-col items-center justify-center text-center">
        <div className="w-full grid grid-cols-6 items-center">
          {/* Left side (empty) */}
          <div className="col-span-1"></div>

          {/* Center content */}
          <div className="text-center col-span-4">
            <h1 className="text-6xl font-bold">Text Summarizer</h1>
            <p className="mt-3 text-2xl">Summarize your text with AI</p>
          </div>

          {/* Right side button */}
          <div className="flex justify-end col-span-1">
            <button 
              className="mt-4 px-6 py-2 rounded-lg transition-colors"
              style={{
                backgroundColor: 'var(--button-bg)',
                color: 'var(--button-text)'
              }}
              onMouseEnter={(e) => e.target.style.backgroundColor = 'var(--button-hover)'}
              onMouseLeave={(e) => e.target.style.backgroundColor = 'var(--button-bg)'}
              onClick={() => setApiModalOpen(prev => !prev)}
            >
              Using {service}
            </button>
          </div>
        </div>

        <div className="mt-6 w-full flex flex-col justify-center items-center">
          <textarea
            className="w-full max-w-4xl p-4 rounded-lg"
            style={{
              border: '1px solid var(--border-color)'
            }}
            placeholder="Paste your text here..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows="4"
          ></textarea>
          <button 
            className="mt-4 px-6 py-2 rounded-lg transition-colors"
            style={{
              backgroundColor: 'var(--button-bg)',
              color: 'var(--button-text)'
            }}
            onMouseEnter={(e) => e.target.style.backgroundColor = 'var(--button-hover)'}
            onMouseLeave={(e) => e.target.style.backgroundColor = 'var(--button-bg)'}
            onClick={summarizeText}
          >
            Summarize
          </button>
        </div>
        {loading && <p className="mt-4 text-blue-500">Summarizing...</p>}
        {error && <p className="mt-4 text-red-500">{error}</p>}
        {summary && (
          <div 
            className="mt-6 w-full max-w-4xl p-4 rounded-lg"
            style={{
              backgroundColor: 'var(--summary-bg)',
              border: '1px solid var(--border-color)'
            }}
          >
            <h2 className="text-xl font-semibold">Summary:</h2>
            <p 
              className="mt-2 text-justify whitespace-pre-wrap"
            >{summary}</p>
          </div>
        )}
      </main>
      <footer className="flex items-center justify-center w-full h-24 border-t">
        <a
          href="https://nextjs.org"
          className="flex items-center justify-center gap-2 text-sm text-gray-500 hover:text-gray-700"
        >
          Powered by{" "}
          <Image
            src="/next.svg"
            alt="Next.js Logo"
            className="dark:invert"
            height={64}
            width={64}
          />
        </a>
      </footer>
      {isClient && (
        <AiServiceSelectModal 
          setAPIKey={setAPIKey} 
          setService={setService} 
          apiKey={apiKey} 
          service={service}
          modalOpen={apiModalOpen}
          setModalOpen={setApiModalOpen}
        />
      )}
    </div> 
  );
}
