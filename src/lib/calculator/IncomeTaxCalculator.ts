export class IncomeTaxCalculator {
    private brackets = [
        { min: 0, max: 14000000, rate: 0.06, deduction: 0 },
        { min: 14000001, max: 50000000, rate: 0.15, deduction: 840000 },
        { min: 50000001, max: 88000000, rate: 0.24, deduction: 5340000 },
        { min: 88000001, max: 150000000, rate: 0.35, deduction: 14020000 },
        { min: 150000001, max: 300000000, rate: 0.38, deduction: 25520000 },
        { min: 300000001, max: 500000000, rate: 0.40, deduction: 35520000 },
        { min: 500000001, max: Number.MAX_SAFE_INTEGER, rate: 0.45, deduction: 65520000 }
    ];

    calculateTax(income: number): number {
        if (income <= 0) return 0;
        const bracket = this.brackets.find(b => income >= b.min && income <= b.max);
        if (!bracket) return 0;
        return Math.floor(income * bracket.rate - bracket.deduction);
    }

    calculateMarginalTax(currentProfit: number, newProfit: number): number {
        const totalTax = this.calculateTax(currentProfit + newProfit);
        const currentTax = this.calculateTax(currentProfit);
        return totalTax - currentTax;
    }

    getTaxBracketInfo(income: number): string {
        if (income <= 0) return "0% (소득 없음)";
        const bracket = this.brackets.find(b => income >= b.min && income <= b.max);
        if (!bracket) return "정보 없음";
        return `${Math.round(bracket.rate * 100)}% 구간`;
    }

    getEffectiveTaxRate(income: number): number {
        if (income <= 0) return 0.0;
        const tax = this.calculateTax(income);
        return (tax / income) * 100;
    }
}
