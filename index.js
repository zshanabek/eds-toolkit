
const ecpModel = EcpModel;

function copyToClipboard(value, btn) {
    navigator.clipboard.writeText(value).then(() => {
        btn.textContent = 'Скопировано!';
        setTimeout(() => { btn.textContent = 'Скопировать'; }, 2000);
    });
}

document.addEventListener('DOMContentLoaded', function () {

    document.getElementById('select-btn').addEventListener('click', function () {
        document.getElementById('error').style.display = 'none';
        document.getElementById('error-ncalayer').style.display = 'none';
        document.getElementById('xml-container').style.display = 'none';
        document.getElementById('base64-container').style.display = 'none';
        const iin = document.getElementById('iin').value;
        if (!isIinValid(iin)) {
            document.getElementById('error').style.display = 'block';
            return;
        }
        ecpModel.selectSignType(iin,
            () => {
            },
            () => {
                document.getElementById('error-ncalayer').style.display = 'block';
            },
            async xml => {
                if (xml.length < 400) {
                    alert('Error happened, retry EDS sign');
                    console.error('Произошла ошибка повторите подпись эцп');
                    return;
                }
                const encodedBase64XmlEcp = ecpModel.b64EncodeUnicode(xml);
                document.getElementById('xml-container').style.display = 'block';
                document.getElementById('base64-container').style.display = 'block';
                document.getElementById('xml').innerHTML = xml;
                document.getElementById('base64').innerHTML = encodedBase64XmlEcp;
                const copyBase64Btn = document.getElementById('btn-copy-base64');
                copyBase64Btn.onclick = () => copyToClipboard(encodedBase64XmlEcp, copyBase64Btn);
                this.showEcpError = false;
                if (
                    typeof encodedBase64XmlEcp === 'string' &&
                    (!encodedBase64XmlEcp || !encodedBase64XmlEcp.length)
                ) {
                    alert('NCALayer error happened');
                    console.error('Произошла ошибка NCALayer');
                    return;
                }
            });
    });

    document.getElementById('btn-sign-string').addEventListener('click', function () {
        document.getElementById('error-ncalayer-cms').style.display = 'none';
        const input = document.getElementById('string-to-sign').value;
        let data;
        try {
            data = JSON.parse(input);
        } catch (e) {
            data = input;
        }
        ecpModel.createCMSSignature(data, {
            cb_start: () => {
                console.warn('Start ECP');
            },
            cb_canceled: () => {
                console.warn('Canceled ECP');
            },
            cb_error: () => {
                document.getElementById('error-ncalayer-cms').style.display = 'block';
            },
            cb_success: async (xml) => {
                if (xml.length < 400) {
                    console.error('Произошла ошибка повторите подпись эцп');
                    return;
                }
                document.getElementById('signedStringBase64').innerHTML = xml;
                const copyBtn = document.getElementById('btn-copy-cms');
                copyBtn.disabled = false;
                copyBtn.onclick = () => copyToClipboard(xml, copyBtn);
            }
        })
    });
});
