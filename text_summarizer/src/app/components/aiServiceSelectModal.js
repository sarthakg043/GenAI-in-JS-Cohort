import { ChevronLeft, Eye, EyeOff, X } from 'lucide-react'
import React, { useRef, useState } from 'react'

function AiServiceSelectModal({service, setService, setAPIKey, apiKey, modalOpen, setModalOpen}) {
    const [showPassword, setShowPassword] = useState(false)
    const inputRef = useRef(null);
    const closeModal = () => {
        // Logic to close the modal
        if(service && (inputRef?.current.value && inputRef?.current.value !== '')) {
            localStorage.setItem("apiKey", String(apiKey))
            setModalOpen(false);
        } else {
            alert('Please enter an API Key');
        }
    };
  return ( modalOpen &&
    <div
        className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50"
        style={{ backdropFilter: 'blur(5px)' }}
    >
        <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-semibold text-gray-800">Select AI Service</h2>
                <button onClick={closeModal} className="text-gray-500 hover:text-gray-700">
                    <X size={24} />
                </button>
            </div>
            <p className="text-gray-600">Choose an AI service to summarize your text:</p>
            <p className="text-gray-600 mb-6 text-xs">Don't worry we don't store your API Key</p>
            <div className="flex flex-col space-y-4">
                {!service && <>
                    <button
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                        onClick={() => setService('openai')}
                    >
                        Open AI
                    </button>
                    <button
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                        onClick={() => setService('gemini')}
                    >
                        Gemini
                    </button>
                </>}
                {service &&
                    <div>
                        <div className="relative w-full">
                            <label 
                                htmlFor='api-key-input'
                                className='text-black'
                            >Enter {service} API Key: </label>
                            <input
                                id="api-key-input"
                                ref={inputRef}
                                type={showPassword ? "text" : "password"}
                                placeholder="sk-*************fy"
                                className="w-full p-2 pr-10 border rounded-lg text-black"
                                onChange={(e) => setAPIKey(e.target.value)}
                                value={apiKey}
                            />

                            <button
                                type="button"
                                onClick={() => setShowPassword((prev) => !prev)}
                                className="absolute right-2 top-2/3 -translate-y-1/2 text-black hover:text-gray-700"
                            >
                                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>
                        <button
                            className="mt-4 rounded-lg transition-colors flex justify-between items-center cursor-pointer"
                            style={{
                                backgroundColor: 'var(--button-bg)',
                                color: 'var(--button-text)'
                            }}
                            onClick={() => setService(null)}
                        >
                            <ChevronLeft size={20} /> 
                            Change Service
                        </button>
                    </div>
                }
            </div>
        </div>
    </div>
  )
}

export default AiServiceSelectModal