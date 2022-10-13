const isIinValid = function (iin) {
    if(iin) {
        if (iin.match(/\D/)) {
            return false;
        }
        if (parseInt(iin.substring(4, 5)) > 3) {
            return false;
        }
        if (parseInt(iin.substring(6, 7)) > 6) {
            return false;
        }
        let s = 0;
        for (let i = 0; i < 11; i++) {
            s = s + (i + 1) * parseInt(iin[i]);
        }
        let k = s % 11;
        if (k === 10) {
            s = 0;
            for (let i = 0; i < 11; i++) {
                let t = (i + 3) % 11;
                if (t === 0) {
                    t = 11;
                }
                s = s + t * parseInt(iin[i]);
            }
            k = s % 11;
            if (k === 10) {
                return false;
            }

            return (k === parseInt(iin.substring(11, 12)));
        }

        return (k === parseInt(iin.substring(11, 12)));
    }
    return true;
}
