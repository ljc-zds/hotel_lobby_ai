# Google / GitHub 登录配置

登录页和注册页均提供两个 OAuth 入口，复用 Better Auth。未开启或凭据不完整时，点击仅显示暂未开通提示，不会发起授权。

在 `/admin/settings` 的 Auth 标签页分别填写 Google / GitHub 的 Client ID 和 Client Secret，并开启对应的 Enable auth 开关。密钥只保存在服务端配置，不进入公开接口。

OAuth 应用的回调地址必须与 `VITE_APP_URL` 一致：

- Google：`<VITE_APP_URL>/api/auth/callback/google`
- GitHub：`<VITE_APP_URL>/api/auth/callback/github`

本地默认 `VITE_APP_URL=http://localhost:3000`，因此回调地址分别为 `http://localhost:3000/api/auth/callback/google` 和 `http://localhost:3000/api/auth/callback/github`。使用相同的 `http://localhost:3000/sign-in` 入口测试；不要混用 localhost 和 127.0.0.1。

Google 的 JavaScript origin 填写 `http://localhost:3000`。正式上线后更换为正式域名，并更新提供方允许的回调地址。Google OAuth 应用若处于测试模式，将测试账户加入允许用户列表。

配置完成后测试：点击提供方、完成授权、返回站点、确认账户会话以及退出登录。正式站已配置两种提供方，并验证授权地址及正式域名回调；用户授权后的完整登录会话仍需真人账户验证。Google 应用已切换到 Production。
