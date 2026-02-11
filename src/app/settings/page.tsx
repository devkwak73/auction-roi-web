'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import Modal from '@/components/Modal';

export default function SettingsPage() {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [modal, setModal] = useState<{ isOpen: boolean; type: 'success' | 'error'; message: string }>({ 
        isOpen: false, 
        type: 'success', 
        message: '' 
    });
    const [profile, setProfile] = useState({
        name: '', 
        house_count: 1,
        is_business: false,
        previous_year_profit: '0',
        current_year_profit: '0'
    });
    
    // 비밀번호 변경 관련 상태
    const [passwordData, setPasswordData] = useState({
        currentPassword: '',
        newPassword: '',
        confirmNewPassword: ''
    });
    const [isChangingPassword, setIsChangingPassword] = useState(false);

    const router = useRouter();
    const [userEmail, setUserEmail] = useState('');

    useEffect(() => {
        fetchProfile();
    }, []);

    const formatNumber = (val: string) => {
        if (!val) return '';
        const num = val.replace(/[^0-9]/g, '');
        return num.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    };

    const parseNumber = (val: string) => {
        return parseInt(val.replace(/,/g, '')) || 0;
    };

    const fetchProfile = async () => {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;
        
        setUserEmail(session.user.email || '');

        const { data, error } = await supabase
            .from('profiles')
            .select('name, house_count,is_business,previous_year_profit,current_year_profit')
            .eq('id', session.user.id)
            .single();

        if (!error && data) {
            setProfile({
                name: data.name || '',
                house_count: data.house_count || 0,
                is_business: data.is_business || false,
                previous_year_profit: formatNumber(String(data.previous_year_profit || 0)),
                current_year_profit: formatNumber(String(data.current_year_profit || 0))
            });
        }
        setLoading(false);
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);

        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;

        // 1. 프로필 정보 업데이트
        const submissionData = {
            name: profile.name,
            house_count: profile.house_count,
            is_business: profile.is_business,
            previous_year_profit: parseNumber(profile.previous_year_profit),
            current_year_profit: parseNumber(profile.current_year_profit)
        };

        const { error: profileError } = await supabase
            .from('profiles')
            .update(submissionData)
            .eq('id', session.user.id);

        if (profileError) {
            setModal({ isOpen: true, type: 'error', message: '프로필 저장 중 오류가 발생했습니다.' });
            setSaving(false);
            return;
        }

        // 2. 비밀번호 변경 (입력된 경우에만)
        if (isChangingPassword) {
            if (!passwordData.currentPassword || !passwordData.newPassword) {
                setModal({ isOpen: true, type: 'error', message: '비밀번호를 모두 입력해주세요.' });
                setSaving(false);
                return;
            }

            if (passwordData.newPassword !== passwordData.confirmNewPassword) {
                setModal({ isOpen: true, type: 'error', message: '새 비밀번호가 일치하지 않습니다.' });
                setSaving(false);
                return;
            }

            if (passwordData.newPassword.length < 6) {
                setModal({ isOpen: true, type: 'error', message: '새 비밀번호는 6자 이상이어야 합니다.' });
                setSaving(false);
                return;
            }

            // 현재 비밀번호 확인 (로그인 시도)
            const { error: signInError } = await supabase.auth.signInWithPassword({
                email: userEmail,
                password: passwordData.currentPassword
            });

            if (signInError) {
                setModal({ isOpen: true, type: 'error', message: '현재 비밀번호가 올바르지 않습니다.' });
                setSaving(false);
                return;
            }

            // 새 비밀번호 설정
            const { error: updateError } = await supabase.auth.updateUser({
                password: passwordData.newPassword
            });

            if (updateError) {
                setModal({ isOpen: true, type: 'error', message: '비밀번호 변경 실패: ' + updateError.message });
                setSaving(false);
                return;
            }
        }

        setModal({ isOpen: true, type: 'success', message: '설정이 저장되었습니다.' });
        // 비밀번호 변경 시 입력창 초기화 및 닫기
        if (isChangingPassword) {
            setPasswordData({ currentPassword: '', newPassword: '', confirmNewPassword: '' });
            setIsChangingPassword(false);
        }
        
        setTimeout(() => {
            setModal(prev => ({ ...prev, isOpen: false }));
        }, 1500);
        
        setSaving(false);
    };

    if (loading) return <div className="container" style={{ paddingTop: '100px', textAlign: 'center' }}>로딩 중...</div>;

    return (
        <div className="container" style={{ paddingTop: '40px', paddingBottom: '80px' }}>
            <button onClick={() => router.push('/')} style={{ color: '#94a3b8', background: 'none', border: 'none', cursor: 'pointer', marginBottom: '16px' }}>
                ← 돌아가기
            </button>
            <h1 className="title">사용자 설정</h1>
            <p style={{ color: '#94a3b8', marginBottom: '32px' }}>정확한 세금 및 ROI 계산을 위해 본인의 투자 프로필을 설정해주세요.</p>

            <form onSubmit={handleSave} className="card" style={{ maxWidth: '600px' }}>
                <h2 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '24px', color: 'var(--primary)' }}>내 정보 수정</h2>
                
                <div style={{ marginBottom: '20px' }}>
                    <label className="label">아이디 (이메일)</label>
                    <input 
                        type="text" 
                        className="input-field" 
                        value={userEmail} 
                        disabled 
                        style={{ backgroundColor: '#f1f5f9', color: '#64748b' }}
                    />
                </div>

                <div style={{ marginBottom: '32px' }}>
                    <label className="label">이름 (닉네임)</label>
                    <input 
                        type="text" 
                        className="input-field" 
                        value={profile.name} 
                        onChange={(e) => setProfile({...profile, name: e.target.value})}
                        placeholder="이름을 입력하세요"
                        required
                    />
                </div>

                {/* 비밀번호 변경 아코디언 */}
                <div style={{ marginBottom: '32px', border: '1px solid var(--border)', borderRadius: '8px', overflow: 'hidden' }}>
                    <button 
                        type="button"
                        onClick={() => setIsChangingPassword(!isChangingPassword)}
                        style={{ 
                            width: '100%', 
                            padding: '16px', 
                            textAlign: 'left', 
                            background: '#f8fafc', 
                            border: 'none', 
                            fontSize: '15px', 
                            fontWeight: 600, 
                            color: 'var(--foreground)',
                            display: 'flex', 
                            justifyContent: 'space-between', 
                            alignItems: 'center',
                            cursor: 'pointer'
                        }}
                    >
                        <span>🔒 비밀번호 변경</span>
                        <span>{isChangingPassword ? '▲' : '▼'}</span>
                    </button>
                    
                    {isChangingPassword && (
                        <div style={{ padding: '20px', backgroundColor: '#ffffff', borderTop: '1px solid var(--border)' }}>
                            <div style={{ marginBottom: '16px' }}>
                                <label className="label">현재 비밀번호</label>
                                <input 
                                    type="password" 
                                    className="input-field" 
                                    value={passwordData.currentPassword} 
                                    onChange={(e) => setPasswordData({...passwordData, currentPassword: e.target.value})}
                                    placeholder="현재 비밀번호를 입력하세요"
                                />
                            </div>
                            <div style={{ marginBottom: '16px' }}>
                                <label className="label">새 비밀번호</label>
                                <input 
                                    type="password" 
                                    className="input-field" 
                                    value={passwordData.newPassword} 
                                    onChange={(e) => setPasswordData({...passwordData, newPassword: e.target.value})}
                                    placeholder="새 비밀번호 (6자 이상)"
                                />
                            </div>
                            <div>
                                <label className="label">새 비밀번호 확인</label>
                                <input 
                                    type="password" 
                                    className="input-field" 
                                    value={passwordData.confirmNewPassword} 
                                    onChange={(e) => setPasswordData({...passwordData, confirmNewPassword: e.target.value})}
                                    placeholder="새 비밀번호를 다시 입력하세요"
                                />
                            </div>
                        </div>
                    )}
                </div>

                <h2 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '24px', color: 'var(--primary)', paddingTop: '24px', borderTop: '1px solid var(--border)' }}>내 투자 프로필</h2>

                <label className="label">현재 주택 수 (본인 세대 기준)</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
                    <input 
                        type="number" 
                        className="input-field" 
                        value={profile.house_count} 
                        onChange={(e) => setProfile({...profile, house_count: parseInt(e.target.value) || 0})}
                        style={{ width: '100px' }}
                    />
                    <span style={{ color: 'var(--muted)' }}>주택</span>
                </div>

                <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '32px', padding: '16px', borderRadius: '12px', background: '#f0fdf4', border: '1px solid #bbf7d0' }}>
                    <input 
                        type="checkbox" 
                        id="is_business"
                        checked={profile.is_business} 
                        onChange={(e) => setProfile({...profile, is_business: e.target.checked})}
                        style={{ width: '20px', height: '20px', cursor: 'pointer' }}
                    />
                    <label htmlFor="is_business" style={{ fontSize: '15px', fontWeight: 600, cursor: 'pointer' }}>
                        부동산 매매사업자로 설정 (비교과세 적용)
                    </label>
                </div>

                {profile.is_business && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', padding: '24px', backgroundColor: '#f8fafc', borderRadius: '12px', border: '1px solid var(--border)', marginBottom: '24px' }}>
                        <div>
                            <label className="label">전년도 매출액 (원)</label>
                            <input 
                                type="text" 
                                className="input-field" 
                                value={profile.previous_year_profit} 
                                onChange={(e) => setProfile({...profile, previous_year_profit: formatNumber(e.target.value)})}
                                placeholder="0"
                            />
                            <p style={{ fontSize: '12px', color: '#64748b', marginTop: '6px' }}>전년도 매출액에 따라 본인 사업자의 성격이 판별됩니다.</p>
                        </div>
                        <div>
                            <label className="label">올해 타 소득 합계 (원)</label>
                            <input 
                                type="text" 
                                className="input-field" 
                                value={profile.current_year_profit} 
                                onChange={(e) => setProfile({...profile, current_year_profit: formatNumber(e.target.value)})}
                                placeholder="0"
                            />
                            <p style={{ fontSize: '12px', color: '#64748b', marginTop: '6px' }}>종합소득세 합산 과세를 위해 사용됩니다.</p>
                        </div>
                    </div>
                )}

                <button type="submit" className="button button-primary" style={{ width: '100%', marginTop: '16px' }} disabled={saving}>
                    {saving ? '저장 중...' : '설정 저장하기'}
                </button>
            </form>

            {/* 면책 조항 및 세금 설명 */}
            <div style={{ marginTop: '48px', padding: '24px', backgroundColor: 'rgba(239, 68, 68, 0.1)', borderRadius: '12px', border: '1px solid rgba(239, 68, 68, 0.3)' }}>
                <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '16px', color: '#ef4444' }}>⚠️ 유의사항 및 이용약관</h3>
                <p style={{ fontSize: '14px', lineHeight: '1.6', marginBottom: '16px', color: '#475569' }}>
                    본 프로그램은 참고용 계산기이며, 실제 세금 및 수익률은 개인의 상황에 따라 달라질 수 있습니다.
                </p>
                
                <div style={{ marginBottom: '16px' }}>
                    <h4 style={{ fontSize: '15px', fontWeight: 600, marginBottom: '8px', color: 'var(--primary)' }}>📋 세금 계산 방식</h4>
                    <ul style={{ fontSize: '13px', lineHeight: '1.8', color: '#475569', paddingLeft: '20px' }}>
                        <li>
                            <strong style={{ color: '#1e293b' }}>취득세:</strong> 주택 수와 조정대상지역 여부에 따라 차등 적용
                            <ul style={{ marginTop: '4px', paddingLeft: '20px' }}>
                                <li>1주택: 1.1% ~ 3.5%</li>
                                <li>2주택: 8%</li>
                                <li>3주택 이상: 12%</li>
                                <li>오피스텔/상가: 4.6% (고정)</li>
                            </ul>
                        </li>
                        <li style={{ marginTop: '8px' }}>
                            <strong style={{ color: '#1e293b' }}>양도소득세:</strong>
                            <ul style={{ marginTop: '4px', paddingLeft: '20px' }}>
                                <li>매매사업자: 종합소득세로 계산 (과세표준에 따라 6%~45%)</li>
                                <li>일반 개인: 양도소득세 기본세율 적용</li>
                            </ul>
                        </li>
                        <li style={{ marginTop: '8px' }}>
                            <strong style={{ color: '#1e293b' }}>중개수수료:</strong> 낙찰가에 따라 법정 요율 자동 계산
                            <ul style={{ marginTop: '4px', paddingLeft: '20px' }}>
                                <li>5천만원 미만: 0.6%</li>
                                <li>5천만원 ~ 2억원: 0.5%</li>
                                <li>2억원 ~ 6억원: 0.4%</li>
                                <li>6억원 ~ 9억원: 0.5%</li>
                                <li>9억원 이상: 0.9%</li>
                            </ul>
                        </li>
                    </ul>
                </div>

                <div style={{ padding: '12px', backgroundColor: 'rgba(239, 68, 68, 0.2)', borderRadius: '8px', marginTop: '16px' }}>
                    <p style={{ fontSize: '13px', fontWeight: 600, color: '#b91c1c', marginBottom: '4px' }}>⚠️ 본 프로그램의 계산 결과에 대한 책임은 전적으로 사용자 본인에게 있습니다.</p>
                    <p style={{ fontSize: '13px', color: '#b91c1c' }}>⚠️ 정확한 세금 계산은 세무사와 상담하시기 바랍니다.</p>
                </div>
            </div>

            {/* 로그아웃 버튼 */}
            <button 
                onClick={async () => {
                    await supabase.auth.signOut();
                    window.location.href = '/auth/login';
                }}
                className="button"
                style={{ 
                    width: '100%', 
                    marginTop: '24px',
                    backgroundColor: 'rgba(239, 68, 68, 0.1)',
                    color: '#ef4444',
                    border: '1px solid rgba(239, 68, 68, 0.3)'
                }}
            >
                로그아웃
            </button>

            <Modal
                isOpen={modal.isOpen}
                onClose={() => setModal({ ...modal, isOpen: false })}
                type={modal.type}
                message={modal.message}
            />
        </div>
    );
}
