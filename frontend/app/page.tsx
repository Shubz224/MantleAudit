"use client";

import React, { useEffect, useState } from 'react';
import MantleLogo from '@/components/MantleLogo';
import '../css/mantle.css';

export default function MantlePage() {
  const [scrolled, setScrolled] = useState(false);
  const [intro, setIntro] = useState(true);

  useEffect(() => {
    // False loader timer
    const timer = setTimeout(() => {
      setIntro(false);
    }, 2000);

    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };

    window.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
      clearTimeout(timer);
    };
  }, []);

  return (
    <div className="relative min-h-screen w-full bg-black overflow-x-hidden font-sans text-white selection:bg-[#5ac2b5] selection:text-black">
      {/* Animated Background - Darker and Blurs on Scroll */}
      <div className={`mantle-bg-gradient fixed top-0 left-0 w-full h-full z-0 transition-all duration-700 ${scrolled ? 'blur-md opacity-30' : 'opacity-40'}`}></div>
      <div className={`mantle-bg-overlay fixed top-0 left-0 w-full h-full z-[1] pointer-events-none transition-all duration-700 ${scrolled ? 'opacity-30' : 'opacity-20'}`}></div>

      {/* Scroll Vignette / Darkener */}
      <div className={`fixed inset-0 z-[1] bg-black transition-opacity duration-700 pointer-events-none ${scrolled ? 'opacity-40' : 'opacity-0'}`}></div>

      {/* Floating particles */}
      <div className={`particles fixed top-0 left-0 w-full h-full z-[2] pointer-events-none transition-all duration-700 ${scrolled ? 'blur-sm opacity-50' : 'opacity-100'}`}>
        {[...Array(20)].map((_, i) => (
          <div key={i} className="particle absolute w-1 h-1 bg-[#5ac2b5] opacity-0 shadow-[0_0_5px_#5ac2b5]" style={{
            left: `${Math.random() * 100}%`,
            animationName: 'particleFloat',
            animationTimingFunction: 'linear',
            animationIterationCount: 'infinite',
            animationDelay: `${Math.random() * 5}s`,
            animationDuration: `${15 + Math.random() * 10}s`
          }}></div>
        ))}
      </div>

      {/* Logo Logic: Intro Center -> Scroll Corner -> Blur */}
      <div className={`mantle-logo-container fixed z-50 transition-all duration-[1500ms] ease-in-out mix-blend-difference
        ${intro
          ? 'top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] md:w-[500px] md:h-[500px] scale-100'
          : '-top-[250px] -left-[250px] w-[720px] h-[720px] max-md:w-[80px] max-md:h-[80px] max-md:top-4 max-md:left-4 translate-x-0 translate-y-0'
        }
        ${!intro && scrolled ? 'blur-xl scale-90 opacity-40' : ''}
        ${!intro && !scrolled ? 'blur-0 scale-100 opacity-100' : ''}
      `}>
        <div className="w-full h-full animate-[logoRotate_60s_linear_infinite]">
          <MantleLogo />
        </div>
      </div>

      {/* Hero Content - Fades in after Intro */}
      <div className={`relative z-10 min-h-screen flex items-center justify-center p-8 pt-32 md:pt-32 transition-opacity duration-1000 delay-500 ${intro ? 'opacity-0 pointer-events-none' : 'opacity-100 pointer-events-auto'}`}>
        <div className="w-full max-w-[1200px] flex flex-col items-center gap-12 max-md:gap-8">
          {/* Main Heading - Shifts from Right to Center on Scroll */}
          <div className={`relative text-center group transition-transform duration-700 ease-out ${!scrolled ? 'translate-x-[15vw]' : 'translate-x-0'}`}>
            <h1 className="font-['Tektur',_monospace] text-[clamp(2.5rem,10vw,8rem)] font-black uppercase tracking-wider leading-none text-white drop-shadow-[0_4px_0_#001a0d] relative">
              <span className="relative inline-block hover:animate-pulse hover:text-[#5ac2b5] transition-colors duration-300">
                Black
                {/* Glitch Effect Layers */}
                <span className="absolute top-0 left-0 -ml-[2px] text-[#5ac2b5] opacity-0 group-hover:opacity-70 animate-[glitch_0.3s_infinite] mix-blend-screen" aria-hidden="true">Black</span>
                <span className="absolute top-0 left-0 ml-[2px] text-[#ff0055] opacity-0 group-hover:opacity-70 animate-[glitch_0.3s_infinite_reverse] mix-blend-screen" aria-hidden="true">Black</span>
              </span>
              <span className="bg-gradient-to-b from-[#5ac2b5] to-[#4eb3a6] bg-clip-text text-transparent drop-shadow-[0_0_20px_rgba(90,194,181,0.3)]">Box</span>
            </h1>
            {/* Reduced glow effect */}
            <div className="absolute inset-0 blur-[80px] bg-[#4eb3a6]/5 -z-10 rounded-full dark-glow"></div>
          </div>

          {/* Subtitle */}
          <p className="font-['Orbitron',_sans-serif] text-[clamp(1rem,3vw,1.8rem)] font-medium text-[#5ac2b5] text-center tracking-[0.1em] uppercase opacity-0 animate-[fadeInUp_1s_ease-out_0.3s_forwards]">
            The Institutional Privacy Layer for Mantle v2
          </p>

          {/* Description */}
          <div className="relative backdrop-blur-xl bg-[#000502]/60 border border-[#4eb3a6]/10 p-10 max-w-[900px] shadow-2xl rounded-sm opacity-0 animate-[fadeInUp_1s_ease-out_0.6s_forwards] hover:border-[#5ac2b5]/30 hover:shadow-[0_0_80px_rgba(90,194,181,0.05)] transition-all duration-500 group overflow-hidden">
            {/* Tech scanline */}
            <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-[#5ac2b5] to-transparent -translate-x-full group-hover:animate-[scanline_2s_linear_infinite]"></div>

            <p className="text-[clamp(1rem,2vw,1.25rem)] leading-relaxed text-gray-300 text-center m-0 relative z-10">
              The first <span className="text-[#5ac2b5] font-semibold drop-shadow-[0_0_8px_rgba(90,194,181,0.2)]">Zero-Knowledge Compliance Bridge</span> that solves the "Transparency Paradox" in institutional DeFi.
              We enable hedge funds and institutions to execute <span className="text-[#5ac2b5] font-semibold drop-shadow-[0_0_8px_rgba(90,194,181,0.2)]">Dark Pool-style strategies</span> on public liquidity
              without leaking alpha, while remaining fully compliant with global AML regulations.
            </p>
            {/* Corner Markers */}
            <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-[#5ac2b5]/50"></div>
            <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-[#5ac2b5]/50"></div>
          </div>


          {/* CTA Button */}
          <a href="/dashboard" className=" opacity-0 animate-[fadeInUp_1s_ease-out_1.9s_forwards]">
            <button className="group relative bg-transparent border border-[#5ac2b5] text-[#5ac2b5] font-['Orbitron',_sans-serif] text-xl font-bold py-6 px-16 cursor-pointer flex items-center gap-4 uppercase tracking-[0.2em] transition-all duration-300 overflow-hidden hover:bg-[#5ac2b5]/10">
              <span className="absolute top-0 left-0 w-[2px] h-full bg-[#5ac2b5] animate-[heightGlitch_2s_infinite]"></span>
              <span className="absolute top-0 right-0 w-[2px] h-full bg-[#5ac2b5] animate-[heightGlitch_2s_infinite_reverse]"></span>

              <span className="relative z-10 group-hover:text-white transition-colors duration-300">Enter the Vault</span>
              <span className="relative z-10 text-2xl transition-transform duration-300 group-hover:translate-x-2 group-hover:text-white">→</span>

              {/* Button bg fill effect */}
              <span className="absolute inset-0 bg-[#5ac2b5] transform scale-x-0 origin-left transition-transform duration-300 group-hover:scale-x-100 mix-blend-difference"></span>
            </button>
          </a>

          {/* Value Propositions */}
          {/* <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full max-w-[1100px] mt-4">
            {/* Feature 1 */}
          {/* <div className="backdrop-blur-xl bg-[#000502]/60 border border-[#4eb3a6]/10 p-8 flex flex-col items-center text-center gap-4 transition-all duration-300 opacity-0 animate-[fadeInUp_1s_ease-out_0.9s_forwards] hover:-translate-y-2 hover:border-[#5ac2b5]/40 hover:shadow-[0_10px_30px_rgba(90,194,181,0.1)] group">
              <div className="text-5xl drop-shadow-[0_0_15px_rgba(90,194,181,0.2)] animate-[iconFloat_3s_ease-in-out_infinite] grayscale group-hover:grayscale-0 transition-all duration-500">🛡︎</div>
              <h3 className="font-['Orbitron',_sans-serif] text-2xl font-bold text-white tracking-wide uppercase group-hover:text-[#5ac2b5] transition-colors">Stop Alpha Leakage</h3>
              <p className="text-base leading-relaxed text-gray-400">
                Execute strategies without revealing your positions to front-runners
              </p>
            </div> */}

          {/* Feature 2 */}
          {/* <div className="backdrop-blur-xl bg-[#000502]/60 border border-[#4eb3a6]/10 p-8 flex flex-col items-center text-center gap-4 transition-all duration-300 opacity-0 animate-[fadeInUp_1s_ease-out_1.1s_forwards] hover:-translate-y-2 hover:border-[#5ac2b5]/40 hover:shadow-[0_10px_30px_rgba(90,194,181,0.1)] group">
              <div className="text-5xl drop-shadow-[0_0_15px_rgba(90,194,181,0.2)] animate-[iconFloat_3s_ease-in-out_infinite] grayscale group-hover:grayscale-0 transition-all duration-500">✓</div>
              <h3 className="font-['Orbitron',_sans-serif] text-2xl font-bold text-white tracking-wide uppercase group-hover:text-[#5ac2b5] transition-colors">Trustless Compliance</h3>
              <p className="text-base leading-relaxed text-gray-400">
                Zero-knowledge proofs ensure regulatory compliance without compromising privacy
              </p>
            </div> */}

          {/* Feature 3 */}
          {/* <div className="backdrop-blur-xl bg-[#000502]/60 border border-[#4eb3a6]/10 p-8 flex flex-col items-center text-center gap-4 transition-all duration-300 opacity-0 animate-[fadeInUp_1s_ease-out_1.3s_forwards] hover:-translate-y-2 hover:border-[#5ac2b5]/40 hover:shadow-[0_10px_30px_rgba(90,194,181,0.1)] group">
              <div className="text-5xl drop-shadow-[0_0_15px_rgba(90,194,181,0.2)] animate-[iconFloat_3s_ease-in-out_infinite] grayscale group-hover:grayscale-0 transition-all duration-500">⚡</div>
              <h3 className="font-['Orbitron',_sans-serif] text-2xl font-bold text-white tracking-wide uppercase group-hover:text-[#5ac2b5] transition-colors">Mantle-Native Economics</h3>
              <p className="text-base leading-relaxed text-gray-400">
                Built specifically for Mantle v2's institutional-grade infrastructure
              </p>
            </div> */}
          {/* </div>  */}

          {/* Value Proposition Quote */}
          <div className="relative backdrop-blur-xl bg-gradient-to-br from-[#000502]/80 to-[#001a1a]/80 border-y border-[#4eb3a6]/20 p-12 w-full shadow-2xl overflow-hidden opacity-0 animate-[fadeInUp_1s_ease-out_1.6s_forwards] ">
            <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-[#5ac2b5] to-transparent animate-[shimmer_3s_ease-in-out_infinite] opacity-30"></div>
            <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-[#5ac2b5] to-transparent animate-[shimmer_3s_ease-in-out_infinite] opacity-30 animation-delay-1500"></div>
            <blockquote className="font-sans text-[clamp(1.1rem,2.5vw,1.5rem)] leading-relaxed text-gray-300 font-light italic text-center tracking-wide">
              "Privacy is not about hiding crimes; it's about <span className="text-white font-normal underline decoration-[#5ac2b5]/50 underline-offset-4 decoration-1">protecting value</span>.
              BlackBox gives you the stealth of a private chain with the liquidity of a public one."
            </blockquote>
          </div>
        </div>
      </div>
    </div>
  );
}
