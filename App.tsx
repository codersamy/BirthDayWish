
import React, { useState } from 'react';
import { BirthdayConfig } from './types';
import SetupForm from './components/SetupForm';
import BirthdayWebsite from './components/BirthdayWebsite';

const App: React.FC = () => {
    const [config, setConfig] = useState<BirthdayConfig | null>(null);

    const handleCreate = (newConfig: BirthdayConfig) => {
        setConfig(newConfig);
    };

    const handleStartOver = () => {
        setConfig(null);
    };

    if (config) {
        return (
            <BirthdayWebsite 
                config={config} 
                onStartOver={handleStartOver}
            />
        );
    }

    return (
        <div className="w-full min-h-screen bg-[#0c0a09]">
            <SetupForm 
                onSubmit={handleCreate} 
            />
        </div>
    );
};

export default App;
