'use client';

import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

export default function WaitingApprovalPage() {
    const router = useRouter();

    const handleLogout = async () => {
        await supabase.auth.signOut();
        router.push('/auth/login');
    };

    return (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', padding: '20px' }}>
            <div className="card" style={{ width: '100%', maxWidth: '500px', textAlign: 'center' }}>
                <div style={{ fontSize: '48px', marginBottom: '24px' }}>⏳</div>
                <h1 className="title">승인 대기 중</h1>
                <p style={{ color: 'var(--muted)', marginBottom: '32px', lineHeight: '1.6' }}>
                    계정 생성이 완료되었습니다.<br />
                    관리자가 가입을 승인한 후에 서비스를 이용하실 수 있습니다.<br />
                    잠시만 기다려 주세요.
                </p>

                <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
                    <button onClick={() => window.location.reload()} className="button button-primary">
                        새로고침하여 상태 확인
                    </button>
                    <button onClick={handleLogout} className="button button-secondary">
                        로그아웃
                    </button>
                </div>
            </div>
        </div>
    );
}
