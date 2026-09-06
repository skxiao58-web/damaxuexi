# Nightfall Strike · 重制版 — 变更说明

相对原始 `nightfall/` 粘贴版，本目录做了这些调整：

- **拆分加载**：`index.html` 只引入 `boot.js`；Three.js 与玩法逻辑分离。
- **多源回退**：`boot.js` 依次尝试 jsDelivr → unpkg → 本地 `vendor-three-170.js`。
- **导出初始化**：`game.js` 导出 `async function init(THREE, ui)`，由 boot 注入 UI 元素。
- **可读结构**：按区块注释划分（场景、灯光、建筑、掩体、载具、小队、烟雾、直升机、音频、主循环等），语句换行，而非整文件一行。
- **移动端减负**：粗指针或宽度 < 900 时，每侧建筑 8（原 15）、碎片 80（原 300）、烟雾 25（原 60）。
- **阴影默认关闭**：`shadowMap.enabled` 默认 false（移动端也关闭），提高稳定性。
- **UI 让出一帧**：WebGLRenderer 创建成功后按钮显示「场景生成中…」，`await` 微任务后再继续构建。
- **不自动开局**：场景就绪后按钮为「开始行动」/ 状态「就绪」，需点击才 `reset()`。
- **状态行**：菜单按钮下使用 `<p id="status" class="sound">`，加载过程可更新文案。
- **错误处理**：boot / init 均 try/catch，失败时启用 `#error` 并禁用开始按钮。
- **无 query 缓存戳**：不再使用 `?v=` 形式的 import。
- **仅本地文件**：不推送 GitHub。
