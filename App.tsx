import React, { useState, useEffect } from 'react';
import SetupForm from './components/SetupForm';
import BirthdayWebsite from './components/BirthdayWebsite';
import type { BirthdayConfig } from './types';

const App = () => {
    const [config, setConfig] = useState<BirthdayConfig | null>(null);
    const [initialFormData, setInitialFormData] = useState<BirthdayConfig | null>(null);

    useEffect(() => {
        const handleHashChange = () => {
            const hash = window.location.hash.slice(1);
            if (hash.startsWith('data=')) {
                try {
                    const encodedData = hash.substring(5);
                    const base64Decoded = atob(decodeURIComponent(encodedData));
                    const jsonString = decodeURIComponent(escape(base64Decoded));
                    const parsedConfig = JSON.parse(jsonString) as BirthdayConfig;
                    setConfig(parsedConfig);
                } catch (e) {
                    console.error("Failed to parse config from URL hash", e);
                    window.location.hash = '';
                    setConfig(null);
                }
            } else {
                setConfig(null);
            }
        };

        handleHashChange();
        window.addEventListener('hashchange', handleHashChange);
        return () => window.removeEventListener('hashchange', handleHashChange);
    }, []);

    const handleCreate = (newConfig: BirthdayConfig) => {
        try {
            const jsonString = JSON.stringify(newConfig);
            // This two-step encoding is necessary to handle Unicode characters correctly
            const safeStringForBtoA = unescape(encodeURIComponent(jsonString));
            const encodedData = btoa(safeStringForBtoA);
            window.location.hash = `data=${encodeURIComponent(encodedData)}`;
            setInitialFormData(null); // Clear form data after creation
        } catch (e) {
            console.error("Error creating shareable link:", e);
            // Here you might want to set an error state to show in the UI
        }
    };

    const handleStartOver = () => {
        setInitialFormData(config);
        window.location.hash = '';
    };

    if (config) {
        return <BirthdayWebsite config={config} onStartOver={handleStartOver} />;
    }
    
    return (
        <div className="w-full min-h-screen bg-[#0c0a09]">
            <SetupForm onSubmit={handleCreate} initialData={initialFormData} />
        </div>
    );
};

export default App;
