import jwt from 'jsonwebtoken';

export default class Jwt {

  static token (data) {
    const secret = 'mycms';
    const expire = 1*60 * 60; // 过期时间2小时
    return jwt.sign(data, secret, { expiresIn: expire });
  }

  static verify (token) {
    const secret = 'mycms';
    const result = {};
    try {
      result.data = jwt.verify(token, secret);
      result.success = true;
    } catch (err) {
      console.log('Token验证失败：' + err.message);
      result.success = false;
      result.msg = err.message;
    }
    return result;
  }
}
