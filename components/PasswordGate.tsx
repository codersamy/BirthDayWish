import React, { useState } from 'react';

interface PasswordGateProps {
    onAuthSuccess: () => void;
}

const PasswordGate: React.FC<PasswordGateProps> = ({ onAuthSuccess }) => {
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);
        try {
            const response = await fetch('/api/check-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ password })
            });

            if (response.ok) {
                onAuthSuccess();
            } else {
                setError('Incorrect Password');
                setPassword('');
            }
        } catch (err) {
            setError('An error occurred. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen w-full flex flex-col items-center justify-center p-4 text-slate-200">
            <div id="aurora-bg"><div className="aurora-blur aurora-1"></div><div className="aurora-blur aurora-2"></div></div>
            <form onSubmit={handleSubmit} className="w-full max-w-sm mx-auto card p-8 space-y-6">
                <div className="text-center"><h1 className="text-3xl font-display text-gradient">Secret Name😎</h1></div>
                <div><input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full bg-slate-800/50 border border-slate-700 rounded-lg p-3 text-white placeholder-slate-400 focus:ring-2 focus:ring-pink-500 focus:border-pink-500 transition-all duration-300 shadow-lg" placeholder="???🧐" autoFocus /></div>
                {error && <div className="bg-red-900/50 text-red-300 p-3 rounded-lg text-center">{error}</div>}
                <button type="submit" disabled={isLoading} className="w-full btn-primary text-white font-bold py-3 px-4 rounded-lg text-lg">
                    {isLoading ? 'Checking...' : 'Unlock'}
                </button>
            </form>
        </div>
    );
};

export default PasswordGate;
