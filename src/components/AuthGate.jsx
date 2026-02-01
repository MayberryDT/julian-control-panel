import React, { useState, useEffect } from 'react';
import { Shield, ShieldAlert, Key, Terminal, Wifi } from 'lucide-react';
import { keyVault } from '../lib/KeyVault';

const styles = {
    overlay: {
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: '#09090b',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 50
    },
    card: {
        backgroundColor: '#111114',
        border: '1px solid #27272a',
        borderRadius: '16px',
        padding: '40px',
        maxWidth: '450px',
        width: '100%',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
    },
    header: {
        textAlign: 'center',
        marginBottom: '32px'
    },
    logo: {
        width: '48px',
        height: '48px',
        borderRadius: '12px',
        marginBottom: '16px',
        border: '1px solid #38bdf8'
    },
    title: {
        fontSize: '24px',
        fontWeight: 'bold',
        color: '#f8fafc',
        marginBottom: '8px'
    },
    subtitle: {
        color: '#94a3b8',
        fontSize: '14px',
        lineHeight: '1.5'
    },
    inputGroup: {
        marginBottom: '24px'
    },
    input: {
        width: '100%',
        padding: '14px',
        backgroundColor: '#09090b',
        border: '1px solid #27272a',
        borderRadius: '8px',
        color: 'white',
        fontSize: '14px',
        marginBottom: '12px',
        outline: 'none',
        transition: 'border-color 0.2s'
    },
    checkboxRow: {
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        color: '#94a3b8',
        fontSize: '13px'
    },
    button: {
        width: '100%',
        padding: '14px',
        backgroundColor: '#38bdf8',
        color: '#09090b',
        border: 'none',
        borderRadius: '8px',
        fontWeight: 'bold',
        fontSize: '14px',
        cursor: 'pointer',
        transition: 'opacity 0.2s'
    },
    features: {
        marginTop: '32px',
        paddingTop: '24px',
        borderTop: '1px solid #27272a'
    },
    featureItem: {
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        fontSize: '13px',
        color: '#94a3b8',
        marginBottom: '12px'
    }
};

export default function AuthGate({ onUnlock }) {
    const [key, setKey] = useState('');
    const [remember, setRemember] = useState(false);

    const handleUnlock = () => {
        if (!key.trim()) return;

        // Save to vault
        keyVault.setKey(key.trim(), remember);

        // Notify parent
        onUnlock();
    };

    return (
        <div style={styles.overlay}>
            <div style={styles.card}>
                <div style={styles.header}>
                    <img src="https://i.imgur.com/rMYsQbN.jpeg" alt="Logo" style={styles.logo} />
                    <h2 style={styles.title}>HeyGen API Control Panel</h2>
                    <p style={styles.subtitle}>
                        Secure, client-side video generation.
                        <br />
                        Your key never leaves your browser.
                    </p>
                </div>

                <div style={styles.inputGroup}>
                    <input
                        type="password"
                        placeholder="Paste HeyGen API Key"
                        style={styles.input}
                        value={key}
                        onChange={(e) => setKey(e.target.value)}
                    />
                    <label style={styles.checkboxRow}>
                        <input
                            type="checkbox"
                            checked={remember}
                            onChange={(e) => setRemember(e.target.checked)}
                        />
                        Remember on this device
                    </label>
                </div>

                <button
                    style={{ ...styles.button, opacity: key ? 1 : 0.5 }}
                    onClick={handleUnlock}
                    disabled={!key}
                >
                    Unlock Interface
                </button>

                <div style={styles.features}>
                    <div style={styles.featureItem}>
                        <Shield size={16} color="#38bdf8" />
                        <span>Client-side only. No backend storage.</span>
                    </div>
                    <div style={styles.featureItem}>
                        <Wifi size={16} color="#38bdf8" />
                        <span>Connects directly to api.heygen.com</span>
                    </div>
                    <div style={styles.featureItem}>
                        <Terminal size={16} color="#38bdf8" />
                        <span>Transparency Log enabled</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
