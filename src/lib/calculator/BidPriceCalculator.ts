import { Property, TaxProfile, ROIReport, BidPriceResult } from '../types';
import { ROICalculator } from './ROICalculator';

export class BidPriceCalculator {
    private roiCalculator = new ROICalculator();

    /**
     * 목표 ROI를 달성하기 위한 최대 입찰가 계산
     */
    calculateMaxBidPrice(
        targetRoi: number,
        expectedSalePrice: number,
        property: Property,
        taxProfile: TaxProfile
    ): BidPriceResult {
        // 초기값 설정
        let minPrice = Math.floor(expectedSalePrice / 2);
        let maxPrice = expectedSalePrice * 1.5; // 예상 매도가보다 높을 수도 있음
        let currentPrice = Math.floor((minPrice + maxPrice) / 2);
        
        const maxIterations = 60;
        const tolerance = 0.05; // ROI 오차 허용 범위 (%)
        
        let iterations = 0;
        let bestPrice = currentPrice;
        let bestRoi = -999.0;
        
        while (iterations < maxIterations) {
            iterations++;
            
            const testProperty: Property = {
                ...property,
                auction_price: currentPrice,
                expected_sale_price: expectedSalePrice
            };
            
            const report = this.roiCalculator.calculate(testProperty, taxProfile);
            const calculatedRoi = report.saleScenario.roi;
            
            // 최적값 업데이트
            if (Math.abs(calculatedRoi - targetRoi) < Math.abs(bestRoi - targetRoi)) {
                bestPrice = currentPrice;
                bestRoi = calculatedRoi;
            }
            
            // 목표 ROI 달성 확인
            if (Math.abs(calculatedRoi - targetRoi) < tolerance) {
                bestPrice = currentPrice;
                bestRoi = calculatedRoi;
                break;
            }
            
            // 이진 탐색 조정
            if (calculatedRoi > targetRoi) {
                // ROI가 목표보다 높으면 입찰가를 올림
                minPrice = currentPrice;
            } else {
                // ROI가 목표보다 낮으면 입찰가를 내림
                maxPrice = currentPrice;
            }
            
            currentPrice = Math.floor((minPrice + maxPrice) / 2);
            
            // 수렴 확인
            if (Math.abs(maxPrice - minPrice) < 10000) { // 1만원 이하 차이
                break;
            }
        }
        
        const finalProperty: Property = {
            ...property,
            auction_price: bestPrice,
            expected_sale_price: expectedSalePrice
        };
        const finalReport = this.roiCalculator.calculate(finalProperty, taxProfile);
        
        return {
            maxBidPrice: bestPrice,
            achievedRoi: finalReport.saleScenario.roi,
            targetRoi: targetRoi,
            roiDifference: finalReport.saleScenario.roi - targetRoi,
            report: finalReport
        };
    }

    /**
     * 여러 목표 ROI에 대한 입찰가 시뮬레이션
     */
    simulateMultipleTargets(
        targetRois: number[],
        expectedSalePrice: number,
        property: Property,
        taxProfile: TaxProfile
    ): BidPriceResult[] {
        return targetRois.map(targetRoi => 
            this.calculateMaxBidPrice(targetRoi, expectedSalePrice, property, taxProfile)
        );
    }
}
