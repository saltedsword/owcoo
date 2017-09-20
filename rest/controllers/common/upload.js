'use strict';
import qiniu from '../../utils/qiniu';

class Upload {
    //饿了么ui框架上传接口
    static async uploadForElement(ctx) {

        return ctx.success(ctx.request.filesDetails.file);
        
    }
    
    static async removeFiles(ctx) {
        const fileUrls = ctx.request.body.fileUrls || [];
        const keys = fileUrls.map(url => { return url.substring(url.lastIndexOf('/') + 1)});
        await qiniu.removeKeys(keys);
        return ctx.success('删除文件成功！');
        
    }

    
}

export default Upload;