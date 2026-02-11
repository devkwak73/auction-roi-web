'use client';

import { useEffect } from 'react';

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title?: string;
    message: string;
    type?: 'success' | 'error' | 'info';
}

export default function Modal({ isOpen, onClose, title, message, type = 'info' }: ModalProps) {
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isOpen]);

    if (!isOpen) return null;

    const getIcon = () => {
        switch (type) {
            case 'success':
                return '✅';
            case 'error':
                return '❌';
            default:
                return 'ℹ️';
        }
    };

    const getColor = () => {
        switch (type) {
            case 'success':
                return '#10b981';
            case 'error':
                return '#ef4444';
            default:
                return 'var(--primary)';
        }
    };

    return (
        <div
            style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: 'rgba(0, 0, 0, 0.7)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 9999,
                padding: '20px'
            }}
            onClick={onClose}
        >
            <div
                className="card"
                style={{
                    maxWidth: '400px',
                    width: '100%',
                    padding: '32px',
                    textAlign: 'center',
                    animation: 'modalSlideIn 0.3s ease-out'
                }}
                onClick={(e) => e.stopPropagation()}
            >
                <div style={{ fontSize: '48px', marginBottom: '16px' }}>{getIcon()}</div>
                {title && (
                    <h2 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '12px', color: 'var(--foreground)' }}>
                        {title}
                    </h2>
                )}
                <p style={{ fontSize: '15px', color: 'var(--muted)', marginBottom: '24px', lineHeight: '1.6' }}>
                    {message}
                </p>
                <button
                    className="button button-primary"
                    onClick={onClose}
                    style={{
                        width: '100%',
                        padding: '14px',
                        backgroundColor: getColor(),
                        borderColor: getColor()
                    }}
                >
                    확인
                </button>
            </div>

            <style jsx>{`
                @keyframes modalSlideIn {
                    from {
                        opacity: 0;
                        transform: translateY(-20px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }
            `}</style>
        </div>
    );
}
