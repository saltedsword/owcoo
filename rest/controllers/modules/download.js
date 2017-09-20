'use strict';
import { ColumnModel, DownloadModel, CodelistModel, Page } from '../../models/index';
import _ from 'lodash';

class Download {
    //保存初始化
    static async saveInit(ctx) {
        // let id = ctx.request.query.id;
        // let column = ctx.request.query.column;
        // if (!id && !privileges(ctx, OPTIONS.ADD, column) || id && !privileges(ctx, OPTIONS.UPDATE, column)) return;
        const id = ctx.params.id;
        const c = ctx.query.c;
        const result = {};

        if (id) {
            result.download = await DownloadModel.findOne({_id: id}, {meta: 0, __v: 0});
        } else {
            result.download = {
                column: '',
                title: '',
                content: '',
                status: 0,
                files: [],
              }
        }
        const column = (id && result.download) ? result.download.column : (c || null);
        const { options, selectedOptions } = await ColumnModel.fetchByModule('download', column);
        if (!id && selectedOptions[selectedOptions.length-1]) {
            result.download.column = selectedOptions[selectedOptions.length-1];
        }
        result.options = options, result.selectedOptions = selectedOptions;
        ctx.success(result);
    }
    //保存
    static async save(ctx) {
        let download = ctx.request.body.download;
        let id = download._id;
        let column = download.column;
        // if (!id && !privileges(ctx, OPTIONS.ADD, column) || id && !privileges(ctx, OPTIONS.UPDATE, column)) return;
        // 浏览量和创建人 只用于显示，不参与保存操作
        delete download.pv;
        delete download.creater;
        if (!download) {
            console.log('参数传递错误！');
            ctx.errorArguments();
            return;
        }
        if (!download.title || !download.column || (!download.files || download.files.length == 0)) {
            console.log('有必填项未填，请检查！');
            ctx.errorMsg('有必填项未填，请检查！');
            return;
        }
        if (await DownloadModel.findByTitle(download.title, id)) {
            console.log('已存在相同的标题！');
            ctx.errorMsg('已存在相同的标题！');
            return;
        }
        if (id) {
            let _download = await DownloadModel.findById(id);
            download = _.assign(_download, download);
            download.meta.updater = ctx.uid;
        } else {
            delete download._id;
            console.log(download)
            download = new DownloadModel(download);
            download.meta.creater = ctx.uid;
        }
        await download.save();
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
        
        await DownloadModel.listByPage(page);
        const { options, selectedOptions } = await ColumnModel.fetchByModule('download', query.column);
        page.options = options;
        page.selectedOptions = selectedOptions;
        page.list = page.list.map((item, index) => {
            return {
                column: item.column ? item.column.name : '',
                files: item.files,
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
        // let download = await DownloadModel.findById(id);
        // if (!privileges(ctx, OPTIONS.DELETE, download.column)) return;
        let id = ctx.params.id;
        let result = {};
        if (id) {
            if (!await DownloadModel.findById(id)) {
                ctx.errorMsg('该记录不存在或已删除！');
                return
            } else {
                let download = await DownloadModel.remove({_id: id});
                ctx.delSuccess();
                return;
            }
        }
        ctx.errorArguments();
    }

    // 前台接口
    static async showDownload(ctx) {
        const id = ctx.params.id;
        if (!id) return ctx.errorArguments();
        let result = {};
        result.download = await DownloadModel.findOne({_id: id});
        if (result.download) {
            const createAt = result.download.meta.createAt;
            result.download = {...result.download._doc, ...{createAt: result.download.createAt}};
            result.pre = await DownloadModel.findOne({'meta.createAt': {$lt: createAt}}, {title: 1}).sort('-meta.createAt');
            result.next = await DownloadModel.findOne({'meta.createAt': {$gt: createAt}}, {title: 1}).sort('meta.createAt');
        }
        ctx.success(result);
    }
    //分页查询，可指定 页面尺寸，目标页面，关键字过滤，按字段排序
    static async downloadList(ctx) {
        let query = ctx.request.query || {} ;
        query.searches = {}, query.filters = {};

        if (query.title) {
            query.searches.title = query.title;
        }
        if (query.column) {
            query.filters.column = await ColumnModel.fetchOffspringIds(query.column);
        }

        let page = new Page(query);
        
        await DownloadModel.listByPage(page);
        page.list = page.list.map((item, index) => {
            return {
                column: item.column ? item.column.name : '',
                // files: item.files,
                // content: item.content || '',
                createAt: item.createAt,
                creater: item.meta.creater ? item.meta.creater.name : '',
                pv: item.pv || 0,
                title: item.title || '',
                status: item.status,
                _id: item._id,
                filesCount: item.files.length,
            };
        });
        ctx.success(page);
    }
}

export default Download;