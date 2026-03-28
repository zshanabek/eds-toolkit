
const ecpModel = EcpModel;

document.addEventListener('DOMContentLoaded', function () {

    document.getElementById('select-btn').addEventListener('click', function () {
        document.getElementById('error').style.display = 'none';
        document.getElementById('xml-container').style.display = 'none';
        document.getElementById('base64-container').style.display = 'none';
        console.log('select-btn click');
        const iin = document.getElementById('iin').value;
        if (!isIinValid(iin)) {
            document.getElementById('error').style.display = 'block';
            return;
        }
        console.log(iin);
        ecpModel.selectSignType(iin,
            () => {
            },
            () => {
            },
            async xml => {
                if (xml.length < 400) {
                    alert('Error happened, retry EDS sign');
                    console.error('Произошла ошибка повторите подпись эцп');
                    return;
                }
                console.log(xml);
                const encodedBase64XmlEcp = ecpModel.b64EncodeUnicode(xml);
                console.log(encodedBase64XmlEcp);
                document.getElementById('xml-container').style.display = 'block';
                document.getElementById('base64-container').style.display = 'block';
                document.getElementById('xml').innerHTML = xml;
                document.getElementById('base64').innerHTML = encodedBase64XmlEcp;
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
                console.warn('Some Error ECP');
            },
            cb_success: async (xml) => {
                if (xml.length < 400) {
                    console.error('Произошла ошибка повторите подпись эцп');
                    return;
                }
                document.getElementById('signedStringBase64').innerHTML = xml;
            }
        })
    });
});
