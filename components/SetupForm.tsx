import React, { useState, useEffect } from 'react';
import { generateBirthdayContent } from '../services/geminiService';
import { uploadToCloudinary } from '../services/cloudinaryService';
import type { BirthdayConfig, Photo, Video, Song, BentoItem, ProcessedVideo } from '../types';

interface SetupFormProps {
    onSubmit: (config: BirthdayConfig) => void;
    initialData: BirthdayConfig | null;
}

type UploadStatus = 'idle' | 'uploading' | 'success' | 'error';

const SetupForm: React.FC<SetupFormProps> = ({ onSubmit, initialData }) => {
    // Default data for a fresh form
    const defaultPhotos = [{ url: 'https://i.ibb.co/6Z6XgCg/crush.webp', caption: 'Our favorite memory.' }];
    const defaultVideos = [{ url: 'https://www.youtube.com/watch?v=LXb3EKWsInQ', caption: 'A Special Message' }];
    const defaultPlaylist = [{ url: 'https://www.youtube.com/watch?v=jfKfPfyJRdk', title: 'Lofi Girl - beats to relax/study to' }];
    
    // State Initialization
    const [relationship, setRelationship] = useState(initialData?.relationship || '');
    const [memories, setMemories] = useState(initialData?.memories || '');
    const [recipientName, setRecipientName] = useState(initialData?.recipientName || 'Beautiful');
    const [welcomeMessage, setWelcomeMessage] = useState(initialData?.welcomeMessage || "I built a little world for you...");
    const [birthdayMessage, setBirthdayMessage] = useState(initialData?.birthdayMessage || "Another year of you making the world brighter.");
    const [bentoItems, setBentoItems] = useState<BentoItem[]>(initialData?.bentoItems || [{ icon: '✨', title: 'Your Radiant Spirit', text: 'Your passion for life is infectious.' }]);
    const [photos, setPhotos] = useState<Photo[]>(initialData?.photos || defaultPhotos);
    const [videos, setVideos] = useState<Video[]>(initialData?.videos.map(v => ({ url: v.url || `https://www.youtube.com/watch?v=${v.id}`, caption: v.caption })) || defaultVideos);
    const [playlist, setPlaylist] = useState<Song[]>(initialData?.playlist?.map(s => ({ url: `https://www.youtube.com/watch?v=${s.id}`, title: s.title })) || defaultPlaylist);
    const [letter, setLetter] = useState(initialData?.letter || "My Dearest,\n\nOn your special day, I find myself reflecting on all the moments we've shared...");
    const [wishMessage, setWishMessage] = useState(initialData?.wishMessage || "May the next year bring you all the love...");
    const [finalMessage, setFinalMessage] = useState(initialData?.finalMessage || "Happy Birthday! ❤️");
    const [galleryTitle, setGalleryTitle] = useState(initialData?.galleryTitle || "A Gallery of Memories");
    const [galleryClosing, setGalleryClosing] = useState(initialData?.galleryClosing || "Every moment with you...");
    const [wishDescription, setWishDescription] = useState(initialData?.wishDescription || "This is a space to send your hopes...");
    
    // Config state
    const [cloudinaryCloudName, setCloudinaryCloudName] = useState('');
    const [cloudinaryUploadPreset, setCloudinaryUploadPreset] = useState('');

    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [uploadStatus, setUploadStatus] = useState<Record<string, UploadStatus>>({});

    // URL Processing Utilities
    const getYouTubeId = (url: string) => {
        const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
        const match = url.match(regExp);
        return (match && match[2].length === 11) ? { type: 'youtube' as const, id: match[2] } : null;
    };
    
    const getGoogleDriveId = (url: string) => {
        const gdRegExp = /drive\.google\.com\/(?:file\/d\/|open\?id=)([a-zA-Z0-9_-]+)/;
        const match = url.match(gdRegExp);
        return match ? { type: 'googledrive' as const, id: match[1] } : null;
    };

    const processVideoUrl = (url: string): Omit<ProcessedVideo, 'caption'> | null => {
        const ytMatch = getYouTubeId(url);
        if (ytMatch) return ytMatch;
        const gdMatch = getGoogleDriveId(url);
        if (gdMatch) return gdMatch;
        if (url.startsWith('http')) return { type: 'direct' as const, url: url };
        return null;
    };

    // Handlers for Photos
    const isCloudinaryConfigured = !!(cloudinaryCloudName && cloudinaryUploadPreset);
    const handleAddPhoto = () => setPhotos([...photos, { url: '', caption: '' }]);
    const handlePhotoChange = (index: number, field: keyof Photo, value: string) => setPhotos(photos.map((p, i) => i === index ? { ...p, [field]: value } : p));
    const handleRemovePhoto = (index: number) => setPhotos(photos.filter((_, i) => i !== index));
    const handlePhotoFileChange = async (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const statusKey = `photo-${index}`;
        setUploadStatus(prev => ({ ...prev, [statusKey]: 'uploading' }));
        try {
            const uploadedUrl = await uploadToCloudinary(file, cloudinaryCloudName, cloudinaryUploadPreset);
            handlePhotoChange(index, 'url', uploadedUrl);
            setUploadStatus(prev => ({ ...prev, [statusKey]: 'success' }));
        } catch (err) {
            setError('Photo upload failed. Please try again.');
            setUploadStatus(prev => ({ ...prev, [statusKey]: 'error' }));
        }
    };

    // Handlers for Videos
    const handleAddVideo = () => setVideos([...videos, { url: '', caption: '' }]);
    const handleVideoChange = (index: number, field: keyof Video, value: string) => setVideos(videos.map((v, i) => i === index ? { ...v, [field]: value } : v));
    const handleRemoveVideo = (index: number) => setVideos(videos.filter((_, i) => i !== index));
    const handleVideoFileChange = async (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const statusKey = `video-${index}`;
        setUploadStatus(prev => ({ ...prev, [statusKey]: 'uploading' }));
        try {
            const uploadedUrl = await uploadToCloudinary(file, cloudinaryCloudName, cloudinaryUploadPreset);
            handleVideoChange(index, 'url', uploadedUrl);
            setUploadStatus(prev => ({ ...prev, [statusKey]: 'success' }));
        } catch (err) {
            setError('Video upload failed. Please try again.');
            setUploadStatus(prev => ({ ...prev, [statusKey]: 'error' }));
        }
    };

    // Handlers for other sections
    const handleAddBentoItem = () => setBentoItems([...bentoItems, { icon: '💖', title: '', text: '' }]);
    const handleBentoItemChange = (index: number, field: keyof BentoItem, value: string) => setBentoItems(bentoItems.map((item, i) => i === index ? { ...item, [field]: value } : item));
    const handleRemoveBentoItem = (index: number) => setBentoItems(bentoItems.filter((_, i) => i !== index));

    const handleAddSong = () => setPlaylist([...playlist, { url: '', title: '' }]);
    const handleSongChange = (index: number, field: keyof Song, value: string) => setPlaylist(playlist.map((s, i) => (i === index ? { ...s, [field]: value } : s)));
    const handleRemoveSong = (index: number) => setPlaylist(playlist.filter((_, i) => i !== index));

    // AI Content Generation
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

    // Form Submission
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        const processedPlaylist = playlist.map(song => ({ ...getYouTubeId(song.url), title: song.title }));
        if (processedPlaylist.some(song => !song.id)) {
            setError('Please enter a valid YouTube URL for all songs.');
            return;
        }

        const processedVideos = videos.map(video => ({ ...processVideoUrl(video.url), caption: video.caption }));
        if (processedVideos.some(video => !video.type)) {
            setError('Please enter a valid YouTube, Google Drive, or direct video URL for all videos.');
            return;
        }

        // FIX: Pass relationship and memories to be included in the shareable configuration, enabling re-editing.
        onSubmit({
            recipientName, welcomeMessage, birthdayMessage, bentoItems, galleryTitle, photos,
            videos: processedVideos as ProcessedVideo[], galleryClosing, wishMessage, wishDescription,
            finalMessage, playlist: processedPlaylist.map(({title, id}) => ({title: title!, type: 'youtube', id: id!})), letter,
            relationship,
            memories,
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

                <details className="bg-slate-900/50 p-4 rounded-lg border border-slate-700">
                    <summary className="font-bold text-lg text-white cursor-pointer">Optional: Enable Media Uploads (Cloudinary)</summary>
                    <div className="mt-4 space-y-4">
                        <p className="text-sm text-slate-400">
                            To upload your own photos and videos directly, provide your Cloudinary credentials. You can get these from your{' '}
                            <a href="https://cloudinary.com/users/register/free" target="_blank" rel="noopener noreferrer" className="text-pink-400 underline">Cloudinary dashboard</a>.
                            You'll need to create an "unsigned" upload preset.
                        </p>
                        <div>
                            <label htmlFor="cloudinaryCloudName" className={labelStyles}>Cloudinary Cloud Name:</label>
                            <input type="text" id="cloudinaryCloudName" value={cloudinaryCloudName} onChange={e => setCloudinaryCloudName(e.target.value)} className={inputStyles} placeholder="your-cloud-name" />
                        </div>
                        <div>
                            <label htmlFor="cloudinaryUploadPreset" className={labelStyles}>Cloudinary Upload Preset:</label>
                            <input type="text" id="cloudinaryUploadPreset" value={cloudinaryUploadPreset} onChange={e => setCloudinaryUploadPreset(e.target.value)} className={inputStyles} placeholder="your-unsigned-preset" />
                        </div>
                    </div>
                </details>
                
                {/* Sections remain largely the same, but with upload logic integrated */}
                {/* Step 1: AI */}
                <details className="bg-slate-900/50 p-4 rounded-lg border border-slate-700" open>
                    <summary className="font-bold text-lg text-white cursor-pointer">Step 1: AI Content Generation</summary>
                    <div className="grid md:grid-cols-2 gap-6 mt-4">
                        <div><label htmlFor="recipientName" className={labelStyles}>To (Name):</label><input type="text" id="recipientName" value={recipientName} onChange={e => setRecipientName(e.target.value)} className={inputStyles} placeholder="e.g., Alex" /></div>
                        <div><label htmlFor="relationship" className={labelStyles}>Your Relationship:</label><input type="text" id="relationship" value={relationship} onChange={e => setRelationship(e.target.value)} className={inputStyles} placeholder="e.g., My amazing girlfriend" /></div>
                        <div className="md:col-span-2"><label htmlFor="memories" className={labelStyles}>Memories & Feelings for AI:</label><textarea id="memories" value={memories} onChange={e => setMemories(e.target.value)} className={`${inputStyles} h-20`} placeholder="A happy memory, what you admire..."></textarea></div>
                    </div>
                    <button type="button" onClick={handleGenerateContent} disabled={isLoading} className="w-full mt-4 bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded-lg transition-all duration-300 disabled:opacity-50 flex items-center justify-center gap-2">{isLoading ? 'Generating...' : '✨ Use AI to Write Messages'}</button>
                </details>

                {/* Step 4: Photo Gallery */}
                 <details className="bg-slate-900/50 p-4 rounded-lg border border-slate-700">
                    <summary className="font-bold text-lg text-white cursor-pointer">Step 4: Customize Photo Gallery</summary>
                    <div className="space-y-4 mt-4">
                        {photos.map((photo, index) => {
                            const statusKey = `photo-${index}`;
                            const currentStatus = uploadStatus[statusKey];
                            return (
                                <div key={index} className="p-4 rounded-lg bg-slate-800/50 border border-slate-700 flex items-start gap-4">
                                    <img src={photo.url || 'https://via.placeholder.com/150/111827/808080?Text=No+Image'} alt="Preview" className="w-24 h-24 object-cover rounded-lg flex-shrink-0" />
                                    <div className="flex-grow space-y-3">
                                        <div className="flex items-end gap-2">
                                            <div className="flex-grow">
                                                <label htmlFor={`photo-url-${index}`} className={labelStyles}>Photo #{index + 1} URL</label>
                                                <input id={`photo-url-${index}`} type="text" value={photo.url} onChange={e => handlePhotoChange(index, 'url', e.target.value)} className={inputStyles} placeholder={'Paste URL or Upload'} />
                                            </div>
                                            <input type="file" id={`file-upload-${index}`} accept="image/*" onChange={(e) => handlePhotoFileChange(index, e)} className="hidden" disabled={!isCloudinaryConfigured || currentStatus === 'uploading'}/>
                                            <label htmlFor={`file-upload-${index}`} className={`flex-shrink-0 h-12 text-center cursor-pointer bg-slate-700 hover:bg-slate-600 text-white font-bold py-3 px-4 rounded-lg transition-all duration-300 ${(!isCloudinaryConfigured || currentStatus === 'uploading') ? 'opacity-50 cursor-not-allowed' : ''}`}>
                                                {currentStatus === 'uploading' ? '...' : 'Upload'}
                                            </label>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <label htmlFor={`photo-caption-${index}`} className="sr-only">Caption</label>
                                            <input id={`photo-caption-${index}`} type="text" value={photo.caption} onChange={e => handlePhotoChange(index, 'caption', e.target.value)} className={inputStyles} placeholder="A short caption" />
                                            <button type="button" onClick={() => handleRemovePhoto(index)} className="bg-red-600 hover:bg-red-700 text-white font-bold p-3 rounded-lg h-12 w-12 flex-shrink-0">-</button>
                                        </div>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                    <button type="button" onClick={handleAddPhoto} className="w-full mt-4 bg-slate-700 hover:bg-slate-600 text-white font-bold py-2 px-4 rounded-lg transition-all duration-300">+</button>
                </details>

                 {/* Other sections omitted for brevity but would follow the same pattern */}
                <details className="bg-slate-900/50 p-4 rounded-lg border border-slate-700">
                    <summary className="font-bold text-lg text-white cursor-pointer">Step 5: Customize Video Messages</summary>
                     <div className="space-y-4 mt-4">
                        {videos.map((video, index) => {
                             const statusKey = `video-${index}`;
                             const currentStatus = uploadStatus[statusKey];
                            return (
                                <div key={index} className="p-4 rounded-lg bg-slate-800/50 border border-slate-700 flex items-start gap-4">
                                <video src={video.url} controls className="w-24 h-24 object-cover rounded-lg flex-shrink-0 bg-slate-900" />
                                <div className="flex-grow space-y-3">
                                    <div className="flex items-end gap-2">
                                        <div className="flex-grow">
                                            <label htmlFor={`video-url-${index}`} className={labelStyles}>Video #{index + 1} URL</label>
                                            <input id={`video-url-${index}`} type="text" value={video.url} onChange={e => handleVideoChange(index, 'url', e.target.value)} className={inputStyles} placeholder={'Paste URL or Upload'} />
                                        </div>
                                        <input type="file" id={`video-file-upload-${index}`} accept="video/*" onChange={(e) => handleVideoFileChange(index, e)} className="hidden" disabled={!isCloudinaryConfigured || currentStatus === 'uploading'} />
                                        <label htmlFor={`video-file-upload-${index}`} className={`flex-shrink-0 h-12 text-center cursor-pointer bg-slate-700 hover:bg-slate-600 text-white font-bold py-3 px-4 rounded-lg transition-all duration-300 ${(!isCloudinaryConfigured || currentStatus === 'uploading') ? 'opacity-50 cursor-not-allowed' : ''}`}>
                                            {currentStatus === 'uploading' ? '...' : 'Upload'}
                                        </label>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <label htmlFor={`video-caption-${index}`} className="sr-only">Caption</label>
                                        <input id={`video-caption-${index}`} type="text" value={video.caption} onChange={e => handleVideoChange(index, 'caption', e.target.value)} className={inputStyles} placeholder="A short caption" />
                                        <button type="button" onClick={() => handleRemoveVideo(index)} className="bg-red-600 hover:bg-red-700 text-white font-bold p-3 rounded-lg h-12 w-12 flex-shrink-0">-</button>
                                    </div>
                                </div>
                            </div>
                            )
                        })}
                    </div>
                    <button type="button" onClick={handleAddVideo} className="w-full mt-4 bg-slate-700 hover:bg-slate-600 text-white font-bold py-2 px-4 rounded-lg transition-all duration-300">+</button>
                </details>


                {/* The rest of the form sections (bento, messages, letter, playlist) remain functionally the same */}
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

                {error && <div className="bg-red-900/50 text-red-300 p-3 rounded-lg text-center">{error}</div>}
                <button type="submit" className="w-full btn-primary text-white font-bold py-4 px-4 rounded-lg text-xl">
                    Create Birthday Website
                </button>
            </form>
        </div>
    );
};

export default SetupForm;