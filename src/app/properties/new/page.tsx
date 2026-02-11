'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { PropertyType } from '@/lib/types';

export default function NewPropertyPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        caseNumber: '',
        propertyType: PropertyType.HOUSE,
        address: '',
        buildingArea: 0,
        auctionPrice: 0,
        expectedSalePrice: 0,
        publicPrice: 0,
        isAdjustmentArea: false,
        loanAmount: 0,
        interestRate: 0,
        loanMonths: 0,
        interiorCost: 0,
        evictionCost: 0,
        brokerageFee: 0,
        otherCosts: 0,
        notes: ''
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value, type } = e.target;
        const val = type === 'checkbox' ? (e.target as HTMLInputElement).checked : 
                    type === 'number' ? parseFloat(value) : value;
        
        setFormData(prev => ({ ...prev, [name]: val }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;

        const { error } = await supabase.from('properties').insert([
            { ...formData, user_id: session.user.id }
        ]);

        if (!error) {
            router.push('/');
            router.refresh();
        } else {
            alert('등록 중 오류가 발생했습니다: ' + error.message);
        }
        setLoading(false);
    };

    return (
        <div className="container" style={{ paddingTop: '40px', paddingBottom: '80px' }}>
            <h1 className="title">새 물건 등록</h1>
            
            <form onSubmit={handleSubmit} className="card">
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px' }}>
                    {/* 기본 정보 */}
                    <section>
                        <h2 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '16px', color: '#818cf8' }}>기본 정보</h2>
                        <label className="label">사건번호</label>
                        <input name="caseNumber" className="input-field" placeholder="2024타경..." required onChange={handleChange} />
                        
                        <label className="label">물건 유형</label>
                        <select name="propertyType" className="input-field" onChange={handleChange}>
                            <option value={PropertyType.HOUSE}>주택</option>
                            <option value={PropertyType.OFFICETEL}>오피스텔</option>
                            <option value={PropertyType.COMMERCIAL}>상가</option>
                        </select>

                        <label className="label">주소</label>
                        <input name="address" className="input-field" placeholder="서울시..." required onChange={handleChange} />

                        <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginTop: '8px' }}>
                            <input type="checkbox" name="isAdjustmentArea" id="isAdjustmentArea" onChange={handleChange} />
                            <label htmlFor="isAdjustmentArea" style={{ fontSize: '14px', cursor: 'pointer' }}>조정지역 여부</label>
                        </div>
                    </section>

                    {/* 금액 정보 */}
                    <section>
                        <h2 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '16px', color: '#10b981' }}>금액 및 면적</h2>
                        <label className="label">낙찰가 (원)</label>
                        <input type="number" name="auctionPrice" className="input-field" placeholder="0" required onChange={handleChange} />

                        <label className="label">전용면적 (m²)</label>
                        <input type="number" step="0.01" name="buildingArea" className="input-field" placeholder="0.0" required onChange={handleChange} />

                        <label className="label">예상 매도가 (원)</label>
                        <input type="number" name="expectedSalePrice" className="input-field" placeholder="0" required onChange={handleChange} />

                        <label className="label">공시가격 (원)</label>
                        <input type="number" name="publicPrice" className="input-field" placeholder="0" required onChange={handleChange} />
                    </section>
                </div>

                <div style={{ marginTop: '32px', borderTop: '1px solid var(--border)', paddingTop: '32px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px' }}>
                    {/* 대출 및 비용 */}
                    <section>
                        <h2 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '16px', color: '#f59e0b' }}>대출 및 부대비용</h2>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                            <div>
                                <label className="label">대출금액</label>
                                <input type="number" name="loanAmount" className="input-field" placeholder="0" onChange={handleChange} />
                            </div>
                            <div>
                                <label className="label">이율 (%)</label>
                                <input type="number" step="0.1" name="interestRate" className="input-field" placeholder="0.0" onChange={handleChange} />
                            </div>
                        </div>
                        <label className="label">보유 예정 (개월)</label>
                        <input type="number" name="loanMonths" className="input-field" placeholder="12" onChange={handleChange} />
                        
                        <label className="label">기타 비용 합계 (인테리어, 명도 등)</label>
                        <input type="number" name="interiorCost" className="input-field" placeholder="0" onChange={handleChange} />
                    </section>

                    {/* 메모 */}
                    <section>
                        <h2 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '16px', color: '#94a3b8' }}>메모</h2>
                        <textarea 
                            name="notes" 
                            className="input-field" 
                            style={{ height: '140px', resize: 'none' }} 
                            placeholder="물건에 대한 특이사항을 적어주세요." 
                            onChange={handleChange}
                        ></textarea>
                    </section>
                </div>

                <div style={{ marginTop: '40px', display: 'flex', gap: '16px', justifyContent: 'flex-end' }}>
                    <button type="button" onClick={() => router.back()} className="button button-secondary">취소</button>
                    <button type="submit" className="button button-primary" style={{ paddingLeft: '40px', paddingRight: '40px' }} disabled={loading}>
                        {loading ? '저장 중...' : '물건 등록 완료'}
                    </button>
                </div>
            </form>
        </div>
    );
}
