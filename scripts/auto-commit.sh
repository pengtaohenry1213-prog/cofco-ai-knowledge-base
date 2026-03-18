#!/bin/bash
#===============================================================================
# Cursor + Git 自动提交脚本
# 适配 AI 知识库项目的自动 Commit 工具
# 兼容 macOS (bash 3.2+) 和 Linux
# 
# 使用方式：
#   ./scripts/auto-commit.sh              # 自动模式：自动识别变更并生成 commit
#   ./scripts/auto-commit.sh "任务名称"    # 手动模式：指定任务名称
#   ./scripts/auto-commit.sh --push        # 自动模式 + 自动推送
#   ./scripts/auto-commit.sh "任务名称" --push  # 手动模式 + 自动推送
#===============================================================================

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 项目根目录
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$PROJECT_ROOT"

#===============================================================================
# 函数：获取任务步骤名称（兼容 bash 3.2）
#===============================================================================
get_task_name() {
    local step_key=$1
    case "$step_key" in
        step1) echo "初始化前端项目结构" ;;
        step2) echo "开发文件上传组件" ;;
        step3) echo "开发文本预览组件" ;;
        step4) echo "开发对话输入组件" ;;
        step5) echo "开发消息展示组件" ;;
        step6) echo "实现后端 Express + TS 基础服务" ;;
        step7) echo "实现文件上传解析 API" ;;
        step8) echo "实现 Embedding 向量化服务" ;;
        step9) echo "实现 RAG 检索与生成 API" ;;
        step10) echo "集成前端对话页面" ;;
        step11) echo "实现流式输出" ;;
        step12) echo "优化用户体验与性能" ;;
        *) echo "" ;;
    esac
}

#===============================================================================
# 函数：打印带颜色的消息
#===============================================================================
print_msg() {
    local color=$1
    local msg=$2
    echo -e "${color}${msg}${NC}"
}

#===============================================================================
# 函数：自动识别变更对应的任务步骤
#===============================================================================
auto_detect_task() {
    local changes=$1
    
    # 检测是否包含 src/ 前端代码
    if echo "$changes" | grep -q "src/"; then
        if echo "$changes" | grep -q "components/FileUpload"; then
            echo "step2"
        elif echo "$changes" | grep -q "components/TextPreview"; then
            echo "step3"
        elif echo "$changes" | grep -q "components/ChatInput"; then
            echo "step4"
        elif echo "$changes" | grep -q "components/Message"; then
            echo "step5"
        elif echo "$changes" | grep -q "views/\|pages/"; then
            echo "step10"
        else
            echo "step1"
        fi
    # 检测后端 API
    elif echo "$changes" | grep -q "server/\|api/"; then
        if echo "$changes" | grep -q "embedding\|vector"; then
            echo "step8"
        elif echo "$changes" | grep -q "rag\|retrieval"; then
            echo "step9"
        elif echo "$changes" | grep -q "upload\|file"; then
            echo "step7"
        else
            echo "step6"
        fi
    # 检测 md/ 文档
    elif echo "$changes" | grep -q "md/"; then
        echo "docs"
    else
        echo "unknown"
    fi
}

#===============================================================================
# 函数：根据变更内容自动生成 commit message
#===============================================================================
generate_commit_message() {
    local changes=$1
    local task_name=$2
    local step_key=$3
    
    # 判断变更类型
    if echo "$changes" | grep -qE "\.vue$|\.tsx$|\.jsx$"; then
        TYPE="feat"
    elif echo "$changes" | grep -qE "\.ts$|\.js$"; then
        TYPE="feat"
    elif echo "$changes" | grep -q "\.md$"; then
        TYPE="docs"
    elif echo "$changes" | grep -qE "package\.json|tsconfig|vite"; then
        TYPE="chore"
    elif echo "$changes" | grep -qE "Dockerfile|\.dockerfile"; then
        TYPE="chore"
    else
        TYPE="chore"
    fi
    
    # 获取任务名称
    local task_display=$(get_task_name "$step_key")
    
    # 生成 commit message
    if [ -n "$task_name" ]; then
        # 手动指定任务名称
        COMMIT_MSG="${TYPE}: ${task_name}"
    elif [ "$step_key" = "docs" ]; then
        # 文档更新
        COMMIT_MSG="${TYPE}: 更新项目文档"
    elif [ -n "$task_display" ]; then
        # 自动识别任务步骤
        COMMIT_MSG="${TYPE}: ${task_display}"
    else
        # 无法识别，使用默认
        COMMIT_MSG="${TYPE}: 完成项目更新"
    fi
    
    echo "$COMMIT_MSG"
}

#===============================================================================
# 主流程
#===============================================================================

# 解析参数
AUTO_PUSH=false
TASK_NAME=""

while [[ $# -gt 0 ]]; do
    case $1 in
        --push|-p)
            AUTO_PUSH=true
            shift
            ;;
        --help|-h)
            echo "Usage: $0 [task_name] [--push|-p]"
            echo ""
            echo "Options:"
            echo "  task_name    任务名称（可选，不指定则自动识别）"
            echo "  --push, -p  提交后自动推送到远程"
            echo ""
            echo "Examples:"
            echo "  $0                                    # 自动识别变更"
            echo "  $0 \"完成前端项目初始化\"              # 指定任务名称"
            echo "  $0 --push                             # 自动识别 + 自动推送"
            echo "  $0 \"开发文件上传组件\" --push        # 指定任务 + 自动推送"
            exit 0
            ;;
        *)
            TASK_NAME="$1"
            shift
            ;;
    esac
done

# 1. 检查是否有未提交的更改
print_msg "$BLUE" "🔍 检查代码变更..."
if [ -z "$(git status --porcelain)" ]; then
    print_msg "$GREEN" "✅ 没有需要提交的更改"
    exit 0
fi

# 2. 暂存所有更改
git add -A
print_msg "$GREEN" "📌 已暂存所有代码变更"

# 3. 获取代码变更摘要
CHANGES=$(git diff --cached --stat)
CHANGES_SHORT=$(git diff --cached --stat | head -15)
echo ""
print_msg "$YELLOW" "📝 本次代码变更："
echo "$CHANGES_SHORT"
echo ""

# 4. 自动检测任务步骤
STEP_KEY=$(auto_detect_task "$CHANGES")
echo "🔎 自动识别任务步骤: $STEP_KEY"

# 5. 生成 Commit 信息
COMMIT_MSG=$(generate_commit_message "$CHANGES" "$TASK_NAME" "$STEP_KEY")

print_msg "$YELLOW" "💬 生成的 Commit 信息："
echo ""
echo "   ${COMMIT_MSG}"
echo ""

# 6. 确认并提交
if [ "$AUTO_PUSH" = true ]; then
    # 自动模式：直接提交并推送
    print_msg "$BLUE" "🚀 自动提交并推送..."
    git commit -m "$COMMIT_MSG"
    print_msg "$GREEN" "✅ Commit 提交成功！"
    
    git push
    if [ $? -eq 0 ]; then
        print_msg "$GREEN" "🚀 已推送到远程仓库"
    else
        print_msg "$RED" "❌ 推送失败，请检查网络或权限"
        exit 1
    fi
else
    # 交互模式：询问确认
    read -p "✅ 确认提交？(y/n): " confirm
    if [ "$confirm" = "y" ] || [ "$confirm" = "Y" ]; then
        git commit -m "$COMMIT_MSG"
        print_msg "$GREEN" "✅ Commit 提交成功！"
        
        read -p "🚀 是否推送到 GitHub？(y/n): " push_confirm
        if [ "$push_confirm" = "y" ] || [ "$push_confirm" = "Y" ]; then
            git push
            if [ $? -eq 0 ]; then
                print_msg "$GREEN" "🚀 已推送到远程仓库"
            else
                print_msg "$RED" "❌ 推送失败，请检查网络或权限"
                exit 1
            fi
        fi
    else
        print_msg "$RED" "❌ 已取消提交"
        exit 0
    fi
fi

echo ""
print_msg "$GREEN" "🎉 完成！当前分支：$(git branch --show-current)"
echo "   Commit 历史："
git log --oneline -5
