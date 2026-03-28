<template>
  <div id="app">
    <nav class="navbar">
      <div class="nav-container">
        <div class="nav-brand">
          <el-icon class="brand-icon"><MagicStick /></el-icon>
          <span class="brand-text">AI 知识库助手</span>
        </div>
        <div class="nav-links">
          <router-link to="/upload" class="nav-link" active-class="active">
            <el-icon><Document /></el-icon>
            <span>文档上传</span>
          </router-link>
          <router-link to="/chat" class="nav-link" active-class="active">
            <el-icon><ChatDotRound /></el-icon>
            <span>智能对话</span>
          </router-link>
        </div>
      </div>
    </nav>
    <main class="main-content">
      <router-view />
    </main>
  </div>
</template>

<script setup lang="ts">
import { MagicStick, Document, ChatDotRound } from '@element-plus/icons-vue';
</script>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  background: #f5f7fa;
}

#app {
  min-height: 100vh;
}
</style>

<style scoped>
.navbar {
  background: #fff;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  position: sticky;
  top: 0;
  z-index: 1000;
}

.nav-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 24px;
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.nav-brand {
  display: flex;
  align-items: center;
  gap: 8px;
}

.brand-icon {
  font-size: 28px;
  color: #409eff;
}

.brand-text {
  font-size: 18px;
  font-weight: 600;
  color: #303133;
}

.nav-links {
  display: flex;
  gap: 8px;
}

.nav-link {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  border-radius: 8px;
  text-decoration: none;
  color: #606266;
  transition: all 0.2s;
}

.nav-link:hover {
  background: #f5f7fa;
  color: #409eff;
}

.nav-link.active {
  background: #ecf5ff;
  color: #409eff;
}

.main-content {
  min-height: calc(100vh - 60px);
}
</style>
