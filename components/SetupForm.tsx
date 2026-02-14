import React, { useState, useEffect } from 'react';
import { generateBirthdayContent } from '../services/geminiService';
import type { BirthdayConfig, Photo, ProcessedVideo, PlaylistItem, BentoItem } from '../types';

interface SetupFormProps {
    onSubmit: (config: BirthdayConfig) => void;
    initialData: BirthdayConfig | null;
}

interface EditablePhoto extends Photo {
    isUploading?: boolean;
}

interface EditableVideo {
    url: string;
    caption: string;
    isUploading?: boolean;
}

interface EditablePlaylistItem {
    url: string;
    title: string;
}

const SetupForm: React.FC<SetupFormProps> = ({ onSubmit, initialData }) => {
    const defaultPhotos: EditablePhoto[] = [
        { url: 'https://i.ibb.co/6Z6XgCg/crush.webp', caption: 'Our favorite memory.' },
        { url: 'https://images.unsplash.com/photo-1524250502761-1ac6f2e30d43?q=80&w=1888', caption: 'That day at the cafe.' }
    ];
    const defaultVideos: EditableVideo[] = [
        { url: 'https://www.youtube.com/watch?v=LXb3EKWsInQ', caption: 'A Special Message' }
    ];
    const defaultPlaylist: EditablePlaylistItem[] = [
        { url: 'https://www.youtube.com/watch?v=jfKfPfyJRdk', title: 'Lofi Girl - beats to relax/study to' },
        { url: 'https://www.youtube.com/watch?v=rUxyKA_-grg', title: 'a playlist of songs that make you feel like the main character' }
    ];

    const reconstructUrl = (item: ProcessedVideo | PlaylistItem, type: 'video' | 'youtube'): string => {
        if (item.type === 'youtube') return `https://www.youtube.com/watch?v=${item.id}`;
        if (type === 'video') {
            const videoItem = item as ProcessedVideo;
            if (videoItem.type === 'googledrive') return `https://drive.google.com/file/d/${videoItem.id}/view`;
            if (videoItem.type === 'data') return videoItem.url || '';
        }
        return '';
    };

    const [relationship, setRelationship] = useState(initialData?.relationship || '');
    const [memories, setMemories] = useState(initialData?.memories || '');
    const [recipientName, setRecipientName] = useState(initialData?.recipientName || 'Beautiful');
    const [welcomeMessage, setWelcomeMessage] = useState(initialData?.welcomeMessage || "I built a little world for you...");
    const [birthdayMessage, setBirthdayMessage] = useState(initialData?.birthdayMessage || "Another year of you making the world brighter.");
    const [bentoItems, setBentoItems] = useState<BentoItem[]>(initialData?.bentoItems || [
        { icon: '✨', title: 'Your Unmatched Kindness', text: 'The genuine warmth you show to everyone is something truly rare and beautiful.' },
        { icon: '😊', title: 'That Smile', text: "It's a work of art." },
        { icon: '🌟', title: 'Your Radiant Spirit', text: 'Your passion for life is infectious.' }
    ]);
    const [galleryTitle, setGalleryTitle] = useState(initialData?.galleryTitle || "A Gallery of Memories");
    const [photos, setPhotos] = useState<EditablePhoto[]>(initialData?.photos || defaultPhotos);
    const [videos, setVideos] = useState<EditableVideo[]>(initialData?.videos?.map(v => ({ url: reconstructUrl(v.processed, 'video'), caption: v.caption })) || defaultVideos);
    const [playlist, setPlaylist] = useState<EditablePlaylistItem[]>(initialData?.playlist?.map(s => ({ url: reconstructUrl(s, 'youtube'), title: s.title })) || defaultPlaylist);
    const [galleryClosing, setGalleryClosing] = useState(initialData?.galleryClosing || "Every moment with you feels like a scene...");
    const [letter, setLetter] = useState(initialData?.letter || "My Dearest Beautiful,\n\nOn your special day, I find myself reflecting on all the moments we've shared, big and small. Each one is a treasure, a testament to the incredible person you are. From your infectious laugh to the quiet way you listen, you make every day brighter.\n\nI hope the year ahead brings you as much joy and light as you bring to everyone around you. May all your dreams take flight.");
    const [wishMessage, setWishMessage] = useState(initialData?.wishMessage || "May the next year bring you all the love...");
    const [wishDescription, setWishDescription] = useState(initialData?.wishDescription || "This is a space to send your hopes and dreams out into the universe. What are you wishing for on this special day?");
    const [finalMessage, setFinalMessage] = useState(initialData?.finalMessage || "Happy Birthday! ❤️");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');

    const getYouTubeId = (url: string): { type: 'youtube', id: string } | null => {
        const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
        const match = url.match(regExp);
        return (match && match[2].length === 11) ? { type: 'youtube', id: match[2] } : null;
    };

    const processVideoUrl = (url: string): ProcessedVideo | null => {
        if (url.startsWith('data:video/') || url.startsWith('/uploads/')) return { type: 'data', url: url };
        const ytMatch = getYouTubeId(url);
        if (ytMatch) return ytMatch;
        const gdRegExp = /drive\.google\.com\/(?:file\/d\/|open\?id=)([a-zA-Z0-9_-]+)/;
        const gdMatch = url.match(gdRegExp);
        if (gdMatch) return { type: 'googledrive', id: gdMatch[1] };
        return null;
    };

    const handleAddPhoto = () => setPhotos([...photos, { url: '', caption: '' }]);
    const handlePhotoChange = (index: number, field: keyof EditablePhoto, value: string) => setPhotos(photos.map((p, i) => i === index ? { ...p, [field]: value } : p));
    const handleRemovePhoto = (index: number) => setPhotos(photos.filter((_, i) => i !== index));

    const uploadFile = async (file: File) => {
        const formData = new FormData();
        formData.append('media', file);
        const response = await fetch('/api/upload', {
            method: 'POST',
            body: formData,
        });
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Upload failed');
        }
        const data = await response.json();
        return data.url;
    };
    
    const handlePhotoFileChange = async (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !file.type.startsWith('image/')) return;
        setPhotos(photos.map((p, i) => i === index ? { ...p, isUploading: true } : p));
        try {
            const url = await uploadFile(file);
            setPhotos(photos.map((p, i) => i === index ? { ...p, url: url, isUploading: false } : p));
        } catch (err: any) {
            setError(`Photo #${index + 1}: ${err.message}`);
            setPhotos(photos.map((p, i) => i === index ? { ...p, isUploading: false } : p));
        }
    };
    
    const handleAddVideo = () => setVideos([...videos, { url: '', caption: '' }]);
    const handleVideoChange = (index: number, field: keyof EditableVideo, value: string) => setVideos(videos.map((v, i) => i === index ? { ...v, [field]: value } : v));
    const handleRemoveVideo = (index: number) => setVideos(videos.filter((_, i) => i !== index));
    
    const handleVideoFileChange = async (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !file.type.startsWith('video/')) return;
        setVideos(videos.map((v, i) => i === index ? { ...v, isUploading: true } : v));
        try {
            const url = await uploadFile(file);
            setVideos(videos.map((v, i) => i === index ? { ...v, url: url, isUploading: false } : v));
        } catch (err: any) {
            setError(`Video #${index + 1}: ${err.message}`);
            setVideos(videos.map((v, i) => i === index ? { ...v, isUploading: false } : v));
        }
    };

    const handleAddBentoItem = () => setBentoItems([...bentoItems, { icon: '💖', title: '', text: '' }]);
    const handleBentoItemChange = (index: number, field: keyof BentoItem, value: string) => setBentoItems(bentoItems.map((item, i) => i === index ? { ...item, [field]: value } : item));
    const handleRemoveBentoItem = (index: number) => setBentoItems(bentoItems.filter((_, i) => i !== index));
    
    const handleAddSong = () => setPlaylist([...playlist, { url: '', title: '' }]);
    const handleSongChange = (index: number, field: keyof EditablePlaylistItem, value: string) => setPlaylist(playlist.map((s, i) => (i === index ? { ...s, [field]: value } : s)));
    const handleRemoveSong = (index: number) => setPlaylist(playlist.filter((_, i) => i !== index));

    const handleGenerateContent = async () => {
        if (!recipientName || !relationship || !memories) {
            setError('Please fill in Name, Relationship, and Memories to generate content.');
            return;
        }
        setIsSubmitting(true);
        setError('');
        try {
            const content = await generateBirthdayContent(recipientName, relationship, memories);
            if (content.welcomeMessage) setWelcomeMessage(content.welcomeMessage);
            if (content.birthdayMessage) setBirthdayMessage(content.birthdayMessage);
            if (content.bentoItems) setBentoItems(content.bentoItems);
            if (content.wishMessage) setWishMessage(content.wishMessage);
            if (content.letter) setLetter(content.letter);
            if (content.finalMessage) setFinalMessage(content.finalMessage);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    const getGoogleDriveImageUrl = (url: string) => {
        if (url.startsWith('data:') || url.startsWith('/uploads/')) return url;
        const gdRegExp = /drive\.google\.com\/(?:file\/d\/|open\?id=)([a-zA-Z0-9_-]+)/;
        const match = url.match(gdRegExp);
        if (match) return `https://drive.google.com/uc?export=view&id=${match[1]}`;
        return url;
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        const playlistWithIds = playlist.map(song => ({ ...song, ...getYouTubeId(song.url) }));
        if (playlistWithIds.some(song => !song.id)) {
            setError('Please enter a valid YouTube URL for all songs in the playlist.');
            return;
        }

        const videosWithData = videos.map(video => ({ ...video, processed: processVideoUrl(video.url) }));
        if (videosWithData.some(video => !video.processed)) {
            setError('Please enter a valid YouTube/Google Drive URL for all videos, or upload a video file.');
            return;
        }
        const finalVideos = videosWithData.map(v => ({ caption: v.caption, processed: v.processed! }));
        
        const processedPhotos = photos.map(photo => ({ ...photo, url: getGoogleDriveImageUrl(photo.url) }));
        if (processedPhotos.some(p => !p.url || !p.caption)) {
            setError('Please ensure all photo fields are filled out.');
            return;
        }

        if (bentoItems.some(item => !item.icon || !item.title || !item.text)) {
            setError('Please ensure all "Adore About You" fields are filled out.');
            return;
        }
        setIsSubmitting(true);
        onSubmit({ 
            recipientName, welcomeMessage, birthdayMessage, bentoItems, galleryTitle, 
            photos: processedPhotos, 
            videos: finalVideos, 
            galleryClosing, wishMessage, wishDescription, finalMessage, 
            playlist: playlistWithIds.map(({title, type, id}) => ({title, type: type!, id: id!})), 
            letter 
        });
    };

    const inputStyles = "w-full bg-slate-800/50 border border-slate-700 rounded-lg p-3 text-white placeholder-slate-400 focus:ring-2 focus:ring-pink-500 focus:border-pink-500 transition-all duration-300 shadow-lg";
    const labelStyles = "block mb-2 text-sm font-bold text-pink-300";

    return (
        <div className="min-h-screen w-full flex flex-col items-center justify-center p-4 text-slate-200">
            <div id="aurora-bg"><div className="aurora-blur aurora-1"></div><div className="aurora-blur aurora-2"></div><div className="aurora-blur aurora-3"></div><div className="aurora-blur aurora-4"></div></div>
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
                    <button type="button" onClick={handleGenerateContent} disabled={isSubmitting} className="w-full mt-4 bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded-lg transition-all duration-300 disabled:opacity-50 flex items-center justify-center gap-2">{isSubmitting ? 'Working...' : '✨ Use AI to Write Messages'}</button>
                </details>
                <details className="bg-slate-900/50 p-4 rounded-lg border border-slate-700">
                    <summary className="font-bold text-lg text-white cursor-pointer">Step 2: Customize Main Messages</summary>
                    <div className="space-y-4 mt-4">
                        <div><label className={labelStyles}>Welcome Message</label><textarea value={welcomeMessage} onChange={e => setWelcomeMessage(e.target.value)} className={inputStyles} /></div>
                        <div><label className={labelStyles}>Birthday Message</label><textarea value={birthdayMessage} onChange={e => setBirthdayMessage(e.target.value)} className={inputStyles} /></div>
                        <div><label className={labelStyles}>Wish For Them</label><textarea value={wishMessage} onChange={e => setWishMessage(e.target.value)} className={inputStyles} /></div>
                        <div><label className={labelStyles}>Final Message</label><input type="text" value={finalMessage} onChange={e => setFinalMessage(e.target.value)} className={inputStyles} /></div>
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
                            <div key={index} className="p-4 rounded-lg bg-slate-800/50 border border-slate-700 flex items-start gap-4">
                                <div className="relative w-24 h-24 flex-shrink-0">
                                    <img src={photo.url || 'https://via.placeholder.com/150/111827/808080?Text=No+Image'} alt="Preview" className="w-full h-full object-cover rounded-lg" />
                                    {photo.isUploading && (
                                        <div className="absolute inset-0 bg-black/70 flex items-center justify-center rounded-lg">
                                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
                                        </div>
                                    )}
                                </div>
                                <div className="flex-grow space-y-3">
                                    <div className="flex items-end gap-2">
                                        <div className="flex-grow"><label htmlFor={`photo-url-${index}`} className={labelStyles}>Photo #{index + 1} URL</label><input id={`photo-url-${index}`} type="text" value={photo.url.startsWith('data:') || photo.url.startsWith('/uploads/') ? '' : photo.url} onChange={e => handlePhotoChange(index, 'url', e.target.value)} className={inputStyles} placeholder={photo.url.startsWith('/uploads/') ? 'Custom image uploaded' : 'Paste URL or Upload'} /></div>
                                        <input type="file" id={`file-upload-${index}`} accept="image/*" onChange={(e) => handlePhotoFileChange(index, e)} className="hidden" /><label htmlFor={`file-upload-${index}`} className="flex-shrink-0 h-12 text-center cursor-pointer bg-slate-700 hover:bg-slate-600 text-white font-bold py-3 px-4 rounded-lg transition-all duration-300">Upload</label>
                                    </div>
                                    <div className="flex items-center gap-2"><label htmlFor={`photo-caption-${index}`} className="sr-only">Caption</label><input id={`photo-caption-${index}`} type="text" value={photo.caption} onChange={e => handlePhotoChange(index, 'caption', e.target.value)} className={inputStyles} placeholder="A short caption" /><button type="button" onClick={() => handleRemovePhoto(index)} className="bg-red-600 hover:bg-red-700 text-white font-bold p-3 rounded-lg h-12 w-12 flex-shrink-0">-</button></div>
                                </div>
                            </div>
                        ))}
                    </div>
                    <button type="button" onClick={handleAddPhoto} className="w-full mt-4 bg-slate-700 hover:bg-slate-600 text-white font-bold py-2 px-4 rounded-lg transition-all duration-300">+</button>
                </details>
                 <details className="bg-slate-900/50 p-4 rounded-lg border border-slate-700">
                    <summary className="font-bold text-lg text-white cursor-pointer">Step 5: Customize Video Messages</summary>
                    <div className="space-y-4 mt-4">
                        {videos.map((video, index) => (
                            <div key={index} className="p-4 rounded-lg bg-slate-800/50 border border-slate-700 flex items-start gap-4">
                                <div className="relative w-24 h-24 flex-shrink-0 bg-slate-900 rounded-lg">
                                    <video src={video.url.startsWith('/uploads/') ? video.url : ''} controls className="w-full h-full object-cover rounded-lg" />
                                    {video.isUploading && (
                                        <div className="absolute inset-0 bg-black/70 flex items-center justify-center rounded-lg">
                                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
                                        </div>
                                    )}
                                </div>
                                <div className="flex-grow space-y-3">
                                    <div className="flex items-end gap-2">
                                        <div className="flex-grow"><label htmlFor={`video-url-${index}`} className={labelStyles}>Video #{index + 1} URL</label><input id={`video-url-${index}`} type="text" value={video.url.startsWith('data:') || video.url.startsWith('/uploads/') ? '' : video.url} onChange={e => handleVideoChange(index, 'url', e.target.value)} className={inputStyles} placeholder={video.url.startsWith('/uploads/') ? 'Custom video uploaded' : 'Paste URL or Upload'} /></div>
                                        <input type="file" id={`video-file-upload-${index}`} accept="video/*" onChange={(e) => handleVideoFileChange(index, e)} className="hidden" /><label htmlFor={`video-file-upload-${index}`} className="flex-shrink-0 h-12 text-center cursor-pointer bg-slate-700 hover:bg-slate-600 text-white font-bold py-3 px-4 rounded-lg transition-all duration-300">Upload</label>
                                    </div>
                                    <div className="flex items-center gap-2"><label htmlFor={`video-caption-${index}`} className="sr-only">Caption</label><input id={`video-caption-${index}`} type="text" value={video.caption} onChange={e => handleVideoChange(index, 'caption', e.target.value)} className={inputStyles} placeholder="A short caption" /><button type="button" onClick={() => handleRemoveVideo(index)} className="bg-red-600 hover:bg-red-700 text-white font-bold p-3 rounded-lg h-12 w-12 flex-shrink-0">-</button></div>
                                </div>
                            </div>
                        ))}
                    </div>
                    <button type="button" onClick={handleAddVideo} className="w-full mt-4 bg-slate-700 hover:bg-slate-600 text-white font-bold py-2 px-4 rounded-lg transition-all duration-300">+</button>
                </details>
                <details className="bg-slate-900/50 p-4 rounded-lg border border-slate-700">
                    <summary className="font-bold text-lg text-white cursor-pointer">Step 6: Customize The Letter</summary>
                    <div className="space-y-4 mt-4">
                        <div><label className={labelStyles}>Your Letter</label><textarea value={letter} onChange={e => setLetter(e.target.value)} className={`${inputStyles} h-48`} /></div>
                    </div>
                </details>
                <details className="bg-slate-900/50 p-4 rounded-lg border border-slate-700">
                    <summary className="font-bold text-lg text-white cursor-pointer">Step 7: Customize Playlist</summary>
                    <div className="space-y-4 mt-4">
                        {playlist.map((song, index) => (
                            <div key={index} className="grid grid-cols-1 md:grid-cols-[1fr_1fr_auto] items-end gap-4">
                                <div><label className={labelStyles}>Song #{index + 1} URL</label><input type="url" value={song.url} onChange={e => handleSongChange(index, 'url', e.target.value)} className={inputStyles} placeholder="https://youtube.com/..." /></div>
                                <div><label className={labelStyles}>Title</label><input type="text" value={song.title} onChange={e => handleSongChange(index, 'title', e.target.value)} className={inputStyles} placeholder="Song Title" /></div>
                                <button type="button" onClick={() => handleRemoveSong(index)} className="bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-3 rounded-lg h-12 w-full md:w-auto">-</button>
                            </div>
                        ))}
                    </div>
                    <button type="button" onClick={handleAddSong} className="w-full mt-4 bg-slate-700 hover:bg-slate-600 text-white font-bold py-2 px-4 rounded-lg transition-all duration-300">+</button>
                </details>
                <details className="bg-slate-900/50 p-4 rounded-lg border border-slate-700">
                  <summary className="font-bold text-lg text-white cursor-pointer">Step 8: Customize Wish Page</summary>
                  <div className="space-y-4 mt-4">
                      <div>
                          <label className={labelStyles}>Wish Page Description</label>
                          <textarea value={wishDescription} onChange={e => setWishDescription(e.target.value)} className={`${inputStyles} h-24`} />
                      </div>
                  </div>
                </details>

                {error && <div className="bg-red-900/50 text-red-300 p-3 rounded-lg text-center">{error}</div>}
                <button type="submit" disabled={isSubmitting} className="w-full btn-primary text-white font-bold py-4 px-4 rounded-lg text-xl disabled:opacity-50">
                    {isSubmitting ? 'Saving...' : 'Create Birthday Website'}
                </button>
            </form>
        </div>
    );
};

export default SetupForm;