import fetch from 'node-fetch';
import { expect } from 'chai';
import { Column } from '../rest/controllers/index';
import { URLSearchParams } from 'url';
import { development } from '../config/config';

// 测试前先造好数据备用
// 每次整个流程测试完，会新建一个一级栏目：测试1，然后updid名被修改为原名+23，还有会将updid 移动到业界资讯下，delsuccess会被删除。
// 注意每次测试要将上述数据进行初始化
const TESTDATA = {
    // uri
    uri: 'http://localhost:' + development.port,
    // 测试数据
    name: '测试1',
    display: 2,
    module: 2,
    dir: 'test1',
    sort: 0,
    parent: '',
    _id: '',
    // 以上为保存条件参数，以下为测试其他数据
    updid: "5987fa2cc53bd2fc2a5f5203",      // 更新的目标id
    repeatname: '太阳镜',                    // 重复的名
    second: '5983d0680b1fe847cad40c6a',     // 公司简介
    secondModule: 2,                        // 公司简介的模块类型
    third: '5983df8fccda3148d744e264',      // 太阳镜
    moveParent: '5983dd78ccda3148d744e25c', // 移动到业界资讯下
    delfailed: '5982fad0c26c804671f0163c',  // 关于我们，不可直接删除
    delsuccess: '5987faf3c53bd2fc2a5f5204'  // 一个一级测试目录，下面没有子目录可以删除
};

describe.skip('栏目保存初始化接口测试：GET: /manage/column/saveInit', () => {
  it('无需传任何参数，如执行成功，返回码为200', (done) => {
    (async () => {
        try {
            let res = await fetch(TESTDATA.uri + '/manage/column/saveInit');
            let json = await res.json();
            expect(json.code).to.be.equal(200);
            done();
        } catch (err) {
            // console.log(err.message);
            done(err);
        }
    })();
  });
});

describe.skip('栏目保存接口测试：POST: /manage/column/save', () => {
  it('新增时，如果存在相同的栏目名，则新增失败，返回码为-200', (done) => {
    (async () => {
        const params = new URLSearchParams();
        params.append('column[name]', TESTDATA.repeatname);
        params.append('column[display]', 2);
        params.append('column[module]', 2);
        params.append('column[dir]', TESTDATA.dir);
        params.append('column[sort]', 0);
        params.append('column[parent]', '');
        params.append('column[_id]', '');
        let headers = {
            'Content-Type': 'application/x-www-form-urlencoded'
        };
        try {
            let res = await fetch(TESTDATA.uri + '/manage/column/save', { method: 'POST', body: params, headers: headers });
            let json = await res.json();
            expect(json.code).to.be.equal(-200);
            done();
        } catch (err) {
            // console.log(err.message);
            done(err);
        }
    })();
  });
  it('修改时，如果存在与修改后名称相同的栏目名，则修改失败，返回码为-200', (done) => {
    (async () => {
        const params = new URLSearchParams();
        params.append('column[name]', TESTDATA.repeatname);
        params.append('column[display]', 2);
        params.append('column[module]', 2);
        params.append('column[dir]', TESTDATA.dir);
        params.append('column[sort]', 2);
        params.append('column[parent]', '');
        params.append('column[_id]', TESTDATA.updid);
        let headers = {
            'Content-Type': 'application/x-www-form-urlencoded'
        };
        try {
            let res = await fetch(TESTDATA.uri + '/manage/column/save', { method: 'POST', body: params, headers: headers });
            let json = await res.json();
            expect(json.code).to.be.equal(-200);
            done();
        } catch (err) {
            // console.log(err.message);
            done(err);
        }
    })();
  });
  it('修改时，不能将目标菜单及其子孙菜单作为目标菜单的父菜单，否则修改失败，返回码为-200', (done) => {
    (async () => {
        const params = new URLSearchParams();
        params.append('column[name]', TESTDATA.name);
        params.append('column[display]', 2);
        params.append('column[module]', 2);
        params.append('column[dir]', TESTDATA.dir);
        params.append('column[sort]', 2);
        params.append('column[parent]', TESTDATA.updid);
        params.append('column[_id]', TESTDATA.updid);
        let headers = {
            'Content-Type': 'application/x-www-form-urlencoded'
        };
        try {
            let res = await fetch(TESTDATA.uri + '/manage/column/save', { method: 'POST', body: params, headers: headers });
            let json = await res.json();
            expect(json.code).to.be.equal(-200);
            done();
        } catch (err) {
            // console.log(err.message);
            done(err);
        }
    })();
  });
  it('保存时，指定的父栏目层级最多为2，否则保存失败，返回码为-200', (done) => {
    (async () => {
        const params = new URLSearchParams();
        params.append('column[name]', TESTDATA.name);
        params.append('column[display]', 2);
        params.append('column[module]', 2);
        params.append('column[dir]', TESTDATA.dir);
        params.append('column[sort]', 2);
        params.append('column[parent]', TESTDATA.third);
        params.append('column[_id]', '');
        let headers = {
            'Content-Type': 'application/x-www-form-urlencoded'
        };
        try {
            let res = await fetch(TESTDATA.uri + '/manage/column/save', { method: 'POST', body: params, headers: headers });
            let json = await res.json();
            expect(json.code).to.be.equal(-200);
            done();
        } catch (err) {
            // console.log(err.message);
            done(err);
        }
    })();
  });
  it('保存时，如果父栏目是二级栏目，则目标栏目的模块类型必须和它一致！，否则保存失败，返回码为-200', (done) => {
    (async () => {
        const params = new URLSearchParams();
        params.append('column[name]', TESTDATA.name);
        params.append('column[display]', 2);
        params.append('column[module]', TESTDATA.second + 1);
        params.append('column[dir]', TESTDATA.dir);
        params.append('column[sort]', 2);
        params.append('column[parent]', TESTDATA.second);
        params.append('column[_id]', '');
        let headers = {
            'Content-Type': 'application/x-www-form-urlencoded'
        };
        try {
            let res = await fetch(TESTDATA.uri + '/manage/column/save', { method: 'POST', body: params, headers: headers });
            let json = await res.json();
            expect(json.code).to.be.equal(-200);
            done();
        } catch (err) {
            // console.log(err.message);
            done(err);
        }
    })();
  });
  it('新增时，不指定_id，如果参数符合条件，则保存成功，返回码为200', (done) => {
    (async () => {
        const params = new URLSearchParams();
        params.append('column[name]', TESTDATA.name);
        params.append('column[display]', TESTDATA.display);
        params.append('column[module]', TESTDATA.module);
        params.append('column[dir]', TESTDATA.dir);
        params.append('column[sort]', TESTDATA.sort);
        params.append('column[parent]', '');
        params.append('column[_id]', '');
        let headers = {
            'Content-Type': 'application/x-www-form-urlencoded'
        };
        try {
            let res = await fetch(TESTDATA.uri + '/manage/column/save', { method: 'POST', body: params, headers: headers });
            let json = await res.json();
            expect(json.code).to.be.equal(200);
            done();
        } catch (err) {
            // console.log(err.message);
            done(err);
        }
    })();
  });
  it('修改时，指定_id，如果参数符合条件，则保存成功，返回码为200', (done) => {
    (async () => {
        const params = new URLSearchParams();
        params.append('column[name]', TESTDATA.name+'23');
        params.append('column[display]', TESTDATA.display);
        params.append('column[module]', TESTDATA.module + 1);
        params.append('column[dir]', TESTDATA.dir);
        params.append('column[sort]', TESTDATA.sort + 1);
        params.append('column[parent]', '');
        params.append('column[_id]', TESTDATA.updid);
        let headers = {
            'Content-Type': 'application/x-www-form-urlencoded'
        };
        try {
            let res = await fetch(TESTDATA.uri + '/manage/column/save', { method: 'POST', body: params, headers: headers });
            let json = await res.json();
            expect(json.code, '保存失败了！！！').to.be.equal(200);
            done();
        } catch (err) {
            // console.log(err.message);
            done(err);
        }
    })();
  });
});

describe.skip('栏目移动初始化接口测试：GET: /manage/column/moveInit', () => {
  it('需传目标栏目的id，如执行成功，返回码为200', (done) => {
    (async () => {
        try {
            let res = await fetch(TESTDATA.uri + '/manage/column/moveInit?id=' + TESTDATA.updid);
            let json = await res.json();
            expect(json.code).to.be.equal(200);
            done();
        } catch (err) {
            // console.log(err.message);
            done(err);
        }
    })();
  });
});

describe.skip('栏目移动接口测试：POST: /manage/column/move', () => {
  it('如果父栏目层级和目标栏目最大层级之和大于3，则请求失败，返回码为-200', (done) => {
    (async () => {
        const params = new URLSearchParams();
        params.append('column[parent]', TESTDATA.third);
        params.append('column[_id]', TESTDATA.updid);
        let headers = {
            'Content-Type': 'application/x-www-form-urlencoded'
        };
        try {
            let res = await fetch(TESTDATA.uri + '/manage/column/move', { method: 'POST', body: params, headers: headers });
            let json = await res.json();
            expect(json.code).to.be.equal(-200);
            done();
        } catch (err) {
            // console.log(err.message);
            done(err);
        }
    })();
  });
  it('如果参数符合要求，则请求成功，返回码为200', (done) => {
    (async () => {
        const params = new URLSearchParams();
        params.append('column[parent]', TESTDATA.moveParent);
        params.append('column[_id]', TESTDATA.updid);
        let headers = {
            'Content-Type': 'application/x-www-form-urlencoded'
        };
        try {
            let res = await fetch(TESTDATA.uri + '/manage/column/move', { method: 'POST', body: params, headers: headers });
            let json = await res.json();
            expect(json.code).to.be.equal(200);
            done();
        } catch (err) {
            // console.log(err.message);
            done(err);
        }
    })();
  });
});

describe.skip('栏目删除接口测试：GET: /manage/column/del', () => {
  it('如果存在子栏目，则请求失败，返回码为-200', (done) => {
    (async () => {
        try {
            let res = await fetch(TESTDATA.uri + '/manage/column/del?id=' + TESTDATA.delfailed);
            let json = await res.json();
            expect(json.code).to.be.equal(-200);
            done();
        } catch (err) {
            // console.log(err.message);
            done(err);
        }
    })();
  });
  it('如果参数符合要求，则请求成功，返回码为200', (done) => {
    (async () => {
        try {
            let res = await fetch(TESTDATA.uri + '/manage/column/del?id=' + TESTDATA.delsuccess);
            let json = await res.json();
            expect(json.code).to.be.equal(200);
            done();
        } catch (err) {
            // console.log(err.message);
            done(err);
        }
    })();
  });
});

describe.skip('栏目树初始化接口测试：GET: /manage/column/tree', () => {
  it('无需参数，如果请求成功，返回码为200', (done) => {
    (async () => {
        try {
            let res = await fetch(TESTDATA.uri + '/manage/column/tree');
            let json = await res.json();
            expect(json.code).to.be.equal(200);
            done();
        } catch (err) {
            // console.log(err.message);
            done(err);
        }
    })();
  });
});

describe.skip('栏目首页初始化接口测试：GET: /manage/column/init', () => {
  it('无需参数，如果请求成功，返回码为200', (done) => {
    (async () => {
        try {
            let res = await fetch(TESTDATA.uri + '/manage/column/init');
            let json = await res.json();
            expect(json.code).to.be.equal(200);
            done();
        } catch (err) {
            // console.log(err.message);
            done(err);
        }
    })();
  });
});