# Live2D Widget

![](https://forthebadge.com/images/badges/built-with-love.svg)
![](https://forthebadge.com/images/badges/made-with-typescript.svg)
![](https://forthebadge.com/images/badges/uses-css.svg)
![](https://forthebadge.com/images/badges/contains-cat-gifs.svg)
![](https://forthebadge.com/images/badges/powered-by-electricity.svg)
![](https://forthebadge.com/images/badges/makes-people-smile.svg)

[English](README.en.md)

## 特性

- 在网页中添加 Live2D 看板娘
- 轻量级，除 Live2D Cubism Core 外无其他运行时依赖
- 核心代码由 TypeScript 编写，易于集成

<img src="demo/screenshots/screenshot-2.png" width="280"><img src="demo/screenshots/screenshot-3.png" width="280"><img src="demo/screenshots/screenshot-1.png" width="270">

*注：以上人物模型仅供展示之用，本仓库并不包含任何模型。*

你也可以查看示例网页：

- 在 [米米的博客](https://zhangshuqiao.org) 的左下角可查看效果
- [demo/demo.html](https://live2d-widget.pages.dev/demo/demo)，展现基础功能
- [demo/login.html](https://live2d-widget.pages.dev/demo/login)，仿 NPM 的登陆界面

## 使用

如果你是小白，或者只需要最基础的功能，那么只用将这一行代码加入 html 页面的 `head` 或 `body` 中，即可加载看板娘：

```html
<script src="https://fastly.jsdelivr.net/npm/live2d-widgets@1.0.0/dist/autoload.js"></script>
```

添加代码的位置取决于你的网站的构建方式。例如，如果你使用的是 [Hexo](https://hexo.io)，那么需要在主题的模版文件中添加以上代码。对于用各种模版引擎生成的页面，修改方法类似。  
如果网站启用了 PJAX，由于看板娘不必每页刷新，需要注意将该脚本放到 PJAX 刷新区域之外。

**但是！我们强烈推荐自己进行配置，让看板娘更加适合你的网站！**  
如果你有兴趣自己折腾的话，请看下面的详细说明。

## 配置

你可以对照 `dist/autoload.js` 的源码查看可选的配置项目。`autoload.js` 会自动加载两个文件：`waifu.css` 和 `waifu-tips.js`。`waifu-tips.js` 会创建 `initWidget` 函数，这就是加载看板娘的主函数。`initWidget` 函数接收一个 Object 类型的参数，作为看板娘的配置。以下是配置选项：

| 选项 | 类型 | 默认值 | 说明 |
| - | - | - | - |
| `waifuPath` | `string` | `https://fastly.jsdelivr.net/npm/live2d-widgets@1/dist/waifu-tips.json` | 看板娘资源路径，可自行修改 |
| `cdnPath` | `string` | `https://fastly.jsdelivr.net/gh/fghrsh/live2d_api/` | CDN 路径 |
| `cubism2Path` | `string` | `https://fastly.jsdelivr.net/npm/live2d-widgets@1/dist/live2d.min.js` | Cubism 2 Core 路径 |
| `cubism5Path` | `string` | `https://cubism.live2d.com/sdk-web/cubismcore/live2dcubismcore.min.js` | Cubism 5 Core 路径 |
| `modelId` | `number` | `0` | 默认模型 id |
| `tools` | `string[]` | 见 `autoload.js` | 加载的小工具按钮 |
| `drag` | `boolean` | `false` | 支持拖动看板娘 |
| `logLevel` | `string` | `error` | 日志等级，支持 `error`，`warn`，`info`，`trace` |

## 模型仓库

本仓库中并不包含任何模型，需要单独配置模型仓库，并通过 `cdnPath` 选项进行设置。  
旧版本的 `initWidget` 函数支持 `apiPath` 参数，这要求用户自行搭建后端，可以参考 [live2d_api](https://github.com/fghrsh/live2d_api)。后端接口会对模型资源进行整合并动态生成 JSON 描述文件。自 1.0 版本起，相关功能已通过前端实现，因此不再需要专门的 `apiPath`，所有模型资源都可通过静态方式提供。只要存在 `model_list.json` 和模型对应的 `textures.cache`，即可支持换装等功能。

## 开发

如果以上「配置」部分提供的选项还不足以满足你的需求，那么你可以自己进行修改。本仓库的目录结构如下：

- `src` 目录下包含了各个组件的 TypeScript 源代码，例如按钮和对话框等；
- `build` 目录下包含了基于 `src` 中源代码构建后的文件（请不要直接修改！）；
- `dist` 目录下包含了进一步打包后网页直接可用的文件，其中：
  - `autoload.js` 用于自动加载其它资源，例如样式表等；
  - `waifu-tips.js` 是由 `build/waifu-tips.js` 自动打包生成的，不建议直接修改；
  - `waifu.css` 是看板娘的样式表；
  - `waifu-tips.json` 中定义了触发条件（`selector`，CSS 选择器）和触发时显示的文字（`text`）。  
    `waifu-tips.json` 中默认的 CSS 选择器规则是对 Hexo 的 [NexT 主题](https://github.com/next-theme/hexo-theme-next) 有效的，为了适用于你自己的网页，可能需要自行修改，或增加新内容。  
    **警告：`waifu-tips.json` 中的内容可能不适合所有年龄段，或不宜在工作期间访问。在使用时，请自行确保它们是合适的。**

要在本地部署本项目的开发测试环境，你需要安装 Node.js 和 npm，然后执行以下命令：

```bash
git clone https://github.com/stevenjoezhang/live2d-widget.git
npm install
```

如果需要使用 Cubism 3 及更新的模型，请单独下载并解压 Cubism SDK for Web 到 `src` 目录下，例如 `src/CubismSdkForWeb-5-r.4`。受 Live2D 许可协议（包括 Live2D Proprietary Software License Agreement 和 Live2D Open Software License Agreement）限制，本项目无法包含 Cubism SDK for Web 的源码。  
如果只需要使用 Cubism 2 版本的模型，可以跳过此步骤。本仓库使用的代码满足 Live2D 许可协议中 Redistributable Code 相关条款。  
完成后，使用以下命令进行编译和打包。

```bash
npm run build
```

`src` 目录中的 TypeScript 代码会被编译到 `build` 目录中，`build` 目录中的代码会被进一步打包到 `dist` 目录中。  
为了能够兼容 Cubism 2 和 Cubism 3 及更新的模型，并减小代码体积，Cubism Core 及相关的代码会根据检测到的模型版本动态加载。

## 部署

在本地完成了修改后，你可以将修改后的项目部署在自己的服务器上，或者通过 CDN 加载。为了方便自定义有关内容，可以把这个仓库 Fork 一份，然后把修改后的内容通过 git push 到你的仓库中。

### 使用 jsDelivr CDN

如果要通过 jsDelivr 加载 Fork 后的仓库，使用方法对应地变为

```html
<script src="https://fastly.jsdelivr.net/gh/username/live2d-widget@latest/autoload.js"></script>
```

将此处的 `username` 替换为你的 GitHub 用户名。为了使 CDN 的内容正常刷新，需要创建新的 git tag 并推送至 GitHub 仓库中，否则此处的 `@latest` 仍然指向更新前的文件。此外 CDN 本身存在缓存，因此改动可能需要一定的时间生效。

### 使用 Cloudflare Pages

也可以使用 Cloudflare Pages 来部署。在 Cloudflare Pages 中创建一个新的项目，选择你 Fork 的仓库。接下来，设置构建命令为 `npm run build`。完成后，Cloudflare Pages 会自动构建并部署你的项目。

### Self-host

你也可以直接把这些文件放到服务器上，而不是通过 CDN 加载。

- 可以把修改后的代码仓库克隆到服务器上，或者通过 `ftp` 等方式将本地文件上传到服务器的网站的目录下；
- 如果你是通过 Hexo 等工具部署的静态博客，请把本项目的代码放在博客源文件目录下（例如 `source` 目录）。重新部署博客时，相关文件就会自动上传到对应的路径下。为了避免这些文件被 Hexo 插件错误地修改，可能需要设置 `skip_render`。

这样，整个项目就可以通过你的域名访问了。不妨试试能否正常地通过浏览器打开 `autoload.js` 和 `live2d.min.js` 等文件，并确认这些文件的内容是完整和正确的。  
一切正常的话，接下来修改 `autoload.js` 中的常量 `live2d_path` 为 `dist` 目录的 URL 即可。比如说，如果你能够通过

```
https://example.com/path/to/live2d-widget/dist/live2d.min.js
```

访问到 `live2d.min.js`，那么就把 `live2d_path` 的值修改为

```
https://example.com/path/to/live2d-widget/dist/
```

路径末尾的 `/` 一定要加上。  
完成后，在你要添加看板娘的界面加入

```html
<script src="https://example.com/path/to/live2d-widget/dist/autoload.js"></script>
```

就可以加载了。

## 鸣谢

<a href="https://www.browserstack.com/">
  <picture>
    <source media="(prefers-color-scheme: dark)" height="80" srcset="https://d98b8t1nnulk5.cloudfront.net/production/images/layout/logo-header.png?1469004780">
    <source media="(prefers-color-scheme: light)" height="80" srcset="https://live.browserstack.com/images/opensource/browserstack-logo.svg">
    <img alt="BrowserStack Logo" height="80" src="https://live.browserstack.com/images/opensource/browserstack-logo.svg">
  </picture>
</a>

> 感谢 BrowserStack 容许我们在真实的浏览器中测试此项目。  
> Thanks to [BrowserStack](https://www.browserstack.com/) for providing the infrastructure that allows us to test in real browsers!

<a href="https://www.jsdelivr.com">
  <picture>
    <source media="(prefers-color-scheme: dark)" height="80" srcset="https://raw.githubusercontent.com/jsdelivr/jsdelivr-media/master/white/svg/jsdelivr-logo-horizontal.svg">
    <source media="(prefers-color-scheme: light)" height="80" srcset="https://raw.githubusercontent.com/jsdelivr/jsdelivr-media/master/default/svg/jsdelivr-logo-horizontal.svg">
    <img alt="jsDelivr Logo" height="80" src="https://raw.githubusercontent.com/jsdelivr/jsdelivr-media/master/default/svg/jsdelivr-logo-horizontal.svg">
  </picture>
</a>

> 感谢 jsDelivr 提供的 CDN 服务。  
> Thanks jsDelivr for providing public CDN service.

感谢 fghrsh 提供的 API 服务。

感谢 [一言](https://hitokoto.cn) 提供的语句接口。

点击看板娘的纸飞机按钮时，会出现一个彩蛋，这来自于 [WebsiteAsteroids](http://www.websiteasteroids.com)。

## 许可证

本仓库并不包含任何模型，用作展示的所有 Live2D 模型、图片、动作数据等版权均属于其原作者，仅供研究学习，不得用于商业用途。

本仓库的代码（不包括受 Live2D Proprietary Software License 和 Live2D Open Software License 约束的部分）基于 GNU General Public License v3 协议开源  
http://www.gnu.org/licenses/gpl-3.0.html

Live2D 相关代码的使用请遵守对应的许可：

Live2D Cubism SDK 2.1 的许可证：  
[Live2D SDK License Agreement (Public)](https://docs.google.com/document/d/10tz1WrycskzGGBOhrAfGiTSsgmyFy8D9yHx9r_PsN8I/)

Live2D Cubism SDK 5 的许可证：  
Live2D Cubism Core は Live2D Proprietary Software License で提供しています。  
https://www.live2d.com/eula/live2d-proprietary-software-license-agreement_cn.html  
Live2D Cubism Components は Live2D Open Software License で提供しています。  
https://www.live2d.com/eula/live2d-open-software-license-agreement_cn.html

## 更新日志

2020年1月1日起，本项目不再依赖于 jQuery。

2022年11月1日起，本项目不再需要用户单独加载 Font Awesome。












新增 demo 页
用于接入我新的agent项目
- 本地服务器已经在项目根目录跑着：`python3 -m http.server 8000`，根目录是  
  `/Users/fengfan/Documents/newPro/doc/other/live2D/live2d-widget-master`
- 用浏览器打开：`http://localhost:8000/demo/demo.html`  
  这是我们修改后的 demo 页，会自动加载看板娘。

**2. 模型切换和 destroy 状态**

配置都写在 `dist/waifu-tips.json:258` 之后：

- 崩坏学园系列：
  - `BengHuai/Lita`：`/model/BengHuai/Lita/model.json`
  - `BengHuai/bronya`：`/model/BengHuai/bronya/model.json`
  - `BengHuai/mie`：`/model/BengHuai/mie/model.json`
  - `BengHuai/xier`：`/model/BengHuai/xier/model.json`
- 紫雨心系列（正常 + 破坏）：
  - `ZiYuXin/ots14_1203`  
    `paths`: `normal/normal.model3.json` 和 `destroy/destroy.model3.json`
  - `ZiYuXin/ots14_3001`  
    `paths`: `normal/normal.model3.json` 和 `destroy/destroy.model3.json`
  - `ZiYuXin/ots14_4501`  
    `paths`: `normal/normal.model3.json` 和 `destroy/destroy.model3.json`
  - `ZiYuXin/ots14_5602`  
    `paths`: `normal/normal.model3.json` 和 `destroy/destroy.model3.json`

对应按钮（工具栏在 `#waifu-tool`）：

- 模型切换按钮（小人/街景图标）  
  功能：调用 `loadNextModel`，在所有模型组之间轮流切换  
  实现位置：`dist/waifu-tips.js` 里的 `"switch-model": { callback: () => e.loadNextModel() }`
- 服装/状态切换按钮（衣服图标）  
  功能：在当前模型组的 `paths` 里切换纹理；在我们现在的配置里，每个 ZiYuXin 模型组只有两条路径：`normal` 和 `destroy`，所以这个按钮就等价于“正常 ↔ 破坏”切换  
  实现位置：`src/model.ts:303` 的 `loadRandTexture` + `dist/waifu-tips.js` 中 `"switch-texture"` 对应的回调。

也就是说：

- 想换角色：点“街景/人形”图标（`switch-model`）。
- 想在当前角色的正常 / destroy 之间切换：点“衣服”图标（`switch-texture`）。  
  对于没有 destroy 的模型，paths 只有 1 条时，会自动走失败提示文案（`changeFail`）。

**3. 已经接入的本地模型**

模型目录结构在 `model/ZiYuXin` 和 `model/BengHuai` 下（`LS` 结果你已经看到），对应的 JSON 路径已经全部写进：

- `dist/waifu-tips.json:258-302`

只要你把整个仓库拷贝走（特别是 `model` 和 `dist` 这两个目录），在其它项目里保持路径不变，就能直接使用这些本地模型。

**4. “模块化”后的使用方式**

我没有动内部 TypeScript/打包链路（因为缺 Cubism SDK，重新 build 会失败），而是在外层提供了一个更易集成的入口函数：

- 文件位置：`dist/autoload.js:30-77`
- 新增的全局方法：

```js
async function initLive2DWidget(options = {}) {
  const basePath = typeof options.basePath === 'string' ? options.basePath : '/dist/';
  const waifuPath = typeof options.waifuPath === 'string' ? options.waifuPath : basePath + 'waifu-tips.json';
  const cubism2Path = typeof options.cubism2Path === 'string' ? options.cubism2Path : basePath + 'live2d.min.js';
  const cubism5Path = typeof options.cubism5Path === 'string'
    ? options.cubism5Path
    : 'https://cubism.live2d.com/sdk-web/cubismcore/live2dcubismcore.min.js';

  const tools = Array.isArray(options.tools)
    ? options.tools
    : ['hitokoto', 'asteroids', 'switch-model', 'switch-texture', 'photo', 'info', 'quit'];
  const logLevel = typeof options.logLevel === 'string' ? options.logLevel : 'warn';
  const drag = typeof options.drag === 'boolean' ? options.drag : false;
  const modelId = typeof options.modelId === 'number' ? options.modelId : undefined;

  const OriginalImage = window.Image;
  window.Image = function (...args) {
    const img = new OriginalImage(...args);
    img.crossOrigin = 'anonymous';
    return img;
  };
  window.Image.prototype = OriginalImage.prototype;

  await Promise.all([
    loadExternalResource(basePath + 'waifu.css', 'css'),
    loadExternalResource(basePath + 'waifu-tips.js', 'js')
  ]);

  const config = {
    waifuPath,
    cubism2Path,
    cubism5Path,
    tools,
    logLevel,
    drag
  };

  if (typeof modelId === 'number') {
    config.modelId = modelId;
  }

  initWidget(config);
}

(async () => {
  await initLive2DWidget();
})();

window.initLive2DWidget = initLive2DWidget;
```

关键点：

- 默认行为：仍然会在页面加载时自动执行一次 `initLive2DWidget()`（保持和原版兼容）。
- 模块化入口：`window.initLive2DWidget` 暴露在全局，你可以在任意项目手动调用它来初始化/重新初始化看板娘。
- 可配置项（通过 `options` 传入）：
  - `basePath`：`dist` 文件所在的基础路径，默认 `/dist/`
  - `waifuPath`：配置 JSON 的路径，默认 `basePath + 'waifu-tips.json'`
  - `cubism2Path`：Cubism2 核心 JS 路径，默认 `basePath + 'live2d.min.js'`
  - `cubism5Path`：Cubism5 核心 JS 路径，默认官方 CDN
  - `tools`：要显示的工具按钮数组，默认已有的 7 个
  - `logLevel`：`error | warn | info | trace`，默认 `'warn'`
  - `drag`：是否允许拖动看板娘
  - `modelId`：初始使用的模型索引（对应 `waifu-tips.json` 里 `models` 数组的下标）

**5. 在你自己的项目中如何集成**

假设你在你的项目中放置的静态资源路径为 `/static/live2d/`，并把这个仓库的 `dist` 和 `model` 目录都拷过去：

1. HTML 引入：

```html
<script src="/static/live2d/dist/autoload.js"></script>
```

2. 页面脚本中手动初始化（可选覆盖默认配置）：

```html
<script>
  window.addEventListener('DOMContentLoaded', () => {
    window.initLive2DWidget({
      basePath: '/static/live2d/dist/',
      waifuPath: '/static/live2d/dist/waifu-tips.json',
      cubism2Path: '/static/live2d/dist/live2d.min.js',
      // cubism5Path: '自定义 Cubism 5 Core URL（可选）',
      drag: true,
      modelId: 4, // 从 ZiYuXin/ots14_1203 开始
      tools: ['switch-model', 'switch-texture', 'photo', 'quit'] // 自己裁剪按钮
    });
  });
</script>
```

这样你在另一个项目里只需要：

- 复制 `dist/` 和 `model/` 两个目录；
- 在 HTML 里引入一个 `autoload.js`；
- 用 `window.initLive2DWidget({...})` 做初始化。

**6. 接下来你可以检查的点**

在浏览器打开 `http://localhost:8000/demo/demo.html` 时，可以测试：

- 默认加载是否正常显示紫雨心/崩坏模型；
- “街景/人形”按钮是否在 BengHuai 与 ZnYuXin 模型之间切换；
- “衣服”按钮在 ZiYuXin 这些模型上是否在正常/破坏之间来回切换；
- 如果你希望默认就进入某一个特定模型，比如 `ots14_4501 destroy`，可以：
  - 先在本地点击切换到你想要的组合；
  - 再查看 `localStorage` 里的 `modelId` 和 `modelTexturesId` 数值，写进你自己的初始化逻辑里（或者在 `initLive2DWidget` 的 `options.modelId` 里设定模型组，destroy 通过按钮切）。

如果你希望我进一步帮你在“工具栏”上做真正独立的 destroy 切换图标（而不是复用“衣服”按钮），这一步就需要改打包产物的内部结构，我可以再给你设计一个基于你目标项目的前端脚本方案，让按钮逻辑完全在你自己的项目里控制，而不动这个库本身。