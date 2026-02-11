'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');
    const router = useRouter();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setErrorMsg('');

        const { error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        if (error) {
            setErrorMsg(error.message);
            setLoading(false);
        } else {
            router.push('/');
            router.refresh();
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
                        {loading ? '로그인 중...' : '로그인'}
                    </button>
                </form>

                <p style={{ textAlign: 'center', marginTop: '24px', fontSize: '14px', color: '#94a3b8' }}>
                    계정이 없으신가요? <Link href="/auth/signup" style={{ color: '#6366f1', fontWeight: 600 }}>회원가입 신청</Link>
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
