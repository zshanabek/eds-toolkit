const ncalayerClient = new NCALayerClient();

async function connectAndSign(base64) {

    try {
        await ncalayerClient.connect();
    } catch (error) {
        alert(`Не удалось подключиться к NCALayer: ${error.toString()}`);
        return;
    }

    let activeTokens;
    try {
        activeTokens = await ncalayerClient.getActiveTokens();
    } catch (error) {
        alert(error.toString());
        return;
    }

    // getActiveTokens может вернуть несколько типов хранилищ, для простоты проверим первый.
    // Иначе нужно просить пользователя выбрать тип носителя.
    const storageType = activeTokens[0] || NCALayerClient.fileStorageType;

    let base64EncodedSignature;
    try {
        base64EncodedSignature = await ncalayerClient.createCMSSignatureFromBase64(storageType, base64, 'SIGNATURE', true);
    } catch (error) {
        // alert(error.toString());
        console.log(error.toString());
        return;
    }

    return base64EncodedSignature;
}
