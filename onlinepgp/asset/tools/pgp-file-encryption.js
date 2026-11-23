function setFileStatus(id, msg, type) {
    const el = document.getElementById(id);
    if (!el) return;
    el.className = 'tool-status ' + type;
    el.textContent = msg;
}

function triggerDownload(bytes, filename, mime) {
    const blob = new Blob([bytes], { type: mime || 'application/octet-stream' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

async function encryptFilePgp() {
    const fileInput = document.getElementById('encFileInput');
    const pubKeyText = document.getElementById('encFilePubKey').value.trim();
    const password = document.getElementById('encFilePassword').value;

    if (!fileInput.files || !fileInput.files[0]) {
        setFileStatus('encFileStatus', 'Please select a file to encrypt.', 'warn');
        return;
    }
    if (!pubKeyText && !password) {
        setFileStatus('encFileStatus', 'Provide either a recipient public key or a symmetric password.', 'warn');
        return;
    }

    try {
        const file = fileInput.files[0];
        const buf = new Uint8Array(await file.arrayBuffer());
        const opts = {
            message: openpgp.message.fromBinary(buf),
            armor: false
        };
        if (pubKeyText) {
            const { keys } = await openpgp.key.readArmored(pubKeyText);
            if (!keys || !keys.length) throw new Error('Invalid public key.');
            opts.publicKeys = keys;
        }
        if (password) {
            opts.passwords = [password];
        }
        const { message } = await openpgp.encrypt(opts);
        const encryptedBytes = message.packets.write();
        triggerDownload(encryptedBytes, file.name + '.pgp', 'application/pgp-encrypted');
        setFileStatus('encFileStatus', `Encrypted "${file.name}" locally. Download started.`, 'success');
    } catch (e) {
        setFileStatus('encFileStatus', 'File encryption failed: ' + e.message, 'error');
    }
}

async function decryptFilePgp() {
    const fileInput = document.getElementById('decFileInput');
    const privKeyText = document.getElementById('decFilePrivKey').value.trim();
    const passphrase = document.getElementById('decFilePassphrase').value;

    if (!fileInput.files || !fileInput.files[0]) {
        setFileStatus('decFileStatus', 'Please select a .pgp, .gpg, or .asc file to decrypt.', 'warn');
        return;
    }
    if (!privKeyText && !passphrase) {
        setFileStatus('decFileStatus', 'Provide your private key (+ passphrase) or the symmetric password.', 'warn');
        return;
    }

    try {
        const file = fileInput.files[0];
        const buf = new Uint8Array(await file.arrayBuffer());
        let message;
        const asText = new TextDecoder().decode(buf.slice(0, 64));
        if (asText.includes('-----BEGIN PGP MESSAGE-----')) {
            message = await openpgp.message.readArmored(new TextDecoder().decode(buf));
        } else {
            message = await openpgp.message.read(buf);
        }

        const opts = { message, format: 'binary' };
        if (privKeyText) {
            const { keys } = await openpgp.key.readArmored(privKeyText);
            const privKey = keys[0];
            if (!privKey) throw new Error('Invalid private key.');
            if (!privKey.isDecrypted()) await privKey.decrypt(passphrase);
            opts.privateKeys = [privKey];
        } else {
            opts.passwords = [passphrase];
        }

        const { data: decryptedBytes } = await openpgp.decrypt(opts);
        const outName = file.name.replace(/\.(pgp|gpg|asc)$/i, '') || 'decrypted-file';
        triggerDownload(decryptedBytes, outName, 'application/octet-stream');
        setFileStatus('decFileStatus', `Decrypted "${file.name}" locally. Download started.`, 'success');
    } catch (e) {
        setFileStatus('decFileStatus', 'File decryption failed: ' + e.message, 'error');
    }
}
