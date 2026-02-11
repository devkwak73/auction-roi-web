'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import Modal from '@/components/Modal';

interface Profile {
    id: string;
    email: string;
    is_approved: boolean;
    created_at: string;
}

export default function AdminPage() {
    const [users, setUsers] = useState<Profile[]>([]);
    const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);
    const [modal, setModal] = useState<{ isOpen: boolean; type: 'success' | 'error'; message: string }>({ 
        isOpen: false, 
        type: 'success', 
        message: '' 
    });

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('is_approved', false)
            .order('created_at', { ascending: false });

        if (!error && data) {
            setUsers(data);
        }
        setLoading(false);
    };

    const handleToggleSelect = (userId: string) => {
        setSelectedUserIds(prev =>
            prev.includes(userId)
                ? prev.filter(id => id !== userId)
                : [...prev, userId]
        );
    };

    const handleSelectAll = () => {
        if (selectedUserIds.length === users.length) {
            setSelectedUserIds([]);
        } else {
            setSelectedUserIds(users.map(u => u.id));
        }
    };

    const handleBulkApprove = async () => {
        if (selectedUserIds.length === 0) return;

        const { error } = await supabase
            .from('profiles')
            .update({ is_approved: true })
            .in('id', selectedUserIds);

        if (!error) {
            setModal({ isOpen: true, type: 'success', message: `${selectedUserIds.length}명의 사용자가 승인되었습니다.` });
            setSelectedUserIds([]);
            fetchUsers();
        } else {
            setModal({ isOpen: true, type: 'error', message: '승인 중 오류가 발생했습니다.' });
        }
    };

    return (
        <div className="container" style={{ paddingTop: '40px', paddingBottom: '40px' }}>
            <button onClick={() => window.history.back()} style={{ color: 'var(--muted)', background: 'none', border: 'none', cursor: 'pointer', marginBottom: '16px' }}>
                ← 돌아가기
            </button>
            <h1 className="title">관리자 대시보드</h1>
            <p style={{ color: 'var(--muted)', marginBottom: '32px' }}>
                가입 신청한 사용자들을 승인하거나 관리할 수 있습니다.
            </p>

            <div className="card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                    <h2 style={{ fontSize: '18px', fontWeight: 600 }}>승인 대기 목록 ({users.length})</h2>
                    <div style={{ display: 'flex', gap: '12px' }}>
                        <button onClick={handleSelectAll} className="button button-secondary">
                            {selectedUserIds.length === users.length ? '선택 해제' : '전체 선택'}
                        </button>
                        <button 
                            onClick={handleBulkApprove} 
                            className="button button-primary"
                            disabled={selectedUserIds.length === 0}
                        >
                            {selectedUserIds.length}명 일괄 승인
                        </button>
                    </div>
                </div>

                {loading ? (
                    <p style={{ textAlign: 'center', padding: '40px', color: 'var(--muted)' }}>로딩 중...</p>
                ) : users.length === 0 ? (
                    <p style={{ textAlign: 'center', padding: '40px', color: 'var(--muted)' }}>대기 중인 사용자가 없습니다.</p>
                ) : (
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                            <thead>
                                <tr style={{ borderBottom: '1px solid var(--border)' }}>
                                    <th style={{ padding: '12px' }}>선택</th>
                                    <th style={{ padding: '12px' }}>이메일</th>
                                    <th style={{ padding: '12px' }}>신청일</th>
                                </tr>
                            </thead>
                            <tbody>
                                {users.map(user => (
                                    <tr key={user.id} style={{ borderBottom: '1px solid var(--border)' }}>
                                        <td style={{ padding: '12px' }}>
                                            <input 
                                                type="checkbox" 
                                                checked={selectedUserIds.includes(user.id)}
                                                onChange={() => handleToggleSelect(user.id)}
                                                style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                                            />
                                        </td>
                                        <td style={{ padding: '12px' }}>{user.email}</td>
                                        <td style={{ padding: '12px', color: 'var(--muted)' }}>
                                            {new Date(user.created_at).toLocaleDateString()}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            <Modal
                isOpen={modal.isOpen}
                onClose={() => setModal({ ...modal, isOpen: false })}
                type={modal.type}
                message={modal.message}
            />
        </div>
    );
}
