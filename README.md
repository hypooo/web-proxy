# Web Proxy Server

一个支持 Docker 部署的 Node.js 代理服务器，可以将客户端请求转发到指定的目标 URL。

## 🌟 功能特性

- **简单易用**：直接使用原始 URL，无需编码
- **安全可靠**：内置安全头和错误处理
- **Docker 支持**：一键 Docker 部署
- **跨域支持**：自动处理 CORS 问题
- **健康检查**：内置服务状态监控
- **完整日志**：记录所有请求和响应

## 🚀 快速开始

### 方式一：使用部署脚本（推荐）

1. **部署服务**：
```bash
chmod +x deploy.sh
./deploy.sh
```

2. **访问服务**：
- 服务器地址：http://localhost:3000
- API 文档：http://localhost:3000/api
- 健康检查：http://localhost:3000/health

### 方式二：手动 Docker 部署

1. **构建镜像**：
```bash
docker-compose build
```

2. **启动服务**：
```bash
docker-compose up -d
```

3. **查看日志**：
```bash
docker-compose logs -f
```

4. **停止服务**：
```bash
docker-compose down
```

### 方式三：本地开发

1. **安装依赖**：
```bash
npm install
```

2. **启动开发服务器**：
```bash
npm run dev
```

## 📖 使用方法

### 基本用法

启动服务后，可以通过以下格式访问：

```
http://localhost:3000/proxy/[目标URL]
```

### 使用示例

1. **代理图片请求**：
```
http://localhost:3000/proxy/https://raw.githubusercontent.com/hypooo/files/refs/heads/main/2025-07/gpt-1747038609316.png
```

2. **代理 API 请求**：
```
http://localhost:3000/proxy/https://api.github.com/users/octocat
```

3. **代理网页内容**：
```
http://localhost:3000/proxy/https://example.com
```

### API 端点

| 端点 | 方法 | 描述 |
|------|------|------|
| `/` | GET | 服务信息 |
| `/api` | GET | API 使用文档 |
| `/health` | GET | 健康检查 |
| `/proxy/*` | GET | 代理请求入口 |

## 🔧 配置说明

### 环境变量

复制 `.env.example` 到 `.env` 并根据需要修改：

```bash
# 服务端口
PORT=3000

# 运行环境
NODE_ENV=production

# 日志级别
LOG_LEVEL=info

# 请求超时时间（毫秒）
REQUEST_TIMEOUT=30000

# 最大请求大小
MAX_REQUEST_SIZE=50mb
```

### Docker Compose 配置

`docker-compose.yml` 中的主要配置：

- **端口映射**：`3000:3000`
- **重启策略**：`unless-stopped`
- **健康检查**：每30秒检查一次
- **网络隔离**：使用独立的 bridge 网络

## 🛠️ 开发指南

### 项目结构

```
├── package.json          # 项目依赖和脚本
├── server.js             # 主服务器文件
├── Dockerfile            # Docker 构建文件
├── docker-compose.yml    # Docker Compose 配置
├── .dockerignore         # Docker 忽略文件
├── .env.example          # 环境变量示例
├── deploy.sh             # 自动化部署脚本
└── README.md             # 项目说明文档
```

### 核心功能

- **代理中间件**：使用 `http-proxy-middleware` 处理请求转发
- **安全防护**：使用 `helmet` 设置安全头
- **跨域处理**：使用 `cors` 处理跨域请求
- **错误处理**：全局异常捕获和响应

### 自定义开发

1. **添加新的代理选项**：
   修改 `server.js` 中的 `createProxyMiddleware` 配置

2. **添加请求验证**：
   在代理前添加自定义验证逻辑

3. **修改日志格式**：
   调整日志中间件的输出格式

## 📋 故障排除

### 常见问题

1. **端口冲突**：
   ```bash
   # 修改 docker-compose.yml 中的端口映射
   ports:
     - "3001:3000"  # 映射到 3001 端口
   ```

2. **Docker 构建失败**：
   ```bash
   # 清理 Docker 缓存
   docker system prune -a
   docker-compose build --no-cache
   ```

3. **代理请求失败**：
   - 检查目标 URL 是否可访问
   - 查看服务器日志：`docker-compose logs web-proxy`
   - 确认请求格式正确

### 调试命令

```bash
# 查看容器状态
docker-compose ps

# 查看实时日志
docker-compose logs -f web-proxy

# 进入容器调试
docker-compose exec web-proxy sh

# 测试健康检查
curl http://localhost:3000/health
```

## 🔒 安全注意事项

- **仅代理信任的 URL**：建议在生产环境中验证目标 URL
- **设置请求限制**：根据需要配置请求大小和超时时间
- **监控访问日志**：定期检查访问记录，及时发现异常
- **更新依赖包**：定期更新 Node.js 依赖包以修复安全漏洞

## 📝 许可证

MIT License - 详见 LICENSE 文件

## 🤝 贡献

欢迎提交 Issues 和 Pull Requests！

## 📞 支持

如果遇到问题，请通过以下方式联系：

- 查看项目文档
- 检查服务器日志
- 提交 Issue

---

**Made with ❤️ by AI Assistant**