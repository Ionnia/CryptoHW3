const {KEYUTIL} = require('jsrsasign');
const readline = require('readline').createInterface({input: process.stdin, output: process.stdout}).pause();

function getRandomBigInt(amountOfHexDigits) {
    if(!amountOfHexDigits) {
        return BigInt(+Math.random().toString().slice(2));
    }
    let numString = (+Math.random().toString().slice(2) % 16).toString(16);
    while(numString === '0') {
        numString = (+Math.random().toString().slice(2) % 16).toString(16);
    }
    for(let i = 0; i < amountOfHexDigits-1; i++) {
        numString += (+Math.random().toString().slice(2) % 16).toString(16);
    }
    numString = '0x' + numString;

    return BigInt(numString);
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
        polyCoefs.push(getRandomBigInt(16));
    }

    for(let i = 0; i < n; ++i) {
        let randomX = getRandomBigInt(32);
        let randomY = calculatePolynomial(randomX, BigInt(t-1), polyCoefs);
        shares.push({x: randomX, y: randomY});
    }

    return shares.map(share => {
        return {
            x: '0x' + share.x.toString(16),
            y: '0x' + share.y.toString(16)
        }
    });
}

function getSecret(shares, t) {
    shares = shares.map(share => {
        return {
            x: BigInt(share.x),
            y: BigInt(share.y)
        }
    });

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
    if(secret.toString(16).length < 64) {
        return '0x' + '0'.repeat(64 - secret.toString(16).length) + secret.toString(16);
    } else {
        return '0x' + secret.toString(16);
    }
}

async function input(inputAmount) {
    return new Promise((resolve) => {
            getLine([], resolve, inputAmount);
        }
    );
}

function getLine(array, resolve, inputAmount) {
    readline.question('', answer => {
        if(answer === '') {
            readline.close();
            resolve(array);
        } else if(inputAmount === 1) {
            array.push(answer);
            readline.close();
            resolve(array);
        } else {
            array.push(answer);
            getLine(array, resolve, --inputAmount);
        }
    });
}

function testMode () {
    let keyPair = KEYUTIL.generateKeypair("EC", "secp256k1");

    console.log('Сгенерированный приватный ключ:', '0x' + keyPair.prvKeyObj.prvKeyHex);

    let prvKeyNumber = BigInt('0x' + keyPair.prvKeyObj.prvKeyHex);
    console.log('Разделяем на 7 частей при необходимых 4')
    let shares = getShares(prvKeyNumber, 7, 4);

    console.log('Полученные части:')
    console.log(shares.map(share => share.x + ',' + share.y));

    let secret = getSecret(shares.slice(2, 6), 4);

    console.log(
        'Обратно получаем секрет по 2,3,4,5 части ->',
        secret
    );
}

async function splitMode() {
    let params = await input(2);
    if(params.length !== 2) {
        console.log("Слишком мало аргументов");
    }
    let secret = params[0];
    let n_t = params[1];

    let secretNum = BigInt(secret.startsWith('0x') ? secret : '0x' + secret);
    let n = +n_t.split(' ')[0];
    let t = +n_t.split(' ')[1];

    let shares = getShares(secretNum, n, t);
    shares = shares.map(share => share.x + ',' + share.y);
    for(share of shares) {
        console.log(share);
    }
}

async function recoverMode() {
    let shares = await input();

    shares = shares.map(share => {
        let values = share.split(',');
        return {
            x: BigInt(values[0]),
            y: BigInt(values[1])
        }
    });

    let secret = getSecret(shares, BigInt(shares.length));

    console.log(secret);
}

let args = process.argv;

if(args.length !== 3) {
    args.length < 3 ? console.log("Слишком мало аргументов!") : console.log("Слишком много аргументов!");
} else {
    switch(args[2]) {
        case 'test':
            testMode();
            break;
        case 'split':
            splitMode();
            break;
        case 'recover':
            recoverMode();
            break;
        default:
            console.log("Неверные аргументы!");
    }
}