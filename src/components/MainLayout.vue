<template>
    <div class="layout-container">
      <header class="header">
        <nav class="navbar">
          <div class="logo">
            <h1>Logo</h1>
          </div>
          <div class="logo">
            <h1>{{ user?.name || 'ผู้ใช้งาน' }}</h1>          </div>
          <div class="nav-menu">
            <button @click="handleLogout" class="logout-btn">ออกจากระบบ</button>
          </div>
        </nav>
      </header>
  
      <main class="main-layout">
        <router-view></router-view>
      </main>
  
      <footer class="footer">
        <p>&copy; 2024 Your Company</p>
      </footer>
    </div>
  </template>
  
  <script setup lang="ts">
  import { useRouter } from 'vue-router'
  import { ref, onMounted } from 'vue'
  const router = useRouter()
  const user = ref<{ name: string } | null>(null)

onMounted(() => {
  const storedUser = window.localStorage.getItem('user')
  if (storedUser) {
    user.value = JSON.parse(storedUser)
    console.log(user.value)
  }
})
  
  const handleLogout = async () => {
    // await authStore.logout() 
    // localStorage.removeItem('token')
    router.push('/login')
  }
  </script>
  
  <style scoped>
  .layout-container {
    min-height: 100vh;
    display: flex;
    flex-direction: column;
  }
  
  .header {
    background-color: #fff;
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  }
  
  .navbar {
    padding: 1rem 2rem;
    display: flex;
    justify-content: space-between;
    align-items: center;
    max-width: 1200px;
    margin: 0 auto;
  }
  
  .main-content {
    flex: 1;
    padding: 2rem;
    max-width: 1200px;
    margin: 0 auto;
    width: 100%;
  }
  
  .footer {
    background-color: #f5f5f5;
    padding: 1rem;
    text-align: center;
  }
  
  .logout-btn {
    padding: 0.5rem 1rem;
    background-color: #dc3545;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
  }
  
  .logout-btn:hover {
    background-color: #c82333;
  }
  </style>