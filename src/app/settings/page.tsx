'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

export default function SettingsPage() {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [profile, setProfile] = useState({
        current_house_count: 1,
        is_business: false,
        current_year_profit: 0
    });
    const router = useRouter();

    useEffect(() => {
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;

        const { data, error } = await supabase
            .from('profiles')
            .select('current_house_count, is_business, current_year_profit')
            .eq('id', session.user.id)
            .single();

        if (!error && data) {
            setProfile({
                current_house_count: data.current_house_count || 1,
                is_business: data.is_business || false,
                current_year_profit: data.current_year_profit || 0
            });
        }
        setLoading(false);
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);

        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;

        const { error } = await supabase
            .from('profiles')
            .update(profile)
            .eq('id', session.user.id);

        if (!error) {
            alert('설정이 저장되었습니다.');
            router.refresh();
        } else {
            alert('저장 중 오류가 발생했습니다.');
        }
        setSaving(false);
    };

    if (loading) return <div className="container" style={{ paddingTop: '100px', textAlign: 'center' }}>로딩 중...</div>;

    return (
        <div className="container" style={{ paddingTop: '40px' }}>
            <h1 className="title">사용자 설정</h1>
            <p style={{ color: '#94a3b8', marginBottom: '32px' }}>정확한 세금 및 ROI 계산을 위해 본인의 투자 프로필을 설정해주세요.</p>

            <form onSubmit={handleSave} className="card" style={{ maxWidth: '600px' }}>
                <h2 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '24px' }}>세금 프로필 설정</h2>

                <label className="label">현재 주택 수 (본인 포함 세대 기준)</label>
                <input 
                    type="number" 
                    className="input-field" 
                    value={profile.current_house_count} 
                    onChange={(e) => setProfile({...profile, current_house_count: parseInt(e.target.value)})}
                />

                <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '24px', padding: '16px', borderRadius: '12px', background: 'rgba(99, 102, 241, 0.05)', border: '1px solid rgba(99, 102, 241, 0.2)' }}>
                    <input 
                        type="checkbox" 
                        id="is_business"
                        checked={profile.is_business} 
                        onChange={(e) => setProfile({...profile, is_business: e.target.checked})}
                        style={{ width: '20px', height: '20px' }}
                    />
                    <label htmlFor="is_business" style={{ fontSize: '15px', fontWeight: 600, cursor: 'pointer' }}>
                        부동산 매매사업자 여부
                    </label>
                </div>

                {profile.is_business && (
                    <>
                        <label className="label">올해 기 확정된 순이익 (원)</label>
                        <input 
                            type="number" 
                            className="input-field" 
                            value={profile.current_year_profit} 
                            onChange={(e) => setProfile({...profile, current_year_profit: parseInt(e.target.value)})}
                            placeholder="종합소득세 비교과세 시 사용됩니다."
                        />
                    </>
                )}

                <button type="submit" className="button button-primary" style={{ width: '100%', marginTop: '16px' }} disabled={saving}>
                    {saving ? '저장 중...' : '설정 저장하기'}
                </button>
            </form>
        </div>
    );
}
