import { ColumnModel } from '../rest/models/index';
import ls from '../rest/utils/lodashit';
describe('测试拷贝方法', () => {
  it('看是否能按要求拷贝', (done) => {
    let column = new ColumnModel().toObject();
    // console.log('之前：' + column)
    // let source = {
    //     name: 'xxxxx',
    //     display: 3,
    //     'meta.createAt': '1999-10-10',
    //     sortBy: 'name_desc'
    // };
    // column = ls.copy(source, column)
    // console.log('之后：')
    for (let key in column) {
        console.log('key:'+key+'  value:'+column[key])
    }
    done()
  });
});