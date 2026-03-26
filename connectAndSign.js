async function connectAndSign(base64) {
    const client = new NCALayerClient();

    try {
        await client.connect();
    } catch (error) {
        alert(`Не удалось подключиться к NCALayer: ${error.toString()}`);
        return;
    }

    let activeTokens;
    try {
        activeTokens = await client.getActiveTokens();
    } catch (error) {
        alert(error.toString());
        return;
    }

    const storageType = activeTokens[0] || NCALayerClient.fileStorageType;

    let base64EncodedSignature;
    try {
        base64EncodedSignature = await client.createCAdESFromBase64(storageType, base64, 'SIGNATURE', true);
    } catch (error) {
        alert(error.toString());
        return;
    }

    return base64EncodedSignature;
}
