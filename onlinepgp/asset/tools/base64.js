function utf8ToBase64(str, urlSafe) {
    const bytes = new TextEncoder().encode(str);
    let bin = '';
    for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
    let b64 = btoa(bin);
    if (urlSafe) b64 = b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
    return b64;
}

function base64ToUtf8(b64) {
    let norm = b64.trim().replace(/-/g, '+').replace(/_/g, '/');
    while (norm.length % 4) norm += '=';
    const bin = atob(norm);
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    return new TextDecoder().decode(bytes);
}

function encodeBase64() {
    const status = document.getElementById('b64Status');
    const urlSafe = document.getElementById('b64UrlSafe').checked;
    const fileInput = document.getElementById('b64FileInput');

    if (fileInput.files && fileInput.files[0]) {
        const reader = new FileReader();
        reader.onload = () => {
            const bytes = new Uint8Array(reader.result);
            let bin = '';
            for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
            let b64 = btoa(bin);
            if (urlSafe) b64 = b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
            document.getElementById('b64Output').value = b64;
            status.className = 'tool-status success';
            status.textContent = `Encoded file "${fileInput.files[0].name}" to Base64.`;
        };
        reader.readAsArrayBuffer(fileInput.files[0]);
        return;
    }

    try {
        const txt = document.getElementById('b64Input').value;
        document.getElementById('b64Output').value = utf8ToBase64(txt, urlSafe);
        status.className = 'tool-status success';
        status.textContent = 'Encoded text to Base64 locally.';
    } catch (e) {
        status.className = 'tool-status error';
        status.textContent = 'Encoding failed: ' + e.message;
    }
}

function decodeBase64() {
    const status = document.getElementById('b64Status');
    try {
        const b64 = document.getElementById('b64Input').value;
        document.getElementById('b64Output').value = base64ToUtf8(b64);
        status.className = 'tool-status success';
        status.textContent = 'Decoded Base64 to UTF-8 text locally.';
    } catch (e) {
        status.className = 'tool-status error';
        status.textContent = 'Invalid Base64 input: ' + e.message;
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { utf8ToBase64, base64ToUtf8 };
}
