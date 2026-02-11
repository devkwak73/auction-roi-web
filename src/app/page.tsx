'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Property } from '@/lib/types';
import { ROICalculator } from '@/lib/calculator/ROICalculator';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function Dashboard() {
    const router = useRouter();
    const [properties, setProperties] = useState<Property[]>([]);
    const [filteredProperties, setFilteredProperties] = useState<Property[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        fetchProperties();
    }, []);

    useEffect(() => {
        if (searchQuery.trim() === '') {
            setFilteredProperties(properties);
        } else {
            const query = searchQuery.toLowerCase();
            const filtered = properties.filter(p => 
                p.case_number.toLowerCase().includes(query) || 
                p.address.toLowerCase().includes(query)
            );
            setFilteredProperties(filtered);
        }
    }, [searchQuery, properties]);

    const fetchProperties = async () => {
        const { data, error } = await supabase
            .from('properties')
            .select('*')
            .order('created_at', { ascending: false });

        if (!error && data) {
            setProperties(data);
            setFilteredProperties(data);
        }
        setLoading(false);
    };

    return (
        <div className="container" style={{ paddingTop: '20px', paddingBottom: '100px', maxWidth: '600px', margin: '0 auto' }}>
            <div style={{ paddingTop: '20px' }} />

            {/* 검색창 */}
            <div style={{ marginBottom: '24px' }}>
                <div style={{ 
                    position: 'relative',
                    backgroundColor: '#ffffff',
                    borderRadius: '16px',
                    border: '1px solid var(--border)',
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)'
                }}>
                    <span style={{ 
                        position: 'absolute',
                        left: '16px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        fontSize: '20px',
                        color: '#64748b'
                    }}>🔍</span>
                    <input 
                        type="text"
                        placeholder="사건번호 또는 주소 검색"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        style={{
                            width: '100%',
                            padding: '14px 16px 14px 48px',
                            backgroundColor: 'transparent',
                            border: 'none',
                            color: 'var(--foreground)',
                            fontSize: '15px',
                            outline: 'none'
                        }}
                    />
                </div>
            </div>

            {loading ? (
                <p style={{ textAlign: 'center', padding: '60px', color: '#94a3b8' }}>불러오는 중...</p>
            ) : filteredProperties.length === 0 ? (
                <div className="card" style={{ textAlign: 'center', padding: '60px' }}>
                    <div style={{ fontSize: '48px', marginBottom: '24px' }}>🏠</div>
                    <p style={{ color: '#94a3b8', marginBottom: '24px' }}>
                        {searchQuery ? '검색 결과가 없습니다.' : '등록된 물건이 없습니다.'}
                    </p>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {filteredProperties.map(p => {
                        // ROI 계산
                        const tp = {
                            houseCount: 1,
                            isBusiness: false,
                            previousYearProfit: 0,
                            currentYearProfit: 0
                        };
                        const calculator = new ROICalculator();
                        const report = calculator.calculate(p, tp);
                        const roi = report.saleScenario.roi;

                        return (
                            <Link 
                                href={`/properties/${p.id}`} 
                                key={p.id}
                                className="card" 
                                style={{ 
                                    display: 'block', 
                                    textDecoration: 'none', 
                                    transition: 'all 0.2s',
                                    backgroundColor: '#ffffff',
                                    position: 'relative',
                                    overflow: 'hidden'
                                }}
                            >
                                {/* 상단: 사건번호 + 수익률 배지 */}
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                                    <div>
                                        <h3 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--primary)', marginBottom: '4px' }}>{p.case_number}</h3>
                                        <span style={{ 
                                            fontSize: '12px', 
                                            padding: '4px 10px', 
                                            borderRadius: '12px', 
                                            backgroundColor: p.property_type === 'HOUSE' ? '#ecfdf5' : p.property_type === 'OFFICETEL' ? '#f0fdf4' : '#fffbeb',
                                            color: p.property_type === 'HOUSE' ? '#059669' : p.property_type === 'OFFICETEL' ? '#16a34a' : '#d97706',
                                            fontWeight: 600,
                                            display: 'inline-block',
                                            border: '1px solid currentColor'
                                        }}>
                                            {p.property_type === 'HOUSE' ? '주택' : p.property_type === 'OFFICETEL' ? '오피스텔' : '상가'}
                                        </span>
                                    </div>
                                    <div style={{ 
                                        padding: '8px 16px',
                                        borderRadius: '20px',
                                        backgroundColor: '#f0fdf4',
                                        border: '1px solid #bbf7d0',
                                        boxShadow: '0 2px 4px rgba(22, 163, 74, 0.1)'
                                    }}>
                                        <span style={{ fontSize: '16px', fontWeight: 700, color: '#16a34a' }}>수익률 {roi.toFixed(1)}%</span>
                                    </div>
                                </div>

                                {/* 주소 */}
                                <p style={{ fontSize: '14px', color: '#94a3b8', marginBottom: '16px' }}>{p.address}</p>
                                
                                {/* 하단: 입찰가, 순이익, 등록일 */}
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', paddingTop: '16px', borderTop: '1px solid var(--border)' }}>
                                    <div style={{ textAlign: 'center' }}>
                                        <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '4px' }}>입찰가</div>
                                        <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--foreground)' }}>{Math.ceil(p.auction_price / 10000).toLocaleString()}만원</div>
                                    </div>
                                    <div style={{ textAlign: 'center' }}>
                                        <p style={{ color: 'var(--muted)', fontSize: '12px', marginBottom: '4px', fontWeight: 600 }}>순이익</p>
                                        <p style={{ color: 'var(--primary)', fontSize: '18px', fontWeight: 800 }}>{Math.ceil(report.saleScenario.netProfit / 10000).toLocaleString()}만원</p>
                                    </div>
                                    <div style={{ textAlign: 'center' }}>
                                        <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '4px' }}>등록일</div>
                                        <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--foreground)' }}>{p.created_at ? new Date(p.created_at).toLocaleDateString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit' }).replace(/\. /g, '.').replace(/\.$/, '') : '-'}</div>
                                    </div>
                                </div>
                            </Link>
                        );
                    })}
                </div>
            )}

            {/* 플로팅 추가 버튼 */}
            <button
                onClick={() => router.push('/properties/new')}
                style={{
                    position: 'fixed',
                    bottom: '32px',
                    right: '32px',
                    width: '64px',
                    height: '64px',
                    borderRadius: '50%',
                    backgroundColor: 'var(--primary)',
                    border: 'none',
                    boxShadow: '0 8px 24px rgba(26, 67, 50, 0.3)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '32px',
                    color: '#fff',
                    transition: 'all 0.3s',
                    zIndex: 1000
                }}
                onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'scale(1.1)';
                    e.currentTarget.style.boxShadow = '0 12px 32px rgba(26, 67, 50, 0.4)';
                }}
                onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'scale(1)';
                    e.currentTarget.style.boxShadow = '0 8px 24px rgba(26, 67, 50, 0.3)';
                }}
            >
                +
            </button>
        </div>
    );
}
