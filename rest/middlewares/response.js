/*
* @ author sessionboy 
* @ github https://github.com/sessionboy
* @ website http://sinn.boyagirl.com
* @ use 统一响应请求中间件
* @ error-data 返回错误时，可携带的数据
* @ error-msg  自定义的错误提示信息
* @ error-status 错误返回码
* @ error-errdata 可返回服务器生成的错误
* @ success-data  请求成功时响应的数据
* @ success-msg  请求成功时响应的提示信息
* @ 调用ctx.error()   响应错误
* @ 调用ctx.success()  响应成功
*/ 

export default async (ctx, next) => {
    ctx.error = (data, msg, status,error) => {
       ctx.status= status||400;
       ctx.body = { 
       	code: -200, 
       	msg: msg, 
       	data: data,
       	error: error
       };
       ctx.isFailed = true;
    }
    ctx.errorMsg = (msg, status) => {
    	ctx.status= status||400;
    	ctx.body = {
    		code: -200, 
    		msg: msg
    	};
        ctx.isFailed = true;
    }
    ctx.errorArguments = (status) => {
    	ctx.status= status||400;
    	ctx.body = {
    		code: -200, 
    		msg: '参数传递错误！'
    	};
        ctx.isFailed = true;
    }
    ctx.needLogin = (msg) => {
        ctx.status = 401;
        ctx.body = {
            code: -200, 
            msg: msg || '',
            needLogin: true
        };
        ctx.isFailed = true;
    }
    ctx.noPrivileges = (msg) => {
        ctx.status = 401;
        ctx.body = {
            code: -200, 
            msg: msg || '没有获取数据或执行该操作的权限!'
        };
        ctx.isFailed = true;
    }
    ctx.success = (data, msg) => {
        ctx.body = { 
        	code: 200, 
        	msg: msg, 
        	data: data 
        };
        ctx.isSuccess = true;
    }
    ctx.successMsg = (msg) => {
    	ctx.body = {
    		code: 200, 
    		msg: msg
    	};
        ctx.isSuccess = true;
    }
    ctx.delSuccess = (msg) => {
        ctx.body = {
            code: 200, 
            msg: msg || '删除成功！',
            deleted: true
        };
        ctx.isSuccess = true;
    }

    // CORS设置
    ctx.set({ 
        'Access-Control-Allow-Origin': 'http://localhost:5000',
        // 'Access-Control-Allow-Credentials': true,
        'Access-Control-Allow-Headers': 'Origin, X-Requested-With, Content-Type, Accept, Authorization'
        });
    // 对于非简单请求的首次OPTIONS预检，直接返回
    if (ctx.request.method === 'OPTIONS')
        return ctx.status = 200;
    await next();
}