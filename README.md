# DSH Desktop

把 [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness)（`dsh`）的网页端独立成一个桌面应用——一个 Electron 壳子，加载本机 `http://127.0.0.1:3080` 的 dsh 界面，让你从"开浏览器敲网页"变成"双击图标直接进桌面端"。

## 功能

- **独立窗口**：无浏览器边框/地址栏，就是干净的 dsh 聊天界面
- **系统托盘**：点关闭按钮 = 缩到右下角托盘不退出；托盘图标单击/双击恢复窗口
- **开机自启**：托盘右键菜单可勾选，启动后先静默藏托盘
- **自动拉起 dsh 服务**：启动时检测 3080 端口，没跑就自动 `dsh web` 拉起来
- **单实例**：重复双击只聚焦已有窗口

## 目录

```
main.js        # 主进程: 窗口 + 托盘 + 开机自启 + 自动拉起 dsh
package.json   # 依赖与 electron-builder 配置
icon.png/ico   # 应用图标
gen_icon.py    # 图标生成脚本(Pillow)
```

## 构建

```bash
npm install
npm run build            # 打包单文件便携版 dist/DeepSeek聊天-*.exe
# 或
npx electron-builder --dir   # 打包成目录(win-unpacked)
```

## 备注

- 打包时 `signAndEditExecutable` 设为 `false`（Windows 上 winCodeSign 解压需要符号链接权限，绕过）。已安装版的 exe 图标可用缓存里的 `rcedit-x64.exe` 手动写入；便携版(NSIS 自解压)不要用 rcedit 改，会损坏。
- 要求本机已装 `dsh` 并能 `dsh web` 启动；本程序只是壳子，不带模型。
