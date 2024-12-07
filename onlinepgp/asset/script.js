function toggleSection(sectionId) {
    const sections = document.querySelectorAll('.section-content');
    sections.forEach(section => {
        if (section.id !== sectionId) {
            section.style.display = 'none'; 
        }
    });
    const selectedSection = document.getElementById(sectionId);
    selectedSection.style.display = selectedSection.style.display === 'block' ? 'none' : 'block';
}

async function encryptMessage() {
    const publicKey = document.getElementById("publicKeyEncrypt").value;
    const plainText = document.getElementById("plainText").value;
    const { keys: [publicKeyObject] } = await openpgp.key.readArmored(publicKey);
    const { data: cipherText } = await openpgp.encrypt({
        message: openpgp.message.fromText(plainText),
        publicKeys: [publicKeyObject]
    });

    document.getElementById("cipherText").value = cipherText;
}

async function decryptMessage() {
    const privateKey = document.getElementById("privateKeyDecrypt").value;
    const passphrase = document.getElementById("passphraseDecrypt").value;
    const cipherText = document.getElementById("cipherTextDecrypt").value;
    const { keys } = await openpgp.key.readArmored(privateKey);
    const privateKeyObject = keys[0];

    if (!privateKeyObject.isDecrypted()) {
        await privateKeyObject.decrypt(passphrase);
    }

    const { data: decryptedText } = await openpgp.decrypt({
        message: await openpgp.message.readArmored(cipherText),
        privateKeys: [privateKeyObject]
    });

    document.getElementById("plainTextDecrypt").value = decryptedText;
}

async function signMessage() {
    const privateKey = document.getElementById("privateKeySign").value;
    const passphrase = document.getElementById("passphraseSign").value;
    const plainText = document.getElementById("plainTextSign").value;
    const { keys } = await openpgp.key.readArmored(privateKey);
    const privateKeyObject = keys[0];

    if (!privateKeyObject.isDecrypted()) {
        await privateKeyObject.decrypt(passphrase);
    }

    const { data: signedMessage } = await openpgp.sign({
        message: openpgp.cleartext.fromText(plainText),
        privateKeys: [privateKeyObject]
    });

    document.getElementById("signedMessage").value = signedMessage;
}

async function verifyMessage() {
    const publicKey = document.getElementById("publicKeyVerify").value;
    const signedMessage = document.getElementById("signedMessageVerify").value;
    const { keys: [publicKeyObject] } = await openpgp.key.readArmored(publicKey);
    const verified = await openpgp.verify({
        message: await openpgp.cleartext.readArmored(signedMessage),
        publicKeys: publicKeyObject
    });

    const { valid } = verified.signatures[0];
    const verificationResult = document.getElementById("verifyResult");

    if (valid) {
        verificationResult.style.color = 'green';
        const userIds = publicKeyObject.getUserIds(); 
        verificationResult.innerText = `Signed by ${userIds.join(', ')} \n Signature is valid.`;
    } else {
        verificationResult.style.color = 'red';
        verificationResult.innerText = "Invalid signature.";
    }
}

async function generateKeys() {
    const name = document.getElementById("name").value;
    const email = document.getElementById("email").value;
    const passphrase = document.getElementById("passphrase").value;

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        alert("Veuillez entrer une adresse e-mail valide.");
        return;
    }

    const { privateKeyArmored, publicKeyArmored } = await openpgp.generateKey({
        userIds: [{ name, email }],
        numBits: 2048,
        passphrase
    });

    document.getElementById("privateKey").value = privateKeyArmored;
    document.getElementById("publicKey").value = publicKeyArmored;
}

function copyToClipboard(elementId) {
    const copyText = document.getElementById(elementId);
    copyText.select();
    copyText.setSelectionRange(0, 99999);
    document.execCommand("copy");
    showCopyMessage("Copied to clipboard!");
}

function showCopyMessage(message) {
    const messageElement = document.createElement('div');
    messageElement.textContent = message;
    messageElement.style.position = 'fixed';
    messageElement.style.bottom = '20px'; 
    messageElement.style.right = '20px';
    messageElement.style.backgroundColor = 'rgba(0, 0, 0, 0.7)'; 
    messageElement.style.color = 'white';
    messageElement.style.padding = '10px';
    messageElement.style.borderRadius = '5px';
    messageElement.style.zIndex = '1000'; 

    document.body.appendChild(messageElement);

    setTimeout(() => {
        document.body.removeChild(messageElement);
    }, 2000);
}

function downloadKey(elementId) {
    const key = document.getElementById(elementId).value;
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
    input.accept = '.txt';
    input.onchange = async (event) => {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                const key = e.target.result;
                document.getElementById(elementId).value = key;
            };
            reader.readAsText(file);
        }
    };
    input.click();
}

document.addEventListener("DOMContentLoaded", function() {
    const sections = document.querySelectorAll(".section-content");
    for(let section of sections) {
        section.style.display = 'none';
    }
});