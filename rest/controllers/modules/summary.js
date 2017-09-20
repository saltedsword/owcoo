'use strict';
import { Page, SummaryModel, CodelistModel, ColumnModel } from '../../models/index';
import _ from 'lodash';

class Summary {
    //保存初始化
    static async saveInit(ctx) {
        const id = ctx.params.id;
        const c = ctx.query.c;
        const result = {};

        if (id) {
            result.summary = await SummaryModel.findOne({_id: id}, {meta: 0, __v: 0});
        }

        const column = (id && result.summary) ? result.summary.column : (c || null);
        const { options, selectedOptions } = await ColumnModel.fetchByModule('summary', column);
        result.options = options, result.selectedOptions = selectedOptions;
        ctx.success(result);
    }
    //保存
    static async save(ctx) {
        let summary = ctx.request.body.summary;
        console.log(summary)
        let id = summary._id;
        if (!summary) {
            console.log('参数传递错误！');
            ctx.errorArguments();
            return;
        }
        if (!summary.content) {
            console.log('有必填项未填，请检查！');
            ctx.errorMsg('有必填项未填，请检查！');
            return;
        }
        if (id) {
            let _summary = await SummaryModel.findById(id);
            summary = _.assign(_summary, summary);
            summary.meta.updater = ctx.uid;
            summary = await summary.save();
        } else {
            delete summary._id;
            summary = new SummaryModel(summary);
            summary.meta.creater = ctx.uid;
            summary = await summary.save();
        }
        ctx.successMsg('保存成功！');
    }
    //分页查询，可指定 页面尺寸，目标页面，关键字过滤，按字段排序
    static async listByPage(ctx) {
        let query = ctx.request.query || {} ;
        query.searches = {}, query.filters = {};
        if (query.column) {
            query.filters.column = await ColumnModel.fetchOffspringIds(query.column);
        }

        let page = new Page(query);
        
        await SummaryModel.listByPage(page);
        const { options, selectedOptions } = await ColumnModel.fetchByModule('summary', query.column);
        page.options = options;
        page.selectedOptions = selectedOptions;
        page.list = page.list.map((item, index) => {
            return {
                column: item.column ? item.column.name : '',
                _id: item._id
            };
        });
        ctx.success(page);
    }

    // 前台接口
    static async showSummary(ctx) {
        const id = ctx.params.id;
        if (!id) return ctx.errorArguments();
        let result = {};
        result.summary = await SummaryModel.findOne({column: id}, {meta: 0, __v: 0}).populate('column', 'name');
        ctx.success(result);
    }
    
}

export default Summary;