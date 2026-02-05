import { useState, useEffect } from 'react';
import { CheckCircle, Loader2, Upload, Video, LogOut, Key } from 'lucide-react';
import AuthGate from './components/AuthGate';
import TransparencyLog from './components/TransparencyLog';
import { keyVault } from './lib/KeyVault';
import { heyGenClient } from './lib/HeyGenClient';

const NOVA_LOGO = 'https://i.imgur.com/rMYsQbN.jpeg';
const VERSION = 'v2.0.0-client';

function App() {
    // Auth State
    const [isLocked, setIsLocked] = useState(true);

    // App State
    const [script, setScript] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [statusMessage, setStatusMessage] = useState(null);
    const [imageKey, setImageKey] = useState('');
    const [isUploading, setIsUploading] = useState(false);
    const [voiceId, setVoiceId] = useState('d2499bfa8e0d471d8a623377958f75f0');
    const [voices, setVoices] = useState([]);
    const [isFetchingVoices, setIsFetchingVoices] = useState(false);
    const [speed, setSpeed] = useState(1.0);
    const [motionPrompt, setMotionPrompt] = useState(
        'Man talking on a podcast directly to the viewer holding steady eye contact with the camera.'
    );
    const [isDragActive, setIsDragActive] = useState(false);
    const [engine, setEngine] = useState('v4');

    // Initial Check
    useEffect(() => {
        const key = keyVault.getKey();
        if (key) {
            setIsLocked(false);
            fetchVoices();
        }
    }, [isLocked]); // Re-run when unlock status changes

    const handleUnlock = () => {
        setIsLocked(false);
        fetchVoices();
    };

    const handleLock = () => {
        keyVault.clearKey();
        setIsLocked(true);
        // Reset sensitive state
        setVoices([]);
        setImageKey('');
        setStatusMessage(null);
    };

    // Fetch voices
    const fetchVoices = async () => {
        setIsFetchingVoices(true);
        try {
            const data = await heyGenClient.getVoices();
            const voiceList = data.data?.voices || [];

            // Sort voices: My voices first, then by name
            const sortedVoices = voiceList.sort((a, b) => {
                if (a.type === 'custom' && b.type !== 'custom') return -1;
                if (a.type !== 'custom' && b.type === 'custom') return 1;
                return a.name.localeCompare(b.name);
            });

            setVoices(sortedVoices);
        } catch (error) {
            // Already logged by client
            if (error.message.includes('401') || error.message.includes('Unauthorized')) {
                alert('Authentication Failed: Invalid API Key. Please disconnect and try again.');
                handleLock();
                return;
            }
        } finally {
            setIsFetchingVoices(false);
        }
    };

    // Handle file upload
    const handleFileUpload = async (file) => {
        if (!file) return;

        setIsUploading(true);
        setStatusMessage('Uploading directly to HeyGen...');

        try {
            const data = await heyGenClient.uploadAsset(file);
            const key = data.data.image_key || data.data.id;
            setImageKey(key);
            setStatusMessage('Asset Secured. Key: ' + key);
        } catch (error) {
            setStatusMessage('Upload failed. See log for details.');
        } finally {
            setIsUploading(false);
        }
    };

    // File input change handler
    const onFileChange = (e) => {
        const file = e.target.files[0];
        handleFileUpload(file);
    };

    // Drag and drop handlers
    const handleDrag = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === 'dragenter' || e.type === 'dragover') {
            setIsDragActive(true);
        } else if (e.type === 'dragleave') {
            setIsDragActive(false);
        }
    };

    const handleDrop = async (e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragActive(false);

        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            const droppedFile = e.dataTransfer.files[0];
            if (droppedFile.size > 0) {
                handleFileUpload(droppedFile);
            }
        }
    };

    // Render video
    const handleRender = async () => {
        if (!script || !imageKey) {
            alert('Missing Script or Photo.');
            return;
        }

        setIsLoading(true);
        setStatusMessage('Initiating Render Sequence...');

        try {
            let payload;
            const title = `Julian Control Panel - ${new Date().toLocaleTimeString()}`;

            if (engine === 'v4') {
                // Avatar IV simplified structure
                payload = {
                    image_key: imageKey,
                    video_title: title,
                    script: script,
                    voice_id: voiceId,
                    voice_settings: {
                        speed: parseFloat(speed),
                    },
                    video_orientation: 'portrait',
                    fit: 'cover',
                    caption: false,
                    custom_motion_prompt: motionPrompt,
                    enhance_custom_motion_prompt: true,
                };
            } else {
                // Avatar III (V2 Engine) required structure
                payload = {
                    title: title,
                    video_inputs: [
                        {
                            character: {
                                type: 'talking_photo',
                                talking_photo_id: imageKey,
                            },
                            voice: {
                                type: 'text',
                                input_text: script,
                                voice_id: voiceId,
                                speed: parseFloat(speed),
                            },
                            background: {
                                type: 'color',
                                value: '#09090b', // Match app background
                            }
                        }
                    ],
                    dimension: { width: 720, height: 1280 }, // 720p Portrait (Credit efficient)
                    caption: false,
                };
            }

            const data = await heyGenClient.generateVideo(payload, engine);
            const videoId = data.data.video_id || data.data.id;
            setStatusMessage(`✅ Render started! Video ID: ${videoId}`);
        } catch (error) {
            setStatusMessage('Render Failed. See Transparency Log.');
        } finally {
            setIsLoading(false);
        }
    };

    if (isLocked) {
        return <AuthGate onUnlock={handleUnlock} />;
    }

    return (
        <div style={styles.container}>
            {/* Header */}
            <header style={styles.header}>
                <div style={styles.headerContent}>
                    <img src={NOVA_LOGO} alt="Nova Logo" style={styles.logo} />
                    <h1 style={styles.title}>
                        HeyGen API <span style={styles.titleAccent}>Control Panel</span>
                    </h1>
                </div>
                <div style={styles.subtitle}>
                    System Active
                    <button onClick={handleLock} style={styles.logoutBtn} title="Lock & Clear Key">
                        <LogOut size={14} />
                    </button>
                </div>
            </header>

            {/* Main Grid */}
            <div style={styles.mainGrid}>
                {/* Left Panel - Settings */}
                <section style={styles.settingsPanel}>
                    {/* Key Status */}
                    <div style={styles.inputGroup}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <label style={styles.label}>Active Credentials</label>
                            <button onClick={handleLock} style={{ ...styles.refreshBtn, color: '#ef4444' }}>
                                Disconnect
                            </button>
                        </div>
                        <div style={{
                            fontSize: '11px',
                            color: '#94a3b8',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            backgroundColor: '#18181b',
                            padding: '10px',
                            borderRadius: '8px',
                            border: '1px solid #27272a'
                        }}>
                            <Key size={14} color="#38bdf8" />
                            <span style={{ flex: 1, fontFamily: 'monospace' }}>••••••••••••••••••••••••</span>
                            <span style={{ color: '#22c55e', fontSize: '10px', fontWeight: 'bold' }}>ACTIVE</span>
                        </div>
                    </div>

                    {/* Photo Upload */}
                    <div style={styles.inputGroup}>
                        <label style={styles.label}>Visual Asset (Drag & Drop)</label>
                        <div
                            onDragEnter={handleDrag}
                            onDragLeave={handleDrag}
                            onDragOver={handleDrag}
                            onDrop={handleDrop}
                            style={styles.dropzoneWrapper}
                        >
                            <input
                                type="file"
                                onChange={onFileChange}
                                style={styles.hiddenInput}
                                id="photo-upload"
                                accept="image/*"
                            />
                            <label
                                htmlFor="photo-upload"
                                style={{
                                    ...styles.dropzone,
                                    border: isDragActive
                                        ? '2px solid #38bdf8'
                                        : imageKey
                                            ? '2px solid #38bdf8'
                                            : '2px dashed #27272a',
                                    backgroundColor: imageKey
                                        ? 'rgba(56, 189, 248, 0.05)'
                                        : '#09090b',
                                }}
                            >
                                {isUploading ? (
                                    <Loader2 className="animate-spin" color="#38bdf8" size={28} />
                                ) : imageKey ? (
                                    <CheckCircle size={28} color="#38bdf8" />
                                ) : (
                                    <Upload size={28} color="#27272a" />
                                )}
                                <div
                                    style={{
                                        fontSize: '13px',
                                        color: imageKey ? '#38bdf8' : '#f8fafc',
                                        marginTop: '10px'
                                    }}
                                >
                                    {imageKey ? 'Asset Secured' : 'Drop Parameter Photo'}
                                </div>
                            </label>
                        </div>
                    </div>

                    {/* Engine Selection */}
                    <div style={styles.inputGroup}>
                        <label style={styles.label}>Avatar Engine</label>
                        <div style={styles.toggleGroup}>
                            <button
                                onClick={() => setEngine('v3')}
                                style={{
                                    ...styles.toggleBtn,
                                    backgroundColor: engine === 'v3' ? '#38bdf8' : '#18181b',
                                    color: engine === 'v3' ? '#000' : '#94a3b8',
                                    border: engine === 'v3' ? '1px solid #38bdf8' : '1px solid #27272a',
                                }}
                            >
                                Avatar III
                            </button>
                            <button
                                onClick={() => setEngine('v4')}
                                style={{
                                    ...styles.toggleBtn,
                                    backgroundColor: engine === 'v4' ? '#38bdf8' : '#18181b',
                                    color: engine === 'v4' ? '#000' : '#94a3b8',
                                    border: engine === 'v4' ? '1px solid #38bdf8' : '1px solid #27272a',
                                }}
                            >
                                Avatar IV
                            </button>
                        </div>
                    </div>

                    {/* Calibration - Voice ID & Speed */}
                    <div style={styles.inputGroup}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                            <label style={styles.label}>Voice Calibration</label>
                            <button
                                onClick={() => fetchVoices()}
                                disabled={isFetchingVoices}
                                style={styles.refreshBtn}
                            >
                                {isFetchingVoices ? <Loader2 size={12} className="animate-spin" /> : 'Sync'}
                            </button>
                        </div>
                        <div style={styles.calibrationRow}>
                            <div style={styles.calibrationItem}>
                                <select
                                    value={voiceId}
                                    onChange={(e) => setVoiceId(e.target.value)}
                                    style={{ ...styles.input, fontSize: '12px' }}
                                >
                                    {voices.length === 0 && <option>Loading voices...</option>}
                                    <optgroup label="My Voices">
                                        {voices.filter(v => v.type === 'custom').map(voice => (
                                            <option key={voice.voice_id} value={voice.voice_id}>
                                                {voice.name}
                                            </option>
                                        ))}
                                    </optgroup>
                                    <optgroup label="System Voices">
                                        {voices.filter(v => v.type !== 'custom').map(voice => (
                                            <option key={voice.voice_id} value={voice.voice_id}>
                                                {voice.name} ({voice.language})
                                            </option>
                                        ))}
                                    </optgroup>
                                </select>
                            </div>
                            <div style={{ ...styles.calibrationItem, width: '80px', flex: '0 0 80px' }}>
                                <input
                                    type="number"
                                    step="0.05"
                                    value={speed}
                                    onChange={(e) => setSpeed(e.target.value)}
                                    style={{ ...styles.input, fontSize: '12px' }}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Motion Prompt */}
                    <div style={{ ...styles.inputGroup, opacity: engine === 'v4' ? 1 : 0.4, pointerEvents: engine === 'v4' ? 'auto' : 'none' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <label style={styles.label}>Motion Prompt</label>
                            {engine === 'v3' && <span style={{ fontSize: '9px', color: '#52525b' }}>(V4 ONLY)</span>}
                        </div>
                        <textarea
                            rows={3}
                            value={motionPrompt}
                            onChange={(e) => setMotionPrompt(e.target.value)}
                            style={styles.motionTextarea}
                            placeholder={engine === 'v4' ? "Describe desired motion..." : "Motion prompts not supported in V3"}
                        />
                    </div>
                </section>

                {/* Right Panel - Script & Render */}
                <section style={styles.scriptPanel}>
                    <div style={styles.scriptHeader}>
                        <label style={styles.label}>Sequence Script</label>
                        <span style={styles.charCount}>{script.length} chars</span>
                    </div>
                    <textarea
                        value={script}
                        onChange={(e) => setScript(e.target.value)}
                        placeholder="Enter the generation script..."
                        style={styles.scriptTextarea}
                    />

                    <button
                        onClick={handleRender}
                        disabled={isLoading || !script || !imageKey}
                        style={{
                            ...styles.renderButton,
                            backgroundColor:
                                isLoading || !script || !imageKey ? '#1e1e24' : '#38bdf8',
                            color: isLoading ? '#52525b' : '#000',
                            cursor:
                                isLoading || !script || !imageKey ? 'not-allowed' : 'pointer',
                        }}
                    >
                        {isLoading ? (
                            <Loader2 className="animate-spin" size={20} />
                        ) : (
                            <Video size={20} />
                        )}
                        {isLoading ? 'Processing...' : 'Generate Sequence'}
                    </button>
                </section>
            </div>

            {/* Status Feedback */}
            {statusMessage && (
                <div style={{
                    ...styles.statusMessage,
                    color: statusMessage.includes('Failed') ? '#ef4444' : '#38bdf8',
                    borderColor: statusMessage.includes('Failed') ? '#ef4444' : '#38bdf8'
                }}>
                    {statusMessage}
                </div>
            )}

            {/* Footer Transparency Log - Fixed at bottom */}
            <div style={styles.footerLog}>
                <TransparencyLog />
            </div>

            <div style={{ height: '200px' }}></div>
        </div>
    );
}

// Styles
const styles = {
    container: {
        padding: '20px',
        maxWidth: '1000px',
        margin: '0 auto',
        fontFamily: 'Inter, sans-serif',
        backgroundColor: '#09090b',
        color: '#f8fafc',
        minHeight: '100vh',
        position: 'relative'
    },
    header: {
        marginBottom: '30px',
        textAlign: 'center',
        borderBottom: '1px solid #1e293b',
        paddingBottom: '20px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
    },
    headerContent: {
        display: 'flex',
        alignItems: 'center',
        gap: '15px',
    },
    logo: {
        width: '40px',
        height: '40px',
        borderRadius: '8px',
        border: '1px solid #38bdf8',
    },
    title: {
        fontSize: '24px',
        fontWeight: '800',
        color: '#f8fafc',
        margin: 0,
    },
    titleAccent: {
        color: '#38bdf8',
    },
    subtitle: {
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        color: '#64748b',
        fontSize: '11px',
        textTransform: 'uppercase',
    },
    logoutBtn: {
        background: 'none',
        border: '1px solid #27272a',
        padding: '8px',
        borderRadius: '6px',
        color: '#ef4444',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center'
    },
    mainGrid: {
        display: 'grid',
        gridTemplateColumns: '300px 1fr',
        gap: '24px',
    },
    settingsPanel: {
        display: 'flex',
        flexDirection: 'column',
        gap: '20px',
        backgroundColor: '#111114',
        padding: '20px',
        borderRadius: '16px',
        border: '1px solid #1e1e24',
    },
    toggleGroup: {
        display: 'flex',
        gap: '8px',
        backgroundColor: '#09090b',
        padding: '4px',
        borderRadius: '10px',
        border: '1px solid #27272a',
    },
    toggleBtn: {
        flex: 1,
        padding: '8px',
        borderRadius: '6px',
        fontSize: '11px',
        fontWeight: '700',
        cursor: 'pointer',
        transition: 'all 0.2s',
        border: 'none',
    },
    inputGroup: {
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
    },
    label: {
        fontSize: '10px',
        fontWeight: '700',
        color: '#52525b',
        textTransform: 'uppercase',
    },
    refreshBtn: {
        background: 'none',
        border: 'none',
        color: '#38bdf8',
        fontSize: '10px',
        cursor: 'pointer',
    },
    input: {
        padding: '10px',
        borderRadius: '8px',
        border: '1px solid #27272a',
        backgroundColor: '#09090b',
        color: 'white',
        fontSize: '13px',
        outline: 'none',
        width: '100%',
    },
    hiddenInput: {
        display: 'none',
    },
    dropzone: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '30px 10px',
        borderRadius: '8px',
        cursor: 'pointer',
        transition: 'all 0.2s',
        textAlign: 'center',
    },
    calibrationRow: {
        display: 'flex',
        gap: '10px',
    },
    calibrationItem: {
        flex: 1,
    },
    motionTextarea: {
        padding: '10px',
        borderRadius: '8px',
        border: '1px solid #27272a',
        backgroundColor: '#09090b',
        color: 'white',
        fontSize: '11px',
        lineHeight: '1.5',
        resize: 'vertical',
        outline: 'none',
    },
    scriptPanel: {
        display: 'flex',
        flexDirection: 'column',
        gap: '15px',
    },
    scriptHeader: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    charCount: {
        fontSize: '10px',
        color: '#52525b',
    },
    scriptTextarea: {
        flex: 1,
        padding: '20px',
        borderRadius: '16px',
        border: '1px solid #1e1e24',
        backgroundColor: '#111114',
        color: 'white',
        fontSize: '15px',
        resize: 'none',
        lineHeight: '1.6',
        minHeight: '350px',
        outline: 'none',
    },
    renderButton: {
        padding: '16px',
        borderRadius: '12px',
        border: 'none',
        fontWeight: '800',
        fontSize: '14px',
        textTransform: 'uppercase',
        letterSpacing: '1px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '12px',
        transition: 'all 0.2s ease',
    },
    statusMessage: {
        marginTop: '20px',
        padding: '14px',
        borderRadius: '12px',
        border: '1px solid',
        fontSize: '13px',
        fontFamily: 'monospace',
        backgroundColor: 'rgba(0,0,0,0.3)',
        textAlign: 'center'
    },
    footerLog: {
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 40,
        boxShadow: '0 -20px 40px rgba(0,0,0,0.5)'
    }
};

export default App;
