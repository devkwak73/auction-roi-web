import { PropertyType } from '../types';
import { IncomeTaxCalculator } from './IncomeTaxCalculator';

export class CapitalGainsTaxCalculator {
    private incomeTaxCalc = new IncomeTaxCalculator();

    calculate(
        propertyType: PropertyType,
        profit: number,
        holdingMonths: number = 12,
        isOnlyHouse: boolean = false,
        publicPrice: number = 0
    ): number {
        if (profit <= 0) return 0;

        // 1세대 1주택 2년 이상 보유 (비과세)
        if (
            propertyType === PropertyType.HOUSE &&
            isOnlyHouse &&
            holdingMonths >= 24 &&
            publicPrice <= 1200000000
        ) {
            const taxableProfit = Math.max(0, profit - 900000000);
            if (taxableProfit === 0) return 0;
            return this.applyLongTermDeduction(taxableProfit, holdingMonths);
        }

        // 2년 미만 보유: 단기 양도 40%
        if (holdingMonths < 24) {
            return Math.floor(profit * 0.40);
        }

        // 2년 이상 보유: 장기보유특별공제 + 누진세율
        return this.applyLongTermDeduction(profit, holdingMonths);
    }

    private applyLongTermDeduction(profit: number, holdingMonths: number): number {
        let deductionRate = 0.0;
        if (holdingMonths >= 36) {
            if (holdingMonths < 48) deductionRate = 0.12;
            else if (holdingMonths < 60) deductionRate = 0.16;
            else if (holdingMonths < 72) deductionRate = 0.20;
            else if (holdingMonths < 84) deductionRate = 0.24;
            else if (holdingMonths < 96) deductionRate = 0.28;
            else if (holdingMonths < 108) deductionRate = 0.32;
            else if (holdingMonths < 120) deductionRate = 0.36;
            else deductionRate = 0.40;
        }

        const deduction = Math.floor(profit * deductionRate);
        const taxableProfit = profit - deduction;
        return this.incomeTaxCalc.calculateTax(taxableProfit);
    }

    getTaxInfo(holdingMonths: number, isOnlyHouse: boolean): string {
        if (isOnlyHouse && holdingMonths >= 24) return "1세대 1주택 (비과세 가능)";
        if (holdingMonths < 24) return "40% (2년 미만 단기양도)";

        let deductionRateText = "0%";
        if (holdingMonths >= 36) {
            const rate = Math.min(40, (Math.floor(holdingMonths / 12) - 2) * 4 + 12);
            deductionRateText = `${rate}%`;
        }

        return `누진세율 (장기보유공제 ${deductionRateText})`;
    }
}
