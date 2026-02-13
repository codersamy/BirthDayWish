
export interface Photo {
  url: string;
  caption: string;
}

export interface BentoItem {
  title: string;
  text: string;
  icon: string;
}

export interface BirthdayConfig {
  recipientName: string;
  welcomeMessage: string;
  birthdayMessage: string;
  bentoItems: BentoItem[];
  galleryTitle: string;
  photos: Photo[];
  galleryClosing: string;
  wishMessage: string;
  finalMessage: string;
  youtubeId: string;
  letter: string;
}

export interface AiGeneratedContent {
  welcomeMessage: string;
  birthdayMessage: string;
  bentoItems: BentoItem[];
  wishMessage: string;
  finalMessage: string;
  letter: string;
}
