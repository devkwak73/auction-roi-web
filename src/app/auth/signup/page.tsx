'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';

export default function SignupPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');

    const handleSignup = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setMessage('');

        const { error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                emailRedirectTo: `${window.location.origin}/auth/callback`,
            },
        });

        if (error) {
            setMessage(`오류: ${error.message}`);
        } else {
            setMessage('가입 신청이 완료되었습니다. 관리자 승인 후 이용 가능합니다.');
        }
        setLoading(false);
    };

    return (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', padding: '20px' }}>
            <div className="card" style={{ width: '100%', maxWidth: '400px' }}>
                <h1 className="title" style={{ textAlign: 'center', fontSize: '28px' }}>회원가입</h1>
                <p style={{ color: '#94a3b8', textAlign: 'center', marginBottom: '32px' }}>
                    경매 수익률 분석기 신청
                </p>

                <form onSubmit={handleSignup}>
                    <label className="label">이메일</label>
                    <input
                        type="email"
                        className="input-field"
                        placeholder="example@email.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
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
                        {loading ? '처리 중...' : '회원가입 신청'}
                    </button>
                </form>

                <p style={{ textAlign: 'center', marginTop: '24px', fontSize: '14px', color: '#94a3b8' }}>
                    이미 계정이 있나요? <Link href="/auth/login" style={{ color: '#6366f1', fontWeight: 600 }}>로그인</Link>
                </p>

                {message && (
                    <div style={{ 
                        marginTop: '20px', 
                        padding: '12px', 
                        borderRadius: '8px', 
                        backgroundColor: message.includes('오류') ? 'rgba(239, 68, 68, 0.1)' : 'rgba(16, 185, 129, 0.1)',
                        color: message.includes('오류') ? '#ef4444' : '#10b981',
                        fontSize: '14px',
                        textAlign: 'center'
                    }}>
                        {message}
                    </div>
                )}
            </div>
        </div>
    );
}
