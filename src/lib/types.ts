export enum PropertyType {
    HOUSE = 'HOUSE',
    OFFICETEL = 'OFFICETEL',
    COMMERCIAL = 'COMMERCIAL'
}

export interface Property {
    id?: number;
    caseNumber: string;
    propertyType: PropertyType;
    address: string;
    buildingArea: number;
    auctionPrice: number;
    expectedSalePrice: number;
    publicPrice: number;
    isAdjustmentArea: boolean;
    isRedevelopmentArea: boolean;
    isLocalArea: boolean;
    
    // 비용 항목
    loanAmount: number;
    loanMonths: number;
    interestRate: number;
    interiorCost: number;
    evictionCost: number;
    brokerageFee: number;
    vacancyManagementCost: number;
    otherCosts: number;
    
    // 임대 정보
    monthlyRent: number;
    monthlyDeposit: number;
    jeonseDeposit: number;
    
    // 메타 정보
    notes?: string;
    created_at?: string;
    updated_at?: string;
}

export interface TaxProfile {
    currentHouseCount: number;
    isBusiness: boolean;
    currentYearProfit: number;
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
