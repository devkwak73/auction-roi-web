// 중개수수료 계산 함수
export function calculateBrokerageFee(auctionPrice: number): number {
    if (auctionPrice < 50000000) {
        // 5천만원 미만: 0.6%
        return Math.floor(auctionPrice * 0.006);
    } else if (auctionPrice < 200000000) {
        // 5천만원 이상 ~ 2억원 미만: 0.5%
        return Math.floor(auctionPrice * 0.005);
    } else if (auctionPrice < 600000000) {
        // 2억원 이상 ~ 6억원 미만: 0.4%
        return Math.floor(auctionPrice * 0.004);
    } else if (auctionPrice < 900000000) {
        // 6억원 이상 ~ 9억원 미만: 0.5% (상한)
        return Math.floor(auctionPrice * 0.005);
    } else {
        // 9억원 이상: 0.9% (상한)
        return Math.floor(auctionPrice * 0.009);
    }
}
