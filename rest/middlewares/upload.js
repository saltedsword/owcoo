/*
* @ author sessionboy 
* @ github https://github.com/sessionboy
* @ website http://sinn.boyagirl.com
* @ use 阿里oss和七牛云图片上传中间件
* @ qiniu   上传到七牛云
* @ alioss  上传到阿里云oss
*/ 
import fs from 'fs';
import qiniu from '../utils/qiniu';
import config from '../../config/config';
import multer from 'koa-multer';
import _ from 'lodash';

const globalConfig = config[process.env.NODE_ENV || 'development'];

const MULTER_CONFIG = {
  OPTS: {
    storage: multer.diskStorage({
      destination: '/tmp/cms-uploads',
      filename: (req, file, cb) => {
        let suffix = (file.originalname).split('.').pop();
        let newFileName = Date.now() + Math.random().toString(16).substr(5) + "." + suffix;
        cb(null, newFileName);
      }
    }),
    fileFilter: (req, file, cb) => {
      // 接受这个文件，使用`true`, 像这样:
      cb(null, true);
      // cb(new Error('I don\'t have a clue!'));
    },
    limits: {
      fileSize: 10*1024*1024,
      files: 10
    }
  }

};
const upload = multer(MULTER_CONFIG.OPTS);

class UploadController {

  // 图片上传到七牛云中间件
  static async qiniu (ctx, next){
    // 上传到本地先
    await upload.any()(ctx);
    ctx.request.body = ctx.req.body;
    // 用于将文本字段和上传七牛后的文件 组装到ctx.request.files(只保留url)和ctx.request.filesDetails（保留文件详情）中，方便后续中间件的调用
    let ctxFiles = ctx.request.files = {};
    let ctxFilesDetails = ctx.request.filesDetails = {};
    // 上传七牛
    let files = ctx.req.files;
    // 已经上传到七牛的文件的keys，可以用于后续的删除
    let qnkeys = [];
    for (let i=0; i<files.length; i++) {
      let fieldname = files[i].fieldname;
      let key = files[i].filename;
      let path = files[i].path;

      let qnres = await qiniu.upload(key, path);
      if (!qnres || !qnres.url) {
        return ctx.error({ msg: '上传到云端时发生错误!' });
      }
      let url = qnres.url;
      qnkeys.push(qnres.key);
      // 每个文件的详细信息
      let details = {
        name: files[i].originalname,
        url: url,
        encoding: files[i].encoding,
        mimetype: files[i].mimetype,
        size: files[i].size
      };
      // 组装数据到 ctx.request.files
      if (!ctxFiles[fieldname]) {
        ctxFiles[fieldname] = url;
        ctxFilesDetails[fieldname] = details;
      } else {
        if (!_.isArray(ctxFiles[fieldname])) {
          ctxFiles[fieldname] = [ctxFiles[fieldname]];
          ctxFilesDetails[fieldname] = [ctxFilesDetails[fieldname]];
        }
        ctxFiles[fieldname].push(url);
        ctxFilesDetails[fieldname].push(details);
      }
      // 删除本地临时文件
      fs.unlinkSync(path);
    }

    // 为了作为工具方法使用，就不用其调用next方法了，但是要返回已经上传到云端的keys,便于捕获异常时，进行删除操作
    if (!next) return qnkeys;

    try {
      await next();
      // 如果业务上请求不成功，则删除已经上传七牛的文件
      if (ctx.isFailed) {
        await qiniu.removeKeys(qnkeys);
      }
    } catch (err) {
      // 如果是未知异常，也要删除远程文件
      await qiniu.removeKeys(qnkeys);
      throw err;
    }
  }
  
   // 图片上传到阿里云oss中间件
  // static async alioss (ctx,next){   
  //   const { fields,files } = ctx.request.body;
  //   if(!files||!files.file){
  //     return ctx.error({ msg: '上传失败!' });
  //   }
  //   const { id } = fields;
  //   const userid = ctx.cookies.get('userid');
  //   if(!id || !userid || id!=userid) return ctx.error({ msg:'您还没有登录哦!'});

  //   const isexit = await fs.existsSync(files.file.path);
  //   if(!isexit) return ctx.error({ msg: '上传文件时发生错误!' });
    
  //   let filekey = id+files.file.name;
  //   if(globalConfig.alioss.folder){
  //     filekey = globalConfig.alioss.folder+filekey;
  //   }

  //   const result = await alioss(filekey,files.file.path);
  //   if( !result || !result.url ) return ctx.error({ msg: '上传到云端时发生错误!' });
   
  //   const { url } = result;
  //   fs.unlinkSync(files.file.path);
  //   ctx.upload = { url,id };  // 挂载在ctx, 传递给下个中间件
  //   await next(); 
  // }

}

export default UploadController;
