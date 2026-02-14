
export interface Photo {
    url: string;
    caption: string;
}

export interface ProcessedVideo {
    type: 'youtube' | 'googledrive' | 'data';
    id?: string;
    url?: string;
}

export interface Video {
    caption: string;
    processed: ProcessedVideo;
}

export interface PlaylistItem {
    title: string;
    type: 'youtube';
    id: string;
}

export interface BentoItem {
    icon: string;
    title: string;
    text: string;
}

export interface BirthdayConfig {
    recipientName: string;
    welcomeMessage: string;
    birthdayMessage: string;
    bentoItems: BentoItem[];
    galleryTitle: string;
    photos: Photo[];
    videos: Video[];
    galleryClosing: string;
    wishMessage: string;
    wishDescription: string;
    finalMessage: string;
    playlist: PlaylistItem[];
    letter: string;
    relationship?: string;
    memories?: string;
}
