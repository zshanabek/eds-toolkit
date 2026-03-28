const isIinValid = function (iin) {
    // Must be exactly 12 digits
    if (!iin || !/^\d{12}$/.test(iin)) return false;

    // Digit at index 4 (birth month first digit): 0-3
    if (parseInt(iin[4]) > 3) return false;

    // Digit at index 6 (gender/century): 1-6
    const genderCentury = parseInt(iin[6]);
    if (genderCentury < 1 || genderCentury > 6) return false;

    // Checksum — first pass with weights 1..11
    const weights1 = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
    let sum = 0;
    for (let i = 0; i < 11; i++) {
        sum += weights1[i] * parseInt(iin[i]);
    }
    let checkDigit = sum % 11;

    // If remainder is 10, use second pass with weights 3..13 (mod 11)
    if (checkDigit === 10) {
        const weights2 = [3, 4, 5, 6, 7, 8, 9, 10, 11, 1, 2];
        sum = 0;
        for (let i = 0; i < 11; i++) {
            sum += weights2[i] * parseInt(iin[i]);
        }
        checkDigit = sum % 11;
        if (checkDigit === 10) return false;
    }

    return checkDigit === parseInt(iin[11]);
};
