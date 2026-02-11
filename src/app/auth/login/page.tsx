'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';

export default function LoginPage() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');
    
    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setErrorMsg('');
        
        try {
            // 아이디를 이메일 형식으로 변환
            const email = `${username}@auction.local`;
            
            const { data, error } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (error) {
                setErrorMsg('아이디 또는 비밀번호가 올바르지 않습니다.');
                setLoading(false);
            } else {
                window.location.href = '/';
            }
        } catch (err: unknown) {
            console.error('Login error:', err);
            const message = err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.';
            setErrorMsg('시스템 오류가 발생했습니다: ' + message);
            setLoading(false);
        }
    };

    return (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', padding: '20px' }}>
            <div className="card" style={{ width: '100%', maxWidth: '400px' }}>
                <h1 className="title" style={{ textAlign: 'center', fontSize: '28px' }}>로그인</h1>
                <p style={{ color: '#94a3b8', textAlign: 'center', marginBottom: '32px' }}>
                    서비스 이용을 위해 로그인해주세요.
                </p>

                <form onSubmit={handleLogin}>
                    <label className="label">아이디</label>
                    <input
                        type="text"
                        className="input-field"
                        placeholder="아이디를 입력하세요"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        required
                    />

                    <label className="label">비밀번호</label>
                    <input
                        type="password"
                        className="input-field"
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                    />

                    <button type="submit" className="button button-primary" style={{ width: '100%', marginTop: '16px' }} disabled={loading}>
                        {loading ? '로그인 중...' : '로그인'}
                    </button>
                </form>

                <p style={{ textAlign: 'center', marginTop: '24px', fontSize: '14px', color: '#94a3b8' }}>
                    계정이 없으신가요? <Link href="/auth/signup" style={{ color: '#6366f1', fontWeight: 600 }}>회원가입</Link>
                </p>

                {errorMsg && (
                    <div style={{ 
                        marginTop: '20px', 
                        padding: '12px', 
                        borderRadius: '8px', 
                        backgroundColor: 'rgba(239, 68, 68, 0.1)',
                        color: '#ef4444',
                        fontSize: '14px',
                        textAlign: 'center'
                    }}>
                        {errorMsg}
                    </div>
                )}
            </div>
        </div>
    );
}
