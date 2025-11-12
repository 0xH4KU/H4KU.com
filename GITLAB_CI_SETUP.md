# GitLab CI/CD 配置说明

本项目已配置 GitLab CI/CD 进行代码质量检查和构建验证。

## CI/CD Pipeline 结构

Pipeline 分为两个主要阶段：

### 1. Quality Gate
- `npm run lint`
- `npm run type-check`
- `npm run test:run`
- 失败会立即阻断后续步骤

### 2. Build & Artifact
- `npm run build:data`（保证 `_aggregated.json` 是最新的）
- `vite build`
- 上传 `dist/` 产物（保留 7 天，供 Cloudflare Pages 拉取）

## 环境变量设置

在 **Settings → CI/CD → Variables** 中添加：

| 变量 | 说明 |
| --- | --- |
| `VITE_EMAILJS_SERVICE_ID` | EmailJS 服务 ID |
| `VITE_EMAILJS_TEMPLATE_ID` | 模板 ID |
| `VITE_EMAILJS_PUBLIC_KEY` | 公钥 |

建议全部勾选 **Masked**，必要时设置为 **Protected**。

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

Cloudflare Pages 监听 `main` 分支的构建产物。保持以下配置：

| 项目 | 值 |
| --- | --- |
| Build command | `npm run build` |
| Output directory | `dist` |
| Environment | 同 CI 变量（EmailJS） |

## 查看 Pipeline 状态

- **Pipelines** 页面：查看所有 pipeline 运行记录
- **Jobs** 页面：查看单个任务的详细日志
- Merge Request 中会显示 CI 状态

## 故障排查

| 问题 | 处理 |
| --- | --- |
| Pipeline 未触发 | 确认 `.gitlab-ci.yml` 在仓库根目录、CI 功能已开启、推送的分支匹配触发规则。 |
| `build:data` 失败 | 检查 `src/content/` 中是否有无效 JSON；本地运行 `npm run build:data` 以复现。 |
| 缺少 EmailJS 凭证 | 确认变量在 GitLab 和 Cloudflare Pages 中均已设置。 |
| Cloudflare 404 | 确保 `public/_redirects` 被包含在 `dist/` 中。 |

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

确保上述命令全部通过后再推送代码，以保持 CI 绿色状态。
