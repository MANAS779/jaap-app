  import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';

  // ==================== GLOBAL STYLES (animations, pseudo-selectors) ====================
  const GlobalStyles = () => (
    <style>{`
      @import url('https://fonts.googleapis.com/css2?family=Tiro+Devanagari+Sanskrit&display=swap');
      *, *::before, *::after { box-sizing: border-box; }

      @keyframes cellPulse {
        0%, 100% { box-shadow: 0 0 0 3px rgba(251,192,45,0.55), 0 4px 22px rgba(251,192,45,0.2); }
        50%       { box-shadow: 0 0 0 7px rgba(251,192,45,0.15), 0 4px 32px rgba(251,192,45,0.55); }
      }
      @keyframes screenIn {
        from { opacity: 0; transform: scale(0.97) translateY(6px); }
        to   { opacity: 1; transform: scale(1)    translateY(0); }
      }
      @keyframes letterPop {
        0%   { transform: scale(1); }
        40%  { transform: scale(1.25); }
        100% { transform: scale(1); }
      }

      .current-cell  { animation: cellPulse 2s ease-in-out infinite; }
      .jaap-screen   { animation: screenIn  0.28s ease forwards; }
      .letter-pop    { animation: letterPop 0.22s ease; }

      .jaap-btn:active {
        transform: scale(0.90) translateY(5px) !important;
        box-shadow: 0 1px 0 #9A7A00 !important;
        transition: transform 0.05s ease, box-shadow 0.05s ease !important;
      }
      .home-btn:active {
        transform: translateY(5px) !important;
        box-shadow: 0 1px 0 #9A7A00 !important;
        transition: transform 0.05s ease, box-shadow 0.05s ease !important;
      }
      ::-webkit-scrollbar { width: 0; background: transparent; }

      @keyframes sheetUp {
        from { transform: translateY(100%); }
        to   { transform: translateY(0); }
      }
      @keyframes backdropIn {
        from { opacity: 0; }
        to   { opacity: 1; }
      }

      /* ---- Focus mode overrides ---- */
      /* Kill entrance + pulse animations */
      .focus-mode.jaap-screen { animation: none !important; }
      .focus-mode .current-cell { animation: none !important; }

      /* Breathing guide — slow 8s cycle (4s inhale, 4s exhale) */
      @keyframes breatheScale {
        0%, 100% { transform: scale(0.6); opacity: 0.35; }
        50%      { transform: scale(1);   opacity: 0.8;  }
      }
      @keyframes breatheText {
        0%, 48%  { opacity: 1; }
        49%, 51% { opacity: 0; }
        52%, 100%{ opacity: 1; }
      }

      /* Flat tap — buttons */
      .focus-mode .jaap-btn:active {
        transform: none !important;
        box-shadow: none !important;
        opacity: 0.45 !important;
        transition: opacity 0.08s ease !important;
      }
      .focus-mode .home-btn:active {
        transform: none !important;
        box-shadow: none !important;
        opacity: 0.5 !important;
        transition: opacity 0.08s ease !important;
      }

      /* ---- Doodle mode overrides ---- */
      @keyframes inkGlow {
        0%, 100% { box-shadow: 0 0 0 3px rgba(141,110,99,0.45), 0 3px 12px rgba(200,169,110,0.2); }
        50%       { box-shadow: 0 0 0 6px rgba(141,110,99,0.15), 0 3px 18px rgba(200,169,110,0.45); }
      }
      .doodle-mode .current-cell { animation: inkGlow 2s ease-in-out infinite !important; }
      .doodle-mode .jaap-btn:active {
        transform: scale(0.93) translateY(3px) !important;
        box-shadow: 0 1px 0 #5D4037 !important;
        transition: transform 0.05s ease, box-shadow 0.05s ease !important;
      }
      .doodle-mode .home-btn:active {
        transform: translateY(3px) !important;
        box-shadow: 0 1px 0 #5D4037 !important;
        transition: transform 0.05s ease, box-shadow 0.05s ease !important;
      }

      /* ---- Voice mode overrides ---- */
      @keyframes dawnGlow {
        0%, 100% { box-shadow: 0 0 0 3px rgba(76,175,80,0.45), 0 3px 14px rgba(255,193,7,0.2); }
        50%       { box-shadow: 0 0 0 7px rgba(76,175,80,0.15), 0 3px 22px rgba(255,193,7,0.5); }
      }
      .voice-mode .current-cell { animation: dawnGlow 2.5s ease-in-out infinite !important; }
      .voice-mode .jaap-btn:active {
        transform: scale(0.93) translateY(3px) !important;
        box-shadow: 0 1px 0 #2E7D32 !important;
        transition: transform 0.05s ease, box-shadow 0.05s ease !important;
      }
      .voice-mode .home-btn:active {
        transform: translateY(3px) !important;
        box-shadow: 0 1px 0 #2E7D32 !important;
        transition: transform 0.05s ease, box-shadow 0.05s ease !important;
      }

      /* ---- Voice mode mic pulse ---- */
      @keyframes micPulse {
        0%, 100% { box-shadow: 0 0 0 0 rgba(46,125,50,0.55), 0 4px 16px rgba(46,125,50,0.4); }
        50%       { box-shadow: 0 0 0 16px rgba(46,125,50,0), 0 4px 24px rgba(46,125,50,0.55); }
      }
      .mic-listening { animation: micPulse 1.2s ease-in-out infinite; }

      /* ---- Completion celebration ---- */
      @keyframes confettiFall {
        0%   { transform: translateY(-10vh) rotate(0deg); opacity: 1; }
        100% { transform: translateY(110vh) rotate(720deg); opacity: 0; }
      }
      @keyframes celebratePop {
        0%   { transform: scale(0.3); opacity: 0; }
        60%  { transform: scale(1.12); opacity: 1; }
        100% { transform: scale(1); opacity: 1; }
      }
      @keyframes shimmer {
        0%, 100% { opacity: 0.7; }
        50%      { opacity: 1; }
      }
    `}</style>
  );

  // Desktop detection hook — shows keyboard hints only on devices with hover + fine pointer
  const useIsDesktop = () => {
    const [isDesktop, setIsDesktop] = useState(() =>
      typeof window !== 'undefined' && window.matchMedia('(hover: hover) and (pointer: fine)').matches
    );
    useEffect(() => {
      const mq = window.matchMedia('(hover: hover) and (pointer: fine)');
      const handler = (e) => setIsDesktop(e.matches);
      mq.addEventListener('change', handler);
      return () => mq.removeEventListener('change', handler);
    }, []);
    return isDesktop;
  };

  // Keyboard hint badge (only rendered on desktop)
  const KbdHint = ({ label }) => (
    <span style={{
      position: 'absolute', top: '-6px', right: '-6px',
      background: 'rgba(0,0,0,0.55)', color: '#FFF', fontSize: '9px', fontWeight: '700',
      padding: '2px 5px', borderRadius: '6px', lineHeight: 1, letterSpacing: '0.3px',
      pointerEvents: 'none', fontFamily: 'system-ui, sans-serif',
    }}>{label}</span>
  );

  const ProgressBar = ({ current, total, focusMode, doodleMode, voiceMode }) => {
    const trackBg = focusMode ? '#1E1E1E' : voiceMode ? 'rgba(76,175,80,0.12)' : doodleMode ? 'rgba(141,110,99,0.12)' : 'rgba(0,0,0,0.08)';
    const fillBg  = focusMode ? '#333' : voiceMode ? 'linear-gradient(90deg, #66BB6A, #FDD835)' : doodleMode ? 'linear-gradient(90deg, #8D6E63, #D4A96A)' : 'linear-gradient(90deg, #E65100, #FBC02D)';
    return (
      <div style={{ height: '3px', background: trackBg, flexShrink: 0 }}>
        <div style={{
          height: '100%',
          width: `${(current / total) * 100}%`,
          background: fillBg,
          transition: 'width 0.5s cubic-bezier(0.4,0,0.2,1)',
          borderRadius: '0 2px 2px 0'
        }} />
      </div>
    );
  };

  const DEFAULT_IMAGE = "default.jpg";

  // ==================== AUDIO FEEDBACK (Web Audio API) ====================
  let _audioCtx = null;
  let _soundMuted = false; // controlled by App via setSoundMuted
  let _focusMuted = false; // when focus/dark mode is active, suppress chimes
  const setSoundMuted = (val) => { _soundMuted = val; };
  const setFocusMuted = (val) => { _focusMuted = val; };
  const getAudioCtx = () => {
    if (!_audioCtx) _audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    return _audioCtx;
  };

  const playChime = (isMilestone) => {
    if (_soundMuted || _focusMuted) return;
    try {
      const ctx = getAudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain); gain.connect(ctx.destination);
      if (isMilestone) {
        // Deeper, richer tone for milestones (27, 54, 81, 108)
        osc.type = 'sine'; osc.frequency.value = 440;
        osc.frequency.exponentialRampToValueAtTime(330, ctx.currentTime + 0.3);
        gain.gain.setValueAtTime(0.25, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.8);
        osc.start(ctx.currentTime); osc.stop(ctx.currentTime + 0.8);
      } else {
        // Light bell tap for regular cell completion
        osc.type = 'sine'; osc.frequency.value = 880;
        gain.gain.setValueAtTime(0.12, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);
        osc.start(ctx.currentTime); osc.stop(ctx.currentTime + 0.25);
      }
    } catch (e) { /* audio not available */ }
  };

  const cellFeedback = (cellIndex) => {
    const isMilestone = (cellIndex + 1) % 27 === 0;
    playChime(isMilestone);
    if (window.navigator.vibrate) {
      // In focus mode: only very subtle single-pulse haptic (no patterns)
      window.navigator.vibrate(_focusMuted ? 6 : isMilestone ? [30, 20, 30, 20, 50] : 12);
    }
  };

  // ==================== MILESTONE MARKERS ====================
  const MILESTONES = { 26: '¼', 53: '½', 80: '¾' }; // 0-indexed: cell 27=index 26, etc.
  const MilestoneBadge = ({ cellIdx }) => {
    const label = MILESTONES[cellIdx];
    if (!label) return null;
    return (
      <span style={{
        position: 'absolute', top: '-2px', right: '-2px', zIndex: 2,
        background: 'linear-gradient(135deg, #FF9800, #F57C00)', color: '#FFF',
        fontSize: '9px', fontWeight: 'bold', borderRadius: '6px',
        padding: '1px 5px', lineHeight: '14px',
        boxShadow: '0 1px 4px rgba(0,0,0,0.2)',
      }}>{label}</span>
    );
  };

  // ==================== BREATHING GUIDE (Focus Mode only) ====================
  const BreathingGuide = () => {
    const [phase, setPhase] = useState('in'); // 'in' or 'out'
    useEffect(() => {
      const id = setInterval(() => setPhase(p => p === 'in' ? 'out' : 'in'), 4000);
      return () => clearInterval(id);
    }, []);
    return (
      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        justifyContent: 'center', padding: '10px 0 6px', gap: '8px',
      }}>
        <div style={{
          width: '44px', height: '44px', borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(255,255,255,0.12) 0%, rgba(255,255,255,0.03) 70%)',
          border: '1px solid rgba(255,255,255,0.08)',
          animation: 'breatheScale 8s ease-in-out infinite',
        }} />
        <span style={{
          fontSize: '11px', color: '#555', letterSpacing: '2px', fontWeight: '300',
          animation: 'breatheText 8s ease-in-out infinite',
        }}>{phase === 'in' ? 'श्वास लें' : 'छोड़ें'}</span>
      </div>
    );
  };

  // ==================== SWIPE-TO-GO-BACK ====================
  const useSwipeBack = (onBack) => {
    const touchRef = useRef({ startX: 0, startY: 0, started: false });
    const indicatorRef = useRef(null);

    const onTouchStart = useCallback((e) => {
      const t = e.touches[0];
      if (t.clientX < 30) { // only from left edge
        touchRef.current = { startX: t.clientX, startY: t.clientY, started: true };
      }
    }, []);

    const onTouchMove = useCallback((e) => {
      if (!touchRef.current.started) return;
      const dx = e.touches[0].clientX - touchRef.current.startX;
      const dy = Math.abs(e.touches[0].clientY - touchRef.current.startY);
      if (dy > 80) { touchRef.current.started = false; return; }
      if (indicatorRef.current) {
        const progress = Math.min(dx / 120, 1);
        indicatorRef.current.style.opacity = progress * 0.8;
        indicatorRef.current.style.transform = `translateX(${Math.min(dx * 0.4, 48)}px)`;
      }
    }, []);

    const onTouchEnd = useCallback((e) => {
      if (!touchRef.current.started) return;
      const dx = e.changedTouches[0].clientX - touchRef.current.startX;
      touchRef.current.started = false;
      if (indicatorRef.current) {
        indicatorRef.current.style.opacity = 0;
        indicatorRef.current.style.transform = 'translateX(0)';
      }
      if (dx > 100) onBack();
    }, [onBack]);

    const SwipeIndicator = useMemo(() => (
      <div ref={indicatorRef} style={{
        position: 'fixed', left: 0, top: '50%', transform: 'translateX(0)',
        width: '36px', height: '36px', borderRadius: '50%',
        background: 'rgba(0,0,0,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: '#FFF', fontSize: '18px', fontWeight: 'bold',
        opacity: 0, transition: 'opacity 0.15s, transform 0.15s',
        pointerEvents: 'none', zIndex: 9998,
      }}>‹</div>
    ), []);

    return { onTouchStart, onTouchMove, onTouchEnd, SwipeIndicator };
  };

  // ==================== SETTINGS SHEET ====================
  const SettingsSheet = ({ open, onClose, focusMode, onFocusModeChange, doodleMode, onDoodleModeChange, voiceMode, onVoiceModeChange, customImage, onImageChange, soundMuted, onSoundMutedChange }) => {
    const [imgDraft, setImgDraft] = useState(customImage);
    const [showImgInput, setShowImgInput] = useState(false);
    const fileInputRef = useRef(null);

    const handleFileUpload = (e) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        // Resize to fit localStorage (~5MB limit) by compressing via canvas
        const img = new Image();
        img.onload = () => {
          const MAX = 1024;
          let w = img.width, h = img.height;
          if (w > MAX || h > MAX) {
            const scale = MAX / Math.max(w, h);
            w = Math.round(w * scale);
            h = Math.round(h * scale);
          }
          const c = document.createElement('canvas');
          c.width = w; c.height = h;
          c.getContext('2d').drawImage(img, 0, 0, w, h);
          const compressed = c.toDataURL('image/jpeg', 0.95);
          onImageChange(compressed);
          setImgDraft(compressed);
          setShowImgInput(false);
        };
        img.src = reader.result;
      };
      reader.readAsDataURL(file);
    };

    useEffect(() => {
      if (open) { setImgDraft(customImage); setShowImgInput(false); }
    }, [open, customImage]);

    if (!open) return null;

    return (
      <div style={settingsStyles.backdrop} onClick={onClose}>
        <div style={settingsStyles.sheet} onClick={e => e.stopPropagation()}>
          <div style={settingsStyles.handle} />
          <h3 style={settingsStyles.heading}>⚙ सेटिंग्स</h3>

          {/* Focus Mode row */}
          <div style={settingsStyles.row}>
            <div>
              <div style={settingsStyles.rowTitle}>फोकस मोड</div>
              <div style={settingsStyles.rowSub}>श्वेत-श्याम, सरल रूप</div>
            </div>
            <div style={{ ...settingsStyles.toggle, background: focusMode ? '#1A1A1A' : '#DDD' }}
              onClick={() => onFocusModeChange(!focusMode)}>
              <div style={{ ...settingsStyles.thumb, transform: focusMode ? 'translateX(26px)' : 'translateX(2px)' }} />
            </div>
          </div>

          {/* Voice Mode row */}
          <div style={settingsStyles.row}>
            <div>
              <div style={settingsStyles.rowTitle}>🎙 वॉइस मोड</div>
              <div style={settingsStyles.rowSub}>नाम बोलकर जाप करें</div>
            </div>
            <div style={{ ...settingsStyles.toggle, background: voiceMode ? '#C62828' : '#DDD' }}
              onClick={() => onVoiceModeChange(!voiceMode)}>
              <div style={{ ...settingsStyles.thumb, transform: voiceMode ? 'translateX(26px)' : 'translateX(2px)' }} />
            </div>
          </div>

          {/* Doodle Mode row */}
          <div style={settingsStyles.row}>
            <div>
              <div style={settingsStyles.rowTitle}>डूडल मोड</div>
              <div style={settingsStyles.rowSub}>नाम लिखकर जाप करें</div>
            </div>
            <div style={{ ...settingsStyles.toggle, background: doodleMode ? '#5D4037' : '#DDD' }}
              onClick={() => onDoodleModeChange(!doodleMode)}>
              <div style={{ ...settingsStyles.thumb, transform: doodleMode ? 'translateX(26px)' : 'translateX(2px)' }} />
            </div>
          </div>

          {/* Sound Effects toggle */}
          <div style={settingsStyles.row}>
            <div>
              <div style={settingsStyles.rowTitle}>🔔 ध्वनि प्रभाव</div>
              <div style={settingsStyles.rowSub}>जाप पूर्ण होने पर ध्वनि</div>
            </div>
            <div style={{ ...settingsStyles.toggle, background: !soundMuted ? '#FF9800' : '#DDD' }}
              onClick={() => onSoundMutedChange(!soundMuted)}>
              <div style={{ ...settingsStyles.thumb, transform: !soundMuted ? 'translateX(26px)' : 'translateX(2px)' }} />
            </div>
          </div>

          {/* Change image row */}
          <div style={settingsStyles.row}>
            <div style={settingsStyles.rowTitle}>होम चित्र बदलें</div>
            <button style={settingsStyles.changeBtn} onClick={() => setShowImgInput(v => !v)}>
              {showImgInput ? '✕' : '🖼 बदलें'}
            </button>
          </div>
          {showImgInput && (
            <div style={settingsStyles.imgInputGroup}>
              <input style={settingsStyles.imgInput} type="url"
                placeholder="Image URL यहाँ paste करें..." value={imgDraft}
                onChange={e => setImgDraft(e.target.value)} />
              <button style={settingsStyles.applyBtn}
                onClick={() => { if (imgDraft.trim()) { onImageChange(imgDraft.trim()); setShowImgInput(false); } }}>
                लगाएं
              </button>
              <span style={{ textAlign: 'center', fontSize: '12px', color: '#999', margin: '4px 0' }}>या</span>
              <button style={{ ...settingsStyles.applyBtn, background: 'linear-gradient(180deg, #E1BEE7 0%, #CE93D8 100%)', color: '#4A148C' }}
                onClick={() => fileInputRef.current?.click()}>
                📁 फ़ोन से चुनें
              </button>
              <input ref={fileInputRef} type="file" accept="image/*" style={{ display: 'none' }}
                onChange={handleFileUpload} />
            </div>
          )}

          <button style={settingsStyles.closeBtn} onClick={onClose}>बंद करें</button>
        </div>
      </div>
    );
  };

  const settingsStyles = {
    backdrop: {
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
      zIndex: 999, animation: 'backdropIn 0.2s ease',
      display: 'flex', flexDirection: 'column', justifyContent: 'flex-end',
    },
    sheet: {
      background: '#FEFEFE', borderRadius: '22px 22px 0 0',
      padding: '10px 22px 40px',
      animation: 'sheetUp 0.3s cubic-bezier(0.25,0.46,0.45,0.94)',
      fontFamily: "'Tiro Devanagari Sanskrit', 'Noto Sans Devanagari', sans-serif",
    },
    handle: { width: '44px', height: '5px', background: '#E0E0E0', borderRadius: '3px', margin: '0 auto 18px' },
    heading: { fontSize: '18px', fontWeight: 'bold', color: '#1A0A00', margin: '0 0 16px', textAlign: 'center' },
    row: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 0', borderBottom: '1px solid #F0F0F0' },
    rowTitle: { fontSize: '16px', fontWeight: '600', color: '#222' },
    rowSub: { fontSize: '12px', color: '#999', marginTop: '3px' },
    toggle: { width: '52px', height: '28px', borderRadius: '14px', position: 'relative', cursor: 'pointer', transition: 'background 0.25s ease', flexShrink: 0 },
    thumb: { position: 'absolute', top: '3px', width: '22px', height: '22px', background: '#FFF', borderRadius: '50%', boxShadow: '0 2px 6px rgba(0,0,0,0.3)', transition: 'transform 0.25s ease' },
    changeBtn: { padding: '8px 14px', borderRadius: '10px', border: 'none', background: '#F0F0F0', color: '#333', fontSize: '14px', cursor: 'pointer', fontWeight: '600' },
    imgInputGroup: { display: 'flex', gap: '8px', padding: '12px 0' },
    imgInput: { flex: 1, padding: '10px 12px', borderRadius: '10px', border: '1.5px solid #E0E0E0', fontSize: '13px', outline: 'none', fontFamily: 'sans-serif' },
    applyBtn: { padding: '10px 16px', borderRadius: '10px', border: 'none', background: '#1A1A1A', color: '#FFF', fontSize: '14px', cursor: 'pointer', fontWeight: '700' },
    closeBtn: { marginTop: '20px', width: '100%', padding: '15px', borderRadius: '14px', border: 'none', background: 'linear-gradient(180deg, #FFE57F 0%, #FBC02D 100%)', color: '#1A0A00', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer' },
  };

  // ==================== COMPLETION MODAL ====================
  const CONFETTI_COLORS = ['#FBC02D','#E65100','#FF5722','#4CAF50','#2196F3','#9C27B0','#FF4081','#00BCD4','#FFEB3B','#8BC34A'];
  const CONFETTI_COUNT = 40;

  const CompletionModal = ({ jaapName, elapsedMs, onClose, focusMode, doodleMode, voiceMode }) => {
    const mins = Math.floor(elapsedMs / 60000);
    const secs = Math.floor((elapsedMs % 60000) / 1000);
    const timeStr = mins > 0 ? `${mins} मिनट ${secs} सेकंड` : `${secs} सेकंड`;

    // Vibration burst (subdued in focus mode)
    useEffect(() => {
      if (window.navigator.vibrate) window.navigator.vibrate(focusMode ? [40, 30, 40] : [100, 50, 100, 50, 200]);
    }, []);

    // Theme-aware colors
    const bg = focusMode ? '#1A1A1A' : doodleMode ? '#FFFDE7' : voiceMode ? '#E8F5E9' : '#FFF8E1';
    const textColor = focusMode ? '#E0E0E0' : doodleMode ? '#3E2723' : voiceMode ? '#1B5E20' : '#1A0A00';
    const subColor = focusMode ? '#AAA' : doodleMode ? '#5D4037' : voiceMode ? '#2E7D32' : '#6D4C41';
    const btnBg = focusMode ? '#333' : doodleMode ? 'linear-gradient(180deg, #FFFDE7 0%, #D4A96A 100%)'
      : voiceMode ? 'linear-gradient(180deg, #C8E6C9 0%, #66BB6A 100%)'
      : 'linear-gradient(180deg, #FFE57F 0%, #FBC02D 100%)';
    const btnColor = focusMode ? '#FFF' : doodleMode ? '#3E2723' : voiceMode ? '#1B5E20' : '#1A0A00';

    // Focus mode: minimal, silent completion card — no confetti, no bounce, no emoji
    if (focusMode) {
      return (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.7)', animation: 'backdropIn 0.4s ease' }}
            onClick={onClose} />
          <div style={{
            position: 'relative', zIndex: 1,
            background: '#1A1A1A', borderRadius: '20px', padding: '40px 28px 32px',
            maxWidth: '300px', width: '80%', textAlign: 'center',
            border: '1px solid #2A2A2A',
            boxShadow: '0 20px 50px rgba(0,0,0,0.5)',
            fontFamily: "'Tiro Devanagari Sanskrit', 'Noto Sans Devanagari', sans-serif",
          }}>
            <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#CCC', marginBottom: '10px', letterSpacing: '1px' }}>जाप पूर्ण</div>
            <div style={{ fontSize: '14px', color: '#666', marginBottom: '8px', lineHeight: 1.7 }}>
              {jaapName}<br />108 जाप · {timeStr}
            </div>
            <div style={{ width: '40px', height: '1px', background: '#333', margin: '16px auto' }} />
            <button onClick={onClose} style={{
              width: '100%', padding: '12px', borderRadius: '12px',
              border: '1px solid #333', background: '#222', color: '#999',
              fontSize: '14px', fontWeight: '500', cursor: 'pointer',
            }}>वापस</button>
          </div>
        </div>
      );
    }

    return (
      <div style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {/* Confetti layer */}
        <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
          {[...Array(CONFETTI_COUNT)].map((_, i) => (
            <div key={i} style={{
              position: 'absolute',
              left: `${Math.random() * 100}%`,
              top: '-5%',
              width: `${8 + Math.random() * 10}px`,
              height: `${8 + Math.random() * 10}px`,
              background: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
              borderRadius: Math.random() > 0.5 ? '50%' : '2px',
              animation: `confettiFall ${2 + Math.random() * 3}s linear ${Math.random() * 1.5}s forwards`,
              opacity: 0,
            }} />
          ))}
        </div>

        {/* Backdrop */}
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.55)', animation: 'backdropIn 0.3s ease' }}
          onClick={onClose} />

        {/* Modal card */}
        <div style={{
          position: 'relative', zIndex: 1,
          background: bg, borderRadius: '24px', padding: '36px 28px 28px',
          maxWidth: '340px', width: '85%', textAlign: 'center',
          animation: 'celebratePop 0.5s cubic-bezier(0.34,1.56,0.64,1) forwards',
          boxShadow: '0 24px 60px rgba(0,0,0,0.3)',
          fontFamily: "'Tiro Devanagari Sanskrit', 'Noto Sans Devanagari', sans-serif",
        }}>
          <div style={{ fontSize: '52px', marginBottom: '8px', animation: 'shimmer 1.5s ease-in-out infinite' }}>🎉</div>
          <div style={{ fontSize: '26px', fontWeight: 'bold', color: textColor, marginBottom: '6px' }}>जाप पूर्ण!</div>
          <div style={{ fontSize: '15px', color: subColor, marginBottom: '18px', lineHeight: 1.6 }}>
            {jaapName}<br />
            <strong>108</strong> जाप सम्पन्न<br />
            ⏱ {timeStr}
          </div>
          <div style={{ fontSize: '13px', color: subColor, opacity: 0.7, marginBottom: '20px' }}>
            🙏 हरि बोल! आपका जाप सफल हुआ।
          </div>
          <button onClick={onClose} style={{
            width: '100%', padding: '14px', borderRadius: '14px', border: 'none',
            background: btnBg, color: btnColor, fontSize: '16px', fontWeight: 'bold',
            cursor: 'pointer', boxShadow: '0 3px 12px rgba(0,0,0,0.15)',
          }}>🏠 वापस जाएं</button>
        </div>
      </div>
    );
  };

  // ==================== DRAWING CANVAS (Doodle Mode) ====================
  const DrawingCanvas = ({ onSuccess, onUndo, canUndo }) => {
    const canvasRef = useRef(null);
    const isDrawingRef = useRef(false);
    const hasStrokesRef = useRef(false);
    const autoTimer = useRef(null);

    useEffect(() => { scaleCanvas(); return () => clearTimeout(autoTimer.current); }, []);

    const scaleCanvas = () => {
      const canvas = canvasRef.current; if (!canvas) return;
      const dpr = window.devicePixelRatio || 1;
      // clientWidth/clientHeight = CSS content area (excludes border)
      const cssW = canvas.clientWidth;
      const cssH = canvas.clientHeight;
      canvas.width = cssW * dpr;
      canvas.height = cssH * dpr;
      const ctx = canvas.getContext('2d');
      ctx.scale(dpr, dpr);
      initCanvas(ctx, cssW, cssH);
    };

    const initCanvas = (ctxArg, w, h) => {
      const canvas = canvasRef.current; if (!canvas) return;
      const dpr = window.devicePixelRatio || 1;
      const ctx = ctxArg || canvas.getContext('2d');
      if (!ctxArg) { ctx.setTransform(dpr, 0, 0, dpr, 0, 0); }
      const cw = w || canvas.clientWidth;
      const ch = h || canvas.clientHeight;
      ctx.fillStyle = '#FFFEF5'; ctx.fillRect(0, 0, cw, ch);
      ctx.strokeStyle = '#2C1A0A'; ctx.lineWidth = 2.5;
      ctx.lineCap = 'round'; ctx.lineJoin = 'round';
      ctx.shadowBlur = 0; ctx.shadowColor = 'transparent';
    };

    const getPos = (e) => {
      const canvas = canvasRef.current;
      const src = e.touches ? e.touches[0] : e;
      // offsetX/offsetY are relative to the target's content area (excludes border)
      // — available on mouse events natively; for touch, compute manually.
      if (src.offsetX !== undefined) {
        return { x: src.offsetX, y: src.offsetY };
      }
      const rect = canvas.getBoundingClientRect();
      const borderL = parseFloat(getComputedStyle(canvas).borderLeftWidth) || 0;
      const borderT = parseFloat(getComputedStyle(canvas).borderTopWidth) || 0;
      return {
        x: src.clientX - rect.left - borderL,
        y: src.clientY - rect.top - borderT,
      };
    };

    const startDraw = (e) => {
      e.preventDefault();
      const ctx = canvasRef.current.getContext('2d');
      const pos = getPos(e); ctx.beginPath(); ctx.moveTo(pos.x, pos.y);
      isDrawingRef.current = true; hasStrokesRef.current = true;
      clearTimeout(autoTimer.current);
    };

    const onDraw = (e) => {
      e.preventDefault(); if (!isDrawingRef.current) return;
      const ctx = canvasRef.current.getContext('2d');
      const pos = getPos(e); ctx.lineTo(pos.x, pos.y); ctx.stroke();
    };

    const endDraw = (e) => {
      e.preventDefault(); if (!isDrawingRef.current) return;
      isDrawingRef.current = false;
      if (!hasStrokesRef.current) return;
      autoTimer.current = setTimeout(() => {
        const imgData = canvasRef.current.toDataURL('image/png');
        onSuccess(imgData);
        // Reset canvas for the next cell
        hasStrokesRef.current = false;
        initCanvas();
      }, 1500);
    };

    const clearCanvas = () => {
      initCanvas(); hasStrokesRef.current = false;
      clearTimeout(autoTimer.current);
    };

    return (
      <div style={doodleStyles.wrapper}>
        <div style={doodleStyles.hint}>✏ नाम लिखें — रुकने पर अपने आप आगे बढ़ेगा</div>
        <canvas ref={canvasRef} style={doodleStyles.canvas}
          onMouseDown={startDraw} onMouseMove={onDraw} onMouseUp={endDraw} onMouseLeave={endDraw}
          onTouchStart={startDraw} onTouchMove={onDraw} onTouchEnd={endDraw}
        />
        <div style={doodleStyles.controls}>
          <button style={doodleStyles.clearBtn} onClick={clearCanvas}>↺ मिटाएं</button>
          {onUndo && (
            <button
              style={{ ...doodleStyles.clearBtn, ...(canUndo ? {} : doodleStyles.disabledBtn) }}
              onClick={canUndo ? onUndo : undefined}
              disabled={!canUndo}
            >↩ पूर्ववत</button>
          )}
        </div>
      </div>
    );
  };

  const doodleStyles = {
    wrapper: {
      display: 'flex', flexDirection: 'column', gap: '6px',
      padding: '10px 14px clamp(16px, 4vh, 26px)',
      background: 'linear-gradient(180deg, #FFFDE7 0%, #FFF8DC 100%)',
      borderTop: '1.5px dashed #C8A96E', flexShrink: 0,
    },
    hint: {
      fontSize: '12px', color: '#8D6E63', textAlign: 'center', letterSpacing: '0.3px',
      fontFamily: "'Tiro Devanagari Sanskrit', 'Noto Sans Devanagari', sans-serif",
    },
    canvas: {
      width: '100%', height: '200px', borderRadius: '10px', touchAction: 'none', display: 'block',
      border: '1.5px solid #D4A96A', background: '#FFFEF5',
      boxShadow: '0 2px 8px rgba(200,169,110,0.15)',
    },
    controls: { display: 'flex', gap: '8px', alignItems: 'center', justifyContent: 'center', minHeight: '30px' },
    clearBtn: { padding: '6px 12px', borderRadius: '8px', border: '1px solid #C8A96E', background: '#FFF8DC', color: '#5D4037', fontSize: '13px', cursor: 'pointer', fontWeight: '600' },
    disabledBtn: { opacity: 0.35, cursor: 'not-allowed', border: '1px solid #D4C5A9' },
  };

  // ==================== VOICE CANVAS (Voice Mode) ====================
  // Feasibility: SpeechRecognition with lang:'hi-IN' returns Devanagari on Android Chrome
  // and on iOS Safari (16+). We match against BOTH Devanagari and common Roman
  // transliterations so either form the browser returns is handled reliably.
  const VoiceCanvas = ({ onSuccess, targetName }) => {
    // micPerm: 'prompt' | 'granted' | 'denied'
    // status:  'idle' | 'ready' | 'listening' | 'error'
    // Use localStorage so returning users skip the prompt screen on every mount.
    const [micPerm, setMicPerm] = useState(() =>
      localStorage.getItem('jaap_mic_ok') === '1' ? 'granted' : 'prompt'
    );
    const [status, setStatus] = useState('idle');
    const [errorText, setErrorText] = useState('');
    const [autoContinue, setAutoContinue] = useState(() =>
      localStorage.getItem('voice_auto_continue') === 'true'
    );
    const recognitionRef = useRef(null);
    const autoContinueRef = useRef(autoContinue);
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;

    // Keep ref in sync so callbacks see latest value
    useEffect(() => { autoContinueRef.current = autoContinue; }, [autoContinue]);

    const toggleAutoContinue = () => {
      const next = !autoContinue;
      setAutoContinue(next);
      localStorage.setItem('voice_auto_continue', String(next));
    };

    const DISPLAY_NAME = targetName === 'radha' ? 'राधा' : 'श्री हरिवंश';

    const TARGETS = {
      harivansh: ['श्री हरिवंश', 'हरिवंश', 'shri harivansh', 'harivansh', 'hari vansh', 'harivans', 'shri harivans'],
      radha: ['राधा', 'radha', 'raadha', 'radhaa'],
    };

    const normalize = (s) =>
      s.toLowerCase().replace(/[।,.!?॥\u0964\u0965]/g, '').replace(/\s+/g, ' ').trim();

    const checkMatch = (transcript) => {
      const t = normalize(transcript);
      return (TARGETS[targetName] || []).some(tgt => t.includes(normalize(tgt)));
    };

    // Request mic permission using SpeechRecognition itself — getUserMedia silently fails
    // inside many iframes (OneCompiler, CodeSandbox) even when the browser has mic enabled.
    // SR is what we actually use, so we use it to both request AND detect permission.
    const requestPermission = () => {
      if (!SR) return;
      const r = new SR();
      r.lang = 'hi-IN';
      let done = false;

      const grant = () => {
        if (done) return; done = true;
        try { r.stop(); } catch (_) {}
        localStorage.setItem('jaap_mic_ok', '1');
        setMicPerm('granted');
      };
      const deny = () => {
        if (done) return; done = true;
        localStorage.removeItem('jaap_mic_ok');
        setMicPerm('denied');
      };

      r.onstart  = grant;           // mic access was given — immediately stop, go to granted
      r.onresult = grant;           // shouldn't happen but handles it cleanly
      r.onend    = () => { if (!done) grant(); }; // ended without error = permission was fine
      r.onerror  = (e) => {
        if (e.error === 'not-allowed' || e.error === 'service-not-allowed') deny();
        else grant(); // network/no-speech = permission is fine, other issue
      };

      try { r.start(); } catch (_) { grant(); }
    };

    const stopRecognition = () => {
      if (recognitionRef.current) { try { recognitionRef.current.abort(); } catch (_) {} }
      setStatus('idle');
      setErrorText('');
    };

    const startListening = () => {
      if (!SR) return;
      setStatus('ready');
      setErrorText('');
      setTimeout(() => {
        const r = new SR();
        r.lang = 'hi-IN';
        r.interimResults = false;
        r.maxAlternatives = 5;
        r.continuous = true;
        let resolved = false;

        r.onresult = (e) => {
          const result = Array.from(e.results).find(res => res.isFinal);
          if (!result) return;
          resolved = true;
          r.stop();
          const alts = Array.from(result);
          const hit = alts.find(a => checkMatch(a.transcript));
          if (hit) {
            cellFeedback(0); // Voice mode cell feedback
            onSuccess(null);
            // Auto-continue: restart listening after a short delay
            if (autoContinueRef.current) {
              setTimeout(() => startListening(), 600);
            } else {
              setStatus('idle');
            }
          } else {
            setErrorText(alts[0].transcript);
            setStatus('error');
          }
        };
        r.onerror = (e) => {
          resolved = true;
          if (e.error === 'not-allowed' || e.error === 'service-not-allowed') {
            localStorage.removeItem('jaap_mic_ok'); // permission was revoked — clear cache
            setMicPerm('denied');
            setStatus('idle');
          } else if (e.error === 'no-speech') {
            setErrorText('कुछ सुनाई नहीं दिया');
            setStatus('error');
          } else {
            setStatus('idle');
          }
        };
        r.onend = () => { if (!resolved) setStatus('idle'); };

        recognitionRef.current = r;
        setStatus('listening');
        r.start();
      }, 800);
    };

    const isDesktop = useIsDesktop();
    // Space key toggles mic on desktop
    useEffect(() => {
      const onKey = (e) => {
        if (e.code === 'Space') {
          e.preventDefault();
          if (status === 'listening') stopRecognition();
          else if (status === 'idle' || status === 'error') startListening();
        }
      };
      window.addEventListener('keydown', onKey);
      return () => window.removeEventListener('keydown', onKey);
    }, [status]);

    if (!SR) return (
      <div style={voiceStyles.wrapper}>
        <div style={voiceStyles.namePrompt}>{DISPLAY_NAME}</div>
        <div style={voiceStyles.hint}>यह ब्राउज़र वॉइस मोड को सपोर्ट नहीं करता</div>
      </div>
    );

    // ── Permission not yet granted ──────────────────────────────────────────
    if (micPerm === 'denied') return (
      <div style={voiceStyles.wrapper}>
        <div style={voiceStyles.namePrompt}>{DISPLAY_NAME}</div>
        <div style={voiceStyles.permBox}>
          <span style={{ fontSize: '28px' }}>🚫</span>
          <span style={voiceStyles.permTitle}>माइक की अनुमति नहीं है</span>
          <span style={voiceStyles.permSub}>
            अगर आपने पहले अनुमति दी है, तो नीचे दबाएं। नहीं तो ब्राउज़र सेटिंग में जाकर माइक चालू करें।
          </span>
          {/* Permissions API can misreport inside iframes — always let the user retry via getUserMedia */}
          <button style={voiceStyles.permBtn} onClick={requestPermission}>
            🎙 दोबारा कोशिश करें
          </button>
        </div>
      </div>
    );

    if (micPerm === 'prompt') return (
      <div style={voiceStyles.wrapper}>
        <div style={voiceStyles.namePrompt}>{DISPLAY_NAME}</div>
        <div style={voiceStyles.permBox}>
          <span style={{ fontSize: '28px' }}>🎙</span>
          <span style={voiceStyles.permTitle}>माइक की अनुमति चाहिए</span>
          <span style={voiceStyles.permSub}>नाम बोलकर जाप करने के लिए माइक का उपयोग होगा</span>
          <button style={voiceStyles.permBtn} onClick={requestPermission}>
            माइक की अनुमति दें
          </button>
        </div>
      </div>
    );

    // ── Permission granted — normal recording UI ────────────────────────────
    const isListening = status === 'listening';
    const isReady     = status === 'ready';

    return (
      <div style={voiceStyles.wrapper}>
        <div style={voiceStyles.namePrompt}>{DISPLAY_NAME}</div>
        <div style={voiceStyles.hint}>
          {isReady     ? '🌅 तैयार रहें...' :
           isListening ? '� अभी बोलें!' :
           status === 'error' ? '� फिर से बोलने के लिए दबाएं' :
           '🍃 माइक दबाएं, फिर नाम बोलें'}
        </div>
        <button
          className={isListening ? 'mic-listening' : ''}
          style={{
            ...voiceStyles.micBtn,
            ...(isListening ? voiceStyles.micActive : {}),
            ...(isReady ? voiceStyles.micReady : {}),
            position: 'relative',
          }}
          onClick={isListening ? stopRecognition : isReady ? undefined : startListening}
        >{isListening ? '⏹' : '🎙'}{isDesktop && <KbdHint label="Space" />}</button>
        {/* Auto-continue toggle */}
        <button onClick={toggleAutoContinue} style={{
          display: 'flex', alignItems: 'center', gap: '6px',
          padding: '6px 14px', borderRadius: '20px', border: '1.5px solid',
          borderColor: autoContinue ? '#2E7D32' : '#A5D6A7',
          background: autoContinue ? 'rgba(46,125,50,0.12)' : 'rgba(76,175,80,0.04)',
          color: autoContinue ? '#1B5E20' : '#4CAF50',
          fontSize: '12px', fontWeight: '600', cursor: 'pointer',
          fontFamily: "'Tiro Devanagari Sanskrit', 'Noto Sans Devanagari', sans-serif",
          transition: 'all 0.2s ease',
        }}>
          <span style={{ fontSize: '14px' }}>{autoContinue ? '🔄' : '⏸'}</span>
          {autoContinue ? 'ऑटो जारी: चालू' : 'ऑटो जारी: बंद'}
        </button>
        {status === 'error' && (
          <div style={voiceStyles.errorBox}>
            <span style={voiceStyles.errorText}>सुना: "{errorText}"</span>
            <span style={voiceStyles.errorSub}>"{DISPLAY_NAME}" नहीं मिला — फिर बोलें</span>
          </div>
        )}
      </div>
    );
  };

  const voiceStyles = {
    wrapper: {
      display: 'flex', flexDirection: 'column', gap: '8px',
      padding: '12px 16px clamp(14px, 4vh, 24px)',
      background: 'linear-gradient(180deg, #E8F5E9 0%, #C8E6C9 100%)',
      borderTop: '1.5px solid rgba(76,175,80,0.35)', flexShrink: 0, alignItems: 'center',
    },
    namePrompt: {
      fontSize: 'clamp(22px, 6vw, 30px)', fontWeight: '800', color: '#1B5E20',
      fontFamily: "'Tiro Devanagari Sanskrit', 'Noto Sans Devanagari', sans-serif",
      letterSpacing: '2px', textAlign: 'center',
    },
    hint: {
      fontSize: '12px', color: '#2E7D32', textAlign: 'center', letterSpacing: '0.3px', fontWeight: '600',
      fontFamily: "'Tiro Devanagari Sanskrit', 'Noto Sans Devanagari', sans-serif",
      minHeight: '18px',
    },
    micBtn: {
      width: '72px', height: '72px', borderRadius: '50%', border: '3px solid #A5D6A7',
      background: 'linear-gradient(180deg, #388E3C, #2E7D32)', color: '#FFF', fontSize: '30px', cursor: 'pointer',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      boxShadow: '0 4px 16px rgba(46,125,50,0.4)', transition: 'transform 0.15s ease, background 0.15s ease',
    },
    micActive: { background: 'linear-gradient(180deg, #C62828, #B71C1C)', border: '3px solid #EF9A9A', transform: 'scale(1.07)', boxShadow: '0 4px 16px rgba(198,40,40,0.4)' },
    micReady: { background: 'linear-gradient(180deg, #66BB6A, #4CAF50)', cursor: 'default', transform: 'scale(0.95)' },
    errorBox: {
      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px',
      background: 'rgba(198,40,40,0.06)', borderRadius: '10px', padding: '8px 14px',
      border: '1px solid rgba(198,40,40,0.18)', width: '100%',
    },
    errorText: {
      fontSize: '13px', color: '#B71C1C', textAlign: 'center', fontWeight: '700',
      fontFamily: "'Tiro Devanagari Sanskrit', 'Noto Sans Devanagari', sans-serif",
    },
    errorSub: {
      fontSize: '11px', color: '#1B5E20', textAlign: 'center',
      fontFamily: "'Tiro Devanagari Sanskrit', 'Noto Sans Devanagari', sans-serif",
    },
    permBox: {
      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px',
      background: 'rgba(76,175,80,0.08)', borderRadius: '14px', padding: '16px',
      border: '1.5px dashed #A5D6A7', width: '100%',
    },
    permTitle: {
      fontSize: '15px', fontWeight: '700', color: '#1B5E20', textAlign: 'center',
      fontFamily: "'Tiro Devanagari Sanskrit', 'Noto Sans Devanagari', sans-serif",
    },
    permSub: {
      fontSize: '12px', color: '#2E7D32', textAlign: 'center', lineHeight: '1.5',
      fontFamily: "'Tiro Devanagari Sanskrit', 'Noto Sans Devanagari', sans-serif",
    },
    permBtn: {
      marginTop: '6px', padding: '10px 24px', borderRadius: '10px', border: 'none',
      background: 'linear-gradient(180deg, #66BB6A, #2E7D32)', color: '#FFF', fontSize: '14px', fontWeight: '700',
      cursor: 'pointer', letterSpacing: '0.3px',
      fontFamily: "'Tiro Devanagari Sanskrit', 'Noto Sans Devanagari', sans-serif",
      boxShadow: '0 3px 12px rgba(46,125,50,0.35)',
    },
  };

  // ==================== CONFIGS ====================
  const HARIVANSH_TOTAL = 108;
  const HARIVANSH_SEQUENCE = ["श्री", " ", "ह", "रि", "वं", "श"];
  const HARIVANSH_BUTTONS = [
    { id: "श्री", label: "श्री" },
    { id: "ह", label: "ह" },
    { id: "रि", label: "रि" },
    { id: "वं", label: "वं" },
    { id: "श", label: "श" }
  ];

  const RADHA_TOTAL = 108;
  const RADHA_SEQUENCE = ["R", "A", "D", "A"];
  const RADHA_BUTTONS = [
    { id: "R", label: "र" },
    { id: "A", label: "ा" },
    { id: "D", label: "ध" }
  ];

  // ==================== HOME SCREEN ====================
  const HomeScreen = ({ onSelect, focusMode, doodleMode, voiceMode, customImage, onSettingsOpen }) => {
    // Focus overrides — TRUE DARK MODE: deep blacks, minimal contrast, zero distraction
    const fContainer = focusMode ? { background: '#121212' } : {};
    const fHeader    = focusMode ? { background: '#1A1A1A', color: '#E0E0E0', boxShadow: 'none' } : {};
    const fTitle     = focusMode ? { color: '#E0E0E0' } : {};
    const fMenuBtn   = focusMode ? { background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', color: '#999' } : {};
    const fSubtitle  = focusMode ? { color: '#777', fontWeight: '400' } : {};
    const fBtn       = focusMode ? { background: '#1E1E1E', border: '1px solid #333', boxShadow: 'none', color: '#CCC', transition: 'opacity 0.1s ease' } : {};
    const fBtnSec    = focusMode ? { background: '#1E1E1E', border: '1px solid #333', boxShadow: 'none', color: '#CCC' } : {};

    // Doodle overrides — isolated from focus, voice and normal
    const dContainer = doodleMode ? { background: 'repeating-linear-gradient(transparent, transparent 27px, #E8D5B0 28px), linear-gradient(160deg, #FFFDE7 0%, #FFF9EC 100%)' } : {};
    const dHeader    = doodleMode ? { background: '#5D4037', boxShadow: '0 3px 8px rgba(93,64,55,0.3)' } : {};
    const dTitle     = doodleMode ? { color: '#FFF8E1' } : {};
    const dMenuBtn   = doodleMode ? { background: 'rgba(255,255,255,0.15)', border: '1.5px dashed rgba(255,255,255,0.45)', color: '#FFF8E1' } : {};
    const dSubtitle  = doodleMode ? { color: '#5D4037', fontWeight: '600' } : {};
    const dBtn       = doodleMode ? { background: '#FFFDE7', border: '1.5px dashed #8D6E63', boxShadow: '2px 3px 0 #C8A96E', color: '#3E2723', borderRadius: '8px', transition: 'opacity 0.1s ease' } : {};
    const dImageRing = doodleMode ? { background: 'none', boxShadow: 'none', border: '3px dashed #C8A96E', padding: '5px' } : {};

    // Voice overrides — Dawn Garden: soft greens, nature-inspired
    const vContainer = voiceMode ? { background: 'linear-gradient(160deg, #E8F5E9 0%, #F1F8E9 55%, #DCEDC8 100%)' } : {};
    const vHeader    = voiceMode ? { background: 'linear-gradient(135deg, #1B5E20 0%, #4CAF50 100%)', boxShadow: '0 4px 20px rgba(27,94,32,0.4)' } : {};
    const vTitle     = voiceMode ? { color: '#E8F5E9' } : {};
    const vMenuBtn   = voiceMode ? { background: 'rgba(255,255,255,0.2)', border: '1px solid rgba(255,255,255,0.4)', color: '#E8F5E9' } : {};
    const vSubtitle  = voiceMode ? { color: '#2E7D32', fontWeight: '600' } : {};
    const vBtn       = voiceMode ? { background: 'linear-gradient(180deg, #C8E6C9 0%, #81C784 100%)', border: 'none', boxShadow: '0 5px 0 #2E7D32, 0 8px 24px rgba(0,0,0,0.12)', color: '#1B5E20' } : {};
    const vBtnSec    = voiceMode ? { background: 'linear-gradient(180deg, #FFF9C4 0%, #FDD835 100%)', boxShadow: '0 5px 0 #F9A825, 0 8px 24px rgba(0,0,0,0.12)', color: '#33691E' } : {};
    const vImageRing = voiceMode ? { background: 'conic-gradient(#66BB6A 0deg, #FDD835 90deg, #81C784 180deg, #FDD835 270deg, #66BB6A 360deg)', boxShadow: '0 0 50px rgba(76,175,80,0.5), 0 8px 36px rgba(0,0,0,0.15)' } : {};

    const modeClass = focusMode ? 'focus-mode' : doodleMode ? 'doodle-mode' : voiceMode ? 'voice-mode' : '';

    return (
      <div className={modeClass} style={{ ...homeStyles.container, ...fContainer, ...dContainer, ...vContainer }}>
        <div style={{ ...homeStyles.header, ...fHeader, ...dHeader, ...vHeader }}>
          <strong style={{ ...homeStyles.title, ...fTitle, ...dTitle, ...vTitle }}>
            {voiceMode ? '🐦 नाम जाप' : '🙏 नाम जाप'}
          </strong>
          <button style={{ ...homeStyles.menuBtn, ...fMenuBtn, ...dMenuBtn, ...vMenuBtn }} onClick={onSettingsOpen} aria-label="Settings">⋮</button>
        </div>
        <div style={homeStyles.body}>
          {!focusMode && (
            <div style={{ ...homeStyles.imageRing, ...dImageRing, ...vImageRing }}>
              <img src={customImage || DEFAULT_IMAGE} alt="Divine" style={homeStyles.image} />
            </div>
          )}
          <p style={{ ...homeStyles.subtitle, ...fSubtitle, ...dSubtitle, ...vSubtitle }}>
            {voiceMode ? '🌿 कौन सा जाप करना है?' : 'कौन सा जाप करना है?'}
          </p>
          <div style={homeStyles.btnGroup}>
            <button className="home-btn" style={{ ...homeStyles.btn, ...fBtn, ...dBtn, ...vBtn }} onClick={() => onSelect('harivansh')}>
              {voiceMode ? '🌳' : '🙏'}&nbsp; श्री हरिवंश जाप
            </button>
            <button className="home-btn" style={{ ...homeStyles.btn, ...homeStyles.btnSecondary, ...fBtn, ...fBtnSec, ...dBtn, ...vBtnSec }} onClick={() => onSelect('radha')}>
              {voiceMode ? '🌸' : '🌸'}&nbsp; राधा जाप
            </button>
          </div>
        </div>
      </div>
    );
  };

  // ==================== HARIVANSH JAAP ====================
  const HarivanshJaap = ({ onBack, focusMode, doodleMode, voiceMode }) => {
    const isDesktop = useIsDesktop();
    const { onTouchStart, onTouchMove, onTouchEnd, SwipeIndicator } = useSwipeBack(onBack);
    const [currentCellIndex, setCurrentCellIndex] = useState(() =>
      Number(localStorage.getItem('harivansh_jaap_count')) || 0
    );
    const [currentLetterIndex, setCurrentLetterIndex] = useState(0);
    const [completedImages, setCompletedImages] = useState({});
    const [canUndo, setCanUndo] = useState(false);
    const [showCompletion, setShowCompletion] = useState(false);
    const [completionTime, setCompletionTime] = useState(0);
    const [elapsed, setElapsed] = useState(0);
    const sessionStartRef = useRef(Date.now());
    const scrollContainerRef = useRef(null);
    const cellRefs = useRef([]);

    useEffect(() => {
      const iv = setInterval(() => setElapsed(Math.floor((Date.now() - sessionStartRef.current) / 1000)), 1000);
      return () => clearInterval(iv);
    }, []);

    const fmtTime = (s) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

    useEffect(() => {
      localStorage.setItem('harivansh_jaap_count', currentCellIndex);
      if (currentCellIndex === 0) {
        scrollContainerRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        handleSmartScroll(currentCellIndex);
      }
    }, [currentCellIndex]);

    const handleSmartScroll = (index) => {
      const container = scrollContainerRef.current;
      const activeCell = cellRefs.current[index];
      if (!container || !activeCell) return;
      const containerRect = container.getBoundingClientRect();
      const cellRect = activeCell.getBoundingClientRect();
      const cellCenter = cellRect.top + cellRect.height / 2;
      const containerCenter = containerRect.top + containerRect.height / 2;
      const offset = cellCenter - containerCenter;
      if (Math.abs(offset) > containerRect.height * 0.25) {
        container.scrollBy({ top: offset, behavior: 'smooth' });
      }
    };

    // Keyboard support: 1-5 map to HARIVANSH_BUTTONS
    const handleInputRef = useRef(null);
    handleInputRef.current = (inputId) => {
      const targetId = HARIVANSH_SEQUENCE[currentLetterIndex];
      if (inputId === targetId) {
        let nextLetterPos = currentLetterIndex + 1;
        if (HARIVANSH_SEQUENCE[nextLetterPos] === " ") nextLetterPos += 1;
        if (nextLetterPos >= HARIVANSH_SEQUENCE.length) {
          const nextIndex = currentCellIndex + 1;
          cellFeedback(currentCellIndex);
          if (nextIndex >= HARIVANSH_TOTAL) {
            setCompletionTime(Date.now() - sessionStartRef.current);
            setShowCompletion(true);
          } else {
            setCurrentCellIndex(nextIndex); setCurrentLetterIndex(0);
          }
        } else {
          if (window.navigator.vibrate) window.navigator.vibrate(focusMode ? 4 : 8);
          setCurrentLetterIndex(nextLetterPos);
        }
      }
    };
    useEffect(() => {
      const onKey = (e) => {
        if (doodleMode) return;
        // Number keys for normal/focus mode buttons
        if (!voiceMode) {
          const idx = parseInt(e.key) - 1;
          if (idx >= 0 && idx < HARIVANSH_BUTTONS.length) {
            handleInputRef.current(HARIVANSH_BUTTONS[idx].id);
          }
        }
      };
      window.addEventListener('keydown', onKey);
      return () => window.removeEventListener('keydown', onKey);
    }, [doodleMode, voiceMode]);

    const triggerCompletion = () => {
      setCompletionTime(Date.now() - sessionStartRef.current);
      setShowCompletion(true);
    };

    const handleCompletionClose = () => {
      setShowCompletion(false);
      setCurrentCellIndex(0); setCurrentLetterIndex(0);
      setCompletedImages({});
      localStorage.setItem('harivansh_jaap_count', 0);
      onBack();
    };

    const handleInput = (inputId) => {
      const targetId = HARIVANSH_SEQUENCE[currentLetterIndex];
      if (inputId === targetId) {
        let nextLetterPos = currentLetterIndex + 1;
        if (HARIVANSH_SEQUENCE[nextLetterPos] === " ") nextLetterPos += 1;
        if (nextLetterPos >= HARIVANSH_SEQUENCE.length) {
          const nextIndex = currentCellIndex + 1;
          cellFeedback(currentCellIndex);
          if (nextIndex >= HARIVANSH_TOTAL) {
            triggerCompletion();
          } else {
            setCurrentCellIndex(nextIndex); setCurrentLetterIndex(0);
          }
        } else {
          if (window.navigator.vibrate) window.navigator.vibrate(focusMode ? 4 : 8);
          setCurrentLetterIndex(nextLetterPos);
        }
      }
    };

    const resetProgress = () => {
      if (window.confirm("Do you want to reset your progress to 0?")) {
        setCurrentCellIndex(0); setCurrentLetterIndex(0);
        localStorage.setItem('harivansh_jaap_count', 0);
        scrollContainerRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
      }
    };

    const handleDoodleSuccess = (imgData) => {
      cellFeedback(currentCellIndex);
      setCompletedImages(prev => ({ ...prev, [currentCellIndex]: imgData }));
      const nextIndex = currentCellIndex + 1;
      if (nextIndex >= HARIVANSH_TOTAL) {
        triggerCompletion();
      } else {
        setCurrentCellIndex(nextIndex); setCurrentLetterIndex(0);
      }
      setCanUndo(true);
    };

    const handleUndo = () => {
      if (currentCellIndex === 0 || !canUndo) return;
      const prevIndex = currentCellIndex - 1;
      setCurrentCellIndex(prevIndex);
      setCurrentLetterIndex(0);
      setCompletedImages(prev => { const n = { ...prev }; delete n[prevIndex]; return n; });
      localStorage.setItem('harivansh_jaap_count', prevIndex);
      setCanUndo(false);
    };

    // Focus mode — TRUE DARK: deep blacks, muted text, zero distraction
    const fContainer = focusMode ? { background: '#121212' } : {};
    const fHeader  = focusMode ? { background: '#1A1A1A', boxShadow: 'none' } : {};
    const fTitle   = focusMode ? { color: '#999' } : {};
    const fBack    = focusMode ? { color: '#666', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' } : {};
    const fCount   = focusMode ? { color: '#555' } : {};
    const fGrid    = focusMode ? { background: '#121212' } : {};
    const fFooter  = focusMode ? { background: 'linear-gradient(0deg, #181818 0%, #121212 100%)' } : {};

    // Doodle mode — Sacred Manuscript
    const dHeader  = doodleMode ? { background: '#5D4037', boxShadow: '0 3px 8px rgba(93,64,55,0.3)' } : {};
    const dTitle   = doodleMode ? { color: '#FFF8E1' } : {};
    const dBack    = doodleMode ? { color: '#FFF8E1', background: 'rgba(255,255,255,0.15)', border: '1.5px dashed rgba(255,255,255,0.45)' } : {};
    const dCount   = doodleMode ? { color: '#FFF8E1' } : {};
    const dGrid    = doodleMode ? { background: 'repeating-linear-gradient(transparent, transparent 27px, #E8D5B0 28px), linear-gradient(160deg, #FFFDE7 0%, #FFF9EC 100%)' } : {};

    // Voice mode — Dawn Garden
    const vHeader  = voiceMode ? { background: 'linear-gradient(135deg, #1B5E20 0%, #4CAF50 100%)', boxShadow: '0 4px 16px rgba(27,94,32,0.3)' } : {};
    const vTitle   = voiceMode ? { color: '#E8F5E9' } : {};
    const vBack    = voiceMode ? { color: '#E8F5E9', background: 'rgba(255,255,255,0.2)', border: '1px solid rgba(255,255,255,0.4)' } : {};
    const vCount   = voiceMode ? { color: '#C8E6C9' } : {};
    const vGrid    = voiceMode ? { background: 'linear-gradient(180deg, #E8F5E9 0%, #F1F8E9 100%)' } : {};
    const vContainer = voiceMode ? { background: 'linear-gradient(160deg, #E8F5E9 0%, #F1F8E9 55%, #DCEDC8 100%)' } : {};
    const dContainer = doodleMode ? { background: 'linear-gradient(160deg, #FFFDE7 0%, #FFF9EC 100%)' } : {};

    const cellStyle = (isCurrent, isDone) => {
      if (focusMode) return { ...sharedStyles.cell, backgroundColor: isCurrent ? '#1E1E1E' : isDone ? '#1A1A1A' : '#161616', border: isCurrent ? '1px solid #444' : isDone ? '1px solid #2A2A2A' : '1px solid #1E1E1E' };
      if (doodleMode) return { ...sharedStyles.cell,
        backgroundColor: isCurrent ? '#FFFEF5' : isDone ? 'rgba(141,110,99,0.08)' : 'transparent',
        border: isCurrent ? '2px dashed #8D6E63' : isDone ? '1.5px dashed rgba(141,110,99,0.25)' : '1.5px dashed rgba(200,169,110,0.3)',
        borderRadius: '8px' };
      if (voiceMode) return { ...sharedStyles.cell,
        backgroundColor: isCurrent ? '#FFFFFF' : isDone ? 'rgba(76,175,80,0.08)' : 'transparent',
        border: isCurrent ? '2px solid #66BB6A' : isDone ? '1px solid rgba(76,175,80,0.2)' : '1px solid rgba(76,175,80,0.1)',
        borderRadius: '14px' };
      return { ...sharedStyles.cell,
        backgroundColor: isCurrent ? '#FFFFFF' : isDone ? 'rgba(26,115,232,0.06)' : 'transparent',
        border: isCurrent ? '2px solid #FBC02D' : isDone ? '1px solid rgba(26,115,232,0.18)' : '1px solid rgba(0,0,0,0.07)' };
    };

    const letterColor = (isPartDone) => {
      if (focusMode) return isPartDone ? '#AAA' : '#3A3A3A';
      if (doodleMode) return isPartDone ? '#5D4037' : '#C8A96E';
      if (voiceMode) return isPartDone ? '#2E7D32' : '#A5D6A7';
      return isPartDone ? 'rgb(26,115,232)' : '#BDBDBD';
    };

    const btnStyle = (isNext) => {
      if (focusMode) return { ...sharedStyles.button, background: isNext ? '#2A2A2A' : '#1E1E1E', boxShadow: 'none', transform: 'none',
        opacity: isNext ? 1 : 0.35, border: isNext ? '1px solid #555' : '1px solid #2A2A2A', color: isNext ? '#CCC' : '#555' };
      if (doodleMode) return { ...sharedStyles.button,
        background: isNext ? '#FFFDE7' : '#FFF8DC', border: '1.5px dashed #8D6E63',
        boxShadow: isNext ? '2px 3px 0 #C8A96E' : '1px 2px 0 #D4C5A9',
        transform: isNext ? 'scale(1.05)' : 'scale(1)', color: '#3E2723', opacity: isNext ? 1 : 0.6 };
      if (voiceMode) return { ...sharedStyles.button,
        background: isNext ? 'linear-gradient(180deg, #C8E6C9 0%, #66BB6A 100%)' : 'linear-gradient(180deg, #E8F5E9 0%, #A5D6A7 100%)',
        transform: isNext ? 'scale(1.08)' : 'scale(1)',
        boxShadow: isNext ? '0 6px 0 #2E7D32, 0 8px 20px rgba(0,0,0,0.15)' : '0 3px 0 #4CAF50',
        color: '#1B5E20', opacity: isNext ? 1 : 0.65 };
      return { ...sharedStyles.button,
        background: isNext ? 'linear-gradient(180deg, #FFE57F 0%, #FFC107 100%)' : 'linear-gradient(180deg, #FFD54F 0%, #FFCA28 100%)',
        transform: isNext ? 'scale(1.08)' : 'scale(1)',
        boxShadow: isNext ? '0 6px 0 #9A7A00, 0 8px 20px rgba(0,0,0,0.15)' : '0 3px 0 #BDA03B',
        opacity: isNext ? 1 : 0.65 };
    };

    const modeClass = focusMode ? ' focus-mode' : doodleMode ? ' doodle-mode' : voiceMode ? ' voice-mode' : '';

    return (
      <div className={`jaap-screen${modeClass}`} style={{ ...sharedStyles.container, ...fContainer, ...dContainer, ...vContainer }}
        onTouchStart={onTouchStart} onTouchMove={onTouchMove} onTouchEnd={onTouchEnd}>
        {SwipeIndicator}
        <div style={{ ...sharedStyles.header, ...fHeader, ...dHeader, ...vHeader }}>
          <span style={{ ...sharedStyles.backBtn, ...fBack, ...dBack, ...vBack }} onClick={onBack}>‹ वापस</span>
          <strong style={{ ...sharedStyles.title, ...fTitle, ...dTitle, ...vTitle }}>श्री हरिवंश जाप</strong>
          <div style={sharedStyles.headerRight}>
            {!focusMode && <span style={{ ...sharedStyles.countDisplay, ...fCount, ...dCount, ...vCount, fontSize: '11px', opacity: 0.7, marginRight: '6px' }}>⏱ {fmtTime(elapsed)}</span>}
            <span style={{ ...sharedStyles.countDisplay, ...fCount, ...dCount, ...vCount }}>{currentCellIndex} / {HARIVANSH_TOTAL}</span>
            <span style={{ ...sharedStyles.resetIcon, ...fCount, ...dCount, ...vCount }} onClick={resetProgress}>↺</span>
          </div>
        </div>
        <ProgressBar current={currentCellIndex} total={HARIVANSH_TOTAL} focusMode={focusMode} doodleMode={doodleMode} voiceMode={voiceMode} />
        <div style={{ ...sharedStyles.grid, ...fGrid, ...dGrid, ...vGrid }} ref={scrollContainerRef}>
          {[...Array(HARIVANSH_TOTAL)].map((_, cellIdx) => {
            const isDone = cellIdx < currentCellIndex;
            const isCurrent = cellIdx === currentCellIndex;
            return (
              <div key={cellIdx} ref={el => cellRefs.current[cellIdx] = el}
                className={isCurrent ? 'current-cell' : ''}
                style={cellStyle(isCurrent, isDone)}
              >
                {!focusMode && <MilestoneBadge cellIdx={cellIdx} />}
                {<div style={sharedStyles.wordWrapper}>
                      {HARIVANSH_SEQUENCE.map((part, pIdx) => {
                        if (part === " ") return <span key={pIdx} style={{ width: '5px' }} />;
                        const isPartDone = isDone || (isCurrent && pIdx < currentLetterIndex);
                        return (
                          <span key={pIdx} style={{
                            color: letterColor(isPartDone),
                            fontWeight: 'bold', fontSize: 'clamp(13px, 3.2vw, 17px)',
                            transition: 'color 0.2s ease'
                          }}>{part}</span>
                        );
                      })}
                    </div>
                }
              </div>
            );
          })}
        </div>
        {doodleMode
          ? <DrawingCanvas onSuccess={handleDoodleSuccess} onUndo={handleUndo} canUndo={canUndo} />
          : voiceMode
          ? <VoiceCanvas onSuccess={handleDoodleSuccess} targetName="harivansh" />
          : <div style={{ ...sharedStyles.footer, ...fFooter }}>
              {focusMode && <BreathingGuide />}
              {HARIVANSH_BUTTONS.map((btn, btnIdx) => {
                const isNext = btn.id === HARIVANSH_SEQUENCE[currentLetterIndex];
                return (
                  <button key={btn.id} className="jaap-btn" onClick={() => handleInput(btn.id)}
                    style={{ ...btnStyle(isNext), position: 'relative' }}
                  >{btn.label}{isDesktop && <KbdHint label={btnIdx + 1} />}</button>
                );
              })}
            </div>
        }
        {showCompletion && (
          <CompletionModal jaapName="श्री हरिवंश जाप" elapsedMs={completionTime}
            onClose={handleCompletionClose} focusMode={focusMode} doodleMode={doodleMode} voiceMode={voiceMode} />
        )}
      </div>
    );
  };

  // ==================== RADHA JAAP ====================
  const RadhaJaap = ({ onBack, focusMode, doodleMode, voiceMode }) => {
    const isDesktop = useIsDesktop();
    const { onTouchStart: rTouchStart, onTouchMove: rTouchMove, onTouchEnd: rTouchEnd, SwipeIndicator: RSwipeIndicator } = useSwipeBack(onBack);
    const [currentCellIndex, setCurrentCellIndex] = useState(() =>
      Number(localStorage.getItem('radha_jaap_count')) || 0
    );
    const [currentLetterIndex, setCurrentLetterIndex] = useState(0);
    const [completedImages, setCompletedImages] = useState({});
    const [canUndo, setCanUndo] = useState(false);
    const [showCompletion, setShowCompletion] = useState(false);
    const [completionTime, setCompletionTime] = useState(0);
    const [elapsed, setElapsed] = useState(0);
    const sessionStartRef = useRef(Date.now());
    const scrollContainerRef = useRef(null);
    const cellRefs = useRef([]);

    useEffect(() => {
      const iv = setInterval(() => setElapsed(Math.floor((Date.now() - sessionStartRef.current) / 1000)), 1000);
      return () => clearInterval(iv);
    }, []);

    const fmtTime = (s) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

    useEffect(() => {
      localStorage.setItem('radha_jaap_count', currentCellIndex);
      if (currentCellIndex === 0) {
        scrollContainerRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        handleSmartScroll(currentCellIndex);
      }
    }, [currentCellIndex]);

    const handleSmartScroll = (index) => {
      const container = scrollContainerRef.current;
      const activeCell = cellRefs.current[index];
      if (!container || !activeCell) return;
      const containerRect = container.getBoundingClientRect();
      const cellRect = activeCell.getBoundingClientRect();
      const cellCenter = cellRect.top + cellRect.height / 2;
      const containerCenter = containerRect.top + containerRect.height / 2;
      const offset = cellCenter - containerCenter;
      if (Math.abs(offset) > containerRect.height * 0.25) {
        container.scrollBy({ top: offset, behavior: 'smooth' });
      }
    };

    // Keyboard support: 1-3 map to RADHA_BUTTONS
    const handleInputRef = useRef(null);
    handleInputRef.current = (inputId) => {
      if (inputId === RADHA_SEQUENCE[currentLetterIndex]) {
        if (currentLetterIndex === RADHA_SEQUENCE.length - 1) {
          const nextIndex = currentCellIndex + 1;
          cellFeedback(currentCellIndex);
          if (nextIndex >= RADHA_TOTAL) {
            setCompletionTime(Date.now() - sessionStartRef.current);
            setShowCompletion(true);
          } else {
            setCurrentCellIndex(nextIndex); setCurrentLetterIndex(0);
          }
        } else {
          if (window.navigator.vibrate) window.navigator.vibrate(focusMode ? 4 : 8);
          setCurrentLetterIndex(prev => prev + 1);
        }
      }
    };
    useEffect(() => {
      const onKey = (e) => {
        if (doodleMode) return;
        if (!voiceMode) {
          const idx = parseInt(e.key) - 1;
          if (idx >= 0 && idx < RADHA_BUTTONS.length) {
            handleInputRef.current(RADHA_BUTTONS[idx].id);
          }
        }
      };
      window.addEventListener('keydown', onKey);
      return () => window.removeEventListener('keydown', onKey);
    }, [doodleMode, voiceMode]);

    const triggerCompletion = () => {
      setCompletionTime(Date.now() - sessionStartRef.current);
      setShowCompletion(true);
    };

    const handleCompletionClose = () => {
      setShowCompletion(false);
      setCurrentCellIndex(0); setCurrentLetterIndex(0);
      setCompletedImages({});
      localStorage.setItem('radha_jaap_count', 0);
      onBack();
    };

    const handleInput = (inputId) => {
      if (inputId === RADHA_SEQUENCE[currentLetterIndex]) {
        if (currentLetterIndex === RADHA_SEQUENCE.length - 1) {
          const nextIndex = currentCellIndex + 1;
          cellFeedback(currentCellIndex);
          if (nextIndex >= RADHA_TOTAL) {
            triggerCompletion();
          } else {
            setCurrentCellIndex(nextIndex); setCurrentLetterIndex(0);
          }
        } else {
          if (window.navigator.vibrate) window.navigator.vibrate(focusMode ? 4 : 8);
          setCurrentLetterIndex(prev => prev + 1);
        }
      }
    };

    const resetProgress = () => {
      if (window.confirm("Reset progress?")) {
        setCurrentCellIndex(0); setCurrentLetterIndex(0);
        localStorage.setItem('radha_jaap_count', 0);
        scrollContainerRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
      }
    };

    const handleDoodleSuccess = (imgData) => {
      cellFeedback(currentCellIndex);
      setCompletedImages(prev => ({ ...prev, [currentCellIndex]: imgData }));
      const nextIndex = currentCellIndex + 1;
      if (nextIndex >= RADHA_TOTAL) {
        triggerCompletion();
      } else {
        setCurrentCellIndex(nextIndex); setCurrentLetterIndex(0);
      }
      setCanUndo(true);
    };

    const handleUndo = () => {
      if (currentCellIndex === 0 || !canUndo) return;
      const prevIndex = currentCellIndex - 1;
      setCurrentCellIndex(prevIndex);
      setCurrentLetterIndex(0);
      setCompletedImages(prev => { const n = { ...prev }; delete n[prevIndex]; return n; });
      localStorage.setItem('radha_jaap_count', prevIndex);
      setCanUndo(false);
    };

    // Returns colour for a syllable (consonant+matra pair) based on chanting progress.
    const syllableColor = (isDone, isCurrent, consonantIdx, currentPos) => {
      if (focusMode) {
        if (isDone || (isCurrent && currentPos > consonantIdx + 1)) return '#AAA';
        if (isCurrent && currentPos === consonantIdx + 1)            return '#666';
        return '#3A3A3A';
      }
      if (doodleMode) {
        if (isDone || (isCurrent && currentPos > consonantIdx + 1)) return '#5D4037';
        if (isCurrent && currentPos === consonantIdx + 1)            return '#8D6E63';
        return '#C8A96E';
      }
      if (voiceMode) {
        if (isDone || (isCurrent && currentPos > consonantIdx + 1)) return '#2E7D32';
        if (isCurrent && currentPos === consonantIdx + 1)            return '#FDD835';
        return '#A5D6A7';
      }
      if (isDone || (isCurrent && currentPos > consonantIdx + 1)) return 'rgb(26,115,232)';
      if (isCurrent && currentPos === consonantIdx + 1)            return '#FF8F00';
      return '#BDBDBD';
    };

    // Focus mode — TRUE DARK
    const fContainer = focusMode ? { background: '#121212' } : {};
    const fHeader = focusMode ? { background: '#1A1A1A', boxShadow: 'none' } : {};
    const fTitle  = focusMode ? { color: '#999' } : {};
    const fBack   = focusMode ? { color: '#666', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' } : {};
    const fCount  = focusMode ? { color: '#555' } : {};
    const fGrid   = focusMode ? { background: '#121212' } : {};
    const fFooter = focusMode ? { background: 'linear-gradient(0deg, #181818 0%, #121212 100%)' } : {};

    // Doodle mode — Sacred Manuscript
    const dHeader  = doodleMode ? { background: '#5D4037', boxShadow: '0 3px 8px rgba(93,64,55,0.3)' } : {};
    const dTitle   = doodleMode ? { color: '#FFF8E1' } : {};
    const dBack    = doodleMode ? { color: '#FFF8E1', background: 'rgba(255,255,255,0.15)', border: '1.5px dashed rgba(255,255,255,0.45)' } : {};
    const dCount   = doodleMode ? { color: '#FFF8E1' } : {};
    const dGrid    = doodleMode ? { background: 'repeating-linear-gradient(transparent, transparent 27px, #E8D5B0 28px), linear-gradient(160deg, #FFFDE7 0%, #FFF9EC 100%)' } : {};
    const dContainer = doodleMode ? { background: 'linear-gradient(160deg, #FFFDE7 0%, #FFF9EC 100%)' } : {};

    // Voice mode — Dawn Garden
    const vHeader  = voiceMode ? { background: 'linear-gradient(135deg, #1B5E20 0%, #4CAF50 100%)', boxShadow: '0 4px 16px rgba(27,94,32,0.3)' } : {};
    const vTitle   = voiceMode ? { color: '#E8F5E9' } : {};
    const vBack    = voiceMode ? { color: '#E8F5E9', background: 'rgba(255,255,255,0.2)', border: '1px solid rgba(255,255,255,0.4)' } : {};
    const vCount   = voiceMode ? { color: '#C8E6C9' } : {};
    const vGrid    = voiceMode ? { background: 'linear-gradient(180deg, #E8F5E9 0%, #F1F8E9 100%)' } : {};
    const vContainer = voiceMode ? { background: 'linear-gradient(160deg, #E8F5E9 0%, #F1F8E9 55%, #DCEDC8 100%)' } : {};

    const cellStyle = (isCurrent, isDone) => {
      if (focusMode) return { ...sharedStyles.cell, backgroundColor: isCurrent ? '#1E1E1E' : isDone ? '#1A1A1A' : '#161616', border: isCurrent ? '1px solid #444' : isDone ? '1px solid #2A2A2A' : '1px solid #1E1E1E' };
      if (doodleMode) return { ...sharedStyles.cell,
        backgroundColor: isCurrent ? '#FFFEF5' : isDone ? 'rgba(141,110,99,0.08)' : 'transparent',
        border: isCurrent ? '2px dashed #8D6E63' : isDone ? '1.5px dashed rgba(141,110,99,0.25)' : '1.5px dashed rgba(200,169,110,0.3)',
        borderRadius: '8px' };
      if (voiceMode) return { ...sharedStyles.cell,
        backgroundColor: isCurrent ? '#FFFFFF' : isDone ? 'rgba(76,175,80,0.08)' : 'transparent',
        border: isCurrent ? '2px solid #66BB6A' : isDone ? '1px solid rgba(76,175,80,0.2)' : '1px solid rgba(76,175,80,0.1)',
        borderRadius: '14px' };
      return { ...sharedStyles.cell,
        backgroundColor: isCurrent ? '#FFFFFF' : isDone ? 'rgba(26,115,232,0.06)' : 'transparent',
        border: isCurrent ? '2px solid #FBC02D' : isDone ? '1px solid rgba(26,115,232,0.18)' : '1px solid rgba(0,0,0,0.07)' };
    };

    const btnStyle = (isNext) => {
      if (focusMode) return { ...sharedStyles.button, background: isNext ? '#2A2A2A' : '#1E1E1E', boxShadow: 'none', transform: 'none',
        opacity: isNext ? 1 : 0.35, border: isNext ? '1px solid #555' : '1px solid #2A2A2A', color: isNext ? '#CCC' : '#555', fontSize: '32px' };
      if (doodleMode) return { ...sharedStyles.button,
        background: isNext ? '#FFFDE7' : '#FFF8DC', border: '1.5px dashed #8D6E63',
        boxShadow: isNext ? '2px 3px 0 #C8A96E' : '1px 2px 0 #D4C5A9',
        transform: isNext ? 'scale(1.05)' : 'scale(1)', color: '#3E2723', opacity: isNext ? 1 : 0.6, fontSize: '32px' };
      if (voiceMode) return { ...sharedStyles.button,
        background: isNext ? 'linear-gradient(180deg, #C8E6C9 0%, #66BB6A 100%)' : 'linear-gradient(180deg, #E8F5E9 0%, #A5D6A7 100%)',
        transform: isNext ? 'scale(1.08)' : 'scale(1)',
        boxShadow: isNext ? '0 6px 0 #2E7D32, 0 8px 20px rgba(0,0,0,0.15)' : '0 3px 0 #4CAF50',
        color: '#1B5E20', opacity: isNext ? 1 : 0.65, fontSize: '32px' };
      return { ...sharedStyles.button,
        background: isNext ? 'linear-gradient(180deg, #FFE57F 0%, #FFC107 100%)' : 'linear-gradient(180deg, #FFD54F 0%, #FFCA28 100%)',
        transform: isNext ? 'scale(1.08)' : 'scale(1)',
        boxShadow: isNext ? '0 6px 0 #9A7A00, 0 8px 20px rgba(0,0,0,0.15)' : '0 3px 0 #BDA03B',
        opacity: isNext ? 1 : 0.65, fontSize: '32px' };
    };

    const modeClass = focusMode ? ' focus-mode' : doodleMode ? ' doodle-mode' : voiceMode ? ' voice-mode' : '';

    return (
      <div className={`jaap-screen${modeClass}`} style={{ ...sharedStyles.container, ...fContainer, ...dContainer, ...vContainer }}
        onTouchStart={rTouchStart} onTouchMove={rTouchMove} onTouchEnd={rTouchEnd}>
        {RSwipeIndicator}
        <div style={{ ...sharedStyles.header, ...fHeader, ...dHeader, ...vHeader }}>
          <span style={{ ...sharedStyles.backBtn, ...fBack, ...dBack, ...vBack }} onClick={onBack}>‹ वापस</span>
          <strong style={{ ...sharedStyles.title, ...fTitle, ...dTitle, ...vTitle }}>राधा जाप</strong>
          <div style={sharedStyles.headerRight}>
            {!focusMode && <span style={{ ...sharedStyles.countDisplay, ...fCount, ...dCount, ...vCount, fontSize: '11px', opacity: 0.7, marginRight: '6px' }}>⏱ {fmtTime(elapsed)}</span>}
            <span style={{ ...sharedStyles.countDisplay, ...fCount, ...dCount, ...vCount }}>{currentCellIndex} / {RADHA_TOTAL}</span>
            <span style={{ ...sharedStyles.resetIcon, ...fCount, ...dCount, ...vCount }} onClick={resetProgress}>↺</span>
          </div>
        </div>
        <ProgressBar current={currentCellIndex} total={RADHA_TOTAL} focusMode={focusMode} doodleMode={doodleMode} voiceMode={voiceMode} />
        <div style={{ ...sharedStyles.grid, ...fGrid, ...dGrid, ...vGrid }} ref={scrollContainerRef}>
          {[...Array(RADHA_TOTAL)].map((_, cellIdx) => {
            const isDone = cellIdx < currentCellIndex;
            const isCurrent = cellIdx === currentCellIndex;
            return (
              <div key={cellIdx} ref={el => cellRefs.current[cellIdx] = el}
                className={isCurrent ? 'current-cell' : ''}
                style={cellStyle(isCurrent, isDone)}
              >
                {!focusMode && <MilestoneBadge cellIdx={cellIdx} />}
                {false /* was: completedImages — now always render text for consistent cells */
                  ? null
                  : <div style={{ ...sharedStyles.wordWrapper, fontSize: 'clamp(18px, 5vw, 24px)', gap: '3px' }}>
                      {/* Render full syllables so the matra is never an orphan (no dotted-circle placeholder) */}
                      <span style={{ fontWeight: 'bold', transition: 'color 0.2s ease', color: syllableColor(isDone, isCurrent, 0, currentLetterIndex) }}>रा</span>
                      <span style={{ fontWeight: 'bold', transition: 'color 0.2s ease', color: syllableColor(isDone, isCurrent, 2, currentLetterIndex) }}>धा</span>
                    </div>
                }
              </div>
            );
          })}
        </div>
        {doodleMode
          ? <DrawingCanvas onSuccess={handleDoodleSuccess} onUndo={handleUndo} canUndo={canUndo} />
          : voiceMode
          ? <VoiceCanvas onSuccess={handleDoodleSuccess} targetName="radha" />
          : <div style={{ ...sharedStyles.footer, ...fFooter }}>
              {focusMode && <BreathingGuide />}
              {RADHA_BUTTONS.map((btn, btnIdx) => {
                const isNext = btn.id === RADHA_SEQUENCE[currentLetterIndex];
                return (
                  <button key={btn.id} className="jaap-btn" onClick={() => handleInput(btn.id)}
                    style={{ ...btnStyle(isNext), position: 'relative' }}
                  >{btn.label}{isDesktop && <KbdHint label={btnIdx + 1} />}</button>
                );
              })}
            </div>
        }
        {showCompletion && (
          <CompletionModal jaapName="राधा जाप" elapsedMs={completionTime}
            onClose={handleCompletionClose} focusMode={focusMode} doodleMode={doodleMode} voiceMode={voiceMode} />
        )}
      </div>
    );
  };

  // ==================== MAIN APP ====================
  const App = () => {
    const [screen, setScreen] = useState('home');
    const [focusMode, setFocusMode] = useState(() => localStorage.getItem('focus_mode') === 'true');
    const [doodleMode, setDoodleMode] = useState(() => localStorage.getItem('doodle_mode') === 'true');
    const [voiceMode, setVoiceMode] = useState(() => localStorage.getItem('voice_mode') === 'true');
    const [customImage, setCustomImage] = useState(() => localStorage.getItem('custom_image') || DEFAULT_IMAGE);
    const [settingsOpen, setSettingsOpen] = useState(false);
    const [soundMuted, setSoundMutedState] = useState(() => localStorage.getItem('sound_muted') === 'true');

    const handleSoundMuted = (val) => {
      setSoundMutedState(val);
      localStorage.setItem('sound_muted', String(val));
      setSoundMuted(val);
    };
    // Sync on mount
    useEffect(() => { setSoundMuted(soundMuted); }, []);
    // Sync focus-mute whenever focusMode toggles
    useEffect(() => { setFocusMuted(focusMode); }, [focusMode]);

    const handleFocusMode = (val) => {
      setFocusMode(val); localStorage.setItem('focus_mode', String(val));
      if (val) {
        setDoodleMode(false); localStorage.setItem('doodle_mode', 'false');
        setVoiceMode(false); localStorage.setItem('voice_mode', 'false');
      }
    };
    const handleDoodleMode = (val) => {
      setDoodleMode(val); localStorage.setItem('doodle_mode', String(val));
      if (val) {
        setFocusMode(false); localStorage.setItem('focus_mode', 'false');
        setVoiceMode(false); localStorage.setItem('voice_mode', 'false');
      }
    };
    const handleVoiceMode = (val) => {
      setVoiceMode(val); localStorage.setItem('voice_mode', String(val));
      if (val) {
        setFocusMode(false); localStorage.setItem('focus_mode', 'false');
        setDoodleMode(false); localStorage.setItem('doodle_mode', 'false');
      }
    };
    const handleImageChange = (url) => { setCustomImage(url); localStorage.setItem('custom_image', url); };

    // Auto-detect dark mode via system preference (prefers-color-scheme)
    useEffect(() => {
      const mq = window.matchMedia('(prefers-color-scheme: dark)');
      const handler = (e) => {
        // Only auto-switch if user hasn't explicitly picked doodle or voice
        if (!doodleMode && !voiceMode) {
          handleFocusMode(e.matches);
        }
      };
      // Set initial value if no explicit mode
      if (!doodleMode && !voiceMode && localStorage.getItem('focus_mode') === null) {
        handleFocusMode(mq.matches);
      }
      mq.addEventListener('change', handler);
      return () => mq.removeEventListener('change', handler);
    }, [doodleMode, voiceMode]);

    return (
      <>
        <GlobalStyles />
        {screen === 'harivansh' ? <HarivanshJaap onBack={() => setScreen('home')} focusMode={focusMode} doodleMode={doodleMode} voiceMode={voiceMode} /> :
        screen === 'radha'     ? <RadhaJaap     onBack={() => setScreen('home')} focusMode={focusMode} doodleMode={doodleMode} voiceMode={voiceMode} /> :
        <>
          <HomeScreen onSelect={setScreen} focusMode={focusMode} doodleMode={doodleMode} voiceMode={voiceMode} customImage={customImage}
            onSettingsOpen={() => setSettingsOpen(true)} />
          <SettingsSheet open={settingsOpen} onClose={() => setSettingsOpen(false)}
            focusMode={focusMode} onFocusModeChange={handleFocusMode}
            doodleMode={doodleMode} onDoodleModeChange={handleDoodleMode}
            voiceMode={voiceMode} onVoiceModeChange={handleVoiceMode}
            customImage={customImage} onImageChange={handleImageChange}
            soundMuted={soundMuted} onSoundMutedChange={handleSoundMuted} />
        </>}
      </>
    );
  };

  // ==================== HOME STYLES ====================
  const homeStyles = {
    container: {
      display: 'flex', flexDirection: 'column',
      height: '100vh', width: '100%',
      fontFamily: "'Tiro Devanagari Sanskrit', 'Noto Sans Devanagari', 'Segoe UI', sans-serif",
      background: 'linear-gradient(160deg, #FFF8E1 0%, #FFF3E0 55%, #FFE0B2 100%)',
      overflow: 'hidden',
      userSelect: 'none', WebkitUserSelect: 'none'
    },
    header: {
      background: 'linear-gradient(135deg, #E65100 0%, #FBC02D 100%)',
      color: '#1A0A00', padding: 'clamp(14px, 4vh, 22px) 20px',
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      boxShadow: '0 4px 20px rgba(230,81,0,0.4)',
    },
    title: { fontSize: 'clamp(20px, 5vw, 26px)', fontWeight: 'bold', letterSpacing: '1px' },
    menuBtn: {
      background: 'rgba(255,255,255,0.28)', border: '1px solid rgba(255,255,255,0.45)',
      borderRadius: '10px', color: '#1A0A00', fontSize: '26px', fontWeight: 'bold',
      cursor: 'pointer', width: '40px', height: '40px', lineHeight: 1,
      display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
      padding: 0,
    },
    body: {
      flex: 1, display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      padding: '28px 28px', gap: '24px',
    },
    imageRing: {
      padding: '5px', borderRadius: '50%',
      background: 'conic-gradient(#FBC02D 0deg, #FF8F00 90deg, #FFD54F 180deg, #FF8F00 270deg, #FBC02D 360deg)',
      boxShadow: '0 0 50px rgba(251,192,45,0.6), 0 8px 36px rgba(0,0,0,0.2)',
    },
    image: {
      width: 'clamp(210px, 60vw, 300px)', height: 'clamp(210px, 60vw, 300px)',
      objectFit: 'cover', borderRadius: '50%', display: 'block',
      border: '4px solid #FFF8E1',
    },
    subtitle: {
      fontSize: 'clamp(13px, 3.8vw, 16px)', color: '#6D4C41',
      fontWeight: '500', letterSpacing: '0.5px', textAlign: 'center', margin: 0
    },
    btnGroup: { display: 'flex', flexDirection: 'column', gap: '14px', width: '100%', maxWidth: '320px' },
    btn: {
      padding: 'clamp(14px, 3.5vh, 20px) 24px',
      fontSize: 'clamp(16px, 4.2vw, 20px)', fontWeight: 'bold', color: '#1A0A00',
      background: 'linear-gradient(180deg, #FFE57F 0%, #FFC107 100%)',
      border: 'none', borderRadius: '14px', cursor: 'pointer',
      boxShadow: '0 6px 0 #B8860B, 0 10px 30px rgba(0,0,0,0.15)',
      touchAction: 'manipulation', letterSpacing: '0.5px',
      transition: 'transform 0.15s ease, box-shadow 0.15s ease',
      textAlign: 'center', lineHeight: 1.3, width: '100%',
    },
    btnSecondary: {
      background: 'linear-gradient(180deg, #FFCCBC 0%, #FF7043 100%)',
      boxShadow: '0 6px 0 #BF360C, 0 10px 30px rgba(0,0,0,0.15)',
    }
  };

  // ==================== SHARED STYLES ====================
  const sharedStyles = {
    container: {
      display: 'flex', flexDirection: 'column',
      height: '100vh', width: '100%',
      fontFamily: "'Tiro Devanagari Sanskrit', 'Noto Sans Devanagari', 'Segoe UI', sans-serif",
      background: 'linear-gradient(160deg, #FFF8E1 0%, #FFF3E0 55%, #FFE0B2 100%)',
      overflow: 'hidden', position: 'relative',
      userSelect: 'none', WebkitUserSelect: 'none'
    },
    header: {
      background: 'linear-gradient(135deg, #E65100 0%, #FBC02D 100%)',
      color: '#1A0A00', padding: 'clamp(9px, 2.5vh, 13px) 16px',
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      boxShadow: '0 4px 16px rgba(230,81,0,0.3)', flexShrink: 0, gap: '8px'
    },
    backBtn: {
      fontSize: 'clamp(12px, 3.2vw, 14px)', fontWeight: '700', cursor: 'pointer',
      padding: '5px 12px', borderRadius: '10px',
      backgroundColor: 'rgba(255,255,255,0.28)', border: '1px solid rgba(255,255,255,0.45)',
      whiteSpace: 'nowrap', transition: 'opacity 0.15s'
    },
    title: {
      fontSize: 'clamp(13px, 3.5vw, 17px)', fontWeight: 'bold', flex: 1,
      textAlign: 'center', letterSpacing: '0.5px'
    },
    headerRight: { display: 'flex', alignItems: 'center', gap: '10px' },
    countDisplay: { fontSize: 'clamp(11px, 2.8vw, 14px)', fontWeight: '700', whiteSpace: 'nowrap', opacity: 0.9 },
    resetIcon: { fontSize: '20px', cursor: 'pointer', fontWeight: 'bold', padding: '4px', opacity: 0.85 },
    grid: {
      flex: 1, overflowY: 'auto', display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))',
      padding: '12px', gap: '8px',
      background: 'transparent',
      WebkitOverflowScrolling: 'touch', overscrollBehavior: 'contain',
    },
    cell: {
      height: '60px', display: 'flex', alignItems: 'center', justifyContent: 'center',
      borderRadius: '12px', position: 'relative',
      transition: 'background-color 0.3s ease, border-color 0.3s ease',
      boxSizing: 'border-box'
    },
    wordWrapper: { display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%' },
    footer: {
      padding: '12px 16px clamp(20px, 7vh, 38px)',
      display: 'flex', flexWrap: 'wrap', justifyContent: 'center',
      gap: '10px', flexShrink: 0,
      background: 'linear-gradient(0deg, rgba(255,240,218,1) 0%, rgba(255,248,225,0.88) 100%)',
      borderTop: '1px solid rgba(251,192,45,0.4)',
    },
    button: {
      flex: '1 1 65px', maxWidth: '110px', height: '66px',
      fontSize: '22px', color: '#1A0A00', border: 'none',
      borderRadius: '14px', fontWeight: 'bold', cursor: 'pointer',
      touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
      transition: 'transform 0.15s ease, box-shadow 0.15s ease, opacity 0.15s ease'
    }
  };

  export default App;
