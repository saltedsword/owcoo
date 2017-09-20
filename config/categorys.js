const FRONT_BASEURL = 'http://localhost:8080';
const ADMIN_BASEURL = 'http://localhost:8080/admin';
// 可动态配置后台首页左侧边框菜单。但现在用不到，前台页面直接写死，如果后面要把 菜单纳入 权限管理的话 就用到了
const categorys = [
  {
    id: 'content',
    name: '内容',
    children: [
      {
        id: 'content_publish',
        name: '发布',
        url: `${ADMIN_BASEURL}/content/publish.html`
      },
      {
        id: 'content_manage',
        name: '管理',
        url: `${ADMIN_BASEURL}/content/manage.html`
      },
    ]
  },
  {
    id: 'settings',
    name: '设置',
    children: [
      {
        id: 'settings_webinfo',
        name: '网站基本信息',
        url: `${ADMIN_BASEURL}/settings/admin.html`
      },
      {
        id: 'settings_admin',
        name: '管理员',
        url: `${ADMIN_BASEURL}/settings/admin.html`
      },
      {
        id: 'settings_column',
        name: '栏目',
        url: `${ADMIN_BASEURL}/settings/admin.html`
      }
    ]
  }
];


export default categorys;