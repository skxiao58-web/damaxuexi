# damaxuexi

超简单的 Hello 网页练手项目：问候、冷知识、主题切换、流星射击、「学习踩坑」动画短片，以及 Three.js 夜间战区电影运镜页。

## 怎么打开

下载后用浏览器直接打开 `index.html`（不用 localhost）。

同层需要：`index.html`、`styles.css`、`app.js`、`fps.html`、`fps.js`，以及 `story/learning-journey.mp4`。

## 小游戏

- 点击画布或空格开火
- 鼠标/手指移动飞船
- 打掉下落的球得分，漏掉扣生命

## 学习日记视频

页面里的「学习日记 · 动画短片」回顾了：localhost 打不开、点错 css/js、文件名中文、免费档限制、Token 权限等坑和解决办法。

## 夜间战区（Three.js）

打开 `fps.html`（或首页按钮「夜间战区 · Three.js」）观看约 30 秒雾夜废墟街道电影运镜：小队推进、爆炸与枪口闪光、低空直升机掠过。页面自包含脚本，需联网加载 Three.js r128 CDN。

Pages 示例：https://skxiao58-web.github.io/damaxuexi/fps.html


## Nightfall Strike

打开 `nightfall/` 或首页入口：可交互 30 秒夜间突袭（空格第一人称，按住射击）。需联网加载 Three.js。

Pages：https://skxiao58-web.github.io/damaxuexi/nightfall/

## Nightfall Strike（rework）

打开 `nightfall-rework/`：稳定多 CDN 启动的 Nightfall Strike 重制版（本地 vendor Three.js r170 回退）。

Pages：https://skxiao58-web.github.io/damaxuexi/nightfall-rework/


## 电影级序列 Demo

打开 `cinematic-demo.html`（或首页按钮「电影级序列 Demo」）：约 30 秒军事电影运镜，经典 script 加载 Three.js r128（优先本地 `nightfall-rework/three.min.js`），无 PointerLock，音效失败静默继续。

Pages：https://skxiao58-web.github.io/damaxuexi/cinematic-demo.html


## AAA FPS Demo with Sound

打开 `fps-sound.html`（或首页按钮「AAA FPS · 带音效」）：约 30 秒军事电影序列，经典 script 加载 Three.js r128（优先本地），无 PointerLock；点击开音（程序合成音效，远程 mp3 软失败不挡画面）。

Pages：https://skxiao58-web.github.io/damaxuexi/fps-sound.html


## 迷你选股表达式引擎

打开 `mini_stock_engine.html`：纯前端迷你选股表达式引擎（CODELIKE / BARSLAST 等）+ 12 项自测。源自 WorkBuddy 硬核代码压力测试产物。

Pages：https://skxiao58-web.github.io/damaxuexi/mini_stock_engine.html
