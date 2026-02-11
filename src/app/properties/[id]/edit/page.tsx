'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { PropertyType } from '@/lib/types';
import { calculateBrokerageFee } from '@/lib/utils/brokerageFee';
import Modal from '@/components/Modal';

export default function EditPropertyPage() {
    const { id } = useParams();
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [modal, setModal] = useState<{ isOpen: boolean; type: 'success' | 'error'; message: string }>({ 
        isOpen: false, 
        type: 'error', 
        message: '' 
    });
    const [formData, setFormData] = useState({
        case_number: '',
        property_type: PropertyType.HOUSE,
        address: '',
        building_area: '',
        auction_price: '',
        expected_sale_price: '',
        public_price: '',
        is_adjustment_area: false,
        loan_amount: '',
        interest_rate: '5.0',
        loan_months: '6',
        interior_cost: '0',
        eviction_cost: '0',
        brokerage_fee: '0',
        other_costs: '0',
        notes: ''
    });

    useEffect(() => {
        fetchProperty();
    }, [id]);

    const fetchProperty = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('properties')
            .select('*')
            .eq('id', id)
            .single();

        if (error || !data) {
            router.push('/');
            return;
        }

        setFormData({
            case_number: data.case_number,
            property_type: data.property_type,
            address: data.address,
            building_area: String(data.building_area),
            auction_price: formatNumber(String(data.auction_price)),
            expected_sale_price: formatNumber(String(data.expected_sale_price)),
            public_price: data.public_price ? formatNumber(String(data.public_price)) : '',
            is_adjustment_area: data.is_adjustment_area,
            loan_amount: formatNumber(String(data.loan_amount)),
            interest_rate: String(data.interest_rate),
            loan_months: String(data.loan_months),
            interior_cost: formatNumber(String(data.interior_cost)),
            eviction_cost: formatNumber(String(data.eviction_cost)),
            brokerage_fee: formatNumber(String(data.brokerage_fee)),
            other_costs: formatNumber(String(data.other_costs)),
            notes: data.notes || ''
        });
        setLoading(false);
    };

    const formatNumber = (val: string) => {
        if (!val) return '';
        const num = val.replace(/[^0-9]/g, '');
        return num.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    };

    const parseNumber = (val: string) => {
        if (typeof val !== 'string') return val;
        return parseFloat(val.replace(/,/g, '')) || 0;
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value, type } = e.target;
        
        if (type === 'checkbox') {
            setFormData(prev => ({ ...prev, [name]: (e.target as HTMLInputElement).checked }));
        } else if (['auction_price', 'expected_sale_price', 'public_price', 'loan_amount', 'interior_cost', 'eviction_cost', 'brokerage_fee', 'other_costs'].includes(name)) {
            const formatted = formatNumber(value);
            const updates: any = { [name]: formatted };
            
            // 낙찰가 입력 시 대출금액 및 중개수수료 자동 계산 (원치 않을 수도 있지만 기본 로직 유지)
            if (name === 'auction_price') {
                const auctionPrice = parseNumber(formatted);
                if (auctionPrice > 0) {
                    updates.loan_amount = formatNumber(String(Math.floor(auctionPrice * 0.8)));
                    updates.brokerage_fee = formatNumber(String(calculateBrokerageFee(auctionPrice)));
                }
            }
            
            setFormData(prev => ({ ...prev, ...updates }));
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);

        const submissionData = {
            ...formData,
            building_area: parseFloat(formData.building_area) || 0,
            auction_price: parseNumber(formData.auction_price),
            expected_sale_price: parseNumber(formData.expected_sale_price),
            public_price: formData.public_price ? parseNumber(formData.public_price) : null,
            loan_amount: parseNumber(formData.loan_amount),
            interest_rate: parseFloat(formData.interest_rate) || 0,
            loan_months: parseInt(formData.loan_months) || 0,
            interior_cost: parseNumber(formData.interior_cost),
            eviction_cost: parseNumber(formData.eviction_cost),
            brokerage_fee: parseNumber(formData.brokerage_fee),
            other_costs: parseNumber(formData.other_costs)
        };

        const { error } = await supabase
            .from('properties')
            .update(submissionData)
            .eq('id', id);

        if (!error) {
            router.push(`/properties/${id}`);
        } else {
            setModal({ isOpen: true, type: 'error', message: `수정 중 오류가 발생했습니다: ${error.message}` });
        }
        setSaving(false);
    };

    if (loading) return <div className="container" style={{ paddingTop: '100px', textAlign: 'center' }}>데이터 불러오는 중...</div>;

    return (
        <div className="container" style={{ paddingTop: '40px', paddingBottom: '80px' }}>
            <h1 className="title">물건 정보 수정</h1>
            
            <form onSubmit={handleSubmit} className="card">
                {/* 기본 정보 */}
                <section style={{ marginBottom: '32px' }}>
                    <h2 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '16px', color: 'var(--primary)' }}>기본 정보</h2>
                    <label className="label">사건번호</label>
                    <input name="case_number" className="input-field" placeholder="2024타경..." required onChange={handleChange} value={formData.case_number} />
                    
                    <label className="label">물건 종류</label>
                    <select name="property_type" className="input-field" onChange={handleChange} value={formData.property_type}>
                        <option value={PropertyType.HOUSE}>주택</option>
                        <option value={PropertyType.OFFICETEL}>오피스텔</option>
                        <option value={PropertyType.COMMERCIAL}>상가</option>
                    </select>

                    <label className="label">주소</label>
                    <input name="address" className="input-field" placeholder="서울시..." required onChange={handleChange} value={formData.address} />

                    <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginTop: '16px' }}>
                        <input type="checkbox" name="is_adjustment_area" id="is_adjustment_area" onChange={handleChange} checked={formData.is_adjustment_area} />
                        <label htmlFor="is_adjustment_area" style={{ fontSize: '14px', cursor: 'pointer' }}>조정대상지역</label>
                    </div>
                </section>

                {/* 금액 정보 */}
                <section style={{ marginBottom: '32px', paddingTop: '32px', borderTop: '1px solid var(--border)' }}>
                    <h2 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '16px', color: '#16a34a' }}>금액 및 면적</h2>
                    <label className="label">낙찰가 (원)</label>
                    <input type="text" name="auction_price" className="input-field" placeholder="0" required onChange={handleChange} value={formData.auction_price} />

                    <label className="label">전용면적 (m²)</label>
                    <input type="number" step="0.01" name="building_area" className="input-field" placeholder="0.0" required onChange={handleChange} value={formData.building_area} />

                    <label className="label">예상 매도가 (원)</label>
                    <input type="text" name="expected_sale_price" className="input-field" placeholder="0" required onChange={handleChange} value={formData.expected_sale_price} />

                    <label className="label">공시가격 (원) - 선택사항</label>
                    <input type="text" name="public_price" className="input-field" placeholder="0" onChange={handleChange} value={formData.public_price} />
                </section>

                {/* 대출 및 비용 */}
                <section style={{ marginBottom: '32px', paddingTop: '32px', borderTop: '1px solid var(--border)' }}>
                    <h2 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '16px', color: '#f59e0b' }}>대출 및 부대비용</h2>
                    <label className="label">대출금액 (원)</label>
                    <input type="text" name="loan_amount" className="input-field" placeholder="0" onChange={handleChange} value={formData.loan_amount} />
                    
                    <label className="label">이율 (%)</label>
                    <input type="number" step="0.1" name="interest_rate" className="input-field" placeholder="5.0" onChange={handleChange} value={formData.interest_rate} />
                    
                    <label className="label">매도 예정 기간 (개월)</label>
                    <input type="number" name="loan_months" className="input-field" placeholder="6" onChange={handleChange} value={formData.loan_months} />
                    
                    <label className="label">부대비용 (명도, 수리비 등)</label>
                    <input type="text" name="interior_cost" className="input-field" placeholder="0" onChange={handleChange} value={formData.interior_cost} />
                </section>

                {/* 메모 */}
                <section style={{ paddingTop: '32px', borderTop: '1px solid var(--border)' }}>
                    <h2 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '16px', color: '#94a3b8' }}>메모</h2>
                    <textarea 
                        name="notes" 
                        className="input-field" 
                        style={{ height: '120px', resize: 'none' }} 
                        placeholder="물건에 대한 특이사항을 적어주세요." 
                        onChange={handleChange}
                        value={formData.notes}
                    ></textarea>
                </section>

                <div style={{ marginTop: '40px', display: 'flex', gap: '16px', justifyContent: 'flex-end' }}>
                    <button type="button" onClick={() => router.back()} className="button button-secondary">취소</button>
                    <button type="submit" className="button button-primary" style={{ paddingLeft: '40px', paddingRight: '40px' }} disabled={saving}>
                        {saving ? '저장 중...' : '정보 수정 완료'}
                    </button>
                </div>
            </form>

            <Modal
                isOpen={modal.isOpen}
                onClose={() => setModal({ ...modal, isOpen: false })}
                type={modal.type}
                message={modal.message}
            />
        </div>
    );
}
