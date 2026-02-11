'use client';

import { useCallback, useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Property, ROIReport, TaxProfile } from '@/lib/types';
import { ROICalculator } from '@/lib/calculator/ROICalculator';
import { BidPriceCalculator } from '@/lib/calculator/BidPriceCalculator';

export default function PropertyDetailPage() {
    const { id } = useParams();
    const router = useRouter();
    const [property, setProperty] = useState<Property | null>(null);
    const [report, setReport] = useState<ROIReport | null>(null);
    const [loading, setLoading] = useState(true);
    const [taxProfile, setTaxProfile] = useState<TaxProfile | null>(null);
    const [targetRoi, setTargetRoi] = useState('40');
    const [bidResult, setBidResult] = useState<any>(null);

    // 금액을 만원 단위로 올림 처리하여 표시 (소수점 없음)
    const formatAmount = (amount: number) => {
        return Math.ceil(amount / 10000).toLocaleString();
    };

    const fetchData = useCallback(async () => {
        setLoading(true);
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

        const { data: profile } = await supabase
            .from('profiles')
            .select('house_count, is_business, previous_year_profit, current_year_profit')
            .eq('id', prop.user_id)
            .single();

        const tp: TaxProfile = {
            houseCount: profile?.house_count || 1,
            isBusiness: profile?.is_business || false,
            previousYearProfit: profile?.previous_year_profit || 0,
            currentYearProfit: profile?.current_year_profit || 0
        };
        setTaxProfile(tp);

        const calculator = new ROICalculator();
        setReport(calculator.calculate(prop, tp));
        setLoading(false);
    }, [id, router]);

    const handleCalculateBid = () => {
        if (!property || !taxProfile) return;
        const calculator = new BidPriceCalculator();
        const res = calculator.calculateMaxBidPrice(
            parseFloat(targetRoi),
            property.expected_sale_price,
            property,
            taxProfile
        );
        setBidResult(res);
    };

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const [activeTab, setActiveTab] = useState('info'); // 'info', 'analysis', 'bid', 'simulation'

    if (loading || !property || !report) {
        return <div className="container" style={{ paddingTop: '100px', textAlign: 'center' }}>로딩 중...</div>;
    }

    const { saleScenario, acquisitionTax, acquisitionTaxRate } = report;

    return (
        <div className="container" style={{ paddingTop: '40px', paddingBottom: '80px' }}>
            <div style={{ marginBottom: '32px' }}>
                <button onClick={() => router.back()} style={{ color: 'var(--muted)', background: 'none', border: 'none', cursor: 'pointer', marginBottom: '16px', fontWeight: 600 }}>
                    ← 돌아가기
                </button>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                        <h1 className="title" style={{ color: 'var(--primary)', marginBottom: '4px' }}>{property.case_number}</h1>
                        <p style={{ color: 'var(--muted)', fontWeight: 500 }}>{property.address}</p>
                    </div>
                    <button 
                        onClick={() => router.push(`/properties/${id}/edit`)}
                        className="button button-secondary"
                        style={{ padding: '8px 16px', fontSize: '14px' }}
                    >
                        수정하기
                    </button>
                </div>
            </div>

            {/* 상단 탭 */}
            <div style={{ 
                display: 'grid',
                gridTemplateColumns: 'repeat(4, 1fr)',
                gap: '0', 
                marginBottom: '32px', 
                borderBottom: '1px solid var(--border)', 
                paddingBottom: '0' 
            }}>
                <button 
                    onClick={() => setActiveTab('info')}
                    style={{ 
                        padding: '12px 8px',
                        border: 'none', 
                        background: 'none', 
                        color: activeTab === 'info' ? 'var(--primary)' : 'var(--muted)',
                        borderBottom: activeTab === 'info' ? '2px solid var(--primary)' : '2px solid transparent',
                        fontWeight: 600,
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        fontSize: '14px',
                        whiteSpace: 'nowrap',
                        textAlign: 'center'
                    }}
                >
                    기본
                    <br/>
                    정보
                </button>
                <button 
                    onClick={() => setActiveTab('analysis')}
                    style={{ 
                        padding: '12px 8px',
                        border: 'none', 
                        background: 'none', 
                        color: activeTab === 'analysis' ? 'var(--primary)' : 'var(--muted)',
                        borderBottom: activeTab === 'analysis' ? '2px solid var(--primary)' : '2px solid transparent',
                        fontWeight: 600,
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        fontSize: '14px',
                        whiteSpace: 'nowrap',
                        textAlign: 'center'
                    }}
                >
                    수익률
                    <br/>
                    분석
                </button>
                <button 
                    onClick={() => setActiveTab('bid')}
                    style={{ 
                        padding: '12px 8px',
                        border: 'none', 
                        background: 'none', 
                        color: activeTab === 'bid' ? 'var(--primary)' : 'var(--muted)',
                        borderBottom: activeTab === 'bid' ? '2px solid var(--primary)' : '2px solid transparent',
                        fontWeight: 600,
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        fontSize: '14px',
                        whiteSpace: 'nowrap',
                        textAlign: 'center'
                    }}
                >
                    입찰가
                    <br/>
                    계산기
                </button>
                <button 
                    onClick={() => setActiveTab('simulation')}
                    style={{ 
                        padding: '12px 8px',
                        border: 'none', 
                        background: 'none', 
                        color: activeTab === 'simulation' ? 'var(--primary)' : 'var(--muted)',
                        borderBottom: activeTab === 'simulation' ? '2px solid var(--primary)' : '2px solid transparent',
                        fontWeight: 600,
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        fontSize: '14px',
                        whiteSpace: 'nowrap',
                        textAlign: 'center'
                    }}
                >
                    시뮬
                    <br/>
                    레이션
                </button>
            </div>

            {/* 기본정보 탭 */}
            {activeTab === 'info' && (
                <div className="card">
                    <h2 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '24px' }}>기본 정보</h2>
                    
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid var(--border)' }}>
                            <span style={{ color: 'var(--muted)' }}>사건번호</span>
                            <span style={{ fontWeight: 600 }}>{property.case_number}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid var(--border)' }}>
                            <span style={{ color: 'var(--muted)' }}>물건 종류</span>
                            <span style={{ fontWeight: 600 }}>
                                {property.property_type === 'HOUSE' ? '주택' : property.property_type === 'OFFICETEL' ? '오피스텔' : '상가'}
                            </span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid var(--border)' }}>
                            <span style={{ color: 'var(--muted)' }}>주소</span>
                            <span style={{ fontWeight: 600, textAlign: 'right' }}>{property.address}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid var(--border)' }}>
                            <span style={{ color: 'var(--muted)' }}>전용면적</span>
                            <span style={{ fontWeight: 600 }}>{property.building_area}㎡</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid var(--border)' }}>
                            <span style={{ color: 'var(--muted)' }}>낙찰가</span>
                            <span style={{ fontWeight: 600, color: 'var(--primary)' }}>{property.auction_price.toLocaleString()}원</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid var(--border)' }}>
                            <span style={{ color: 'var(--muted)' }}>예상 매도가</span>
                            <span style={{ fontWeight: 600, color: '#16a34a' }}>{property.expected_sale_price.toLocaleString()}원</span>
                        </div>
                        {property.public_price && property.public_price > 0 && (
                            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid var(--border)' }}>
                                <span style={{ color: 'var(--muted)' }}>공시가격</span>
                                <span style={{ fontWeight: 600 }}>{property.public_price.toLocaleString()}원</span>
                            </div>
                        )}
                        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid var(--border)' }}>
                            <span style={{ color: 'var(--muted)' }}>조정대상지역</span>
                            <span style={{ fontWeight: 600 }}>{property.is_adjustment_area ? '예' : '아니오'}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid var(--border)' }}>
                            <span style={{ color: 'var(--muted)' }}>대출금액</span>
                            <span style={{ fontWeight: 600 }}>{property.loan_amount.toLocaleString()}원</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid var(--border)' }}>
                            <span style={{ color: 'var(--muted)' }}>이율</span>
                            <span style={{ fontWeight: 600 }}>{property.interest_rate}%</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid var(--border)' }}>
                            <span style={{ color: 'var(--muted)' }}>매도 예정 기간</span>
                            <span style={{ fontWeight: 600 }}>{property.loan_months}개월</span>
                        </div>
                        
                        <h3 style={{ fontSize: '16px', fontWeight: 700, marginTop: '16px', marginBottom: '8px' }}>부대비용</h3>
                        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid var(--border)' }}>
                            <span style={{ color: 'var(--muted)' }}>인테리어비</span>
                            <span style={{ fontWeight: 600 }}>{property.interior_cost.toLocaleString()}원</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid var(--border)' }}>
                            <span style={{ color: 'var(--muted)' }}>명도비</span>
                            <span style={{ fontWeight: 600 }}>{property.eviction_cost.toLocaleString()}원</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid var(--border)' }}>
                            <span style={{ color: 'var(--muted)' }}>중개수수료</span>
                            <span style={{ fontWeight: 600 }}>{property.brokerage_fee.toLocaleString()}원</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid var(--border)' }}>
                            <span style={{ color: 'var(--muted)' }}>기타 비용</span>
                            <span style={{ fontWeight: 600 }}>{property.other_costs.toLocaleString()}원</span>
                        </div>
                        
                        {property.notes && (
                            <div style={{ marginTop: '16px' }}>
                                <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '8px' }}>메모</h3>
                                <p style={{ color: '#475569', lineHeight: '1.6', whiteSpace: 'pre-wrap' }}>{property.notes}</p>
                            </div>
                        )}
                    </div>
                </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                {activeTab === 'analysis' && (
                    <>
                        {/* 단기 매도 분석 카드 */}
                        <div className="card" style={{ borderLeft: '4px solid var(--primary)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                                <h2 style={{ fontSize: '18px', fontWeight: 600 }}>단기 매도 ROI 분석</h2>
                                <span style={{ 
                                    fontSize: '12px', 
                                    padding: '4px 10px', 
                                    borderRadius: '100px', 
                                    backgroundColor: 'rgba(99, 102, 241, 0.1)', 
                                    color: '#818cf8',
                                    fontWeight: 600
                                }}>
                                    {saleScenario.taxInfo}
                                </span>
                            </div>
                            
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', marginBottom: '32px' }}>
                                <div style={{ textAlign: 'center', padding: '24px', backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid var(--border)', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
                                    <p style={{ fontSize: '14px', color: 'var(--muted)', marginBottom: '8px', fontWeight: 600 }}>수익률</p>
                                    <p style={{ fontSize: '36px', fontWeight: 800, color: '#16a34a' }}>{saleScenario.roi.toFixed(1)}%</p>
                                </div>
                                <div style={{ textAlign: 'center', padding: '24px', backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid var(--border)', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
                                    <p style={{ fontSize: '14px', color: 'var(--muted)', marginBottom: '8px', fontWeight: 600 }}>세후 순이익</p>
                                    <p style={{ fontSize: '28px', fontWeight: 800, color: 'var(--foreground)' }}>{formatAmount(saleScenario.netProfit)}만원</p>
                                </div>
                                <div style={{ textAlign: 'center', padding: '24px', backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid var(--border)', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
                                    <p style={{ fontSize: '14px', color: 'var(--muted)', marginBottom: '8px', fontWeight: 600 }}>실투자금</p>
                                    <p style={{ fontSize: '28px', fontWeight: 800, color: 'var(--foreground)' }}>{formatAmount(saleScenario.actualInvestment)}만원</p>
                                </div>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                {/* 상세 항목 */}
                                <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '12px', borderBottom: '1px solid var(--border)' }}>
                                    <span style={{ color: '#94a3b8' }}>낙찰가</span>
                                    <span style={{ fontWeight: 600 }}>{property.auction_price.toLocaleString()}원</span>
                                </div>
                                <div style={{ paddingBottom: '12px', borderBottom: '1px solid var(--border)' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                                        <span style={{ color: '#94a3b8' }}>취득세 등</span>
                                        <span style={{ fontWeight: 600 }}>{acquisitionTax.toLocaleString()}원</span>
                                    </div>
                                    <div style={{ fontSize: '11px', color: '#64748b', textAlign: 'right' }}>{acquisitionTaxRate}</div>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '12px', borderBottom: '1px solid var(--border)' }}>
                                    <span style={{ color: '#94a3b8' }}>부대비용</span>
                                    <span style={{ fontWeight: 600 }}>{(property.interior_cost + property.eviction_cost + property.brokerage_fee + property.other_costs).toLocaleString()}원</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '12px', borderBottom: '1px solid var(--border)' }}>
                                    <span style={{ color: '#94a3b8' }}>대출이자 (총액)</span>
                                    <span style={{ fontWeight: 600 }}>{(saleScenario.totalCost - property.auction_price - acquisitionTax - property.interior_cost - property.eviction_cost - property.brokerage_fee - property.other_costs).toLocaleString()}원</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px', paddingTop: '12px', borderTop: '2px solid var(--border)' }}>
                                    <span style={{ fontWeight: 700, fontSize: '16px' }}>총 지출 합계</span>
                                    <span style={{ fontWeight: 700, fontSize: '16px', color: 'var(--primary)' }}>{saleScenario.totalCost.toLocaleString()}원</span>
                                </div>

                                <div style={{ height: '1px', backgroundColor: 'var(--border)', margin: '16px 0' }}></div>

                                <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '12px', borderBottom: '1px solid var(--border)' }}>
                                    <span style={{ color: '#94a3b8' }}>예상 매도가</span>
                                    <span style={{ fontWeight: 600 }}>{property.expected_sale_price.toLocaleString()}원</span>
                                </div>
                                <div style={{ paddingBottom: '12px', borderBottom: '1px solid var(--border)' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                                        <span style={{ color: '#94a3b8' }}>세전 수익</span>
                                        <span style={{ color: '#16a34a', fontWeight: 700 }}>{saleScenario.grossProfit.toLocaleString()}원</span>
                                    </div>
                                    <div style={{ fontSize: '11px', color: '#64748b', textAlign: 'right' }}>매도가 - 총 비용</div>
                                </div>
                                <div style={{ paddingBottom: '12px', borderBottom: '1px solid var(--border)' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                                        <span style={{ color: '#94a3b8' }}>총 세금</span>
                                        <span style={{ color: '#ef4444', fontWeight: 700 }}>{saleScenario.totalTax.toLocaleString()}원</span>
                                    </div>
                                    <div style={{ fontSize: '11px', color: '#64748b', textAlign: 'right' }}>취득세 + 양도세(지방세 포함)</div>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px', paddingTop: '12px', borderTop: '2px solid var(--border)' }}>
                                    <span style={{ fontWeight: 700, fontSize: '16px' }}>세후 순이익</span>
                                    <span style={{ fontWeight: 700, fontSize: '16px', color: '#16a34a' }}>{saleScenario.netProfit.toLocaleString()}원</span>
                                </div>
                            </div>
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
                    </>
                )}

                {activeTab === 'bid' && (
                    <div className="card">
                        <h2 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '24px' }}>목표 수익 달성을 위한 입찰가 계산</h2>
                        <div style={{ marginBottom: '32px' }}>
                            <label className="label">예상 매도가</label>
                            <div className="input-field" style={{ marginBottom: '16px', backgroundColor: '#f8fafc', color: 'var(--muted)' }}>
                                {property.expected_sale_price.toLocaleString()}원
                            </div>
                            
                            <label className="label">목표 수익률 (%)</label>
                            <input 
                                type="number" 
                                className="input-field" 
                                value={targetRoi} 
                                onChange={(e) => setTargetRoi(e.target.value)}
                                placeholder="10"
                                style={{ marginBottom: '12px' }}
                            />
                            <button className="button button-primary" onClick={handleCalculateBid} style={{ width: '100%', padding: '14px' }}>
                                계산하기
                            </button>
                        </div>

                        {bidResult && (
                            <div style={{ borderTop: '1px solid var(--border)', paddingTop: '32px' }}>
                                <div style={{ textAlign: 'center', marginBottom: '32px', padding: '24px', backgroundColor: '#f0fdf4', borderRadius: '12px', border: '1px solid #bbf7d0' }}>
                                    <p style={{ color: 'var(--muted)', fontSize: '14px', marginBottom: '8px' }}>최대 입찰가 제안</p>
                                    <p style={{ fontSize: '32px', fontWeight: 800, color: 'var(--primary)' }}>
                                        {bidResult.maxBidPrice.toLocaleString()}원
                                    </p>
                                </div>
                                
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                    <div style={{ padding: '16px', backgroundColor: '#f8fafc', borderRadius: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: '1px solid var(--border)' }}>
                                        <span style={{ fontSize: '14px', color: '#94a3b8' }}>달성 수익률</span>
                                        <span style={{ fontSize: '20px', fontWeight: 700, color: '#16a34a' }}>{bidResult.achievedRoi.toFixed(1)}%</span>
                                    </div>
                                    <div style={{ padding: '16px', backgroundColor: '#f8fafc', borderRadius: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: '1px solid var(--border)' }}>
                                        <span style={{ fontSize: '14px', color: '#94a3b8' }}>세후 순이익</span>
                                        <span style={{ fontSize: '20px', fontWeight: 700 }}>{formatAmount(bidResult.report.saleScenario.netProfit)}만원</span>
                                    </div>
                                    <div style={{ padding: '16px', backgroundColor: '#f8fafc', borderRadius: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: '1px solid var(--border)' }}>
                                        <span style={{ fontSize: '14px', color: '#94a3b8' }}>실투자금</span>
                                        <span style={{ fontSize: '20px', fontWeight: 700 }}>{formatAmount(bidResult.report.saleScenario.actualInvestment)}만원</span>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'simulation' && (
                    <div className="card">
                        <h2 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '24px' }}>📊 시뮬레이션 결과</h2>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            {(() => {
                                const targetRoiNum = parseFloat(targetRoi) || 40;
                                const roiTargets = [5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 60, 70, 80, 90, 100];
                                
                                // 계산 결과 생성
                                const results = roiTargets.map(target => {
                                    const calc = new BidPriceCalculator();
                                    const res = property && taxProfile ? calc.calculateMaxBidPrice(target, property.expected_sale_price, property, taxProfile) : null;
                                    if (!res) return null;
                                    return {
                                        target,
                                        ...res,
                                        diff: Math.abs(target - targetRoiNum)
                                    };
                                }).filter(Boolean);
                                
                                // 목표 수익률과 가까운 순으로 정렬
                                results.sort((a, b) => a!.diff - b!.diff);
                                
                                return results.slice(0, 6).map((res, idx) => (
                                    <div 
                                        key={res!.target} 
                                        style={{ 
                                            padding: '20px', 
                                            backgroundColor: idx === 0 ? '#f0fdf4' : '#ffffff', 
                                            border: idx === 0 ? '1px solid #bbf7d0' : '1px solid var(--border)',
                                            borderRadius: '12px',
                                            boxShadow: idx === 0 ? '0 4px 12px rgba(22, 163, 74, 0.1)' : '0 2px 8px rgba(0,0,0,0.03)'
                                        }}
                                    >
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                                            <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--foreground)' }}>
                                                시나리오 {idx + 1} {idx === 0 && '⭐ 최적'}
                                            </h3>
                                        </div>
                                        
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                                <span style={{ color: '#94a3b8', fontSize: '14px' }}>입찰가</span>
                                                <span style={{ fontWeight: 700, fontSize: '18px' }}>{res!.maxBidPrice.toLocaleString()}원</span>
                                            </div>
                                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                                <span style={{ color: '#94a3b8', fontSize: '14px' }}>수익률</span>
                                                <span style={{ fontWeight: 700, fontSize: '18px', color: '#10b981' }}>{res!.target}%</span>
                                            </div>
                                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                                <span style={{ color: '#94a3b8', fontSize: '14px' }}>순이익</span>
                                                <span style={{ fontWeight: 600 }}>{formatAmount(res!.report.saleScenario.netProfit)}만원</span>
                                            </div>
                                            <div style={{ paddingTop: '8px', borderTop: '1px solid rgba(255, 255, 255, 0.1)' }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                                                    <span style={{ color: '#64748b' }}>매도가 - 총 비용 - 세금</span>
                                                </div>
                                            </div>
                                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                                <span style={{ color: '#94a3b8', fontSize: '14px' }}>실투자금</span>
                                                <span style={{ fontWeight: 600 }}>{formatAmount(res!.report.saleScenario.actualInvestment)}만원</span>
                                            </div>
                                            <div style={{ paddingTop: '8px', borderTop: '1px solid rgba(255, 255, 255, 0.1)' }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                                                    <span style={{ color: '#64748b' }}>(입찰가 + 대출) + 비용 + 양도세</span>
                                                </div>
                                            </div>
                                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                                <span style={{ color: '#94a3b8', fontSize: '14px' }}>총 세금</span>
                                                <span style={{ fontWeight: 600, color: '#ef4444' }}>{formatAmount(res!.report.saleScenario.totalTax)}만원</span>
                                            </div>
                                            <div style={{ paddingTop: '8px', borderTop: '1px solid rgba(255, 255, 255, 0.1)' }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                                                    <span style={{ color: '#64748b' }}>취득세 + 양도세(지방세 포함)</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ));
                            })()}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
