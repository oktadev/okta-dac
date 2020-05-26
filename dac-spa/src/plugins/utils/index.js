import moment from "moment";

class Util {
    constructor() {

    }
    urlParams(query) {
        let urlParams = {};
        const search = /([^&=]+)=?([^&]*)/g;
    
        let match;
        while ((match = search.exec(query)) != null) {
            urlParams[match[1]] = match[2];
        }

        return urlParams;    
    }
    offsetDate(date, format) {
        if (!date || date.length <= 0) return '';
        
        const pattern = format ? format : 'MM/DD/YYYY HH:mm:ss'
        return moment(moment.utc(date).toDate())
            .local()
            .format(pattern);
    }
}

function install (Vue, options) {
  Vue.prototype.$utils = new Util()
}

export default { install }
