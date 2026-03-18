要实现**任务模板驱动的自动化 Commit 提交流程**，核心是让 Commit 信息/提交行为严格遵循预定义的任务模板（你拆分的 `steps` 目录下的模板），结合工具链（如 Commitizen、Husky、Node 脚本、Git Hooks 等）实现“模板校验→自动填充→合规提交”的闭环。以下是分步骤的实施与配置方案：

### 一、核心思路
1. **模板标准化**：将 `steps` 目录下的任务模板抽象为 Commit 规则（如类型、步骤、必填字段）；
2. **提交拦截**：用 Git Hooks 拦截不合规的 Commit，强制走模板流程；
3. **模板渲染**：通过脚本/工具读取 `steps` 模板，自动生成合规的 Commit 信息；
4. **自动化校验**：确保提交内容与模板匹配（如步骤完整性、字段格式）。

### 二、前提准备
假设你的 `steps` 目录结构示例（需根据实际调整）：
```
steps/
├── feat/          # 功能开发任务模板
│   ├── step1.yml  # 子步骤1：需求确认
│   ├── step2.yml  # 子步骤2：代码开发
│   └── template.md # feat类型Commit的整体模板
├── fix/           # Bug修复任务模板
│   └── template.md
└── common.yml     # 通用字段（如作者、日期、关联任务ID）
```
模板文件建议用 **YAML/JSON**（易解析）或 **Markdown**（易阅读），示例 `feat/template.md`：
```markdown
# feat类型提交模板
类型：feat
关联任务ID：{{TASK_ID}}
完成步骤：
1. {{STEP1_STATUS}}（需求确认）
2. {{STEP2_STATUS}}（代码开发）
描述：{{DESCRIPTION}}
```

### 三、分步实施配置

#### 步骤1：环境与工具安装
安装核心依赖（基于 Node.js 生态，通用且易扩展）：
```bash
# 1. 初始化package.json（如无）
npm init -y

# 2. 安装关键工具
npm install --save-dev husky commitizen cz-customizable js-yaml inquirer # inquirer用于交互式填写模板
```

#### 步骤2：配置 Commit 模板解析脚本
编写 Node 脚本读取 `steps` 目录下的模板，生成交互式填写界面，并输出合规的 Commit 信息。

创建脚本文件 `scripts/commit-template.js`：
```javascript
const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');
const inquirer = require('inquirer');

// 1. 读取steps目录下的模板
function loadTemplate(type) {
  const templatePath = path.join(__dirname, '../steps', type, 'template.md');
  if (!fs.existsSync(templatePath)) {
    throw new Error(`未找到${type}类型的任务模板，请检查steps目录`);
  }
  return fs.readFileSync(templatePath, 'utf8');
}

// 2. 交互式获取模板所需参数
async function promptTemplateParams(type) {
  // 可根据模板动态生成问题（示例：固定字段，实际可解析模板中的{{变量}}）
  const questions = [
    { type: 'input', name: 'TASK_ID', message: '关联任务ID：' },
    { type: 'list', name: 'STEP1_STATUS', message: '需求确认状态：', choices: ['完成', '待确认'] },
    { type: 'list', name: 'STEP2_STATUS', message: '代码开发状态：', choices: ['完成', '开发中'] },
    { type: 'input', name: 'DESCRIPTION', message: '提交描述：' },
  ];
  return inquirer.prompt(questions);
}

// 3. 渲染模板生成Commit信息
function renderTemplate(templateStr, params) {
  return templateStr.replace(/{{(\w+)}}/g, (_, key) => params[key] || '');
}

// 4. 主流程
async function main() {
  // 第一步：选择任务类型（对应steps下的目录）
  const { type } = await inquirer.prompt([
    { type: 'list', name: 'type', message: '选择任务类型：', choices: ['feat', 'fix', 'docs'] },
  ]);

  // 第二步：加载对应模板
  const templateStr = loadTemplate(type);

  // 第三步：交互式填写参数
  const params = await promptTemplateParams(type);

  // 第四步：渲染模板
  const commitMsg = renderTemplate(templateStr, params);

  // 第五步：将生成的Commit信息写入.git/COMMIT_EDITMSG（Git默认读取此文件）
  const commitEditMsgPath = path.join(__dirname, '../.git/COMMIT_EDITMSG');
  fs.writeFileSync(commitEditMsgPath, commitMsg, 'utf8');

  console.log('✅ 任务模板渲染完成，Commit信息已生成：\n', commitMsg);
}

main().catch(err => {
  console.error('❌ 模板处理失败：', err.message);
  process.exit(1);
});
```

#### 步骤3：配置 Husky 拦截 Git Commit 流程
Husky 用于管理 Git Hooks，强制提交前走模板流程，拒绝不合规的 Commit。

##### 3.1 启用 Husky
```bash
npx husky install
# 配置开机自启（可选）
npm set-script prepare "husky install"
npm run prepare
```

##### 3.2 添加 commit-msg 钩子（校验Commit信息是否符合模板）
创建 `commit-msg` 钩子，校验提交信息是否匹配模板规则：
```bash
npx husky add .husky/commit-msg "node scripts/verify-commit.js"
```

编写校验脚本 `scripts/verify-commit.js`：
```javascript
const fs = require('fs');
const path = require('path');

// 读取Git提交信息（由commit-template.js生成，或用户手动输入）
const commitMsgPath = process.argv[2] || path.join(__dirname, '../.git/COMMIT_EDITMSG');
const commitMsg = fs.readFileSync(commitMsgPath, 'utf8').trim();

// 校验规则：示例（需根据你的模板调整）
const RULES = [
  { regex: /^类型：(feat|fix|docs)/, message: 'Commit必须以「类型：feat/fix/docs」开头' },
  { regex: /关联任务ID：\d+/, message: '必须填写有效的关联任务ID（数字）' },
  { regex: /完成步骤：\n1\.\s(完成|待确认)\n2\.\s(完成|开发中)/, message: '完成步骤必须包含两个子步骤的状态' },
];

// 执行校验
const errors = RULES.filter(rule => !rule.regex.test(commitMsg)).map(rule => rule.message);

if (errors.length > 0) {
  console.error('❌ Commit信息不符合任务模板规则：\n', errors.join('\n '));
  process.exit(1); // 终止提交
}

console.log('✅ Commit信息符合模板规则');
process.exit(0);
```

##### 3.3 添加 prepare-commit-msg 钩子（自动填充模板）
此钩子在执行 `git commit` 时自动触发，调用模板脚本生成Commit信息：
```bash
npx husky add .husky/prepare-commit-msg "node scripts/commit-template.js"
```
> 说明：`prepare-commit-msg` 在用户输入Commit信息前触发，脚本会自动生成模板化的内容到 `.git/COMMIT_EDITMSG`，用户可补充后提交，或直接提交。

#### 步骤4：简化提交命令（可选）
在 `package.json` 中添加脚本，一键触发模板化提交：
```json
{
  "scripts": {
    "commit": "git add . && node scripts/commit-template.js && git commit -F .git/COMMIT_EDITMSG"
  }
}
```
使用方式：
```bash
npm run commit
```

### 四、进阶优化
1. **模板动态解析**：不用硬编码参数，通过正则解析模板中的 `{{变量}}`，自动生成交互式问题（如解析 `template.md` 中的所有 `{{XXX}}`，生成对应的 input/list 问题）；
2. **与任务管理系统联动**：调用 Jira/GitLab API，根据任务ID自动拉取任务信息，填充模板（如任务标题、负责人）；
3. **分支名关联模板**：强制分支名格式（如 `feat/TASK-123`），脚本自动提取 `TASK-123` 填充到模板的「关联任务ID」字段；
4. **提交记录校验**：在 CI/CD 阶段（如 GitLab CI）再次校验Commit信息是否符合模板，拒绝不合规的合并。

### 五、关键注意事项
1. `steps` 目录的模板结构需统一（如每个类型目录下必须有 `template.md`），避免脚本解析失败；
2. Git Hooks 依赖 `.git` 目录，需确保项目已初始化 Git（`git init`）；
3. 跨平台兼容：脚本中路径处理使用 `path.join`，避免 Windows/Linux 路径分隔符问题；
4. 权限问题：确保脚本有可执行权限（`chmod +x scripts/*.js`）。

通过以上配置，即可实现“选择任务类型→自动加载对应模板→交互式填写参数→生成合规Commit信息→校验通过后提交”的自动化流程，确保所有 Commit 严格遵循 `steps` 目录下的任务模板规范。