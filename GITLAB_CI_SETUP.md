# GitLab CI/CD 配置说明

本项目已配置 GitLab CI/CD 进行代码质量检查和构建验证。

## CI/CD Pipeline 结构

Pipeline 包含两个阶段：

### 1. Lint and Test Stage
- 代码风格检查（ESLint）
- TypeScript 类型检查
- 代码格式检查（Prettier）
- 单元测试运行

### 2. Build Stage
- 同步图片资源
- 生产环境构建
- 保存构建产物（7天）

## 环境变量设置

需要在 GitLab 项目中设置以下环境变量：

进入：**Settings** → **CI/CD** → **Variables**

添加以下变量：
- `VITE_EMAILJS_SERVICE_ID`
- `VITE_EMAILJS_TEMPLATE_ID`
- `VITE_EMAILJS_PUBLIC_KEY`

**注意**：这些变量应该设置为 **Masked** 和 **Protected**（可选）

## 触发 Pipeline

Pipeline 会在以下情况自动触发：
- 推送到 `main` 分支
- 推送到 `develop` 分支
- 创建 Merge Request

## 手动触发

如需手动触发 pipeline：
1. 进入 **Build** → **Pipelines**
2. 点击 **Run pipeline**
3. 选择目标分支
4. 点击 **Run pipeline**

## Cloudflare Pages 部署

Cloudflare Pages 会在 GitLab CI 之后自动部署（external stage）。

部署配置：
- Build command: `npm run build`
- Build output: `dist`
- 环境变量也需要在 Cloudflare Pages 设置中配置

## 查看 Pipeline 状态

- **Pipelines** 页面：查看所有 pipeline 运行记录
- **Jobs** 页面：查看单个任务的详细日志
- Merge Request 中会显示 CI 状态

## 故障排查

### Pipeline 未运行
- 检查 **Settings** → **General** → **Visibility** 中 CI/CD 是否启用
- 检查 `.gitlab-ci.yml` 文件是否存在于仓库根目录
- 检查分支名称是否匹配（main/develop）

### 构建失败
- 查看 Job 日志获取详细错误信息
- 检查环境变量是否正确设置
- 确认依赖安装成功

## 本地测试

在推送前本地运行 CI 检查：

```bash
# 运行 linter
npm run lint

# 运行类型检查
npm run type-check

# 运行格式检查
npm run format:check

# 运行构建
npm run build
```

确保所有命令都成功后再推送代码。
