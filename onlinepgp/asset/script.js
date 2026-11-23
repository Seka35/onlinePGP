function switchTab(tabId) {
    document.querySelectorAll('.tab-pane').forEach(p => p.classList.remove('active'));
    document.querySelectorAll('.tab-btn').forEach(b => {
        b.classList.remove('active');
        b.setAttribute('aria-selected', 'false');
    });
    const pane = document.getElementById(tabId);
    if (pane) pane.classList.add('active');
    const btn = document.querySelector(`[data-tab="${tabId}"]`);
    if (btn) {
        btn.classList.add('active');
        btn.setAttribute('aria-selected', 'true');
    }
}

function setToolStatus(statusId, message, type) {
    const el = document.getElementById(statusId);
    if (!el) return;
    el.className = 'tool-status ' + (type || '');
    el.textContent = message;
}

function toggleSection(sectionId) {
    const sections = document.querySelectorAll('.section-content');
    sections.forEach(section => {
        if (section.id !== sectionId) {
            section.style.display = 'none';
        }
    });
    const selectedSection = document.getElementById(sectionId);
    if (selectedSection) {
        selectedSection.style.display = selectedSection.style.display === 'block' ? 'none' : 'block';
    }
}

async function encryptMessage() {
    try {
        const publicKey = document.getElementById("publicKeyEncrypt").value.trim();
        const plainText = document.getElementById("plainText").value;
        if (!publicKey || !plainText) {
            setToolStatus("statusEncrypt", "Please provide both a recipient public key and a message.", "warn");
            return;
        }
        const { keys: [publicKeyObject] } = await openpgp.key.readArmored(publicKey);
        if (!publicKeyObject) throw new Error("Invalid public key.");
        const { data: cipherText } = await openpgp.encrypt({
            message: openpgp.message.fromText(plainText),
            publicKeys: [publicKeyObject]
        });
        document.getElementById("cipherText").value = cipherText;
        setToolStatus("statusEncrypt", "Message encrypted locally in your browser.", "success");
    } catch (err) {
        setToolStatus("statusEncrypt", "Encryption failed: " + err.message, "error");
    }
}

async function decryptMessage() {
    try {
        const privateKey = document.getElementById("privateKeyDecrypt").value.trim();
        const passphrase = document.getElementById("passphraseDecrypt").value;
        const cipherText = document.getElementById("cipherTextDecrypt").value.trim();
        if (!privateKey || !cipherText) {
            setToolStatus("statusDecrypt", "Please provide your private key and the encrypted message.", "warn");
            return;
        }
        const { keys } = await openpgp.key.readArmored(privateKey);
        const privateKeyObject = keys[0];
        if (!privateKeyObject) throw new Error("Invalid private key.");
        if (!privateKeyObject.isDecrypted()) {
            await privateKeyObject.decrypt(passphrase);
        }
        const { data: decryptedText } = await openpgp.decrypt({
            message: await openpgp.message.readArmored(cipherText),
            privateKeys: [privateKeyObject]
        });
        document.getElementById("plainTextDecrypt").value = decryptedText;
        setToolStatus("statusDecrypt", "Message decrypted successfully.", "success");
    } catch (err) {
        setToolStatus("statusDecrypt", "Decryption failed: " + err.message, "error");
    }
}

async function signMessage() {
    try {
        const privateKey = document.getElementById("privateKeySign").value.trim();
        const passphrase = document.getElementById("passphraseSign").value;
        const plainText = document.getElementById("plainTextSign").value;
        if (!privateKey || !plainText) {
            setToolStatus("statusSign", "Please provide your private key and a message to sign.", "warn");
            return;
        }
        const { keys } = await openpgp.key.readArmored(privateKey);
        const privateKeyObject = keys[0];
        if (!privateKeyObject) throw new Error("Invalid private key.");
        if (!privateKeyObject.isDecrypted()) {
            await privateKeyObject.decrypt(passphrase);
        }
        const { data: signedMessage } = await openpgp.sign({
            message: openpgp.cleartext.fromText(plainText),
            privateKeys: [privateKeyObject]
        });
        document.getElementById("signedMessage").value = signedMessage;
        setToolStatus("statusSign", "Message signed locally.", "success");
    } catch (err) {
        setToolStatus("statusSign", "Signing failed: " + err.message, "error");
    }
}

async function verifyMessage() {
    try {
        const publicKey = document.getElementById("publicKeyVerify").value.trim();
        const signedMessage = document.getElementById("signedMessageVerify").value.trim();
        if (!publicKey || !signedMessage) {
            setToolStatus("statusVerify", "Please provide the signer's public key and the signed message.", "warn");
            return;
        }
        const { keys: [publicKeyObject] } = await openpgp.key.readArmored(publicKey);
        if (!publicKeyObject) throw new Error("Invalid public key.");
        const verified = await openpgp.verify({
            message: await openpgp.cleartext.readArmored(signedMessage),
            publicKeys: publicKeyObject
        });
        const { valid } = verified.signatures[0];
        const verificationResult = document.getElementById("verifyResult");
        if (valid) {
            verificationResult.style.color = '#34d399';
            const userIds = publicKeyObject.getUserIds();
            verificationResult.innerText = `Signed by ${userIds.join(', ')} \n Signature is valid.`;
            setToolStatus("statusVerify", "Signature verified.", "success");
        } else {
            verificationResult.style.color = '#f87171';
            verificationResult.innerText = "Invalid signature.";
            setToolStatus("statusVerify", "Signature is invalid.", "error");
        }
    } catch (err) {
        setToolStatus("statusVerify", "Verification failed: " + err.message, "error");
    }
}

async function generateKeys() {
    try {
        const name = document.getElementById("name").value.trim();
        const email = document.getElementById("email").value.trim();
        const passphrase = document.getElementById("passphrase").value;

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            setToolStatus("statusKeygen", "Please enter a valid email address.", "error");
            return;
        }
        if (!passphrase) {
            setToolStatus("statusKeygen", "Warning: generating a key without a passphrase is not recommended. Add a strong passphrase to protect your private key.", "warn");
        } else {
            setToolStatus("statusKeygen", "Generating 2048-bit RSA key pair in your browser...", "success");
        }

        const { privateKeyArmored, publicKeyArmored } = await openpgp.generateKey({
            userIds: [{ name: name || email, email }],
            numBits: 2048,
            passphrase
        });

        document.getElementById("privateKey").value = privateKeyArmored;
        document.getElementById("publicKey").value = publicKeyArmored;
        if (passphrase) {
            setToolStatus("statusKeygen", "2048-bit RSA key pair generated locally. Download and back up your private key.", "success");
        }
    } catch (err) {
        setToolStatus("statusKeygen", "Key generation failed: " + err.message, "error");
    }
}

function copyToClipboard(elementId) {
    const copyText = document.getElementById(elementId);
    if (!copyText || !copyText.value) return;
    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(copyText.value).then(() => showCopyMessage("Copied to clipboard!"));
    } else {
        copyText.select();
        copyText.setSelectionRange(0, 99999);
        document.execCommand("copy");
        showCopyMessage("Copied to clipboard!");
    }
}

function showCopyMessage(message) {
    const messageElement = document.createElement('div');
    messageElement.textContent = message;
    messageElement.style.position = 'fixed';
    messageElement.style.bottom = '80px';
    messageElement.style.right = '20px';
    messageElement.style.backgroundColor = '#10b981';
    messageElement.style.color = '#052218';
    messageElement.style.fontWeight = '700';
    messageElement.style.padding = '10px 16px';
    messageElement.style.borderRadius = '10px';
    messageElement.style.zIndex = '1000';

    document.body.appendChild(messageElement);
    setTimeout(() => {
        if (messageElement.parentNode) document.body.removeChild(messageElement);
    }, 2000);
}

function downloadKey(elementId) {
    const key = document.getElementById(elementId).value;
    if (!key) return;
    const fileName = `${elementId}.txt`;
    const element = document.createElement('a');
    element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(key));
    element.setAttribute('download', fileName);
    element.style.display = 'none';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
}

function importKey(elementId) {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.txt,.asc,.pgp,.gpg';
    input.onchange = async (event) => {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                document.getElementById(elementId).value = e.target.result;
            };
            reader.readAsText(file);
        }
    };
    input.click();
}
