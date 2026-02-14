// Defines the core data structures for the application.

export interface Photo {
  url: string;
  caption: string;
}

export interface Video {
  url: string;
  caption: string;
}

export interface ProcessedVideo {
    caption: string;
    type: 'youtube' | 'googledrive' | 'direct'; // 'direct' is for Cloudinary or other direct links
    id?: string; // For YouTube or Google Drive
    url?: string; // For direct links
}

export interface Song {
  url: string;
  title: string;
}

export interface ProcessedSong {
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
  videos: ProcessedVideo[];
  galleryClosing: string;
  wishMessage: string;
  wishDescription: string;
  finalMessage: string;
  playlist: ProcessedSong[];
  letter: string;
  // FIX: Add missing properties to resolve type errors in SetupForm.tsx.
  relationship: string;
  memories: string;
}
