import React, { useState, useEffect, useRef } from 'react';
import { logger } from '../lib/TransparencyLog';
import { Activity, X } from 'lucide-react';

const styles = {
    container: {
        backgroundColor: '#09090b',
        borderTop: '1px solid #27272a',
        height: '200px',
        display: 'flex',
        flexDirection: 'column',
        fontFamily: 'monospace',
        fontSize: '12px'
    },
    header: {
        padding: '8px 16px',
        borderBottom: '1px solid #27272a',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#111114',
        color: '#94a3b8'
    },
    logArea: {
        flex: 1,
        overflowY: 'auto',
        padding: '12px',
        display: 'flex',
        flexDirection: 'column',
        gap: '4px'
    },
    logEntry: {
        display: 'flex',
        gap: '12px',
        padding: '4px 0',
        borderBottom: '1px solid #1e1e24'
    },
    timestamp: {
        color: '#52525b',
        minWidth: '70px'
    },
    method: {
        fontWeight: 'bold',
        minWidth: '40px'
    },
    url: {
        color: '#e2e8f0',
        wordBreak: 'break-all'
    },
    status: {
        marginLeft: 'auto',
        fontWeight: 'bold'
    },
    badge: {
        padding: '2px 6px',
        borderRadius: '4px',
        fontSize: '10px',
        fontWeight: 'bold'
    }
};

export default function TransparencyLog() {
    const [logs, setLogs] = useState([]);
    const bottomRef = useRef(null);

    useEffect(() => {
        // Load initial logs
        setLogs([...logger.getLogs()]);

        // Subscribe to new logs
        const unsubscribe = logger.subscribe((entry) => {
            if (entry.type === 'CLEAR') {
                setLogs([]);
            } else {
                setLogs(prev => [...prev, entry]);
            }
        });

        return unsubscribe;
    }, []);

    // Auto-scroll
    useEffect(() => {
        if (bottomRef.current) {
            bottomRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [logs]);

    const getStatusColor = (status, ok) => {
        if (status === 'pending') return '#fbbf24'; // yellow
        if (ok) return '#22c55e'; // green
        return '#ef4444'; // red
    };

    return (
        <div style={styles.container}>
            <div style={styles.header}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Activity size={14} color="#38bdf8" />
                    <span>TRANSPARENCY LOG // LIVE NETWORK ACTIVITY</span>
                </div>
                <button
                    onClick={() => logger.clear()}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#52525b' }}
                >
                    <X size={14} />
                </button>
            </div>
            <div style={styles.logArea}>
                {logs.length === 0 && (
                    <div style={{ color: '#52525b', textAlign: 'center', padding: '20px' }}>
                        Waiting for network activity...
                    </div>
                )}
                {logs.map((log) => (
                    <div key={log.id} style={styles.logEntry}>
                        <span style={styles.timestamp}>
                            {new Date(log.timestamp).toLocaleTimeString().split(' ')[0]}
                        </span>

                        {log.type === 'REQUEST' && (
                            <>
                                <span style={{ ...styles.method, color: '#38bdf8' }}>
                                    {log.method}
                                </span>
                                <span style={styles.url}>
                                    {log.url.replace('https://api.heygen.com', '')}
                                </span>
                                <span style={{ ...styles.status, color: '#fbbf24' }}>
                                    WAITING
                                </span>
                            </>
                        )}

                        {log.type === 'RESPONSE' && (
                            <>
                                <span style={{ ...styles.method, color: log.ok ? '#22c55e' : '#ef4444' }}>
                                    {log.method}
                                </span>
                                <span style={styles.url}>
                                    {log.url.replace('https://api.heygen.com', '')}
                                </span>
                                <span style={{ ...styles.status, color: log.ok ? '#22c55e' : '#ef4444' }}>
                                    {log.status}
                                </span>
                            </>
                        )}

                        {log.type === 'ERROR' && (
                            <>
                                <span style={{ ...styles.method, color: '#ef4444' }}>
                                    ERR
                                </span>
                                <span style={{ color: '#ef4444' }}>
                                    {log.source}: {log.message}
                                </span>
                            </>
                        )}
                    </div>
                ))}
                <div ref={bottomRef} />
            </div>
        </div>
    );
}
