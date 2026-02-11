'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';

export default function SignupPage() {
    const [name, setName] = useState('');
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [checkingUsername, setCheckingUsername] = useState(false);
    const [usernameChecked, setUsernameChecked] = useState(false);
    const [usernameAvailable, setUsernameAvailable] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');
    const [successMsg, setSuccessMsg] = useState('');

    // 아이디 유효성 검사 (영어, 숫자만 허용, 4-20자)
    const validateUsername = (username: string): boolean => {
        const regex = /^[a-zA-Z0-9]{4,20}$/;
        return regex.test(username);
    };

    // 아이디 중복 확인
    const handleCheckUsername = async () => {
        if (!username) {
            setErrorMsg('아이디를 입력해주세요.');
            return;
        }

        if (!validateUsername(username)) {
            setErrorMsg('아이디는 영어와 숫자만 사용 가능하며, 4-20자여야 합니다.');
            return;
        }

        setCheckingUsername(true);
        setErrorMsg('');

        try {
            // profiles 테이블에서 username 중복 확인
            const { data, error } = await supabase
                .from('profiles')
                .select('username')
                .eq('username', username)
                .single();

            if (error && error.code === 'PGRST116') {
                // 데이터가 없으면 사용 가능
                setUsernameAvailable(true);
                setUsernameChecked(true);
                setSuccessMsg('사용 가능한 아이디입니다.');
            } else if (data) {
                // 데이터가 있으면 중복
                setUsernameAvailable(false);
                setUsernameChecked(true);
                setErrorMsg('이미 사용 중인 아이디입니다.');
            }
        } catch (err) {
            console.error('Username check error:', err);
            setErrorMsg('아이디 확인 중 오류가 발생했습니다.');
        } finally {
            setCheckingUsername(false);
        }
    };

    const handleSignup = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setErrorMsg('');
        setSuccessMsg('');

        // 아이디 중복 확인 여부 체크
        if (!usernameChecked || !usernameAvailable) {
            setErrorMsg('아이디 중복 확인을 해주세요.');
            setLoading(false);
            return;
        }

        // 비밀번호 확인
        if (password !== confirmPassword) {
            setErrorMsg('비밀번호가 일치하지 않습니다.');
            setLoading(false);
            return;
        }

        // 비밀번호 길이 확인
        if (password.length < 6) {
            setErrorMsg('비밀번호는 최소 6자 이상이어야 합니다.');
            setLoading(false);
            return;
        }

        try {
            // 아이디를 이메일 형식으로 변환 (Supabase Auth는 이메일 필수)
            const email = `${username}@auction.local`;

            // 1. Supabase Auth에 사용자 등록 (메타데이터 포함)
            const { data: authData, error: authError } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    data: {
                        name: name,
                        username: username,
                        house_count: 1,
                        is_business: false
                    }
                }
            });

            if (authError) {
                setErrorMsg(authError.message);
                setLoading(false);
                return;
            }

            // 2. profiles 테이블 업데이트 로직 제거 (Trigger로 자동 처리됨)
            // 수동 업데이트 시 RLS 및 권한 문제로 실패할 수 있음
            /*
            if (authData.user) {
                const { error: profileError } = await supabase
                    .from('profiles')
                    .upsert({ ... }, { onConflict: 'id' });

                if (profileError) { ... }
            }
            */

            setSuccessMsg('회원가입이 완료되었습니다! 로그인 페이지로 이동합니다...');
            
            // 2초 후 로그인 페이지로 이동
            setTimeout(() => {
                window.location.href = '/auth/login';
            }, 2000);

        } catch (err: unknown) {
            console.error('Signup error:', err);
            const message = err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.';
            setErrorMsg('시스템 오류가 발생했습니다: ' + message);
            setLoading(false);
        }
    };

    return (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', padding: '20px' }}>
            <div className="card" style={{ width: '100%', maxWidth: '400px' }}>
                <h1 className="title" style={{ textAlign: 'center', fontSize: '28px' }}>회원가입</h1>
                <p style={{ color: '#94a3b8', textAlign: 'center', marginBottom: '32px' }}>
                    경매도우미 서비스에 가입하세요.
                </p>

                <form onSubmit={handleSignup}>
                    <label className="label">기수 + 이름</label>
                    <input
                        type="text"
                        className="input-field"
                        placeholder="예: 1기 홍길동"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                    />

                    <label className="label">아이디</label>
                    <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
                        <input
                            type="text"
                            className="input-field"
                            placeholder="영어, 숫자 4-20자"
                            value={username}
                            onChange={(e) => {
                                setUsername(e.target.value);
                                setUsernameChecked(false);
                                setUsernameAvailable(false);
                                setErrorMsg('');
                                setSuccessMsg('');
                            }}
                            required
                            style={{ flex: 1, marginBottom: 0 }}
                        />
                        <button
                            type="button"
                            onClick={handleCheckUsername}
                            disabled={checkingUsername || !username}
                            className="button"
                            style={{
                                padding: '0 16px',
                                backgroundColor: usernameChecked && usernameAvailable ? 'rgba(16, 185, 129, 0.1)' : 'rgba(129, 140, 248, 0.1)',
                                color: usernameChecked && usernameAvailable ? '#10b981' : '#818cf8',
                                border: usernameChecked && usernameAvailable ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid rgba(129, 140, 248, 0.3)',
                                whiteSpace: 'nowrap'
                            }}
                        >
                            {checkingUsername ? '확인 중...' : usernameChecked && usernameAvailable ? '확인 완료' : '중복 확인'}
                        </button>
                    </div>

                    <label className="label">패스워드</label>
                    <input
                        type="password"
                        className="input-field"
                        placeholder="최소 6자 이상"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                    />

                    <label className="label">패스워드 확인</label>
                    <input
                        type="password"
                        className="input-field"
                        placeholder="패스워드를 다시 입력하세요"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                    />

                    <button type="submit" className="button button-primary" style={{ width: '100%', marginTop: '16px' }} disabled={loading}>
                        {loading ? '가입 중...' : '회원가입'}
                    </button>
                </form>

                <p style={{ textAlign: 'center', marginTop: '24px', fontSize: '14px', color: '#94a3b8' }}>
                    이미 계정이 있으신가요? <Link href="/auth/login" style={{ color: '#6366f1', fontWeight: 600 }}>로그인</Link>
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

                {successMsg && !errorMsg && (
                    <div style={{ 
                        marginTop: '20px', 
                        padding: '12px', 
                        borderRadius: '8px', 
                        backgroundColor: 'rgba(16, 185, 129, 0.1)',
                        color: '#10b981',
                        fontSize: '14px',
                        textAlign: 'center'
                    }}>
                        {successMsg}
                    </div>
                )}
            </div>
        </div>
    );
}
