# 阿里云 Docker 部署说明

本文档说明如何把 Remote Job Bot 部署到阿里云 ECS，并以 Docker 一次性任务容器方式持续监控。

## 运行方式

- Docker 镜像内置 Node.js、pnpm、Chromium 和中文字体。
- 容器每次启动只执行一次 `pnpm start`，抓取、推送、保存后退出。
- 阿里云 ECS 通过宿主机 `cron` 每 4 小时触发一次容器。
- `flock` 用于避免上一轮任务未结束时重复启动。

## 服务器准备

1. 准备一台 Linux ECS。
2. 安装 Docker Engine 和 Docker Compose 插件。
3. 确认服务器可以访问 Supabase、目标招聘网站和 Telegram Bot API。
4. 如果使用中国大陆区域 ECS，Telegram 访问可能受网络限制，需要先确认网络出口可用。

## 部署目录

示例部署目录：

```bash
/opt/remote-job
```

在服务器上准备目录：

```bash
mkdir -p /opt/remote-job/logs /opt/remote-job/debug
```

将项目代码放到 `/opt/remote-job` 后进入目录：

```bash
cd /opt/remote-job
```

## 环境变量

复制环境变量模板：

```bash
cp .env.example .env
```

编辑 `.env`：

```env
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
TELEGRAM_TOKEN=your_telegram_bot_token
TELEGRAM_CHAT_ID=your_chat_id
NODE_ENV=production
LOCAL=false
CHROME_EXECUTABLE_PATH=/usr/bin/chromium
TZ=Asia/Shanghai
```

`.env` 不应提交到 Git。

## BOSS 直聘 Cookie

BOSS 爬虫会读取项目根目录的 `cookies.json`。如果需要启用 BOSS 数据源：

1. 在服务器项目根目录放置 `cookies.json`。
2. 编辑 `docker-compose.yml`，取消下面这一行注释：

```yaml
- ./cookies.json:/app/cookies.json:ro
```

如果没有 `cookies.json`，BOSS 爬虫会跳过或失败，但其他数据源仍可继续运行。

## 构建镜像

```bash
docker compose build
```

## 手动验证

先手动执行一次：

```bash
docker compose run --rm remote-job
```

如果看到抓取日志、Telegram 推送日志或“无新增岗位”等输出，说明容器任务可以运行。

## 配置持续监控

编辑 crontab：

```bash
crontab -e
```

添加默认每 4 小时执行一次的任务：

```cron
0 */4 * * * cd /opt/remote-job && flock -n /tmp/remote-job.lock docker compose run --rm remote-job >> /opt/remote-job/logs/cron.log 2>&1
```

可按需调整频率：

```cron
*/30 * * * *   # 每 30 分钟
0 */2 * * *    # 每 2 小时
0 9,18 * * *   # 每天 9 点和 18 点
```

## 查看日志

```bash
tail -n 200 /opt/remote-job/logs/cron.log
```

实时查看：

```bash
tail -f /opt/remote-job/logs/cron.log
```

## 更新部署

代码更新后重新构建镜像：

```bash
cd /opt/remote-job
docker compose build
docker compose run --rm remote-job
```

确认手动执行正常后，cron 会继续按原频率触发。

## 常见问题

### Telegram 发送失败

先确认 `TELEGRAM_TOKEN` 和 `TELEGRAM_CHAT_ID` 正确。如果阿里云 ECS 无法访问 Telegram Bot API，需要先解决服务器网络出口问题。

### Chromium 启动失败

确认 `.env` 中的路径为：

```env
CHROME_EXECUTABLE_PATH=/usr/bin/chromium
```

Docker 镜像已安装 Chromium。不要在容器内使用本地 macOS Chrome 路径。

### 上一次任务没结束又触发

crontab 示例已使用 `flock -n /tmp/remote-job.lock`，同一时间只允许一个任务运行。
