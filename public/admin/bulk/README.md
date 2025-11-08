# 📦 Bulk Content Manager

批量管理工具 - 一次性删除多个内容，只产生一个 commit。

## 🚀 访问地址

```
https://lum-bio-mh2.pages.dev/admin/bulk/
```

或本地开发：
```
http://localhost:5173/admin/bulk/
```

## 🔑 认证方式

**使用 GitLab Personal Access Token（推荐）**

由于 OAuth 配置复杂，工具改用更简单的 Personal Access Token 方式：

1. 访问 [GitLab Personal Access Tokens](https://gitlab.com/-/profile/personal_access_tokens)
2. 点击 "Add new token"
3. 设置名称（如 "Bulk Manager"）
4. 选择 **api** scope
5. 点击 "Create personal access token"
6. 复制 token 并粘贴到批量管理工具

**优点：**
- ✅ 无需配置 OAuth App redirect_uri
- ✅ 更简单、更快速
- ✅ Token 可以随时撤销
- ✅ 可以设置过期时间

## ✨ 功能特性

### 已实现功能

- ✅ **GitLab OAuth 认证**：复用 Decap CMS 的 OAuth 配置
- ✅ **内容列表**：自动加载所有 folders、pages、images
- ✅ **批量选择**：复选框选择多个项目
- ✅ **搜索功能**：按文件名或文件夹搜索
- ✅ **类型筛选**：文件夹 / 页面 / 图片
- ✅ **文件夹筛选**：按文件夹分组查看
- ✅ **快速操作**：一键选择所有测试文件
- ✅ **批量删除**：一次性删除，生成一个 commit
- ✅ **响应式设计**：手机、平板、电脑都支持

### 使用流程

1. **登录**
   - 点击 "Login with GitLab"
   - 授权访问（首次使用需要授权）
   - 自动重定向回页面

2. **查找内容**
   - 使用搜索框搜索文件名
   - 使用筛选器按类型或文件夹过滤
   - 点击 "选择所有测试文件" 快速选中测试内容

3. **批量删除**
   - 勾选要删除的项目
   - 点击 "删除选中项目"
   - 确认删除
   - ✅ 完成！只产生一个 commit

## 🔧 技术细节

### 文件结构
```
public/admin/bulk/
├── index.html    # 页面结构和样式
├── app.js        # 核心功能实现
└── README.md     # 本文档
```

### API 使用

**GitLab API 端点：**
- `GET /api/v4/projects/:id/repository/tree` - 列出文件
- `GET /api/v4/projects/:id/repository/files/:path` - 读取文件内容
- `POST /api/v4/projects/:id/repository/commits` - 创建 commit（批量操作）

**认证：**
- 使用 OAuth PKCE 流程
- Token 存储在 localStorage
- 可以通过 "登出" 按钮清除

## 🚧 待完善功能（可交给 Codex）

### 优先级 1（核心功能）

1. **错误处理增强**
   - 网络错误重试
   - 更友好的错误提示
   - 权限不足的处理

2. **性能优化**
   - 大量文件时的分页加载
   - 虚拟滚动（100+ 项目时）

3. **批量操作确认**
   - 预览将要删除的内容
   - 显示依赖关系（如文件夹包含的内容）

### 优先级 2（用户体验）

4. **批量移动**
   - 将多个文件移动到另一个文件夹
   - 实现：修改 JSON/MD 文件中的 `folderId`

5. **批量编辑元数据**
   - 批量修改 tags
   - 批量修改 order
   - 批量修改 date

6. **撤销功能**
   - 记录最近的操作
   - 提供快速撤销（创建 revert commit）

7. **导出/导入**
   - 导出选中内容为 JSON
   - 批量导入内容

### 优先级 3（高级功能）

8. **操作历史**
   - 显示最近的批量操作
   - 链接到 GitLab commits

9. **预设筛选**
   - 保存常用的筛选条件
   - 快速切换（如 "本月新增"、"未分类"）

10. **批量上传**
    - 选择多张图片
    - 自动创建对应的 work items
    - 统一 commit

## 🐛 已知问题

1. **OAuth 限制**
   - GitLab OAuth 需要在同源下工作
   - 本地开发时需要配置 redirect_uri

2. **大文件列表**
   - 超过 100 个文件时可能加载较慢
   - 建议实现分页或虚拟滚动

3. **文件夹依赖**
   - 删除文件夹前需要检查是否有内容引用
   - 当前版本会同时显示，需手动检查

## 💡 开发建议

### 代码结构
- `app.js` 包含所有功能
- 使用原生 JavaScript（无框架依赖）
- 适合快速迭代和修改

### 扩展方向
1. 可以将功能模块化（auth.js, api.js, ui.js）
2. 可以添加 TypeScript 类型支持
3. 可以集成到主 React 应用

### 测试建议
1. 先在测试文件夹测试删除功能
2. 确认 commit 消息格式正确
3. 检查权限是否足够

## 📞 支持

如有问题或建议，请在 GitLab 创建 Issue。

---

**开发者备注：**
- 本工具是一个完整的原型
- 核心功能已实现且可用
- 后续可以根据需求逐步完善
