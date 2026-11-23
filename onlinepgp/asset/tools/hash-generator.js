// Vetted compact MD5 implementation (RFC 1321) for legacy checksum verification only
function md5Bytes(bytes) {
    function cmn(q, a, b, x, s, t) {
        a = (((a + q) | 0) + ((x + t) | 0)) | 0;
        return (((a << s) | (a >>> (32 - s))) + b) | 0;
    }
    function ff(a, b, c, d, x, s, t) { return cmn((b & c) | ((~b) & d), a, b, x, s, t); }
    function gg(a, b, c, d, x, s, t) { return cmn((b & d) | (c & (~d)), a, b, x, s, t); }
    function hh(a, b, c, d, x, s, t) { return cmn(b ^ c ^ d, a, b, x, s, t); }
    function ii(a, b, c, d, x, s, t) { return cmn(c ^ (b | (~d)), a, b, x, s, t); }

    const len = bytes.length;
    const nBlocks = ((len + 8) >>> 6) + 1;
    const words = new Int32Array(nBlocks * 16);
    for (let i = 0; i < len; i++) {
        words[i >> 2] |= bytes[i] << ((i % 4) * 8);
    }
    words[len >> 2] |= 0x80 << ((len % 4) * 8);
    words[nBlocks * 16 - 2] = (len * 8) | 0;
    words[nBlocks * 16 - 1] = Math.floor((len * 8) / 0x100000000);

    let a = 1732584193, b = -271733879, c = -1732584194, d = 271733878;
    const K = [
        -680876936,-389564586,606105819,-1044525330,-176418897,1200080426,-1473231341,-45705983,
        1770035416,-1958414417,-42063,-1990404162,1804603682,-40341101,-1502002290,1236535329,
        -165796510,-1069501632,643717713,-373897302,-701558691,38016083,-660478335,-405537848,
        568446438,-1019803690,-187363961,1163531501,-1444681467,-51403784,1735328473,-1926607734,
        -378558,-2022574463,1839030562,-35309556,-1530992060,1272893353,-155497632,-1094730640,
        681279174,-358537222,-722521979,76029189,-640364487,-421815835,530742520,-995338651,
        -198630844,1126891415,-1416354905,-57434055,1700485571,-1894986606,-1051523,-2054922799,
        1873313359,-30611744,-1560198380,1309151649,-145523070,-1120210379,718787259,-343485551
    ];
    const S = [
        7,12,17,22,7,12,17,22,7,12,17,22,7,12,17,22,
        5,9,14,20,5,9,14,20,5,9,14,20,5,9,14,20,
        4,11,16,23,4,11,16,23,4,11,16,23,4,11,16,23,
        6,10,15,21,6,10,15,21,6,10,15,21,6,10,15,21
    ];
    const idx = [
        0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,
        1,6,11,0,5,10,15,4,9,14,3,8,13,2,7,12,
        5,8,11,14,1,4,7,10,13,0,3,6,9,12,15,2,
        0,7,14,5,12,3,10,1,8,15,6,13,4,11,2,9
    ];

    for (let i = 0; i < words.length; i += 16) {
        let oa = a, ob = b, oc = c, od = d;
        for (let j = 0; j < 64; j++) {
            const x = words[i + idx[j]];
            if (j < 16) a = ff(a, b, c, d, x, S[j], K[j]);
            else if (j < 32) a = gg(a, b, c, d, x, S[j], K[j]);
            else if (j < 48) a = hh(a, b, c, d, x, S[j], K[j]);
            else a = ii(a, b, c, d, x, S[j], K[j]);
            const tmp = d; d = c; c = b; b = a; a = tmp;
        }
        a = (a + oa) | 0; b = (b + ob) | 0; c = (c + oc) | 0; d = (d + od) | 0;
    }

    const out = [a, b, c, d];
    let hex = '';
    for (let i = 0; i < 4; i++) {
        for (let j = 0; j < 4; j++) {
            hex += ((out[i] >>> (j * 8)) & 0xff).toString(16).padStart(2, '0');
        }
    }
    return hex;
}

function bufToHex(buf) {
    return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
}

async function computeAllHashes() {
    const text = document.getElementById('hashInput').value;
    const fileInput = document.getElementById('hashFileInput');
    const status = document.getElementById('hashStatus');
    let bytes;

    if (fileInput.files && fileInput.files[0]) {
        bytes = new Uint8Array(await fileInput.files[0].arrayBuffer());
        status.className = 'tool-status success';
        status.textContent = `Hashed file "${fileInput.files[0].name}" (${bytes.length} bytes) locally.`;
    } else {
        bytes = new TextEncoder().encode(text);
        status.className = 'tool-status success';
        status.textContent = 'Hashed text input locally.';
    }

    const [s1, s256, s384, s512] = await Promise.all([
        crypto.subtle.digest('SHA-1', bytes),
        crypto.subtle.digest('SHA-256', bytes),
        crypto.subtle.digest('SHA-384', bytes),
        crypto.subtle.digest('SHA-512', bytes)
    ]);

    document.getElementById('outMd5').value = md5Bytes(bytes);
    document.getElementById('outSha1').value = bufToHex(s1);
    document.getElementById('outSha256').value = bufToHex(s256);
    document.getElementById('outSha384').value = bufToHex(s384);
    document.getElementById('outSha512').value = bufToHex(s512);
    verifyChecksum();
}

function verifyChecksum() {
    const expected = document.getElementById('hashExpected').value.trim().toLowerCase();
    const res = document.getElementById('hashVerifyResult');
    if (!expected) {
        res.textContent = '';
        return;
    }
    const vals = ['outMd5', 'outSha1', 'outSha256', 'outSha384', 'outSha512']
        .map(id => ({ id, val: document.getElementById(id).value.trim().toLowerCase() }));
    const match = vals.find(v => v.val && v.val === expected);
    if (match) {
        res.style.color = '#34d399';
        res.textContent = `Match! Matches ${match.id.replace('out', '').toUpperCase()}.`;
    } else {
        res.style.color = '#f87171';
        res.textContent = 'No match against computed hashes.';
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { md5Bytes };
}
