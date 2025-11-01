# 使用官方 Node.js 运行时作为基础镜像
FROM node:24-alpine

# 设置工作目录
WORKDIR /app

# 复制 package.json
COPY package.json ./

# 安装 Node.js 依赖
RUN npm install && npm cache clean --force

# 复制应用程序代码
COPY server.js ./

# 创建非 root 用户
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# 更改文件所有者
RUN chown -R nodejs:nodejs /app
USER nodejs

# 暴露端口
EXPOSE 3000

# 启动应用
CMD ["npm", "start"]
