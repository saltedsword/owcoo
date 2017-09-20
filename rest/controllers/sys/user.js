'use strict';
import { UserGroupModel, Page, UserModel } from '../../models/index';
import _ from 'lodash';
import Jwt from '../../utils/jwt';

class User {
    // 分页查询，可指定 页面尺寸，目标页面，关键字过滤，按字段排序
    // 查询时，要根据查询人的权限，限制其查询的结果
    static async list(ctx) {
        let query = ctx.request.query || {} ;

        let page = new Page(query);
        
        await UserModel.listByPage(page);
        
        page.list = page.list.map(el => {return Object.assign({}, el._doc, {userGroup: el._doc.userGroup.name})});
        ctx.success({currentPage: page.currentPage, total: page.totalCount, data: page.list});
    }
    //保存初始化
    static async saveInit(ctx) {
        let id = ctx.params.id;
        // if (!id && !privileges(ctx, OPTIONS.ADD) || id && !privileges(ctx, OPTIONS.UPDATE)) return;
        let result = {};
        if (id) result.user = await UserModel.findOne({_id: id}, {meta: 0, __v: 0});
        result.userGroups = await UserGroupModel.find({}, {name: 1});
        ctx.success(result);
    }
    //保存
    static async save(ctx) {
        let user = ctx.request.body.user;
        let id = user._id;
        // if (!id && !privileges(ctx, OPTIONS.ADD) || id && !privileges(ctx, OPTIONS.UPDATE)) return;
        if (!user) {
            console.log('参数传递错误！');
            ctx.errorArguments();
            return;
        }
        if (!user.name || !user.userName || !user.pass || !user.checkPass || !user.userGroup || !user.email) {
            console.log('有必填项未填，请检查！');
            ctx.errorMsg('有必填项未填，请检查！');
            return;
        }

        if (user.pass !== user.checkPass) {
            console.log('两次输入的密码不匹配！');
            ctx.errorMsg('两次输入的密码不匹配！');
            return;
        }

        if (await UserModel.findByName(user.name, id)) {
            console.log('已存在相同的用户组名！');
            ctx.errorMsg('已存在相同的用户组名！');
            return;
        }

        delete user.checkPass;
        if (id) {
            let _user = await UserModel.findById(id);
            user = _.assign(_user, user);
            user.meta.updater = ctx.uid;
            user = await user.save();
        } else {
            delete user._id;
            user = new UserModel(user);
            user.meta.creater = ctx.uid;
            user = await user.save();
        }
        await User.list(ctx);
        return ctx.body.msg = '保存成功！';
    }
    //删除
    static async del(ctx) {
        // if (!privileges(ctx, OPTIONS.DELETE)) return;
        let id = ctx.params.id;
        let result = {};
        if (id) {
            if (!await UserModel.findById(id)) {
                ctx.errorMsg('该用户组不存在或已删除！');
                return
            }
            
            let user = await UserModel.remove({_id: id});

            await User.list(ctx);
            return ctx.body.msg = '删除成功！';
        }
        ctx.errorArguments();
    }

    //登录
    static async login(ctx) {
        let user = ctx.request.body.user;
        if (!user) {
            console.log('参数传递错误！');
            ctx.errorArguments();
            return;
        }
        if (!user.userName || !user.pass) {
            console.log('有必填项未填，请检查！');
            ctx.errorMsg('有必填项未填，请检查！');
            return;
        }
        let mUser = await UserModel.findOne({ userName: user.userName });
        if (mUser) {
            if (mUser.comparePassword(user.pass)) {
                // ctx.session.user = mUser;
                const data = {_id: mUser._id, userName: mUser.userName};
                const token = Jwt.token(data);
                const menusTree = await UserModel.fetchMenusTree(mUser._id);
                return ctx.success({token: token, user: data, menusTree: menusTree}, '登录成功！');
            }else {
                console.log('用户名密码错误!');
                return ctx.errorMsg('用户名密码错误!');
            }
        } else {
            console.log('没有该用户！');
            return ctx.errorMsg('没有该用户！');
        }
    }
    //获取登录状态
    static async logInfo(ctx) {
        const auth = ctx.headers.authorization;
        if (!auth) return ctx.success({login: false});
        const token = auth.split('Bearer ')[1];
        if (!token) return ctx.success({login: false});

        const result = Jwt.verify(token);
        if (!result.success) return ctx.success({login: false});
        return ctx.success({login: true, user: result.data});
    }

    // //登出
    // static async logout(ctx) {
    //     delete ctx.session.user;
    //     return crx.successMsg('登出成功！');
    // }
}

export default User;