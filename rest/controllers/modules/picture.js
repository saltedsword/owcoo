'use strict';
import { ColumnModel, PictureModel, CodelistModel, Page } from '../../models/index';
import _ from 'lodash';

class Picture {
    //保存初始化
    static async saveInit(ctx) {
        // let id = ctx.request.query.id;
        // let column = ctx.request.query.column;
        // if (!id && !privileges(ctx, OPTIONS.ADD, column) || id && !privileges(ctx, OPTIONS.UPDATE, column)) return;
        const id = ctx.params.id;
        const c = ctx.query.c;
        const result = {};
        // result.status = await CodelistModel.getCodes('art_status');

        if (id) {
            result.picture = await PictureModel.findOne({_id: id}, {meta: 0, __v: 0});
        } else {
            result.picture = {
                column: '',
                title: '',
                content: '',
                status: 0,
                subImgs: [],
              }
        }

        const column = (id && result.picture) ? result.picture.column : (c || null);
        const { options, selectedOptions } = await ColumnModel.fetchByModule('picture', column);
        if (!id && selectedOptions[selectedOptions.length-1]) {
            result.picture.column = selectedOptions[selectedOptions.length-1];
        }
        result.options = options, result.selectedOptions = selectedOptions;
        ctx.success(result);
    }
    //保存
    static async save(ctx) {
        let picture = ctx.request.body.picture;
        let id = picture._id;
        let column = picture.column;
        // if (!id && !privileges(ctx, OPTIONS.ADD, column) || id && !privileges(ctx, OPTIONS.UPDATE, column)) return;
        if (!picture) {
            console.log('参数传递错误！');
            ctx.errorArguments();
            return;
        }
        if (!picture.title || !picture.column || (!picture.subImgs || picture.subImgs.length == 0)) {
            console.log('有必填项未填，请检查！');
            ctx.errorMsg('有必填项未填，请检查！');
            return;
        }
        if (await PictureModel.findByTitle(picture.title, id)) {
            console.log('已存在相同的标题！');
            ctx.errorMsg('已存在相同的标题！');
            return;
        }
        if (id) {
            let _picture = await PictureModel.findById(id);
            picture = _.assign(_picture, picture);
            picture.meta.updater = ctx.uid;
        } else {
            delete picture._id;
            picture = new PictureModel(picture);
            picture.meta.creater = ctx.uid;
        }
        await picture.save();
        ctx.successMsg('保存成功！');
    }
    // 分页查询，可指定 页面尺寸，目标页面，关键字过滤，按字段排序
    // 查询时，要根据查询人的权限，限制其查询的结果
    static async listByPage(ctx) {
        let query = ctx.request.query || {} ;
        query.searches = {}, query.filters = {};

        if (query.title) {
            query.searches.title = query.title;
        }
        if (query.column) {
            query.filters.column = await ColumnModel.fetchOffspringIds(query.column);
        }

        let page = new Page(query);
        
        await PictureModel.listByPage(page);
        const { options, selectedOptions } = await ColumnModel.fetchByModule('picture', query.column);
        page.options = options;
        page.selectedOptions = selectedOptions;
        page.list = page.list.map((item, index) => {
            return {
                column: item.column ? item.column.name : '',
                subImgs: item.subImgs,
                // content: item.content || '',
                createAt: item.createAt,
                creater: item.meta.creater ? item.meta.creater.name : '',
                pv: item.pv || 0,
                title: item.title || '',
                status: item.status,
                _id: item._id
            };
        });
        ctx.success(page);
    }
    //删除
    static async del(ctx) {
        // let id = ctx.request.query.id;
        // let picture = await PictureModel.findById(id);
        // if (!privileges(ctx, OPTIONS.DELETE, picture.column)) return;
        let id = ctx.params.id;
        let result = {};
        if (id) {
            if (!await PictureModel.findById(id)) {
                ctx.errorMsg('该记录不存在或已删除！');
                return
            } else {
                let picture = await PictureModel.remove({_id: id});
                ctx.delSuccess();
                return;
            }
        }
        ctx.errorArguments();
    }

    // 前台接口
    static async showPicture(ctx) {
        const id = ctx.params.id;
        if (!id) return ctx.errorArguments();
        let result = {};
        result.picture = await PictureModel.findOne({_id: id});
        if (result.picture) {
            const createAt = result.picture.meta.createAt;
            result.picture = {...result.picture._doc, ...{createAt: result.picture.createAt}};
            result.pre = await PictureModel.findOne({'meta.createAt': {$lt: createAt}}, {title: 1}).sort('-meta.createAt');
            result.next = await PictureModel.findOne({'meta.createAt': {$gt: createAt}}, {title: 1}).sort('meta.createAt');
        }
        ctx.success(result);
    }
    //分页查询，可指定 页面尺寸，目标页面，关键字过滤，按字段排序
    static async pictureList(ctx) {
        let query = ctx.request.query || {} ;
        query.searches = {}, query.filters = {};

        if (query.title) {
            query.searches.title = query.title;
        }
        if (query.column) {
            query.filters.column = await ColumnModel.fetchOffspringIds(query.column);
        }

        let page = new Page(query);
        
        await PictureModel.listByPage(page);
        page.list = page.list.map((item, index) => {
            return {
                column: item.column ? item.column.name : '',
                subImgs: item.subImgs,
                // content: item.content || '',
                createAt: item.createAt,
                creater: item.meta.creater ? item.meta.creater.name : '',
                pv: item.pv || 0,
                title: item.title || '',
                status: item.status,
                _id: item._id,
                abstract: item.abstract
            };
        });
        ctx.success(page);
    }
}

export default Picture;