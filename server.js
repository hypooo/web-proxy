const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const https = require('https');
const http = require('http');
const { URL } = require('url');
require('dotenv').config();

const app = express();
const PORT = 3000;

// 中间件配置
app.use(helmet()); // 安全头
app.use(cors()); // 跨域支持
app.use(express.json()); // JSON解析

// 日志中间件
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
    next();
});

// 代理路由处理 - 直接代理模式
app.get('/proxy/*', (req, res) => {
    // 从完整URL中提取目标URL
    // 去掉 /proxy/ 前缀，保留完整的URL包括查询参数
    const fullOriginalUrl = req.originalUrl;
    const pathAfterProxy = fullOriginalUrl.replace(/^\/proxy\//, '');
    const targetUrl = pathAfterProxy || req.params[0];
    
    console.log(`代理请求: ${targetUrl}`);
    
    if (!targetUrl) {
        return res.status(400).json({
            error: '缺少目标URL参数',
            originalUrl: fullOriginalUrl,
            usage: '/proxy/[目标URL]'
        });
    }

    // 验证URL格式
    let parsedUrl;
    try {
        // 如果 targetUrl 不是完整的 URL，尝试添加协议
        let urlToTest = targetUrl;
        if (!targetUrl.startsWith('http://') && !targetUrl.startsWith('https://')) {
            urlToTest = 'https://' + targetUrl;
        }
        
        parsedUrl = new URL(urlToTest);
        
        // 确保协议是 http 或 https
        if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
            throw new Error('只支持 HTTP 和 HTTPS 协议');
        }
    } catch (error) {
        console.log('URL解析错误:', error.message);
        return res.status(400).json({
            error: '目标URL格式无效',
            originalUrl: targetUrl,
            message: error.message,
            suggestion: '确保URL以 http:// 或 https:// 开头'
        });
    }

    // 手动处理代理请求
    const targetUrlObj = new URL(targetUrl);
    const protocol = targetUrlObj.protocol === 'https:' ? https : http;
    
    const options = {
        hostname: targetUrlObj.hostname,
        port: targetUrlObj.port || (targetUrlObj.protocol === 'https:' ? 443 : 80),
        path: targetUrlObj.pathname + targetUrlObj.search,
        method: req.method,
        timeout: 30000, // 30秒超时
        headers: {
            'User-Agent': 'Web-Proxy-Server/1.0',
            'Accept': '*/*',
            'Accept-Encoding': 'gzip, deflate, br',
            'Connection': 'keep-alive'
        }
    };

    // 对于HTTPS请求，禁用证书验证（仅用于GitHub等可信站点）
    if (targetUrlObj.protocol === 'https:') {
        options.rejectUnauthorized = false;
    }

    const proxyReq = protocol.request(options, (proxyRes) => {
        // 检查响应状态
        if (proxyRes.statusCode >= 300 && proxyRes.statusCode < 400 && proxyRes.headers.location) {
            console.log(`重定向到: ${proxyRes.headers.location}`);
        }
        
        // 转发响应头
        res.writeHead(proxyRes.statusCode, proxyRes.headers);
        
        // 转发响应体
        proxyRes.pipe(res);
        
        console.log(`代理响应: ${proxyRes.statusCode} - ${targetUrl}`);
    });

    proxyReq.on('error', (err) => {
        console.error('代理错误:', err.code, err.message);
        
        // 提供更详细的错误信息
        let errorMessage = err.message;
        let statusCode = 502;
        
        if (err.code === 'ENOTFOUND') {
            errorMessage = '无法解析域名';
            statusCode = 502;
        } else if (err.code === 'ECONNREFUSED') {
            errorMessage = '连接被拒绝';
            statusCode = 502;
        } else if (err.code === 'ETIMEDOUT' || err.code === 'ESOCKETTIMEDOUT') {
            errorMessage = '连接超时';
            statusCode = 504;
        } else if (err.code === 'CERT_HAS_EXPIRED') {
            errorMessage = 'SSL证书已过期';
            statusCode = 502;
        } else if (err.message.includes('TLS')) {
            errorMessage = 'TLS连接失败';
        }
        
        res.status(statusCode).json({
            error: '代理请求失败',
            message: errorMessage,
            code: err.code,
            targetUrl: targetUrl,
            suggestion: '请检查目标URL是否可访问，或稍后重试'
        });
    });

    proxyReq.on('timeout', () => {
        console.error('代理请求超时');
        proxyReq.destroy();
        res.status(504).json({
            error: '代理请求超时',
            message: '请求时间超过30秒',
            targetUrl: targetUrl
        });
    });

    // 转发请求体
    if (req.method !== 'GET' && req.method !== 'HEAD') {
        req.pipe(proxyReq);
    } else {
        proxyReq.end();
    }
});

// 健康检查端点
app.get('/health', (req, res) => {
    res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        service: 'Web Proxy Server'
    });
});

// API信息端点
app.get('/api', (req, res) => {
    res.json({
        service: 'Web Proxy Server',
        version: '1.0.0',
        endpoints: {
            health: '/health',
            proxy: '/proxy/[编码后的目标URL]',
            api: '/api'
        },
        usage: {
            example: '/proxy/https://raw.githubusercontent.com/hypooo/files/refs/heads/main/2025-07/gpt-1747038609316.png',
            note: '直接使用原始URL即可'
        }
    });
});

// 根路径
app.get('/', (req, res) => {
    res.json({
        message: 'Web Proxy Server 正在运行',
        docs: '/api',
        health: '/health'
    });
});

// 404处理
app.use('*', (req, res) => {
    res.status(404).json({
        error: '端点未找到',
        availableEndpoints: ['/', '/health', '/api', '/proxy/*']
    });
});

// 全局错误处理
app.use((err, req, res, next) => {
    console.error('服务器错误:', err);
    res.status(500).json({
        error: '服务器内部错误',
        message: err.message
    });
});

// 启动服务器
app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Web Proxy Server 启动成功!`);
    console.log(`📍 服务器地址: http://0.0.0.0:${PORT}`);
    console.log(`📖 API文档: http://localhost:${PORT}/api`);
    console.log(`❤️  健康检查: http://localhost:${PORT}/health`);
    console.log(`🔗 代理使用: http://localhost:${PORT}/proxy/[编码后的URL]`);
});

// 优雅关闭
process.on('SIGTERM', () => {
    console.log('收到 SIGTERM 信号，正在关闭服务器...');
    process.exit(0);
});

process.on('SIGINT', () => {
    console.log('收到 SIGINT 信号，正在关闭服务器...');
    process.exit(0);
});