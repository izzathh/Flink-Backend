const decimalCalculation = (value) => {
    try {
        const roundedAmount = Math.floor(value * 100) / 100;

        const secondDecimal = Math.floor(value * 100) % 10;

        if (secondDecimal >= 5) {
            return roundedAmount.toFixed(2);
        }

        return roundedAmount.toFixed(2);

        // const roundedAmount = Math.floor(value * 100) / 100;

        // const thirdDecimal = Math.floor(value * 1000) % 10;

        // if (thirdDecimal > 5) {
        //     return (roundedAmount + 0.01).toFixed(2);
        // }

        // return roundedAmount.toFixed(2);

    } catch (error) {
        console.log('decimalCalculation:', error);
    }
}

module.exports = { decimalCalculation }