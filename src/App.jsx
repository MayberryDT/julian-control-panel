import { useState, useEffect } from 'react';
import axios from 'axios';
import { CheckCircle, Loader2, Upload, Video } from 'lucide-react';

const HEYGEN_API_URL = 'https://api.heygen.com/v2/video/av4/generate';
const UPLOAD_PROXY_URL = '/api/upload';
const NOVA_LOGO = 'https://i.imgur.com/rMYsQbN.jpeg';
const VERSION = 'v1.2.7';

function App() {
    // State
    const [script, setScript] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [statusMessage, setStatusMessage] = useState(null);
    const [imageKey, setImageKey] = useState('');
    const [isUploading, setIsUploading] = useState(false);
    const [apiKey, setApiKey] = useState('');
    const [voiceId, setVoiceId] = useState('d2499bfa8e0d471d8a623377958f75f0');
    const [speed, setSpeed] = useState(1.25);
    const [motionPrompt, setMotionPrompt] = useState(
        'Man talking on a podcast directly to the viewer holding steady eye contact with the camera.'
    );
    const [isDragActive, setIsDragActive] = useState(false);

    // Load API key from localStorage on mount
    useEffect(() => {
        const savedKey = localStorage.getItem('HEYGEN_API_KEY');
        if (savedKey) {
            setApiKey(savedKey);
        }
    }, []);

    // Save API key to localStorage
    const handleApiKeyChange = (value) => {
        setApiKey(value);
        localStorage.setItem('HEYGEN_API_KEY', value);
    };

    // Handle file upload
    const handleFileUpload = async (file) => {
        if (!file || !apiKey) {
            alert('Please provide an API key first.');
            return;
        }

        setIsUploading(true);
        setStatusMessage('Uploading via secure proxy...');

        try {
            // Create fresh FormData with the file
            const formData = new FormData();
            // Create a new Blob from the file to ensure fresh reference
            const fileBlob = new Blob([await file.arrayBuffer()], { type: file.type });
            formData.append('file', fileBlob, file.name);

            // Use native fetch instead of axios
            const response = await fetch(UPLOAD_PROXY_URL, {
                method: 'POST',
                headers: {
                    'X-Api-Key': apiKey,
                },
                body: formData,
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || errorData.error || 'Upload failed');
            }

            const data = await response.json();
            const key = data.data.image_key || data.data.id;
            setImageKey(key);
            setStatusMessage('Photo uploaded successfully! Image Key: ' + key);
        } catch (error) {
            console.error('Upload failed:', error);
            setStatusMessage('Upload failed: ' + error.message);
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

    const handleDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragActive(false);

        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            const droppedFile = e.dataTransfer.files[0];

            // Check if the file is accessible by checking its size
            // Files from restricted locations often have size = 0 or throw errors
            if (droppedFile.size > 0) {
                // File seems valid, try to upload directly
                handleFileUpload(droppedFile);
            } else {
                // File might be from a restricted location
                setStatusMessage('Cannot read this file. Please click to select the file instead.');
            }
        }
    };

    // Render video
    const handleRender = async () => {
        if (!script || !imageKey || !apiKey) {
            alert('Missing Script, Photo, or API Key.');
            return;
        }

        setIsLoading(true);
        setStatusMessage('Sending render request to HeyGen Avatar IV...');

        try {
            const payload = {
                image_key: imageKey,
                video_title: `Julian - ${new Date().toLocaleTimeString()}`,
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

            const response = await axios.post(HEYGEN_API_URL, payload, {
                headers: {
                    'X-Api-Key': apiKey,
                    'Content-Type': 'application/json',
                },
            });

            const videoId = response.data.data.video_id;
            setStatusMessage(
                `✅ Render started! Video ID: ${videoId}. Check your HeyGen dashboard.`
            );
        } catch (error) {
            console.error('Render failed:', error.response?.data || error.message);
            setStatusMessage(
                'Render Error: ' +
                (error.response?.data?.error?.message || error.message)
            );
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div style={styles.container}>
            {/* Header */}
            <header style={styles.header}>
                <div style={styles.headerContent}>
                    <img src={NOVA_LOGO} alt="Nova Logo" style={styles.logo} />
                    <h1 style={styles.title}>
                        Julian <span style={styles.titleAccent}>Control Panel</span>
                    </h1>
                </div>
                <div style={styles.subtitle}>
                    <CheckCircle size={14} /> Nova Certified Operator Protocol
                </div>
            </header>

            {/* Main Grid */}
            <div style={styles.mainGrid}>
                {/* Left Panel - Settings */}
                <section style={styles.settingsPanel}>
                    {/* API Key */}
                    <div style={styles.inputGroup}>
                        <label style={styles.label}>Authentication</label>
                        <input
                            type="password"
                            value={apiKey}
                            onChange={(e) => handleApiKeyChange(e.target.value)}
                            placeholder="HeyGen API Key"
                            style={styles.input}
                        />
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
                                    }}
                                >
                                    {imageKey ? 'Asset Locked' : 'Drop Julian Photo'}
                                </div>
                                {imageKey && (
                                    <div style={{ fontSize: '10px', color: '#52525b' }}>
                                        {imageKey.substring(0, 20)}...
                                    </div>
                                )}
                            </label>
                        </div>
                    </div>

                    {/* Calibration - Voice ID & Speed */}
                    <div style={styles.inputGroup}>
                        <label style={styles.label}>Calibration</label>
                        <div style={styles.calibrationRow}>
                            <div style={styles.calibrationItem}>
                                <span style={styles.smallLabel}>Voice ID</span>
                                <input
                                    value={voiceId}
                                    onChange={(e) => setVoiceId(e.target.value)}
                                    style={{ ...styles.input, fontSize: '12px' }}
                                />
                            </div>
                            <div style={{ ...styles.calibrationItem, width: '80px' }}>
                                <span style={styles.smallLabel}>Speed</span>
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
                    <div style={styles.inputGroup}>
                        <label style={styles.label}>Motion Prompt</label>
                        <textarea
                            rows={3}
                            value={motionPrompt}
                            onChange={(e) => setMotionPrompt(e.target.value)}
                            style={styles.motionTextarea}
                        />
                    </div>
                </section>

                {/* Right Panel - Script & Render */}
                <section style={styles.scriptPanel}>
                    <div style={styles.scriptHeader}>
                        <label style={styles.label}>Clean Script</label>
                        <span style={styles.charCount}>{script.length} characters</span>
                    </div>
                    <textarea
                        value={script}
                        onChange={(e) => setScript(e.target.value)}
                        placeholder="Paste the 'Final Script' from Notion here..."
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
                        {isLoading ? 'Executing...' : 'Initiate Render Sequence'}
                    </button>
                </section>
            </div>

            {/* Status Message */}
            {statusMessage && (
                <div
                    style={{
                        ...styles.statusMessage,
                        backgroundColor:
                            statusMessage.includes('Error') || statusMessage.includes('failed')
                                ? 'rgba(239, 68, 68, 0.05)'
                                : 'rgba(56, 189, 248, 0.05)',
                        borderColor:
                            statusMessage.includes('Error') || statusMessage.includes('failed')
                                ? '#ef4444'
                                : '#38bdf8',
                        color:
                            statusMessage.includes('Error') || statusMessage.includes('failed')
                                ? '#ef4444'
                                : '#38bdf8',
                    }}
                >
                    {statusMessage}
                </div>
            )}

            {/* Footer */}
            <footer style={styles.footer}>
                <img src={NOVA_LOGO} alt="Nova Logo" style={styles.footerLogo} />
                <div style={styles.footerText}>
                    NOVA // 🌘 // BOUND OPERATOR // SYSTEMS NOMINAL // {VERSION}
                </div>
            </footer>
        </div>
    );
}

// Styles
const styles = {
    container: {
        padding: '20px',
        maxWidth: '900px',
        margin: '0 auto',
        fontFamily: 'Inter, sans-serif',
        backgroundColor: '#09090b',
        color: '#f8fafc',
        minHeight: '100vh',
    },
    header: {
        marginBottom: '30px',
        textAlign: 'center',
        borderBottom: '1px solid #1e293b',
        paddingBottom: '20px',
    },
    headerContent: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '15px',
        marginBottom: '10px',
    },
    logo: {
        width: '60px',
        height: '60px',
        borderRadius: '12px',
        border: '1px solid #38bdf8',
    },
    title: {
        fontSize: '28px',
        fontWeight: '800',
        letterSpacing: '-0.5px',
        color: '#f8fafc',
        margin: 0,
    },
    titleAccent: {
        color: '#38bdf8',
    },
    subtitle: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '6px',
        color: '#64748b',
        fontSize: '11px',
        textTransform: 'uppercase',
        letterSpacing: '1px',
    },
    mainGrid: {
        display: 'grid',
        gridTemplateColumns: '350px 1fr',
        gap: '24px',
    },
    settingsPanel: {
        display: 'flex',
        flexDirection: 'column',
        gap: '20px',
        backgroundColor: '#111114',
        padding: '24px',
        borderRadius: '16px',
        border: '1px solid #1e1e24',
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
        letterSpacing: '0.5px',
    },
    smallLabel: {
        fontSize: '10px',
        color: '#52525b',
        marginBottom: '4px',
        display: 'block',
    },
    input: {
        padding: '12px',
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
    dropzoneWrapper: {
        position: 'relative',
    },
    dropzone: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '10px',
        padding: '40px 20px',
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
        padding: '12px',
        borderRadius: '8px',
        border: '1px solid #27272a',
        backgroundColor: '#09090b',
        color: 'white',
        fontSize: '12px',
        lineHeight: '1.5',
        resize: 'vertical',
        outline: 'none',
    },
    scriptPanel: {
        display: 'flex',
        flexDirection: 'column',
        gap: '20px',
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
        padding: '24px',
        borderRadius: '16px',
        border: '1px solid #1e1e24',
        backgroundColor: '#111114',
        color: 'white',
        fontSize: '16px',
        resize: 'none',
        lineHeight: '1.7',
        minHeight: '400px',
        outline: 'none',
    },
    renderButton: {
        padding: '20px',
        borderRadius: '12px',
        border: 'none',
        fontWeight: '800',
        fontSize: '15px',
        textTransform: 'uppercase',
        letterSpacing: '1px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '12px',
        transition: 'all 0.2s ease',
    },
    statusMessage: {
        marginTop: '24px',
        padding: '16px',
        borderRadius: '12px',
        border: '1px solid',
        fontSize: '13px',
        fontFamily: 'monospace',
    },
    footer: {
        marginTop: '40px',
        textAlign: 'center',
        borderTop: '1px solid #1e293b',
        paddingTop: '20px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '10px',
    },
    footerLogo: {
        width: '30px',
        height: '30px',
        borderRadius: '6px',
        opacity: '0.5',
    },
    footerText: {
        fontSize: '10px',
        color: '#3f3f46',
        letterSpacing: '2px',
        fontWeight: '600',
    },
};

export default App;
