'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Property } from '@/lib/types';
import Link from 'next/link';

export default function Dashboard() {
    const [properties, setProperties] = useState<Property[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchProperties();
    }, []);

    const fetchProperties = async () => {
        const { data, error } = await supabase
            .from('properties')
            .select('*')
            .order('created_at', { ascending: false });

        if (!error && data) {
            setProperties(data);
        }
        setLoading(false);
    };

    return (
        <div className="container" style={{ paddingTop: '40px', paddingBottom: '40px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
                <div>
                    <h1 className="title" style={{ marginBottom: '8px' }}>나의 물건 목록</h1>
                    <p style={{ color: '#94a3b8' }}>분석된 경매 물건들을 관리하세요.</p>
                </div>
                <Link href="/properties/new" className="button button-primary">
                    + 물건 추가하기
                </Link>
            </div>

            {loading ? (
                <p style={{ textAlign: 'center', padding: '60px', color: '#94a3b8' }}>불러오는 중...</p>
            ) : properties.length === 0 ? (
                <div className="card" style={{ textAlign: 'center', padding: '60px' }}>
                    <div style={{ fontSize: '48px', marginBottom: '24px' }}>🏠</div>
                    <p style={{ color: '#94a3b8', marginBottom: '24px' }}>등록된 물건이 없습니다. 첫 번째 물건을 추가해보세요!</p>
                    <Link href="/properties/new" className="button button-primary">
                        첫 물건 등록하기
                    </Link>
                </div>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '24px' }}>
                    {properties.map(p => (
                        <Link href={`/properties/${p.id}`} key={p.id}>
                            <div className="card">
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                                    <span style={{ 
                                        padding: '4px 8px', 
                                        borderRadius: '6px', 
                                        background: 'rgba(99, 102, 241, 0.1)', 
                                        color: '#818cf8',
                                        fontSize: '12px',
                                        fontWeight: 600
                                    }}>
                                        {p.propertyType === 'HOUSE' ? '주택' : p.propertyType === 'OFFICETEL' ? '오피스텔' : '상가'}
                                    </span>
                                    <span style={{ color: '#94a3b8', fontSize: '12px' }}>{new Date(p.created_at || 0).toLocaleDateString()}</span>
                                </div>
                                <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '8px' }}>{p.caseNumber}</h3>
                                <p style={{ color: '#94a3b8', fontSize: '14px', marginBottom: '16px', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                                    {p.address}
                                </p>
                                <div style={{ borderTop: '1px solid var(--border)', paddingTop: '16px', display: 'flex', justifyContent: 'space-between' }}>
                                    <div>
                                        <p style={{ fontSize: '12px', color: '#94a3b8' }}>낙찰가</p>
                                        <p style={{ fontWeight: 700 }}>{(p.auctionPrice / 100000000).toFixed(1)}억</p>
                                    </div>
                                    <div style={{ textAlign: 'right' }}>
                                        <p style={{ fontSize: '12px', color: '#94a3b8' }}>ROI</p>
                                        <p style={{ color: '#10b981', fontWeight: 700 }}>분석중</p>
                                    </div>
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            )}
        </div>
    );
}
