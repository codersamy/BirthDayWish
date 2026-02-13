
import React, { useState, useEffect } from 'react';
import { BirthdayConfig, Photo, BentoItem } from '../types';
import { generateBirthdayContent } from '../services/geminiService';

interface SetupFormProps {
    onSubmit: (config: BirthdayConfig) => void;
}

const SetupForm: React.FC<SetupFormProps> = ({ onSubmit }) => {
    // AI prompt fields
    const [relationship, setRelationship] = useState('');
    const [memories, setMemories] = useState('');

    // Full config state
    const [recipientName, setRecipientName] = useState('Beautiful');
    const [welcomeMessage, setWelcomeMessage] = useState("I built a little world for you...");
    const [birthdayMessage, setBirthdayMessage] = useState("Another year of you making the world brighter.");
    const [bentoItems, setBentoItems] = useState<BentoItem[]>([
        { icon: '✨', title: 'Your Unmatched Kindness', text: 'The genuine warmth you show to everyone is something truly rare and beautiful.' },
        { icon: '😊', title: 'That Smile', text: "It's a work of art." },
        { icon: '🌟', title: 'Your Radiant Spirit', text: 'Your passion for life is infectious.' }
    ]);
    const [galleryTitle, setGalleryTitle] = useState("A Gallery of Memories");
    const [photos, setPhotos] = useState<Photo[]>([
        { url: 'https://i.ibb.co/6Z6XgCg/crush.webp', caption: 'Our favorite memory.' },
        { url: 'https://images.unsplash.com/photo-1524250502761-1ac6f2e30d43?q=80&w=1888', caption: 'That day at the cafe.' }
    ]);
    const [galleryClosing, setGalleryClosing] = useState("Every moment with you feels like a scene...");
    const [letter, setLetter] = useState("My Dearest Beautiful,\n\nOn your special day, I find myself reflecting on all the moments we've shared, big and small. Each one is a treasure, a testament to the incredible person you are. From your infectious laugh to the quiet way you listen, you make every day brighter.\n\nI hope the year ahead brings you as much joy and light as you bring to everyone around you. May all your dreams take flight.");
    const [wishMessage, setWishMessage] = useState("May the next year bring you all the love...");
    const [finalMessage, setFinalMessage] = useState("Happy Birthday! ❤️");
    const [youtubeUrl, setYoutubeUrl] = useState('https://www.youtube.com/watch?v=jfKfPfyJRdk');
    
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    
    const getYouTubeId = (url: string): string | null => {
        const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
        const match = url.match(regExp);
        return (match && match[2].length === 11) ? match[2] : null;
    };
    
    const handleAddPhoto = () => setPhotos([...photos, { url: '', caption: '' }]);
    const handlePhotoChange = (index: number, field: keyof Photo, value: string) => {
        setPhotos(photos.map((p, i) => i === index ? { ...p, [field]: value } : p));
    };
    const handleRemovePhoto = (index: number) => setPhotos(photos.filter((_, i) => i !== index));

    const handleAddBentoItem = () => setBentoItems([...bentoItems, { icon: '💖', title: '', text: '' }]);
    const handleBentoItemChange = (index: number, field: keyof BentoItem, value: string) => {
        setBentoItems(bentoItems.map((item, i) => i === index ? { ...item, [field]: value } : item));
    };
    const handleRemoveBentoItem = (index: number) => setBentoItems(bentoItems.filter((_, i) => i !== index));
    
    const handleGenerateContent = async () => {
        if (!recipientName || !relationship || !memories) {
            setError('Please fill in Name, Relationship, and Memories to generate content.');
            return;
        }
        setIsLoading(true);
        setError('');
        try {
            const content = await generateBirthdayContent(recipientName, relationship, memories);
            setWelcomeMessage(content.welcomeMessage);
            setBirthdayMessage(content.birthdayMessage);
            setBentoItems(content.bentoItems);
            setWishMessage(content.wishMessage);
            setLetter(content.letter);
            setFinalMessage(content.finalMessage);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        const youtubeId = getYouTubeId(youtubeUrl);
        if (!youtubeId) {
            setError('Please enter a valid YouTube URL.');
            return;
        }
        if (photos.some(p => !p.url || !p.caption)) {
            setError('Please ensure all photo fields are filled out.');
            return;
        }
        if (bentoItems.some(item => !item.icon || !item.title || !item.text)) {
            setError('Please ensure all "Adore About You" fields are filled out.');
            return;
        }

        onSubmit({ recipientName, welcomeMessage, birthdayMessage, bentoItems, galleryTitle, photos, galleryClosing, wishMessage, finalMessage, youtubeId, letter });
    };

    const inputStyles = "w-full bg-slate-800/50 border border-slate-700 rounded-lg p-3 text-white placeholder-slate-400 focus:ring-2 focus:ring-pink-500 focus:border-pink-500 transition-all duration-300 shadow-lg";
    const labelStyles = "block mb-2 text-sm font-bold text-pink-300";

    return (
        <div className="min-h-screen w-full flex flex-col items-center justify-center p-4 text-slate-200">
            <div id="aurora-bg">
              <div className="aurora-blur aurora-1 top-[10%] left-[15%]"></div><div className="aurora-blur aurora-2 top-[60%] left-[30%]"></div>
              <div className="aurora-blur aurora-3 top-[40%] left-[70%]"></div><div className="aurora-blur aurora-4 top-[80%] left-[5%]"></div>
            </div>
            <form onSubmit={handleSubmit} className="w-full max-w-3xl mx-auto card p-8 space-y-6 my-16">
                <div className="text-center">
                    <h1 className="text-4xl font-display text-gradient">Birthday Site Generator</h1>
                    <p className="text-pink-300 mt-2">Create a magical gift for someone special.</p>
                </div>

                <details className="bg-slate-900/50 p-4 rounded-lg border border-slate-700" open>
                    <summary className="font-bold text-lg text-white cursor-pointer">Step 1: AI Content Generation</summary>
                    <div className="grid md:grid-cols-2 gap-6 mt-4">
                        <div><label htmlFor="recipientName" className={labelStyles}>To (Name):</label><input type="text" id="recipientName" value={recipientName} onChange={e => setRecipientName(e.target.value)} className={inputStyles} placeholder="e.g., Alex" /></div>
                        <div><label htmlFor="relationship" className={labelStyles}>Your Relationship:</label><input type="text" id="relationship" value={relationship} onChange={e => setRelationship(e.target.value)} className={inputStyles} placeholder="e.g., My amazing girlfriend" /></div>
                        <div className="md:col-span-2"><label htmlFor="memories" className={labelStyles}>Memories & Feelings for AI:</label><textarea id="memories" value={memories} onChange={e => setMemories(e.target.value)} className={`${inputStyles} h-20`} placeholder="A happy memory, what you admire..."></textarea></div>
                    </div>
                    <button type="button" onClick={handleGenerateContent} disabled={isLoading} className="w-full mt-4 bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded-lg transition-all duration-300 disabled:opacity-50 flex items-center justify-center gap-2">{isLoading ? 'Generating...' : '✨ Use AI to Write Messages'}</button>
                </details>

                <details className="bg-slate-900/50 p-4 rounded-lg border border-slate-700">
                    <summary className="font-bold text-lg text-white cursor-pointer">Step 2: Customize Main Messages & Music</summary>
                    <div className="space-y-4 mt-4">
                      <div><label className={labelStyles}>Welcome Message</label><textarea value={welcomeMessage} onChange={e => setWelcomeMessage(e.target.value)} className={inputStyles} /></div>
                      <div><label className={labelStyles}>Birthday Message</label><textarea value={birthdayMessage} onChange={e => setBirthdayMessage(e.target.value)} className={inputStyles} /></div>
                      <div><label className={labelStyles}>Wish For Them</label><textarea value={wishMessage} onChange={e => setWishMessage(e.target.value)} className={inputStyles} /></div>
                      <div><label className={labelStyles}>Final Message</label><input type="text" value={finalMessage} onChange={e => setFinalMessage(e.target.value)} className={inputStyles} /></div>
                      <div><label className={labelStyles}>Background Music (YouTube URL)</label><input type="url" value={youtubeUrl} onChange={e => setYoutubeUrl(e.target.value)} className={inputStyles} /></div>
                    </div>
                </details>

                <details className="bg-slate-900/50 p-4 rounded-lg border border-slate-700">
                    <summary className="font-bold text-lg text-white cursor-pointer">Step 3: Customize "Adore About You" Section</summary>
                    <div className="space-y-4 mt-4">
                        {bentoItems.map((item, index) => (
                            <div key={index} className="grid grid-cols-[auto_1fr_1fr_auto] items-end gap-2 p-2 rounded-md bg-slate-800/50">
                                <div><label className={labelStyles}>Icon</label><input type="text" value={item.icon} onChange={e => handleBentoItemChange(index, 'icon', e.target.value)} className={`${inputStyles} w-16 text-center`} /></div>
                                <div className="flex-grow"><label className={labelStyles}>Title</label><input type="text" value={item.title} onChange={e => handleBentoItemChange(index, 'title', e.target.value)} className={inputStyles} /></div>
                                <div className="flex-grow"><label className={labelStyles}>Text</label><input type="text" value={item.text} onChange={e => handleBentoItemChange(index, 'text', e.target.value)} className={inputStyles} /></div>
                                <button type="button" onClick={() => handleRemoveBentoItem(index)} className="bg-red-600 hover:bg-red-700 text-white font-bold p-3 rounded-lg h-12 w-12">-</button>
                            </div>
                        ))}
                    </div>
                    <button type="button" onClick={handleAddBentoItem} className="w-full mt-4 bg-slate-700 hover:bg-slate-600 text-white font-bold py-2 px-4 rounded-lg transition-all duration-300">+</button>
                </details>
                
                <details className="bg-slate-900/50 p-4 rounded-lg border border-slate-700">
                    <summary className="font-bold text-lg text-white cursor-pointer">Step 4: Customize Photo Gallery</summary>
                    <div className="space-y-4 mt-4">
                        {photos.map((photo, index) => (
                            <div key={index} className="grid grid-cols-1 md:grid-cols-[1fr_1fr_auto] items-end gap-4">
                                <div><label className={labelStyles}>Photo #{index + 1} URL</label><input type="url" value={photo.url} onChange={e => handlePhotoChange(index, 'url', e.target.value)} className={inputStyles} placeholder="https://..." /></div>
                                <div><label className={labelStyles}>Caption</label><input type="text" value={photo.caption} onChange={e => handlePhotoChange(index, 'caption', e.target.value)} className={inputStyles} placeholder="A short caption" /></div>
                                <button type="button" onClick={() => handleRemovePhoto(index)} className="bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-3 rounded-lg h-12 w-full md:w-auto">-</button>
                            </div>
                        ))}
                    </div>
                    <button type="button" onClick={handleAddPhoto} className="w-full mt-4 bg-slate-700 hover:bg-slate-600 text-white font-bold py-2 px-4 rounded-lg transition-all duration-300">+</button>
                </details>
                
                <details className="bg-slate-900/50 p-4 rounded-lg border border-slate-700">
                    <summary className="font-bold text-lg text-white cursor-pointer">Step 5: Customize The Letter</summary>
                    <div className="space-y-4 mt-4">
                        <div>
                            <label className={labelStyles}>Your Letter</label>
                            <textarea value={letter} onChange={e => setLetter(e.target.value)} className={`${inputStyles} h-48`} />
                        </div>
                    </div>
                </details>

                {error && <div className="bg-red-900/50 text-red-300 p-3 rounded-lg text-center">{error}</div>}
                
                <button type="submit" className="w-full btn-primary text-white font-bold py-4 px-4 rounded-lg text-xl">
                    Create Birthday Website
                </button>
            </form>
        </div>
    );
};

export default SetupForm;
