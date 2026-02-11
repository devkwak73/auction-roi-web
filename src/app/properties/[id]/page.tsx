'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Property, ROIReport, TaxProfile } from '@/lib/types';
import { ROICalculator } from '@/lib/calculator/ROICalculator';

export default function PropertyDetailPage() {
    const { id } = useParams();
    const router = useRouter();
    const [property, setProperty] = useState<Property | null>(null);
    const [report, setReport] = useState<ROIReport | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchData();
    }, [id]);

    const fetchData = async () => {
        setLoading(true);
        // 1. 물건 데이터 가져오기
        const { data: prop, error: propError } = await supabase
            .from('properties')
            .select('*')
            .eq('id', id)
            .single();

        if (propError || !prop) {
            router.push('/');
            return;
        }

        setProperty(prop);

        // 2. 사용자 세금 프로필 가져오기 (없으면 기본값)
        const { data: profile } = await supabase
            .from('profiles')
            .select('current_house_count, is_business, current_year_profit')
            .eq('id', prop.user_id)
            .single();

        const taxProfile: TaxProfile = {
            currentHouseCount: profile?.current_house_count || 1,
            isBusiness: profile?.is_business || false,
            currentYearProfit: profile?.current_year_profit || 0
        };

        // 3. ROI 계산
        const calculator = new ROICalculator();
        const roiReport = calculator.calculate(prop, taxProfile);
        setReport(roiReport);
        setLoading(false);
    };

    if (loading || !property || !report) {
        return <div className="container" style={{ paddingTop: '100px', textAlign: 'center' }}>로딩 중...</div>;
    }

    const { saleScenario, acquisitionTax, acquisitionTaxRate } = report;

    return (
        <div className="container" style={{ paddingTop: '40px', paddingBottom: '80px' }}>
            <div style={{ marginBottom: '32px' }}>
                <button onClick={() => router.back()} style={{ color: '#94a3b8', background: 'none', border: 'none', cursor: 'pointer', marginBottom: '16px' }}>
                    ← 돌아가기
                </button>
                <h1 className="title">{property.caseNumber}</h1>
                <p style={{ color: '#94a3b8' }}>{property.address}</p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '32px' }}>
                {/* 요약 카드 */}
                <div className="card" style={{ borderLeft: '4px solid #6366f1' }}>
                    <h2 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '24px' }}>단기 매도 ROI 분석</h2>
                    
                    <div style={{ marginBottom: '32px', textAlign: 'center' }}>
                        <p style={{ fontSize: '14px', color: '#94a3b8', marginBottom: '8px' }}>예상 수익률</p>
                        <p style={{ fontSize: '42px', fontWeight: 800, color: '#10b981' }}>{saleScenario.roi.toFixed(1)}%</p>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                        <div>
                            <p style={{ fontSize: '12px', color: '#94a3b8' }}>세후 순이익</p>
                            <p style={{ fontSize: '18px', fontWeight: 700 }}>{(saleScenario.netProfit / 10000).toLocaleString()}만원</p>
                        </div>
                        <div>
                            <p style={{ fontSize: '12px', color: '#94a3b8' }}>실투자금</p>
                            <p style={{ fontSize: '18px', fontWeight: 700 }}>{(saleScenario.actualInvestment / 10000).toLocaleString()}만원</p>
                        </div>
                    </div>
                </div>

                {/* 상세 비용 카드 */}
                <div className="card">
                    <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '20px' }}>항목별 비용 상세</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span style={{ color: '#94a3b8' }}>낙찰가</span>
                            <span>{property.auctionPrice.toLocaleString()}원</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span style={{ color: '#94a3b8' }}>취득세 ({acquisitionTaxRate})</span>
                            <span>{acquisitionTax.toLocaleString()}원</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span style={{ color: '#94a3b8' }}>대출 이자 (총액)</span>
                            <span>{report.saleScenario.totalTax.toLocaleString()}원</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--border)', paddingTop: '16px' }}>
                            <span style={{ fontWeight: 600 }}>총 지출 합계</span>
                            <span style={{ fontWeight: 600 }}>{saleScenario.totalCost.toLocaleString()}원</span>
                        </div>
                    </div>
                </div>

                {/* 세금 분석 카드 */}
                <div className="card" style={{ borderLeft: '4px solid #f59e0b' }}>
                    <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '20px' }}>세금 분석 ({saleScenario.taxInfo})</h3>
                    <div style={{ marginBottom: '20px' }}>
                        <p style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '4px' }}>예상 세금 합계</p>
                        <p style={{ fontSize: '24px', fontWeight: 700 }}>{saleScenario.totalTax.toLocaleString()}원</p>
                    </div>
                    <p style={{ fontSize: '14px', color: '#94a3b8', lineHeight: '1.6' }}>
                        현 설정(주택 수, 사업자 여부)에 따라 적용된 세금입니다.<br />
                        실제 납부액과 차이가 있을 수 있으므로 참고용으로만 활용하세요.
                    </p>
                </div>

                {/* 메모 카드 */}
                {property.notes && (
                    <div className="card">
                        <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '16px' }}>메모</h3>
                        <p style={{ color: '#cbd5e1', fontSize: '14px', lineHeight: '1.6', whiteSpace: 'pre-wrap' }}>
                            {property.notes}
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
