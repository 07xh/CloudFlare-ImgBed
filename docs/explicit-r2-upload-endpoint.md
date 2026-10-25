# 独立 R2 上传入口（不迁移坚果云图片）

图床原有 `/upload` 与 WebDAV（坚果云）渠道保持不变。新增：

- **方法：** `POST /upload/r2`
- **表单：** `multipart/form-data`，必须有 `file` 字段
- **常用参数：** `?returnFormat=full&uploadFolder=blog`
- **上传凭据：** 沿用原 `/upload` 的用户权限认证；不能匿名绕过权限
- **存储：** 强制 Cloudflare R2；该路由自动设置 `uploadChannel=cfr2&autoRetry=false`，忽略客户端提供的其他 `uploadChannel`、`channelName`
- **返回与访问：** 与原上传接口一致，例如 `/file/<图片ID>` 或 `returnFormat=full` 的完整地址。

## 上线前必须手动完成

1. 在部署图床的 Cloudflare Pages / Workers 项目里，创建或选择 R2 存储桶，并绑定变量名 **`img_r2`**。这是现有代码真正读取的绑定名；没有绑定时上传会失败。
2. 确保图床原来的图片索引数据库（例如 `img_url` 的 KV 或已配置的数据库）仍能读取和写入；新路由不会建立第二份元数据库。
3. 在图床后台确认 **R2 上传渠道已启用**。若使用公开 R2 地址，可设置 R2 渠道的 `publicUrl`，但不要把存储 API Token 直接写进前端。
4. 用有上传权限的账号，上传一张无敏感内容的小图片到 `/upload/r2?returnFormat=full`，打开返回的 `/file/图片ID` 检查访问。
5. 原有坚果云 WebDAV 图片不需要迁移或删除。历史对象继续依据数据库中记录的渠道读取。删除旧 WebDAV 凭据可能让历史图片不可读取。

**失败行为：** 独立 R2 接口上传失败时只返回错误，不会将文件偷偷回退存到坚果云、Telegram 或其他渠道。原有 `/upload` 的渠道选择和自动重试策略未改变。

**部署说明：** 仓库 PR / GitHub CI 成功仅证明代码和构建；还不能证明 Cloudflare 生产环境已部署，也不能证明绑定或线上图片读写已通过。
