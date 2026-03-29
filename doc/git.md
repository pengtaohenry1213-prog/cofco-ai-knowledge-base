# Git 本地目录私有化部署（仓库级配置）

## github上创建一个新的仓库
复制出SSH：`git@github.com:pengtaohenry1213-prog/cofco-ai-knowledge-base.git`

## 1. 进入本地项目目录
`cd /你的项目路径/cofco-ai-knowledge-base`

## 2. 初始化本地 Git 仓库（首次执行）
`git init`

## 3. 配置当前仓库的身份（覆盖全局）
`git config user.name pengtaohenry1213-prog`
`git config user.email pengtaohenry1213@gmail.com`

## 4. 验证
`git config --local --list`

## 5. 关联远程仓库（优先用 SSH 地址）
git remote add origin git@github.com:pengtaohenry1213-prog/cofco-ai-knowledge-base.git

## 6. 验证关联是否正确
`git remote -v`
# 输出应显示：
# origin  git@github.com:pengtaohenry1213-prog/cofco-ai-knowledge-base.git (fetch)
# origin  git@github.com:pengtaohenry1213-prog/cofco-ai-knowledge-base.git (push)