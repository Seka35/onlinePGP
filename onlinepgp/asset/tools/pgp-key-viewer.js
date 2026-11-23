async function inspectPgpKey() {
    const status = document.getElementById('kvStatus');
    const out = document.getElementById('kvOutput');
    const raw = document.getElementById('kvInput').value.trim();
    status.className = 'tool-status';
    out.innerHTML = '';

    if (!raw) {
        status.className = 'tool-status warn';
        status.textContent = 'Please paste an ASCII-armored PGP key first.';
        return;
    }

    try {
        const { keys, err } = await openpgp.key.readArmored(raw);
        if (err && err.length && (!keys || !keys.length)) {
            throw err[0];
        }
        const key = keys[0];
        if (!key) throw new Error('No valid OpenPGP key found.');

        if (key.isPrivate()) {
            status.className = 'tool-status warn';
            status.textContent = 'Warning: You pasted a PRIVATE key. Never share your private key with anyone.';
        } else {
            status.className = 'tool-status success';
            status.textContent = 'Public key parsed locally in your browser.';
        }

        const fpHex = key.getFingerprint().toUpperCase();
        const fpFormatted = fpHex.match(/.{1,4}/g).join(' ');
        const keyId = key.getKeyId().toHex().toUpperCase();
        const algoInfo = key.keyPacket.getAlgorithmInfo();
        const algoStr = `${algoInfo.algorithm}${algoInfo.bits ? ' (' + algoInfo.bits + '-bit)' : algoInfo.curve ? ' (' + algoInfo.curve + ')' : ''}`;
        const created = key.getCreationTime() ? key.getCreationTime().toISOString().split('T')[0] : 'Unknown';
        let expires = 'Never';
        try {
            const expDate = await key.getExpirationTime();
            if (expDate && expDate !== Infinity) {
                expires = new Date(expDate).toISOString().split('T')[0];
            }
        } catch (_) {}

        let revoked = 'No';
        try {
            const isRev = await key.isRevoked();
            if (isRev) revoked = 'Yes (REVOKED)';
        } catch (_) {}

        const userIds = key.getUserIds();
        const subkeys = key.getSubkeys().map(sk => {
            const sa = sk.keyPacket.getAlgorithmInfo();
            return `${sk.getKeyId().toHex().toUpperCase()} (${sa.algorithm}${sa.bits ? ' ' + sa.bits + '-bit' : ''})`;
        });

        out.innerHTML = `
            <div class="card" style="margin-top:1rem;">
                <p><strong>Key Type:</strong> ${key.isPrivate() ? 'Private Key' : 'Public Key'}</p>
                <p><strong>Fingerprint:</strong><br><code>${fpFormatted}</code></p>
                <p><strong>Long Key ID:</strong> <code>${keyId}</code></p>
                <p><strong>Algorithm:</strong> ${algoStr}</p>
                <p><strong>Created:</strong> ${created} &bull; <strong>Expires:</strong> ${expires}</p>
                <p><strong>Revoked:</strong> ${revoked}</p>
                <p><strong>User IDs:</strong> ${userIds.length ? userIds.map(u => `<code>${u.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</code>`).join(', ') : 'None'}</p>
                <p><strong>Subkeys (${subkeys.length}):</strong> ${subkeys.length ? subkeys.map(s => `<code>${s}</code>`).join(', ') : 'None'}</p>
            </div>
        `;
    } catch (e) {
        status.className = 'tool-status error';
        status.textContent = 'Could not parse key: ' + e.message;
    }
}
