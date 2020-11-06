let {KEYUTIL} = require('jsrsasign');

function getRandomBigInt() {
   return BigInt(+Math.random().toString().slice(2));
}

function calculatePolynomial(x, power, coefs) {
    let result = coefs[0];
    for(let i = 1; i <= power; i++) {
        result += coefs[i] * (x ** BigInt(i));
    }
    return result;
}

// n - количество секретов, t - минимальное количество секретов для восстановления
function getShares(secret, n, t) {
    let shares = []

    let polyCoefs = [secret]
    for(let i = 0; i < t - 1; ++i) {
        polyCoefs.push(getRandomBigInt());
    }

    for(let i = 0; i < n; ++i) {
        let randomX = getRandomBigInt();
        let randomY = calculatePolynomial(randomX, BigInt(t-1), polyCoefs);
        shares.push({x: randomX, y: randomY});
    }

    return shares;
}

function getSecret(shares, t) {
    let l_i_noms = [];
    let l_i_denoms = [];

    // Calculating products for l_i nominators and denominators
    for(let i = 0; i < t; i++) {
        l_i_noms.push(shares.filter((val, idx) => idx !== i).reduce((total, num) => total * (-num.x), BigInt(1)));
        l_i_denoms.push(shares.filter((val, idx) => idx !== i).reduce((total, num) => total * (shares[i].x - num.x), BigInt(1)));
    }

    let common_denominator = l_i_denoms.reduce((total, num) => total * num, BigInt(1));
    let common_nominator = BigInt(0);

    for(let i = 0; i < t; i++) {
        common_nominator += shares[i].y * l_i_noms[i] * l_i_denoms.filter((val, idx) => idx !== i).reduce((total, num) => total * num, BigInt(1));
    }

    let secret = common_nominator / common_denominator;

    return secret.toString(16);
}

let keyPair = KEYUTIL.generateKeypair("EC", "secp256k1");

console.log(keyPair.prvKeyObj);

let prvKeyNumber = BigInt("0x" + keyPair.prvKeyObj.prvKeyHex);

let shares = getShares(prvKeyNumber, 5, 4);

console.log(shares);

let secret = getSecret(shares.slice(0, 4), 4);

console.log(secret);