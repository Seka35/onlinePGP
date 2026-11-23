async function verifyDetachedOrCleartext() {
    const status = document.getElementById('vsStatus');
    const out = document.getElementById('vsResult');
    const pubText = document.getElementById('vsPubKey').value.trim();
    const clearText = document.getElementById('vsClearText').value.trim();
    const fileInput = document.getElementById('vsFileInput');
    const sigInput = document.getElementById('vsSigText').value.trim();

    out.textContent = '';
    if (!pubText) {
        status.className = 'tool-status warn';
        status.textContent = "Please paste the signer's public key.";
        return;
    }

    try {
        const { keys } = await openpgp.key.readArmored(pubText);
        const pubKey = keys[0];
        if (!pubKey) throw new Error('Invalid public key.');
        const fp = pubKey.getFingerprint().toUpperCase().match(/.{1,4}/g).join(' ');

        let verified;
        if (fileInput.files && fileInput.files[0] && sigInput) {
            const bytes = new Uint8Array(await fileInput.files[0].arrayBuffer());
            const message = openpgp.message.fromBinary(bytes);
            const signature = await openpgp.signature.readArmored(sigInput);
            verified = await openpgp.verify({ message, signature, publicKeys: pubKey });
        } else if (clearText) {
            const message = await openpgp.cleartext.readArmored(clearText);
            verified = await openpgp.verify({ message, publicKeys: pubKey });
        } else {
            status.className = 'tool-status warn';
            status.textContent = 'Provide either a clear-signed message OR a file + detached signature.';
            return;
        }

        const sig = verified.signatures[0];
        const valid = await sig.verified;
        const keyId = sig.keyid ? sig.keyid.toHex().toUpperCase() : 'Unknown';
        if (valid) {
            status.className = 'tool-status success';
            status.textContent = 'Signature is VALID.';
            out.innerHTML = `<p style="color:#34d399;"><strong>Valid Signature</strong><br>Signer Key ID: <code>${keyId}</code><br>Public Key Fingerprint: <code>${fp}</code></p>`;
        } else {
            status.className = 'tool-status error';
            status.textContent = 'Signature is INVALID.';
            out.innerHTML = `<p style="color:#f87171;"><strong>Invalid Signature</strong> &mdash; The data was modified or signed with a different key.</p>`;
        }
    } catch (e) {
        status.className = 'tool-status error';
        status.textContent = 'Verification failed: ' + e.message;
    }
}
