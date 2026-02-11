export enum PropertyType {
    HOUSE = 'HOUSE',
    OFFICETEL = 'OFFICETEL',
    COMMERCIAL = 'COMMERCIAL'
}

export interface Property {
    id?: number;
    user_id?: string;
    case_number: string;
    property_type: PropertyType;
    address: string;
    building_area: number;
    auction_price: number;
    expected_sale_price: number;
    public_price?: number;
    is_adjustment_area: boolean;
    is_redevelopment_area: boolean;
    is_local_area: boolean;
    
    // 비용 항목
    loan_amount: number;
    loan_months: number;
    interest_rate: number;
    interior_cost: number;
    eviction_cost: number;
    brokerage_fee: number;
    vacancy_management_cost: number;
    other_costs: number;
    
    // 임대 정보
    monthly_rent: number;
    monthly_deposit: number;
    jeonse_deposit: number;
    
    // 메타 정보
    notes?: string;
    created_at?: string;
    updated_at?: string;
}

export interface TaxProfile {
    houseCount: number;
    isBusiness: boolean;
    previousYearProfit: number; // 전년도 매출(소득)
    currentYearProfit: number;  // 올해 타 소득
}

export interface ROIReport {
    saleScenario: SaleScenario;
    rentScenario: RentScenario;
    jeonseScenario: JeonseScenario;
    acquisitionTax: number;
    acquisitionTaxRate: string;
}

export interface SaleScenario {
    totalCost: number;
    grossProfit: number;
    netProfit: number;
    actualInvestment: number;
    totalTax: number;
    roi: number;
    taxInfo: string;
}

export interface RentScenario {
    monthlyRent: number;
    monthlyInterest: number;
    monthlyNetIncome: number;
    actualInvestment: number;
    rentalYield: number;
    deposit: number;
}

export interface JeonseScenario {
    actualInvestment: number;
    isPlusP: boolean;
    deposit: number;
}

export interface BidPriceResult {
    maxBidPrice: number;
    achievedRoi: number;
    targetRoi: number;
    roiDifference: number;
    report: ROIReport;
}
