import { PropertyType } from './types';

export class AcquisitionTaxCalculator {
    calculate(
        acquisitionPrice: number,
        buildingArea: number,
        houseCount: number,
        isAdjustmentArea: boolean,
        propertyType: PropertyType
    ): number {
        // 1. 오피스텔/상가: 4.6%
        if (propertyType !== PropertyType.HOUSE) {
            return Math.floor(acquisitionPrice * 0.046);
        }

        // 2. 주택 취득세율 (기본)
        let acquisitionRate = this.getBasicHouseAcquisitionRate(acquisitionPrice);

        // 다주택자 중과
        if (houseCount === 2 && isAdjustmentArea) acquisitionRate = 0.08;
        else if (houseCount >= 3) {
            acquisitionRate = isAdjustmentArea ? 0.12 : 0.08;
        } else if (houseCount >= 4) {
            acquisitionRate = 0.12;
        }

        // 3. 지방교육세
        const educationRate = acquisitionRate > 0.03 ? 0.004 : acquisitionRate * 0.1;

        // 4. 농어촌특별세
        let ruralRate = 0.0;
        const isSmallSize = buildingArea <= 85.0;

        if (acquisitionRate <= 0.03) {
            if (!isSmallSize) ruralRate = 0.002;
        } else {
            if (acquisitionRate === 0.08) {
                ruralRate = isSmallSize ? 0.006 : 0.01;
            } else if (acquisitionRate >= 0.12) {
                ruralRate = isSmallSize ? 0.01 : 0.014;
            }
        }

        const totalRate = acquisitionRate + educationRate + ruralRate;
        return Math.floor(acquisitionPrice * totalRate);
    }

    private getBasicHouseAcquisitionRate(price: number): number {
        if (price <= 600000000) return 0.01;
        if (price > 900000000) return 0.03;
        
        // 6~9억 구간
        const rate = (price * 2.0 / 300000000.0 - 3.0) / 100.0;
        return Math.round(rate * 10000) / 10000.0;
    }

    getTaxRateInfo(
        acquisitionPrice: number,
        buildingArea: number,
        houseCount: number,
        isAdjustmentArea: boolean,
        propertyType: PropertyType
    ): string {
        if (propertyType !== PropertyType.HOUSE) return "4.6% (오피스텔/상가)";
        
        const tax = this.calculate(acquisitionPrice, buildingArea, houseCount, isAdjustmentArea, propertyType);
        const rate = (tax / acquisitionPrice) * 100;
        return `${rate.toFixed(2)}%`;
    }
}
