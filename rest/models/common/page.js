import _ from 'lodash';

const PAGE_SIZE = 10;
const DEAULT_PAGE = 1;
const Bar_SIZE = 5;

class Page {
    constructor(query) {
        this.currentPage = query.p || DEAULT_PAGE;
        this.previousPage = 0;
        this.nextPage = 0;
        this.totalCount = 0;
        this.totalPage = 0;
        this.firstPage = 1;
        this.lastPage = 0;
        this.barSize = Bar_SIZE;
        this.pageBar = [];
        this.pageSize = query.pSize || PAGE_SIZE;

        this.filters = query.filters;
        this.searches = query.searches;
        this.sortBy = query.sortBy;
        this.skip = 0;
        this.limit = 0;

        this.list = [];
        this.initPageInfo();
    }
    initPageInfo() {
        this.currentPage = _.parseInt(this.currentPage);
        this.pageSize = _.parseInt(this.pageSize);

        if (this.currentPage <= 0) {
            this.currentPage = 1;
        }
        if (this.pageSize <= 0) {
            this.pageSize = PAGE_SIZE;
        }

        this.skip = (this.currentPage - 1) * this.pageSize;
        this.limit = this.pageSize;
    }
    pageQuery(result, totalCount) {
        this.totalCount = totalCount;
        this.totalPage = _.ceil(this.totalCount / this.pageSize);
        this.totalPage = this.totalPage == 0 ? 1 : this.totalPage;
        this.lastPage = this.totalPage;
        if (this.currentPage > this.totalPage) {    // 如果指定页 大于 最大页，直接返回空的页面
            this.previousPage = this.nextPage = this.totalPage;
            delete this.filters;
            delete this.searches;
            return this;
        }
        let halfBarSize = _.ceil(this.barSize / 2);
        console.log(halfBarSize)
        if (this.barSize > this.totalPage) {
            for (let i = 1; i < this.totalPage+1; i++) {
                this.pageBar.push(i);
            }
        } else {
            if (this.currentPage <= halfBarSize) {
                for (let i = 1; i < this.barSize+1; i++) {
                    this.pageBar.push(i);
                }
            } else if (this.totalPage < (this.currentPage + halfBarSize)) {
                for (let i = this.totalPage - this.barSize + 1; i <= this.totalPage; i++) {
                    this.pageBar.push(i);
                }
            } else {
                for (let i = this.currentPage + halfBarSize - this.barSize; i < this.currentPage + halfBarSize; i++) {
                    this.pageBar.push(i);
                }
            }
        }
        this.previousPage = this.currentPage == 1 ? this.currentPage : this.currentPage - 1;
        this.nextPage = this.totalPage == this.currentPage ? this.currentPage : this.currentPage + 1;
        this.list = result;

        delete this.filters;
        delete this.searches;
        return this;
    }
}

export default Page;