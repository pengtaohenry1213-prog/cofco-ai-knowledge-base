<template>
  <div id="app" class="app-shell">
    <aside class="sidebar">
      <div class="sidebar-brand">
        <el-icon class="sidebar-brand-icon"><MagicStick /></el-icon>
        <span class="sidebar-brand-text">AI 知识库助手</span>
      </div>
      <nav class="sidebar-nav">
        <router-link
          to="/space"
          class="nav-item"
          active-class="active"
        >
          <el-icon><User /></el-icon>
          <span>我的空间</span>
        </router-link>
        <router-link
          to="/agent"
          class="nav-item"
          active-class="active"
        >
          <el-icon><Cpu /></el-icon>
          <span>智能体</span>
        </router-link>
        <router-link
          to="/knowledge"
          class="nav-item"
          active-class="active"
        >
          <el-icon><Collection /></el-icon>
          <span>知识库</span>
        </router-link>
      </nav>
    </aside>
    <main class="main-area">
      <router-view />
    </main>
  </div>
</template>

<script setup lang="ts">
import { MagicStick, User, Cpu, Collection } from '@element-plus/icons-vue';
</script>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial,
    sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  background: #f0f2f5;
}

#app {
  min-height: 100vh;
}
</style>

<style scoped>
.app-shell {
  display: flex;
  min-height: 100vh;
}

.sidebar {
  width: 220px;
  flex-shrink: 0;
  background: linear-gradient(180deg, #1a1d24 0%, #14161c 100%);
  color: #c0c4cc;
  display: flex;
  flex-direction: column;
  padding: 20px 0;
  box-shadow: 2px 0 12px rgba(0, 0, 0, 0.08);
}

.sidebar-brand {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 0 20px 24px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
  margin-bottom: 12px;
}

.sidebar-brand-icon {
  font-size: 26px;
  color: #409eff;
}

.sidebar-brand-text {
  font-size: 15px;
  font-weight: 600;
  color: #e4e7ed;
  line-height: 1.3;
}

.sidebar-nav {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 0 12px;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 14px;
  border-radius: 8px;
  text-decoration: none;
  color: #a8abb2;
  font-size: 14px;
  transition: background 0.2s, color 0.2s;
}

.nav-item:hover {
  background: rgba(255, 255, 255, 0.06);
  color: #e4e7ed;
}

.nav-item.active {
  background: rgba(64, 158, 255, 0.18);
  color: #79bbff;
}

.nav-item .el-icon {
  font-size: 18px;
}

.main-area {
  flex: 1;
  min-width: 0;
  min-height: 100vh;
  background: #f0f2f5;
  overflow: auto;
}
</style>
