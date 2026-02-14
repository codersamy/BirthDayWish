import React, { useState, useEffect, useRef } from 'react';
import * as THREE from 'three';
import gsap from 'gsap';
import confetti from 'canvas-confetti';
import type { BirthdayConfig, ProcessedVideo } from '../types';

interface BirthdayWebsiteProps {
    config: BirthdayConfig;
    onStartOver: () => void;
}

const BirthdayWebsite: React.FC<BirthdayWebsiteProps> = ({ config, onStartOver }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const objectsRef = useRef<any[]>([]);
    const sceneRef = useRef<THREE.Scene | null>(null);
    const launchedStarsRef = useRef<THREE.Points | null>(null);
    const starFieldRef = useRef<THREE.Points | null>(null);
    const animationFrameId = useRef<number | null>(null);
    const [currentStep, setCurrentStep] = useState(1);
    const [isMusicPlaying, setIsMusicPlaying] = useState(false);
    const [currentSongIndex, setCurrentSongIndex] = useState<number | null>(null);
    const [isPlayerReady, setIsPlayerReady] = useState(false);
    const playerRef = useRef<any>(null); // YT.Player
    const [wishes, setWishes] = useState<string[]>([]);
    const [newWish, setNewWish] = useState('');
    const [copySuccess, setCopySuccess] = useState('');
    const [isWishLaunched, setIsWishLaunched] = useState(false);
    const [launchedWishText, setLaunchedWishText] = useState('');

    const TOTAL_STEPS = 9;

    // Load/Save wishes from/to localStorage
    useEffect(() => {
        try {
            const storedWishes = localStorage.getItem(`birthdayWishes_${config.recipientName}`);
            if (storedWishes) setWishes(JSON.parse(storedWishes));
        } catch (e) {
            console.error("Failed to parse wishes from localStorage", e);
        }
    }, [config.recipientName]);

    useEffect(() => {
        try {
            localStorage.setItem(`birthdayWishes_${config.recipientName}`, JSON.stringify(wishes));
        } catch (e) {
            console.error("Failed to save wishes to localStorage", e);
        }
    }, [wishes, config.recipientName]);

    const goToStep = (stepNumber: number) => {
        if (currentStep === stepNumber) return;
        const currentStepEl = document.getElementById(`step-${currentStep}`);
        if (currentStepEl) {
            gsap.to(currentStepEl, {
                opacity: 0,
                scale: 0.9,
                duration: 0.4,
                ease: 'power3.in',
                onComplete: () => {
                    setCurrentStep(stepNumber);
                }
            });
        } else {
            setCurrentStep(stepNumber);
        }
    };

    useEffect(() => {
        const stepEl = document.getElementById(`step-${currentStep}`);
        if (stepEl) {
            gsap.fromTo(stepEl,
                { opacity: 0, scale: 1.1 },
                {
                    opacity: 1,
                    scale: 1,
                    duration: 0.6,
                    ease: 'power3.out',
                    delay: currentStep === 1 ? 0.5 : 0
                }
            );
        }
    }, [currentStep]);

    const handleAddWish = () => {
        if (newWish.trim()) {
            setWishes([...wishes, newWish.trim()]);
            setNewWish('');
        }
    };

    const handleRemoveWish = (indexToRemove: number) => {
        setWishes(wishes.filter((_, index) => index !== indexToRemove));
    };

    const handleCopyWishes = () => {
        navigator.clipboard.writeText(wishes.join('\n')).then(() => {
            setCopySuccess('Copied to clipboard!');
            setTimeout(() => setCopySuccess(''), 2000);
        }, () => {
            setCopySuccess('Failed to copy.');
            setTimeout(() => setCopySuccess(''), 2000);
        });
    };

    useEffect(() => {
        const initPlayer = () => {
            if (playerRef.current) playerRef.current.destroy();
            const firstVideoId = config.playlist?.find(p => p.type === 'youtube')?.id;
            if (!firstVideoId) return;

            playerRef.current = new (window as any).YT.Player('youtube-player', {
                height: '0', width: '0', videoId: firstVideoId,
                playerVars: { autoplay: 0, controls: 0, loop: 1, playlist: firstVideoId },
                events: {
                    'onReady': (event: any) => { event.target.setVolume(30); setIsPlayerReady(true); },
                    'onStateChange': (event: any) => {
                        if (event.data === (window as any).YT.PlayerState.PLAYING) setIsMusicPlaying(true);
                        else if (event.data === (window as any).YT.PlayerState.PAUSED || event.data === (window as any).YT.PlayerState.ENDED) setIsMusicPlaying(false);
                    }
                }
            });
        };
        if ((window as any).YT?.Player) { initPlayer(); } else { (window as any).onYouTubeIframeAPIReady = initPlayer; }

        const canvas = canvasRef.current;
        if (!canvas) return;
        sceneRef.current = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        camera.position.z = 5;
        const renderer = new THREE.WebGLRenderer({ canvas, alpha: true });
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        sceneRef.current.add(new THREE.AmbientLight(0xffffff, 1.5));
        const dirLight = new THREE.DirectionalLight(0xffffff, 2);
        dirLight.position.set(5, 5, 5);
        sceneRef.current.add(dirLight);

        // ... (rest of the THREE.js setup code is identical to original) ...
        const heartShape = new THREE.Shape().moveTo(25, 25).bezierCurveTo(25, 25, 20, 0, 0, 0).bezierCurveTo(-30, 0, -30, 35, -30, 35).bezierCurveTo(-30, 55, -10, 77, 25, 95).bezierCurveTo(60, 77, 80, 55, 80, 35).bezierCurveTo(80, 35, 80, 0, 50, 0).bezierCurveTo(35, 0, 25, 25, 25, 25);
        const heartGeom = new THREE.ExtrudeGeometry(heartShape, { depth: 8, bevelEnabled: true, bevelSegments: 2, steps: 2, bevelSize: 1, bevelThickness: 1 }).scale(0.02, 0.02, 0.02).center();
        const heartMaterial = new THREE.MeshStandardMaterial({ color: 0xec4899, roughness: 0.3, metalness: 0.6, transparent: true });

        objectsRef.current = [];
        for (let i = 0; i < 25; i++) {
            const x = (Math.random() - 0.5) * 20; const y = (Math.random() - 0.5) * 20; const z = (Math.random() - 0.5) * 10;
            const userData = { sinOffset: Math.random() * Math.PI * 2, speed: Math.random() * 0.3 + 0.1, initialPosition: new THREE.Vector3(x, y, z) };
            let obj: any;
            const rand = Math.random();

            if (rand < 0.5) { // Heart
                obj = new THREE.Mesh(heartGeom, heartMaterial.clone());
                obj.isGroup = false;
            } else { // Gift
                const giftGroup = new THREE.Group();
                const giftColors = [0xa78bfa, 0x7dd3fc, 0x60a5fa, 0xfde047]; const ribbonColor = 0xf1f5f9;
                const boxMaterial = new THREE.MeshStandardMaterial({ color: giftColors[Math.floor(Math.random() * giftColors.length)], roughness: 0.3, metalness: 0.6, transparent: true });
                const ribbonMaterial = new THREE.MeshStandardMaterial({ color: ribbonColor, roughness: 0.3, metalness: 0.6, transparent: true });
                const boxMesh = new THREE.Mesh(new THREE.BoxGeometry(1.5, 1.5, 1.5), boxMaterial);
                const ribbon1Mesh = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.3, 1.6), ribbonMaterial);
                const ribbon2Mesh = new THREE.Mesh(new THREE.BoxGeometry(0.3, 1.6, 1.6), ribbonMaterial);
                giftGroup.add(boxMesh, ribbon1Mesh, ribbon2Mesh); obj = giftGroup; obj.isGroup = true;
            }

            obj.position.set(x, y, z); obj.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
            obj.scale.setScalar(Math.random() * 0.5 + 0.3); obj.userData = userData; sceneRef.current.add(obj); objectsRef.current.push(obj);
        }

        const starVertices: number[] = [];
        for (let i = 0; i < 1500; i++) {
            starVertices.push((Math.random() - 0.5) * 100, (Math.random() - 0.5) * 100, (Math.random() - 0.5) * 100);
        }
        const starGeometry = new THREE.BufferGeometry();
        starGeometry.setAttribute('position', new THREE.Float32BufferAttribute(starVertices, 3));
        const starMaterial = new THREE.PointsMaterial({ color: 0xffffff, size: 0.1, transparent: true, opacity: 0.8 });
        starFieldRef.current = new THREE.Points(starGeometry, starMaterial);
        sceneRef.current.add(starFieldRef.current);

        const animate = () => {
            animationFrameId.current = requestAnimationFrame(animate);
            const time = Date.now() * 0.0005;
            objectsRef.current.forEach(obj => { obj.rotation.y += Math.sin(time * obj.userData.speed + obj.userData.sinOffset) * 0.01; });
            renderer.render(sceneRef.current!, camera);
        };
        animate();
        const handleResize = () => {
            camera.aspect = window.innerWidth / window.innerHeight; camera.updateProjectionMatrix(); renderer.setSize(window.innerWidth, window.innerHeight);
        };
        window.addEventListener('resize', handleResize);
        return () => {
            window.removeEventListener('resize', handleResize);
            if (animationFrameId.current) cancelAnimationFrame(animationFrameId.current);
            playerRef.current?.destroy();
        };
    }, [config.playlist]);

    const handlePlaySong = (index: number) => {
        if (!isPlayerReady || !playerRef.current) return;
        if (index === currentSongIndex) {
            const playerState = playerRef.current.getPlayerState();
            if (playerState === 1) playerRef.current.pauseVideo();
            else playerRef.current.playVideo();
        } else {
            const videoId = config.playlist[index].id;
            playerRef.current.loadVideoById(videoId);
            setCurrentSongIndex(index);
        }
    };

    const toggleMusic = () => {
        if (!isPlayerReady || !playerRef.current || typeof playerRef.current.getPlayerState !== 'function') return;
        if (currentSongIndex === null) setCurrentSongIndex(0);
        const playerState = playerRef.current.getPlayerState();
        if (playerState === 1) { playerRef.current.pauseVideo(); } else { playerRef.current.playVideo(); }
    };

    const handleBegin = () => {
        if (isPlayerReady && playerRef.current?.playVideo) {
            setCurrentSongIndex(0);
            playerRef.current.playVideo();
        }
        goToStep(2);
    };

    const handleLaunchWish = () => {
        const lastWish = wishes.length > 0 ? wishes[wishes.length - 1] : "For all your dreams to come true.";
        setLaunchedWishText(lastWish);
        setIsWishLaunched(true);

        const scene = sceneRef.current;
        if (!scene) return;
        // ... (GSAP and THREE.js animation for wish launch is identical) ...
        objectsRef.current.forEach(obj => {
            gsap.to(obj.material, { opacity: 0, duration: 2.5, ease: 'power3.in' });
            gsap.to(obj.position, {
                x: (Math.random() - 0.5) * 30, y: (Math.random() - 0.5) * 30, z: Math.random() * -20,
                duration: 2.5, ease: 'power3.in'
            });
        });

        const tl = gsap.timeline();
        tl.to('#wish-list-ui', { opacity: 0, duration: 1, ease: 'power2.in' })
            .fromTo('#launched-wish-text', { opacity: 0, scale: 0.5 }, { opacity: 1, scale: 1, duration: 2, ease: 'back.out(1.7)' }, ">-0.5")
            .to('#launched-wish-text', { opacity: 0, scale: 0.1, y: -100, duration: 2, ease: 'power3.in' }, "+=1")
            .fromTo('#wish-sent-confirmation', { opacity: 0 }, { opacity: 1, duration: 1.5 }, ">-0.5");
    };

    const handleCelebration = () => {
        const end = Date.now() + (5 * 1000);
        const colors = ['#ec4899', '#f87171', '#a78bfa', '#ffffff'];

        (function frame() {
            confetti({ particleCount: 2, angle: 60, spread: 55, origin: { x: 0 }, colors: colors });
            confetti({ particleCount: 2, angle: 120, spread: 55, origin: { x: 1 }, colors: colors });
            if (Date.now() < end) requestAnimationFrame(frame);
        }());
    };

    useEffect(() => {
        if (currentStep !== 4) return;
        const galleryWrapper = document.getElementById('photo-gallery-wrapper'); if (!galleryWrapper) return;
        const gallery = galleryWrapper.querySelector('.photo-gallery'); const polaroids = galleryWrapper.querySelectorAll('.polaroid'); if (!gallery || !polaroids) return;
        const onMove = (e: MouseEvent) => { const rect = galleryWrapper.getBoundingClientRect(); const x = e.clientX - rect.left, y = e.clientY - rect.top; gsap.to(polaroids, { rotateX: gsap.utils.mapRange(0, rect.height, 10, -10, y), rotateY: gsap.utils.mapRange(0, rect.width, -10, 10, x), duration: 0.5, ease: 'power1.out' }); };
        const onLeave = () => gsap.to(polaroids, { rotateX: 0, rotateY: 0, duration: 0.5, ease: 'power1.out' });
        const onWheel = (e: WheelEvent) => { if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) return; e.preventDefault(); gallery.scrollLeft += e.deltaY; };
        galleryWrapper.addEventListener('mousemove', onMove); galleryWrapper.addEventListener('mouseleave', onLeave); gallery.addEventListener('wheel', onWheel, { passive: false });
        return () => { galleryWrapper.removeEventListener('mousemove', onMove); galleryWrapper.removeEventListener('mouseleave', onLeave); gallery.removeEventListener('wheel', onWheel); };
    }, [currentStep]);

    const cardStyles = "step absolute inset-0 m-auto w-full card p-6 md:p-8 flex flex-col items-center justify-start gap-4 text-center max-h-[90vh] overflow-y-auto pt-20 pb-8";

    const VideoPlayer = ({ video }: { video: ProcessedVideo }) => {
        if (video.type === 'direct') {
            return <div className="aspect-video-container bg-black rounded-lg overflow-hidden shadow-lg"><video src={video.url} controls className="w-full h-full" /></div>;
        }
        const embedUrl = video.type === 'youtube'
            ? `https://www.youtube.com/embed/${video.id}`
            : `https://drive.google.com/file/d/${video.id}/preview`;
        return <div className="aspect-video-container bg-black rounded-lg overflow-hidden shadow-lg"><iframe src={embedUrl} frameBorder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen title={video.caption}></iframe></div>;
    };
    
    // The rest of the JSX is largely identical to the original, with minor adjustments for prop names.
    return (
        <div className="w-full h-screen overflow-hidden">
             <div id="aurora-bg"><div className="aurora-blur aurora-1"></div><div className="aurora-blur aurora-2"></div><div className="aurora-blur aurora-3"></div><div className="aurora-blur aurora-4"></div></div>
            <canvas ref={canvasRef} id="three-canvas" className="fixed top-0 left-0 w-full h-full -z-10"></canvas>
            <main className="relative z-10 w-full h-screen flex flex-col items-center justify-center p-4">
                <div className="fixed top-5 w-11/12 max-w-md h-2.5 rounded-full p-0.5 bg-slate-900/30 backdrop-blur-sm"><div className="h-1.5 rounded-full bg-gradient-to-r from-pink-500 to-red-500 transition-all duration-500" style={{ width: `${((currentStep - 1) / (TOTAL_STEPS - 1)) * 100}%` }}></div></div>
                <div className="fixed top-12 left-5 z-20 flex gap-2">
                    <button onClick={() => goToStep(1)} title="Home" className="w-12 h-12 rounded-full flex items-center justify-center text-white bg-slate-800/70 backdrop-blur-sm border border-slate-600 hover:bg-slate-700/70 transition-colors"><i className="fas fa-home"></i></button>
                    <button onClick={onStartOver} title="Edit This Wish" className="w-12 h-12 rounded-full flex items-center justify-center text-white bg-slate-800/70 backdrop-blur-sm border border-slate-600 hover:bg-slate-700/70 transition-colors"><i className="fas fa-edit"></i></button>
                </div>
                <button onClick={toggleMusic} title="Toggle Music" className="fixed top-12 right-5 z-20 w-12 h-12 rounded-full flex items-center justify-center text-white bg-slate-800/70 backdrop-blur-sm border border-slate-600 hover:bg-slate-700/70 transition-colors">
                    <i className={`fas ${isMusicPlaying ? 'fa-pause' : 'fa-play'}`}></i>
                </button>
                <div className="relative w-full max-w-2xl h-full flex items-center justify-center">
                    <div id="step-1" className={cardStyles} style={{ display: currentStep === 1 ? 'flex' : 'none', justifyContent: 'center' }}><div className="text-7xl animate-pulse">❤️</div><h1 className="text-5xl font-display text-gradient">Hey {config.recipientName},</h1><p>{config.welcomeMessage}</p><button onClick={handleBegin} className="btn-primary rounded-full px-8 py-3 font-bold mt-4">Let's Begin</button></div>
                    <div id="step-2" className={cardStyles} style={{ display: currentStep === 2 ? 'flex' : 'none', justifyContent: 'center' }}><div className="text-7xl">🎉</div><h1 className="text-5xl font-display text-gradient">Happy Birthday!</h1><p>{config.birthdayMessage}</p><button onClick={() => goToStep(3)} className="btn-primary rounded-full px-8 py-3 font-bold mt-4">There's more...</button></div>
                    <div id="step-3" className={cardStyles} style={{ display: currentStep === 3 ? 'flex' : 'none' }}>
                        <h2 className="text-4xl font-display text-gradient text-center">A Few Things I Adore About You</h2>
                        <div className="bento-grid w-full mt-4">
                            {(config.bentoItems || []).map((item, i) => {
                                const totalItems = (config.bentoItems || []).length; const isLastOnOdd = totalItems % 2 !== 0 && i === totalItems - 1;
                                return (<div key={item.title} className={`bento-item ${isLastOnOdd ? 'col-span-2' : ''}`}>
                                    <h3 className="font-bold text-lg text-white mb-2">{item.icon} {item.title}</h3><p className="text-sm opacity-80">{item.text}</p>
                                </div>);
                            })}
                        </div>
                        <button onClick={() => goToStep(4)} className="btn-primary rounded-full px-8 py-3 font-bold mt-6 self-center">Remember this?</button>
                    </div>
                    <div id="step-4" className={cardStyles} style={{ display: currentStep === 4 ? 'flex' : 'none' }}>
                        <h2 className="text-4xl font-display text-gradient text-center">{config.galleryTitle}</h2>
                        <div id="photo-gallery-wrapper" className="w-full relative"><div className="photo-gallery flex gap-8 overflow-x-auto p-4 snap-x snap-mandatory scroll-smooth">{(config.photos || []).map((photo, i) => <figure key={i} className={`polaroid w-64 h-auto flex-shrink-0 snap-center`} style={{transform: `rotate(${(i%2===0? -1:1) * (2+i)}deg)`}}><img src={photo.url} alt={photo.caption} className="w-full h-auto object-cover" /><figcaption className="font-display">{photo.caption}</figcaption></figure>)}</div></div>
                        <p className="text-center italic mt-4">{config.galleryClosing}</p>
                        <button onClick={() => goToStep(5)} className="btn-primary rounded-full px-8 py-3 font-bold mt-4">Some messages for you...</button>
                    </div>
                    <div id="step-5" className={cardStyles} style={{ display: currentStep === 5 ? 'flex' : 'none' }}>
                        <h2 className="text-4xl font-display text-gradient text-center">Some Special Messages</h2>
                        <div className="w-full flex gap-8 overflow-x-auto p-4 snap-x snap-mandatory scroll-smooth">
                            {(config.videos || []).map((video, i) => (
                                <div key={i} className="flex-shrink-0 snap-center w-full max-w-lg">
                                    <VideoPlayer video={video} />
                                    <p className="text-center italic mt-2">{video.caption}</p>
                                </div>
                            ))}
                        </div>
                        <button onClick={() => goToStep(6)} className="btn-primary rounded-full px-8 py-3 font-bold mt-4">A soundtrack for you</button>
                    </div>
                    <div id="step-6" className={cardStyles} style={{ display: currentStep === 6 ? 'flex' : 'none' }}>
                        <h2 className="text-4xl font-display text-gradient text-center">A Soundtrack For You</h2>
                        <div className="w-full max-w-md mx-auto mt-4 space-y-2">
                            {(config.playlist || []).map((song, index) => (
                                <div key={index} className="flex items-center justify-between gap-4 bg-slate-800/50 p-3 rounded-lg">
                                    <div className="flex items-center gap-3"><i className="fas fa-music text-pink-400"></i><span className="text-left">{song.title}</span></div>
                                    <button onClick={() => handlePlaySong(index)} className="w-10 h-10 flex-shrink-0 rounded-full bg-pink-600 hover:bg-pink-700 flex items-center justify-center text-white transition-transform transform hover:scale-110"><i className={`fas ${currentSongIndex === index && isMusicPlaying ? 'fa-pause' : 'fa-play'}`}></i></button>
                                </div>
                            ))}
                        </div>
                        <button onClick={() => goToStep(7)} className="btn-primary rounded-full px-8 py-3 font-bold mt-6 self-center">Read my letter</button>
                    </div>
                   <div id="step-7" className={cardStyles} style={{ display: currentStep === 7 ? 'flex' : 'none' }}>
                      <h2 className="text-4xl font-display text-gradient text-center">A Letter For You</h2>
                      <div className="w-full text-left overflow-y-auto max-h-[50vh] prose prose-invert prose-p:text-slate-300 mt-4 px-4 whitespace-pre-wrap">{config.letter}</div>
                      <button onClick={() => goToStep(8)} className="btn-primary rounded-full px-8 py-3 font-bold mt-6 self-center">One last thing...</button>
                  </div>
                  <div id="step-8" className={cardStyles} style={{ display: currentStep === 8 ? 'flex' : 'none', justifyContent: 'center' }}>
                      <div className="text-7xl">🎂</div>
                      <h1 className="text-5xl font-display text-gradient">My Wish For You</h1>
                      <p>{config.wishMessage}</p>
                      <div className="h-10 mt-4"><h2 className="text-3xl text-gradient font-display">{config.finalMessage}</h2></div>
                      <div className="flex flex-col sm:flex-row gap-4 mt-4">
                        <button onClick={handleCelebration} className="btn-primary rounded-full px-8 py-3 font-bold">🎉 Celebrate! 🎉</button>
                        <button onClick={() => goToStep(9)} className="btn-primary rounded-full px-8 py-3 font-bold">Make a Wish</button>
                      </div>
                  </div>
                  <div id="step-9" className={cardStyles} style={{ display: currentStep === 9 ? 'flex' : 'none', justifyContent: 'center' }}>
                      {!isWishLaunched ? (
                        <div id="wish-list-ui" className="w-full max-w-md mx-auto transition-opacity duration-500">
                          <h2 className="text-4xl font-display text-gradient text-center">One Final Wish...</h2>
                          <p className="text-slate-400 mt-2 mb-4">{config.wishDescription}</p>
                          <div className="flex gap-2"><input type="text" value={newWish} onChange={(e) => setNewWish(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && handleAddWish()} placeholder="What are you wishing for?" className="flex-grow bg-slate-800/50 border border-slate-700 rounded-lg p-3 text-white placeholder-slate-400 focus:ring-2 focus:ring-pink-500"/><button onClick={handleAddWish} className="bg-pink-600 hover:bg-pink-700 text-white font-bold p-3 rounded-lg">+</button></div>
                          <ul className="mt-4 space-y-2 text-left">{wishes.map((wish, index) => (<li key={index} className="flex justify-between items-center bg-slate-800/50 p-3 rounded-lg"><span>{wish}</span><button onClick={() => handleRemoveWish(index)} className="text-red-400 hover:text-red-300">&times;</button></li>))}</ul>
                          {wishes.length > 0 && <button onClick={handleCopyWishes} className="mt-4 bg-slate-700 hover:bg-slate-600 text-white font-bold py-2 px-4 rounded-lg">{copySuccess || 'Copy My Wishes'}</button>}
                          <button onClick={handleLaunchWish} className="w-full btn-primary rounded-full px-8 py-3 font-bold mt-6 self-center">Make a Wish & Launch!</button>
                        </div>
                       ) : (
                        <div className="text-center">
                            <h2 id="launched-wish-text" className="text-4xl font-display text-gradient opacity-0" style={{ transform: 'scale(0.5)' }}>{launchedWishText}</h2>
                            <p id="wish-sent-confirmation" className="mt-4 text-xl opacity-0">Your wish is on its way to the stars...</p>
                        </div>
                       )}
                  </div>
                </div>
            </main>
            <div id="youtube-player-container" className="fixed -z-50 top-[-9999px] left-[-9999px]"><div id="youtube-player"></div></div>
        </div>
    );
};

export default BirthdayWebsite;
