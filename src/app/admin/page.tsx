'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import Modal from '@/components/Modal';

interface Profile {
    id: string;
    email: string;
    name: string;
    username: string;
    is_approved: boolean;
    created_at: string;
}

export default function AdminPage() {
    const [activeTab, setActiveTab] = useState<'pending' | 'all'>('pending');
    
    // 승인 대기 목록
    const [pendingUsers, setPendingUsers] = useState<Profile[]>([]);
    const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
    
    // 전체 회원 목록
    const [allUsers, setAllUsers] = useState<Profile[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [filteredUsers, setFilteredUsers] = useState<Profile[]>([]);

    const [loading, setLoading] = useState(true);
    const [modal, setModal] = useState<{ isOpen: boolean; type: 'success' | 'error'; message: string }>({ 
        isOpen: false, 
        type: 'success', 
        message: '' 
    });

    // 비밀번호 초기화 모달
    const [resetModalOpen, setResetModalOpen] = useState(false);
    const [resetTargetUser, setResetTargetUser] = useState<Profile | null>(null);
    const [newPassword, setNewPassword] = useState('');

    useEffect(() => {
        fetchUsers();
    }, []);

    useEffect(() => {
        if (activeTab === 'all') {
            filterUsers();
        }
    }, [searchQuery, allUsers, activeTab]);

    const fetchUsers = async () => {
        setLoading(true);
        
        // 승인 대기 사용자
        const { data: pendingData } = await supabase
            .from('profiles')
            .select('*')
            .eq('is_approved', false)
            .order('created_at', { ascending: false });

        if (pendingData) setPendingUsers(pendingData);

        // 전체 사용자
        const { data: allData } = await supabase
            .from('profiles')
            .select('*')
            .order('created_at', { ascending: false });

        if (allData) {
            setAllUsers(allData);
            setFilteredUsers(allData);
        }

        setLoading(false);
    };

    const filterUsers = () => {
        if (!searchQuery.trim()) {
            setFilteredUsers(allUsers);
            return;
        }
        const query = searchQuery.toLowerCase();
        const filtered = allUsers.filter(user => 
            (user.name?.toLowerCase().includes(query)) || 
            (user.username?.toLowerCase().includes(query)) ||
            (user.email?.toLowerCase().includes(query))
        );
        setFilteredUsers(filtered);
    };

    const handleToggleSelect = (userId: string) => {
        setSelectedUserIds(prev =>
            prev.includes(userId)
            ? prev.filter(id => id !== userId)
            : [...prev, userId]
        );
    };

    const handleSelectAll = () => {
        if (selectedUserIds.length === pendingUsers.length) {
            setSelectedUserIds([]);
        } else {
            setSelectedUserIds(pendingUsers.map(u => u.id));
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

    const openResetPasswordModal = (user: Profile) => {
        setResetTargetUser(user);
        setNewPassword('123456'); // 기본값 설정
        setResetModalOpen(true);
    };

    const handleResetPassword = async () => {
        if (!resetTargetUser || !newPassword) return;

        try {
            const response = await fetch('/api/admin/reset-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: resetTargetUser.id, newPassword })
            });

            const result = await response.json();

            if (response.ok) {
                setModal({ isOpen: true, type: 'success', message: '비밀번호가 초기화되었습니다.' });
                setResetModalOpen(false);
            } else {
                setModal({ isOpen: true, type: 'error', message: result.error || '초기화 실패' });
            }
        } catch (error) {
            setModal({ isOpen: true, type: 'error', message: 'API 호출 오류' });
        }
    };

    return (
        <div className="container" style={{ paddingTop: '40px', paddingBottom: '40px' }}>
            <button onClick={() => window.history.back()} style={{ color: 'var(--muted)', background: 'none', border: 'none', cursor: 'pointer', marginBottom: '16px' }}>
                ← 돌아가기
            </button>
            <h1 className="title">관리자 대시보드</h1>
            
            {/* 탭 메뉴 */}
            <div style={{ display: 'flex', gap: '16px', marginBottom: '24px', borderBottom: '1px solid var(--border)' }}>
                <button 
                    onClick={() => setActiveTab('pending')}
                    style={{
                        padding: '12px 24px',
                        background: 'none',
                        border: 'none',
                        borderBottom: activeTab === 'pending' ? '2px solid var(--primary)' : 'none',
                        color: activeTab === 'pending' ? 'var(--primary)' : 'var(--muted)',
                        fontWeight: activeTab === 'pending' ? 700 : 400,
                        cursor: 'pointer',
                        fontSize: '16px'
                    }}
                >
                    승인 대기 ({pendingUsers.length})
                </button>
                <button 
                    onClick={() => setActiveTab('all')}
                    style={{
                        padding: '12px 24px',
                        background: 'none',
                        border: 'none',
                        borderBottom: activeTab === 'all' ? '2px solid var(--primary)' : 'none',
                        color: activeTab === 'all' ? 'var(--primary)' : 'var(--muted)',
                        fontWeight: activeTab === 'all' ? 700 : 400,
                        cursor: 'pointer',
                        fontSize: '16px'
                    }}
                >
                    전체 회원 관리
                </button>
            </div>

            {activeTab === 'pending' && (
                <div className="card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                        <h2 style={{ fontSize: '18px', fontWeight: 600 }}>승인 대기 목록</h2>
                        <div style={{ display: 'flex', gap: '12px' }}>
                            <button onClick={handleSelectAll} className="button button-secondary">
                                {selectedUserIds.length === pendingUsers.length ? '선택 해제' : '전체 선택'}
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
                    ) : pendingUsers.length === 0 ? (
                        <p style={{ textAlign: 'center', padding: '40px', color: 'var(--muted)' }}>대기 중인 사용자가 없습니다.</p>
                    ) : (
                        <div style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                                <thead>
                                    <tr style={{ borderBottom: '1px solid var(--border)', color: 'var(--muted)', fontSize: '14px' }}>
                                        <th style={{ padding: '12px', width: '50px' }}>선택</th>
                                        <th style={{ padding: '12px' }}>이름</th>
                                        <th style={{ padding: '12px' }}>아이디</th>
                                        <th style={{ padding: '12px' }}>신청일</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {pendingUsers.map(user => (
                                        <tr key={user.id} style={{ borderBottom: '1px solid var(--border)' }}>
                                            <td style={{ padding: '12px' }}>
                                                <input 
                                                    type="checkbox" 
                                                    checked={selectedUserIds.includes(user.id)}
                                                    onChange={() => handleToggleSelect(user.id)}
                                                    style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                                                />
                                            </td>
                                            <td style={{ padding: '12px', fontWeight: 600 }}>{user.name || '-'}</td>
                                            <td style={{ padding: '12px' }}>{user.username || '-'}</td>
                                            <td style={{ padding: '12px', color: 'var(--muted)', fontSize: '14px' }}>
                                                {new Date(user.created_at).toLocaleDateString()}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}

            {activeTab === 'all' && (
                <div className="card">
                    <div style={{ marginBottom: '24px' }}>
                        <input 
                            type="text" 
                            placeholder="이름 또는 아이디로 검색..." 
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="input-field"
                            style={{ margin: 0 }}
                        />
                    </div>

                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                            <thead>
                                <tr style={{ borderBottom: '1px solid var(--border)', color: 'var(--muted)', fontSize: '14px' }}>
                                    <th style={{ padding: '12px' }}>이름</th>
                                    <th style={{ padding: '12px' }}>아이디</th>
                                    <th style={{ padding: '12px' }}>가입일</th>
                                    <th style={{ padding: '12px' }}>상태</th>
                                    <th style={{ padding: '12px' }}>관리</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredUsers.map(user => (
                                    <tr key={user.id} style={{ borderBottom: '1px solid var(--border)' }}>
                                        <td style={{ padding: '12px', fontWeight: 600 }}>{user.name || '-'}</td>
                                        <td style={{ padding: '12px' }}>{user.username || '-'}</td>
                                        <td style={{ padding: '12px', color: 'var(--muted)', fontSize: '14px' }}>
                                            {new Date(user.created_at).toLocaleDateString()}
                                        </td>
                                        <td style={{ padding: '12px' }}>
                                            {user.is_approved ? (
                                                <span style={{ color: '#10b981', background: '#ecfdf5', padding: '4px 8px', borderRadius: '4px', fontSize: '12px' }}>승인됨</span>
                                            ) : (
                                                <span style={{ color: '#f59e0b', background: '#fffbeb', padding: '4px 8px', borderRadius: '4px', fontSize: '12px' }}>대기중</span>
                                            )}
                                        </td>
                                        <td style={{ padding: '12px' }}>
                                            <button 
                                                onClick={() => openResetPasswordModal(user)}
                                                className="button"
                                                style={{ padding: '6px 12px', fontSize: '13px', background: '#f1f5f9', color: '#475569', border: '1px solid #cbd5e1' }}
                                            >
                                                비밀번호 초기화
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* 비밀번호 초기화 모달 */}
            {resetModalOpen && resetTargetUser && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000
                }}>
                    <div className="card" style={{ width: '400px', maxWidth: '90%' }}>
                        <h3 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '16px' }}>비밀번호 초기화</h3>
                        <p style={{ marginBottom: '24px', color: 'var(--muted)' }}>
                            <strong>{resetTargetUser.name}({resetTargetUser.username})</strong> 님의 비밀번호를 변경합니다.
                        </p>
                        
                        <label className="label">새 비밀번호</label>
                        <input 
                            type="text" 
                            className="input-field" 
                            value={newPassword} 
                            onChange={(e) => setNewPassword(e.target.value)} 
                        />

                        <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
                            <button 
                                onClick={() => setResetModalOpen(false)} 
                                className="button button-secondary"
                                style={{ flex: 1 }}
                            >
                                취소
                            </button>
                            <button 
                                onClick={handleResetPassword} 
                                className="button button-primary"
                                style={{ flex: 1 }}
                            >
                                변경하기
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <Modal
                isOpen={modal.isOpen}
                onClose={() => setModal({ ...modal, isOpen: false })}
                type={modal.type}
                message={modal.message}
            />
        </div>
    );
}
