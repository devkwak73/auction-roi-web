import { Property, TaxProfile, ROIReport, SaleScenario, RentScenario, JeonseScenario, PropertyType } from '../types';
import { AcquisitionTaxCalculator } from './AcquisitionTaxCalculator';
import { IncomeTaxCalculator } from './IncomeTaxCalculator';
import { CapitalGainsTaxCalculator } from './CapitalGainsTaxCalculator';

export class ROICalculator {
    private acquisitionTaxCalc = new AcquisitionTaxCalculator();
    private incomeTaxCalc = new IncomeTaxCalculator();
    private capitalGainsTaxCalc = new CapitalGainsTaxCalculator();

    calculate(property: Property, taxProfile: TaxProfile): ROIReport {
        const acquisitionTax = this.acquisitionTaxCalc.calculate(
            property.auction_price,
            property.building_area,
            taxProfile.houseCount,
            property.is_adjustment_area,
            property.property_type
        );

        const acquisitionTaxRateInfo = this.acquisitionTaxCalc.getTaxRateInfo(
            property.auction_price,
            property.building_area,
            taxProfile.houseCount,
            property.is_adjustment_area,
            property.property_type
        );

        const commonExpenses = 
            property.interior_cost + property.eviction_cost + 
            property.brokerage_fee + property.vacancy_management_cost + 
            property.other_costs;

        const saleScenario = this.calculateSaleScenario(
            property, taxProfile, acquisitionTax, commonExpenses
        );

        const rentScenario = this.calculateRentScenario(
            property, acquisitionTax, commonExpenses
        );

        const jeonseScenario = this.calculateJeonseScenario(
            property, acquisitionTax, commonExpenses
        );

        return {
            saleScenario,
            rentScenario,
            jeonseScenario,
            acquisitionTax,
            acquisitionTaxRate: acquisitionTaxRateInfo
        };
    }

    private calculateSaleScenario(
        property: Property,
        taxProfile: TaxProfile,
        acquisitionTax: number,
        commonExpenses: number
    ): SaleScenario {
        const loanInterest = this.calculateLoanInterest(
            property.loan_amount,
            property.interest_rate,
            property.loan_months
        );

        const totalCost = property.auction_price + acquisitionTax + loanInterest + commonExpenses;
        const grossProfit = property.expected_sale_price - totalCost;

        const taxResult = this.calculateTaxes(property, taxProfile, grossProfit);
        const appliedTax = taxResult.appliedTax;
        
        const netProfit = grossProfit - appliedTax;
        const actualInvestment = (property.auction_price - property.loan_amount) + acquisitionTax + commonExpenses + loanInterest;

        const roi = actualInvestment > 0 ? (netProfit / actualInvestment) * 100 : 0;

        return {
            totalCost,
            grossProfit,
            netProfit,
            actualInvestment,
            totalTax: appliedTax,
            roi,
            taxInfo: taxResult.taxInfo
        };
    }

    private calculateRentScenario(
        property: Property,
        acquisitionTax: number,
        commonExpenses: number
    ): RentScenario {
        const monthlyInterest = Math.floor(property.loan_amount * (property.interest_rate / 100.0) / 12.0);
        const monthlyNetIncome = property.monthly_rent - monthlyInterest;
        const annualNetIncome = monthlyNetIncome * 12;

        const actualInvestment = (property.auction_price - property.loan_amount - property.monthly_deposit) + acquisitionTax + commonExpenses;
        const rentalYield = actualInvestment > 0 ? (annualNetIncome / actualInvestment) * 100 : 0;

        return {
            monthlyRent: property.monthly_rent,
            monthlyInterest,
            monthlyNetIncome,
            actualInvestment,
            rentalYield,
            deposit: property.monthly_deposit
        };
    }

    private calculateJeonseScenario(
        property: Property,
        acquisitionTax: number,
        commonExpenses: number
    ): JeonseScenario {
        const actualInvestment = (property.auction_price - property.jeonse_deposit) + acquisitionTax + commonExpenses;
        return {
            actualInvestment,
            isPlusP: actualInvestment <= 0,
            deposit: property.jeonse_deposit
        };
    }

    private calculateLoanInterest(loanAmount: number, interestRate: number, months: number): number {
        if (loanAmount === 0 || interestRate === 0 || months === 0) return 0;
        const monthlyRate = interestRate / 100 / 12;
        return Math.floor(loanAmount * monthlyRate * months);
    }

    private calculateTaxes(
        property: Property,
        taxProfile: TaxProfile,
        grossProfit: number
    ): { incomeTax: number, capitalGainsTax: number, appliedTax: number, taxInfo: string } {
        if (!taxProfile.isBusiness) {
            const capitalGainsTax = this.capitalGainsTaxCalc.calculate(
                property.property_type,
                grossProfit,
                12,
                taxProfile.houseCount === 0,
                property.public_price || 0
            );
            return { incomeTax: 0, capitalGainsTax, appliedTax: capitalGainsTax, taxInfo: "양도소득세" };
        }

        const incomeTax = this.incomeTaxCalc.calculateMarginalTax(
            taxProfile.currentYearProfit,
            grossProfit
        );

        if (property.property_type === PropertyType.HOUSE) {
            const capitalGainsTax = this.capitalGainsTaxCalc.calculate(
                property.property_type,
                grossProfit,
                12,
                taxProfile.houseCount === 0,
                property.public_price || 0
            );
            const appliedTax = Math.min(incomeTax, capitalGainsTax);
            const taxInfo = appliedTax === incomeTax ? "사업소득세 (비교과세)" : "양도소득세 (비교과세)";
            return { incomeTax, capitalGainsTax, appliedTax, taxInfo };
        }

        return { incomeTax, capitalGainsTax: 0, appliedTax: incomeTax, taxInfo: "사업소득세 (상가/오피)" };
    }
}
