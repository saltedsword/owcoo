/*
* @ use  七牛云对象存储实现，用于文件上传
*/ 
import qiniu from 'qiniu';
import GLOBLE_CONFIG from  '../../config/config';

const QN_CONFIG = GLOBLE_CONFIG[process.env.NODE_ENV || 'development'].qiniu;
const BASE_URL = QN_CONFIG.baseUrl;
const BUCKET = QN_CONFIG.bucket;
const MAC = new qiniu.auth.digest.Mac(QN_CONFIG.ACCESS_KEY, QN_CONFIG.SECRET_KEY);
const CONFIG = (() => {
  let config = new qiniu.conf.Config();
  // 空间对应的机房(华东)
  config.zone = qiniu.zone.Zone_z0;
  // 上传是否使用cdn加速
  config.useCdnDomain = true;
  return config;
})();
const LAST_TOKEN = {};

const getToken = () => {
  if (LAST_TOKEN.token && (Date.now() - LAST_TOKEN.createTime + 20*1000 < LAST_TOKEN.expires*1000)) {
    return LAST_TOKEN.token;
  } else {
    //自定义凭证有效期（示例2小时，expires单位为秒，为上传凭证的有效时间）
    let options = {
      scope: BUCKET,
      expires: 7200
    };
    let putPolicy = new qiniu.rs.PutPolicy(options);
    LAST_TOKEN.token = putPolicy.uploadToken(MAC);
    LAST_TOKEN.createTime = Date.now();
    LAST_TOKEN.expires = options.expires;
    return LAST_TOKEN.token;
  }
}
const upload = (key, path) => {
  let uploadToken = getToken();
  let localFile = path;
  let formUploader = new qiniu.form_up.FormUploader(CONFIG);
  let putExtra = new qiniu.form_up.PutExtra();
  // 文件上传
  return new Promise((resolve, reject) => {
    formUploader.putFile(uploadToken, key, localFile, putExtra, (err, res, info) => {
      if (err) {
        reject(err);
      } else {
        resolve({
          hash: res.hash,
          key: res.key,
          url: BASE_URL + res.key
        });
      }
    });
  });
}

const remove = (key) => {
  let bucketManager = new qiniu.rs.BucketManager(MAC, CONFIG);
  // 文件上传
  return new Promise((resolve, reject) => {
    bucketManager.delete(BUCKET, key, (err, res, info) => {
      if (err) {
        reject(err);
      } else {
        resolve(res);
      }
    });
  });
}

const removeKeys = async (keys) => {
  for (let i=0; i<keys.length; i++) {
    await remove(keys[i]);
  }
}

export default { upload, remove, removeKeys };