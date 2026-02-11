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
            property.auctionPrice,
            property.buildingArea,
            taxProfile.currentHouseCount,
            property.isAdjustmentArea,
            property.propertyType
        );

        const acquisitionTaxRateInfo = this.acquisitionTaxCalc.getTaxRateInfo(
            property.auctionPrice,
            property.buildingArea,
            taxProfile.currentHouseCount,
            property.isAdjustmentArea,
            property.propertyType
        );

        const commonExpenses = 
            property.interiorCost + property.evictionCost + 
            property.brokerageFee + property.vacancyManagementCost + 
            property.otherCosts;

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
            property.loanAmount,
            property.interestRate,
            property.loanMonths
        );

        const totalCost = property.auctionPrice + acquisitionTax + loanInterest + commonExpenses;
        const grossProfit = property.expectedSalePrice - totalCost;

        const taxResult = this.calculateTaxes(property, taxProfile, grossProfit);
        const appliedTax = taxResult.appliedTax;
        
        const netProfit = grossProfit - appliedTax;
        const actualInvestment = (property.auctionPrice - property.loanAmount) + acquisitionTax + commonExpenses + loanInterest;

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
        const monthlyInterest = Math.floor(property.loanAmount * (property.interestRate / 100.0) / 12.0);
        const monthlyNetIncome = property.monthlyRent - monthlyInterest;
        const annualNetIncome = monthlyNetIncome * 12;

        const actualInvestment = (property.auctionPrice - property.loanAmount - property.monthlyDeposit) + acquisitionTax + commonExpenses;
        const rentalYield = actualInvestment > 0 ? (annualNetIncome / actualInvestment) * 100 : 0;

        return {
            monthlyRent: property.monthlyRent,
            monthlyInterest,
            monthlyNetIncome,
            actualInvestment,
            rentalYield,
            deposit: property.monthlyDeposit
        };
    }

    private calculateJeonseScenario(
        property: Property,
        acquisitionTax: number,
        commonExpenses: number
    ): JeonseScenario {
        const actualInvestment = (property.auctionPrice - property.jeonseDeposit) + acquisitionTax + commonExpenses;
        return {
            actualInvestment,
            isPlusP: actualInvestment <= 0,
            deposit: property.jeonseDeposit
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
                property.propertyType,
                grossProfit,
                12,
                taxProfile.currentHouseCount === 0,
                property.publicPrice
            );
            return { incomeTax: 0, capitalGainsTax, appliedTax: capitalGainsTax, taxInfo: "양도소득세" };
        }

        const incomeTax = this.incomeTaxCalc.calculateMarginalTax(
            taxProfile.currentYearProfit,
            grossProfit
        );

        if (property.propertyType === PropertyType.HOUSE) {
            const capitalGainsTax = this.capitalGainsTaxCalc.calculate(
                property.propertyType,
                grossProfit,
                12,
                taxProfile.currentHouseCount === 0,
                property.publicPrice
            );
            const appliedTax = Math.min(incomeTax, capitalGainsTax);
            const taxInfo = appliedTax === incomeTax ? "사업소득세 (비교과세)" : "양도소득세 (비교과세)";
            return { incomeTax, capitalGainsTax, appliedTax, taxInfo };
        }

        return { incomeTax, capitalGainsTax: 0, appliedTax: incomeTax, taxInfo: "사업소득세 (상가/오피)" };
    }
}
