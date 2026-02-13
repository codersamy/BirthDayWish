
import React, { useEffect, useRef, useState } from 'react';
import { BirthdayConfig } from '../types';
import * as THREE from 'three';
import gsap from 'gsap';
import confetti from 'canvas-confetti';

declare global {
    interface Window { YT: any; onYouTubeIframeAPIReady: () => void; }
}

interface BirthdayWebsiteProps {
    config: BirthdayConfig;
    onStartOver: () => void;
}

const BirthdayWebsite: React.FC<BirthdayWebsiteProps> = ({ config, onStartOver }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const objectsRef = useRef<THREE.Mesh[]>([]);
    const animationFrameId = useRef<number | null>(null);
    
    const [currentStep, setCurrentStep] = useState(1);
    const [isMusicPlaying, setIsMusicPlaying] = useState(false);
    const [isPlayerReady, setIsPlayerReady] = useState(false);
    const playerRef = useRef<any>(null);

    const TOTAL_STEPS = 6;

    useEffect(() => {
        // Initialize YT Player
        const initPlayer = () => {
            if (playerRef.current) playerRef.current.destroy();
            playerRef.current = new window.YT.Player('youtube-player', {
                height: '0', width: '0', videoId: config.youtubeId,
                playerVars: { autoplay: 0, controls: 0, loop: 1, playlist: config.youtubeId },
                events: { 
                    'onReady': (event: any) => {
                        event.target.setVolume(30);
                        setIsPlayerReady(true);
                    }
                }
            });
        };

        if (window.YT?.Player) {
            initPlayer();
        } else {
            window.onYouTubeIframeAPIReady = initPlayer;
        }

        // Initialize 3D Scene
        const canvas = canvasRef.current;
        if (!canvas) return;
        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        camera.position.z = 5;
        const renderer = new THREE.WebGLRenderer({ canvas, alpha: true });
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        scene.add(new THREE.AmbientLight(0xffffff, 1.5));
        const dirLight = new THREE.DirectionalLight(0xffffff, 2);
        dirLight.position.set(5, 5, 5);
        scene.add(dirLight);
        const heartShape = new THREE.Shape().moveTo(25, 25).bezierCurveTo(25, 25, 20, 0, 0, 0).bezierCurveTo(-30, 0, -30, 35, -30, 35).bezierCurveTo(-30, 55, -10, 77, 25, 95).bezierCurveTo(60, 77, 80, 55, 80, 35).bezierCurveTo(80, 35, 80, 0, 50, 0).bezierCurveTo(35, 0, 25, 25, 25, 25);
        const heartGeom = new THREE.ExtrudeGeometry(heartShape, { depth: 8, bevelEnabled: true, bevelSegments: 2, steps: 2, bevelSize: 1, bevelThickness: 1 }).scale(0.02, 0.02, 0.02).center();
        const heartMaterial = new THREE.MeshStandardMaterial({ color: 0xec4899, roughness: 0.3, metalness: 0.6, transparent: true });
        objectsRef.current = [];
        for (let i = 0; i < 25; i++) {
            const mesh = new THREE.Mesh(heartGeom, heartMaterial.clone());
            const x = (Math.random() - 0.5) * 20;
            const y = (Math.random() - 0.5) * 20;
            const z = (Math.random() - 0.5) * 10;
            mesh.position.set(x, y, z);
            mesh.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
            mesh.scale.setScalar(Math.random() * 0.5 + 0.3);
            mesh.userData = { 
                sinOffset: Math.random() * Math.PI * 2, 
                speed: Math.random() * 0.3 + 0.1,
                initialPosition: new THREE.Vector3(x, y, z) 
            };
            scene.add(mesh);
            objectsRef.current.push(mesh);
        }
        const animate = () => {
            animationFrameId.current = requestAnimationFrame(animate);
            const time = Date.now() * 0.0005;
            objectsRef.current.forEach(obj => {
                obj.rotation.y += Math.sin(time * obj.userData.speed + obj.userData.sinOffset) * 0.01;
            });
            renderer.render(scene, camera);
        };
        animate();
        const handleResize = () => {
            camera.aspect = window.innerWidth / window.innerHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(window.innerWidth, window.innerHeight);
        };
        window.addEventListener('resize', handleResize);
        gsap.from('#step-1', { opacity: 0, scale: 1.1, duration: 1, ease: 'power3.out', delay: 0.5 });
        return () => {
            window.removeEventListener('resize', handleResize);
            if (animationFrameId.current) cancelAnimationFrame(animationFrameId.current);
            playerRef.current?.destroy();
        };
    }, [config.youtubeId]);
    
    const toggleMusic = () => {
        if (!isPlayerReady || !playerRef.current || typeof playerRef.current.getPlayerState !== 'function') return;
        const playerState = playerRef.current.getPlayerState();
        if (playerState === 1) { // playing
            playerRef.current.pauseVideo();
            setIsMusicPlaying(false);
        } else {
            playerRef.current.playVideo();
            setIsMusicPlaying(true);
        }
    };
    
    const handleBegin = () => {
        if (isPlayerReady && playerRef.current?.playVideo) {
            playerRef.current.playVideo();
            setIsMusicPlaying(true);
        }
        goToStep(2);
    }

    const goToStep = (stepNumber: number) => {
        const currentStepEl = document.getElementById(`step-${currentStep}`);
        const nextStepEl = document.getElementById(`step-${stepNumber}`);
        if (!currentStepEl || !nextStepEl || currentStep === stepNumber) return;
        
        gsap.timeline()
          .to(currentStepEl, { opacity: 0, scale: 0.9, duration: 0.4, ease: 'power3.in', onComplete: () => currentStepEl.style.display = 'none' })
          .set(nextStepEl, { opacity: 0, scale: 1.1, display: 'flex' })
          .to(nextStepEl, { opacity: 1, scale: 1, duration: 0.6, ease: 'power3.out' }, ">-0.2");
        setCurrentStep(stepNumber);
    };

    const handleGoHome = () => {
        // Always reset the celebration state when going home
        objectsRef.current.forEach(obj => {
            gsap.killTweensOf(obj.position);
            gsap.killTweensOf(obj.material);
            gsap.to(obj.position, {
                x: obj.userData.initialPosition.x,
                y: obj.userData.initialPosition.y,
                z: obj.userData.initialPosition.z,
                duration: 1,
                ease: 'power2.out'
            });
            gsap.to(obj.material as THREE.MeshStandardMaterial, { opacity: 1, duration: 1 });
        });
        
        goToStep(1);
    };
    
    const handleCelebration = () => {
        // Kill any ongoing animations to prevent conflicts
        gsap.killTweensOf(objectsRef.current.map(o => o.position));
        gsap.killTweensOf(objectsRef.current.map(o => o.material));

        // Reset positions and opacity first
        objectsRef.current.forEach(obj => {
            obj.position.copy(obj.userData.initialPosition);
            (obj.material as THREE.MeshStandardMaterial).opacity = 1;
        });

        // Trigger confetti
        const duration = 5 * 1000, end = Date.now() + duration;
        (function frame() {
            confetti({ particleCount: 2, angle: 60, spread: 55, origin: { x: 0 }, colors: ['#ec4899', '#f87171', '#a78bfa', '#ffffff'] });
            confetti({ particleCount: 2, angle: 120, spread: 55, origin: { x: 1 }, colors: ['#ec4899', '#f87171', '#a78bfa', '#ffffff'] });
            if (Date.now() < end) requestAnimationFrame(frame);
        }());
        
        // Animate hearts away
        objectsRef.current.forEach(obj => {
            gsap.to(obj.position, { y: obj.position.y + (Math.random() > 0.5 ? 15 : -15), x: obj.position.x + (Math.random() > 0.5 ? 15 : -15), z: 10, duration: 5, ease: 'power2.in' });
            gsap.to(obj.material as THREE.MeshStandardMaterial, { opacity: 0, duration: 5, ease: 'power2.in' });
        });
    };
    
    useEffect(() => {
        const galleryWrapper = document.getElementById('photo-gallery-wrapper');
        const gallery = galleryWrapper?.querySelector('.photo-gallery');
        const polaroids = galleryWrapper?.querySelectorAll('.polaroid');
        if (!galleryWrapper || !gallery || !polaroids) return;

        const onMove = (e: MouseEvent) => {
            const rect = galleryWrapper.getBoundingClientRect();
            const x = e.clientX - rect.left, y = e.clientY - rect.top;
            gsap.to(polaroids, { rotateX: gsap.utils.mapRange(0, rect.height, 10, -10, y), rotateY: gsap.utils.mapRange(0, rect.width, -10, 10, x), duration: 0.5, ease: 'power1.out' });
        };
        const onLeave = () => gsap.to(polaroids, { rotateX: 0, rotateY: 0, duration: 0.5, ease: 'power1.out' });
        
        const onWheel = (e: WheelEvent) => {
            if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) return; // prioritize native horizontal scroll
            e.preventDefault();
            gallery.scrollLeft += e.deltaY;
        };

        galleryWrapper.addEventListener('mousemove', onMove);
        galleryWrapper.addEventListener('mouseleave', onLeave);
        gallery.addEventListener('wheel', onWheel, { passive: false });
        return () => {
            galleryWrapper.removeEventListener('mousemove', onMove);
            galleryWrapper.removeEventListener('mouseleave', onLeave);
            gallery.removeEventListener('wheel', onWheel);
        };
    }, [currentStep]);

    const cardStyles = "step absolute inset-0 m-auto w-full card p-6 md:p-8 flex flex-col items-center justify-start gap-4 text-center max-h-[90vh] overflow-y-auto pt-20 pb-8";

    return (
        <div className="w-full h-screen overflow-hidden">
            <div id="aurora-bg"><div className="aurora-blur aurora-1 top-[10%] left-[15%]"></div><div className="aurora-blur aurora-2 top-[60%] left-[30%]"></div><div className="aurora-blur aurora-3 top-[40%] left-[70%]"></div><div className="aurora-blur aurora-4 top-[80%] left-[5%]"></div></div>
            <canvas ref={canvasRef} id="three-canvas" className="fixed top-0 left-0 w-full h-full -z-10"></canvas>
            <main className="relative z-10 w-full h-screen flex flex-col items-center justify-center p-4">
                <div className="fixed top-5 w-11/12 max-w-md h-2.5 rounded-full p-0.5 bg-slate-900/30 backdrop-blur-sm"><div className="h-1.5 rounded-full bg-gradient-to-r from-pink-500 to-red-500 transition-all duration-500" style={{ width: `${((currentStep - 1) / (TOTAL_STEPS - 1)) * 100}%` }}></div></div>
                <div className="fixed top-12 left-5 z-20 flex gap-2">
                    <button onClick={handleGoHome} title="Home" className="w-12 h-12 rounded-full flex items-center justify-center text-white bg-slate-800/70 backdrop-blur-sm border border-slate-600 hover:bg-slate-700/70 transition-colors">
                        <i className="fas fa-home"></i>
                    </button>
                    <button onClick={onStartOver} title="Create Another Wish" className="w-12 h-12 rounded-full flex items-center justify-center text-white bg-slate-800/70 backdrop-blur-sm border border-slate-600 hover:bg-slate-700/70 transition-colors">
                        <i className="fas fa-plus"></i>
                    </button>
                </div>
                <button onClick={toggleMusic} className="fixed top-12 right-5 z-20 w-10 h-10 rounded-full flex items-center justify-center text-pink-300 bg-slate-900/30 backdrop-blur-sm hover:bg-slate-900/50 transition-colors">{isMusicPlaying ? '❚❚' : '▶'}</button>
                <div className="relative w-full max-w-2xl h-full flex items-center justify-center">
                    <div id="step-1" className={`${cardStyles} gap-6 pb-12`} style={{ display: currentStep === 1 ? 'flex' : 'none', justifyContent: 'center' }}><div className="text-7xl animate-pulse">❤️</div><h1 className="text-5xl font-display text-gradient">Hey {config.recipientName},</h1><p>{config.welcomeMessage}</p><button onClick={handleBegin} className="btn-primary rounded-full px-8 py-3 font-bold mt-4">Let's Begin</button></div>
                    <div id="step-2" className={cardStyles} style={{ display: currentStep === 2 ? 'flex' : 'none', justifyContent: 'center' }}><div className="text-7xl">🎉</div><h1 className="text-5xl font-display text-gradient">Happy Birthday!</h1><p>{config.birthdayMessage}</p><button onClick={() => goToStep(3)} className="btn-primary rounded-full px-8 py-3 font-bold mt-4">There's more...</button></div>
                    <div id="step-3" className={cardStyles} style={{ display: currentStep === 3 ? 'flex' : 'none' }}>
                       <h2 className="text-4xl font-display text-gradient text-center">A Few Things I Adore About You</h2>
                       <div className="bento-grid w-full mt-4">
                         {config.bentoItems.map((item, i) => {
                            const totalItems = config.bentoItems.length;
                            const isLastOnOdd = totalItems % 2 !== 0 && i === totalItems - 1;
                            return (<div key={item.title} className={`bento-item ${isLastOnOdd ? 'col-span-2' : ''}`}>
                               <h3 className="font-bold text-lg text-white mb-2">{item.icon} {item.title}</h3>
                               <p className="text-sm opacity-80">{item.text}</p>
                            </div>);
                         })}
                       </div>
                       <button onClick={() => goToStep(4)} className="btn-primary rounded-full px-8 py-3 font-bold mt-6 self-center">Remember this?</button>
                    </div>
                    <div id="step-4" className={cardStyles} style={{ display: currentStep === 4 ? 'flex' : 'none' }}>
                        <h2 className="text-4xl font-display text-gradient text-center">{config.galleryTitle}</h2>
                        <div id="photo-gallery-wrapper" className="w-full relative"><div className="photo-gallery flex gap-8 overflow-x-auto p-4 snap-x snap-mandatory scroll-smooth">{config.photos.map((photo, i) => <figure key={i} className={`polaroid w-64 h-auto flex-shrink-0 snap-center`} style={{transform: `rotate(${(i%2===0? -1:1) * (2+i)}deg)`}}><img src={photo.url} alt={photo.caption} className="w-full h-auto object-cover" /><figcaption>{photo.caption}</figcaption></figure>)}</div></div>
                        <p className="text-center italic mt-4">{config.galleryClosing}</p>
                        <button onClick={() => goToStep(5)} className="btn-primary rounded-full px-8 py-3 font-bold mt-4">Read my letter to you</button>
                    </div>
                    <div id="step-5" className={cardStyles} style={{ display: currentStep === 5 ? 'flex' : 'none' }}>
                        <h2 className="text-4xl font-display text-gradient text-center">A Letter For You</h2>
                        <div className="w-full text-left overflow-y-auto max-h-[50vh] prose prose-invert prose-p:text-slate-300 mt-4 px-4 whitespace-pre-wrap">
                            {config.letter}
                        </div>
                        <button onClick={() => goToStep(6)} className="btn-primary rounded-full px-8 py-3 font-bold mt-6 self-center">One last thing...</button>
                    </div>
                    <div id="step-6" className={cardStyles} style={{ display: currentStep === 6 ? 'flex' : 'none', justifyContent: 'center' }}>
                        <div className="text-7xl">🎂</div>
                        <h1 className="text-5xl font-display text-gradient">My Wish For You</h1>
                        <p>{config.wishMessage}</p>
                        <div className="h-10 mt-4">
                           <h2 className="text-3xl text-gradient font-display">{config.finalMessage}</h2>
                        </div>
                        <button id="celebrate-btn" onClick={handleCelebration} className="btn-primary rounded-full px-8 py-3 font-bold">Celebrate!</button>
                    </div>
                </div>
            </main>
            <div id="youtube-player-container" className="fixed -z-50 top-[-9999px] left-[-9999px]"><div id="youtube-player"></div></div>
        </div>
    );
};

export default BirthdayWebsite;
