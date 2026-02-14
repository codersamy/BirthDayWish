import React, { useState, useEffect } from 'react';
import SetupForm from './components/SetupForm';
import BirthdayWebsite from './components/BirthdayWebsite';
import PasswordGate from './components/PasswordGate';
import type { BirthdayConfig } from './types';

const App: React.FC = () => {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [config, setConfig] = useState<BirthdayConfig | null>(null);
    const [isLoading, setIsLoading] = useState(true); // To handle initial data fetching
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!isAuthenticated) {
            setIsLoading(false);
            return;
        }

        const path = window.location.pathname;
        const match = path.match(/^\/view\/([a-zA-Z0-9]+)$/);
        
        if (match) {
            const id = match[1];
            setIsLoading(true);
            setError(null);
            fetch(`/api/birthday/${id}`)
                .then(response => {
                    if (!response.ok) {
                        throw new Error('Birthday site not found.');
                    }
                    return response.json();
                })
                .then((data: BirthdayConfig) => {
                    setConfig(data);
                })
                .catch(err => {
                    console.error("Failed to fetch config:", err);
                    setError(err.message);
                    // Redirect to home if not found
                    if (window.location.pathname !== '/') {
                        window.history.replaceState(null, '', '/');
                    }
                })
                .finally(() => {
                    setIsLoading(false);
                });
        } else {
            setConfig(null);
            setIsLoading(false);
        }
    }, [isAuthenticated]);

    const handleCreate = async (newConfig: BirthdayConfig) => {
        try {
            const response = await fetch('/api/birthday', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(newConfig),
            });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to save birthday website.');
            }
            const { id } = await response.json();
            window.location.href = `/view/${id}`;
        } catch (e: any) {
            console.error("Error creating birthday site:", e);
            // This error can be displayed to the user in the SetupForm
            alert(`Error: ${e.message}`);
        }
    };

    const handleStartOver = () => {
        // Just redirect to the creation page
        window.location.href = '/';
    };

    const handleAuthSuccess = () => {
        setIsAuthenticated(true);
    };

    if (!isAuthenticated) {
        return <PasswordGate onAuthSuccess={handleAuthSuccess} />;
    }

    if (isLoading) {
        return (
            <div className="w-full min-h-screen bg-[#0c0a09] flex items-center justify-center">
                <div id="aurora-bg"><div className="aurora-blur aurora-1"></div><div className="aurora-blur aurora-2"></div></div>
                <p className="text-2xl text-white font-display">Loading...</p>
            </div>
        );
    }
    
    if (error) {
         return (
            <div className="w-full min-h-screen bg-[#0c0a09] flex flex-col items-center justify-center text-center p-4">
                 <div id="aurora-bg"><div className="aurora-blur aurora-1"></div><div className="aurora-blur aurora-2"></div></div>
                 <h2 className="text-4xl font-display text-red-400">Oops!</h2>
                 <p className="text-lg text-slate-300 mt-2">{error}</p>
                 <a href="/" className="btn-primary rounded-full px-8 py-3 font-bold mt-8">Create a new one</a>
            </div>
         );
    }

    if (config) {
        return <BirthdayWebsite config={config} onStartOver={handleStartOver} />;
    }

    return (
        <div className="w-full min-h-screen bg-[#0c0a09]">
            <SetupForm onSubmit={handleCreate} initialData={null} />
        </div>
    );
};

export default App;
