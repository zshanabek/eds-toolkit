// "use strict";
const EcpModel = {
    cb_error: false,
    cb_start: false,
    cb_canceled: false,
    cb_success: false,
    data: null,
    method: false,
    kTokensNclayer: false,
    idCardNclayer: false,
    webSocket: null,
    heartbeatMsg: "--heartbeat--",
    heartbeatInterval: null,
    missedHeartbeats: 0,
    missedHeartbeatsLimitMin: 3,
    missedHeartbeatsLimitMax: 50,
    missedHeartbeatsLimit: 3,
    callback: null,
    keyType: null,
    storageAlias: null,
    /**
     * Показать диалоговое окно ошибки при соединении по веб сокетам
     */
    openNCALayerNotConnectedModal: function () {
        if (EcpModel.cb_error) EcpModel.cb_error();
        console.warn("Показать окно Ошибки при соединении по Веб Сокетам");
    },
    /**
     * Показать стандартную форму с ошибкой, закрыв все остальные модалки
     */
    openNcLayerCanceled: function () {
        if (EcpModel.cb_canceled) EcpModel.cb_canceled();
        console.warn("При отмены окна NCALayer");
    },
    openNcaLayerError: function () {
        if (EcpModel.cb_error) EcpModel.cb_error();
        console.warn(
            "Показать стандартную форму с ошибкой, закрыв все остальные модалки"
        );
    },
    /**
     * Пингуем прослойку
     */
    pingLayer: function () {
        const _this = EcpModel;
        if (
            _this.webSocket === null ||
            _this.webSocket.readyState === 3 ||
            _this.webSocket.readyState === 2
        ) {
            clearInterval(_this.heartbeatInterval);
            _this.heartbeatInterval = null;
            _this.webSocket.close();
            return;
        }
        try {
            _this.webSocket.send(_this.heartbeatMsg);
        } catch (error) {
            clearInterval(_this.heartbeatInterval);
            _this.heartbeatInterval = null;
            _this.webSocket.close();
        }
    },
    onCloseSocket: function (event) {
        if (!event.wasClean) {
            EcpModel.openNCALayerNotConnectedModal();
        }
    },
    onMessageSocket: function (event) {
        const _this = EcpModel;
        if (event.data === _this.heartbeatMsg) {
            _this.missedHeartbeats = 0;
            return;
        }
        const result = JSON.parse(event.data);
        const rw = {
            result: result.result,
            secondResult: result.secondResult,
            errorCode: result.errorCode,
            code: result.code,
            responseObject: result.responseObject,
            message: result.message,
            getResult: function () {
                return this.result;
            },
            // getSecondResult: function() {
            //   return this.secondResult;
            // },
            // getErrorCode: function() {
            //   return this.errorCode;
            // },
            getMessage: function () {
                return this.message;
            },
            getResponseObject: function () {
                return this.responseObject;
            },
            // getCode: function () {
            //   return this.code;
            // }
        };
        if (_this.callback) {
            _this.callback(rw);
        }
        _this.setMissedHeartbeatsLimitToMin();
    },
    setMissedHeartbeatsLimitToMin: function () {
        EcpModel.missedHeartbeatsLimit = EcpModel.missedHeartbeatsLimitMin;
    },
    /**
     * Делаем лимиты максимальными перед новой отправкой
     */
    setMissedHeartbeatsLimitToMax: function () {
        EcpModel.missedHeartbeatsLimit = EcpModel.missedHeartbeatsLimitMax;
    },
    /**
     * Начинаем проверка, какие кнопки показать, проверка Казтокенов
     */
    selectNCAStore: function () {
        setTimeout(function () {
            EcpModel.getActiveTokens();
        }, 500);
    },
    getActiveTokens: function () {
        const _this = EcpModel;
        _this.callback = _this.getActiveTokensBack;
        _this.setMissedHeartbeatsLimitToMax();
        _this.webSocket.send(
            JSON.stringify({
                module: "kz.gov.pki.knca.commonUtils",
                method: "getActiveTokens",
            })
        );
    },
    getActiveTokensBack: function (result) {
        const _this = EcpModel;
        console.warn("getActiveTokensBack", result);
        if (result["code"] === "500") {
            _this.openNcaLayerError();
            return;
        }
        if (result["code"] === "200") {
            const listOfTokens = result["responseObject"]
            _this.kTokensNclayer = false;
            _this.idCardNclayer = false;
            for (let i = 0; i < listOfTokens.length; i++) {
                if (listOfTokens[i] === "AKKaztokenStore") {
                    _this.kTokensNclayer = true;
                }
                if (listOfTokens[i] === "AKKZIDCardStore") {
                    _this.idCardNclayer = true;
                }
            }
            _this.showNCAStore();
        }
    },
    /**
     * После проверки что подключено, показываем модалку с подкл устройствами или открываем файловый менеджер
     */
    showNCAStore: function () {
        const storage = "PKCS12";
        // const kTokens = 'AKKaztokenStore';
        // const idCards = 'AKKZIDCardStore';
        // Можно выбрать варианты по-умолчанию NCALayer с файлового ключа
        EcpModel.chooseNCAStorage(storage);
        // if (kTokensNclayer || idCardNclayer) {
        //   if (kTokensNclayer) {
        //     chooseNCAStorage(kTokens);
        //   }
        //   if (idCardNclayer) {
        //     chooseNCAStorage(idCards);
        //   }
        //   chooseNCAStorage(storage);
        // }
    },
    /**
     * @return {callback}
     * @param storageAlias
     */
    chooseNCAStorage: function (storageAlias) {
        EcpModel.storageAlias = storageAlias;
        EcpModel.doSign();
    },
    /**
     * doSignRequest() Вызываем перед отправкой xml, чтобы подписать
     * sendSignedXml() Зарегистрированная функция в ангуляре
     */
    signXml() {
        let xml = this.data.data
        if (this.data.type === "JSON") {
            xml = "<root><params>\n";
            for (const key in this.data.data) {
                if (this.data.data.hasOwnProperty(key)) {
                    xml =
                        xml +
                        "<" +
                        encodeURI(key) +
                        ">" +
                        encodeURI(this.data.data[key]) +
                        "</" +
                        encodeURI(key) +
                        ">\n";
                }
            }
            xml = xml + "</params></root>";
        }
        xml = xml + "\n";
        this.webSocket.send(
            JSON.stringify({
                module: "kz.gov.pki.knca.commonUtils",
                method: "signXml",
                args: [this.storageAlias, this.method, xml, "", ""],
            })
        );
    },
    signCms() {
        const obj = {
            module: "kz.gov.pki.knca.commonUtils",
            method: "createCAdESFromBase64",
            args: [this.storageAlias, this.method, this.data.data, true],
        }

        this.webSocket.send(
            JSON.stringify(obj)
        );
    },
    doSign() {
        const _this = EcpModel;
        _this.callback = _this.signXmlNewBack; // пользователь нажал отмена
        _this.setMissedHeartbeatsLimitToMax();
        if (this.data.type === "CMS") {
            this.signCms()
        } else {
            this.signXml()
        }

    },
    signXmlNewBack: function (result) {
        const _this = EcpModel;
        if (result["code"] === "500") {
            if (
                result["message"] != null &&
                result["message"] !== "action.canceled"
            ) {
                _this.openNcaLayerError();
            }
            if (
                result["message"] != null &&
                result["message"] === "action.canceled"
            ) {
                _this.openNcLayerCanceled();
            }
            return;
        }
        if (result["code"] === "200") {
            const signedData = result["responseObject"];
            if (_this.cb_success) {
                _this.cb_success(signedData);
            }
            _this.webSocket.close();
        }
    },
    /**
     * Инициализация прослойки
     */
    initNCALayer: function () {
        const _this = EcpModel;
        _this.webSocket = new WebSocket("wss://127.0.0.1:13579/");
        _this.webSocket.onopen = function () {
            if (_this.heartbeatInterval === null) {
                _this.missedHeartbeats = 0;
                _this.heartbeatInterval = setInterval(_this.pingLayer, 1000);
            }
            _this.selectNCAStore();
        };
        _this.webSocket.onclose = _this.onCloseSocket;
        _this.webSocket.onmessage = _this.onMessageSocket;
    },
    /**
     * runProcess() запускает процесс выбора ЭЦП ключей
     */
    runProcess: function () {
        const _this = EcpModel;
        if (_this.cb_start) _this.cb_start();
        if (
            _this.webSocket === null ||
            _this.webSocket.readyState === 3 ||
            _this.webSocket.readyState === 2
        ) {
            _this.initNCALayer();
        } else {
            _this.selectNCAStore();
        }
    },
    /**
     * signatureData() подписание данных ЭЦП
     */
    signatureXml: function (xml, {cb_start, cb_canceled, cb_error, cb_success}) {
        this.initSettings({cb_start, cb_canceled, cb_error, cb_success})
        this.data = {
            type: "JSON",
            data: xml
        }
        this.runProcess();
    },
    /**
     * signatureData() подписание данных ЭЦП с помощью json
     */
    signatureData: function (data = {}, {cb_start, cb_canceled, cb_error, cb_success}) {
        this.initSettings({cb_start, cb_canceled, cb_error, cb_success})
        this.data = {
            type: "JSON",
            data
        }
        this.runProcess();
    },
    b64EncodeUnicode(str) {
        return btoa(encodeURIComponent(str).replace(/%([0-9A-F]{2})/g,
            function toSolidBytes(match, p1) {
                return String.fromCharCode('0x' + p1);
            }));
    },
    initSettings({
                     cb_start = () => {},
                     cb_canceled = () => {},
                     cb_error = () => {},
                     cb_success = () => {}
                 }, method = "SIGNATURE") {
        this.method = method;
        this.cb_start = cb_start;
        this.cb_canceled = cb_canceled;
        this.cb_error = cb_error;
        this.cb_success = cb_success;
    },
    createCMSSignature(data = {}, {cb_start, cb_canceled, cb_error, cb_success}) {
        const raw = typeof data === 'string' ? data : JSON.stringify(data);
        this.data = {
            type: "CMS",
            data: this.b64EncodeUnicode(raw),
            dataType: 'object'
        }
        this.initSettings({cb_start, cb_canceled, cb_error, cb_success})
        this.runProcess();
    },
    selectSignType: function (jwt_token, cb_start, cb_error, cb_success) {
        this.data = {
            type: "JSON",
            data: {
                action: "AUTHENTICATION",
                jwt_token: jwt_token,
            }
        };
        this.initSettings({cb_start, cb_error, cb_success}, "AUTHENTICATION")

        this.runProcess();
    },
};