<template>
  <div class="layout-container" :class="{ 'dark-mode': isDarkMode }" @click="handleOutsideClick">
    <header class="header" >
      <nav class="navbar">
        <div class="logo">
          <h1> CDG</h1>
        </div>
        <div class="user-info">
          <div class="user-name">
            <button @click="toggleDarkMode" class="theme-btn">
            <v-icon>{{ isDarkMode ? 'mdi-white-balance-sunny' : 'mdi-moon-waning-crescent' }}</v-icon>
          </button>
            <h2>{{ userData?.firstName || 'ผู้ใช้งาน' }} {{ userData?.lastName }}</h2>
          </div>
          <div class="user-role">
            <h3>{{ userData?.role || 'ไม่ระบุสิทธิ์' }}</h3>
          </div>
        </div>
   
       
          <button @click="handleLogout" class="logout-btn">
            <v-icon>mdi-logout</v-icon>
            ออกจากระบบ
          </button>
       
      </nav>
    </header>

    <main class="main-layout">
      <div class="menu-section">
        <button class="toggle-menu-btn" @click="toggleMenu">
          <v-icon>{{ showMenu ? 'mdi-menu-open' : 'mdi-menu' }}</v-icon>
        </button>

        <div class="button-group" :class="{ 'menu-hidden': !showMenu }">
          <div class="profile-menu-container">
            <button
              class="nav-btn"
              :class="{ active: activeComponent === 'Profile' }"
              @click.stop="toggleProfileMenu"
            >
              <v-icon class="nav-icon">mdi-account-cog</v-icon>
              <span class="nav-text">ตั้งค่าโปรไฟล์</span>
              <v-icon>{{ showProfileMenu ? 'mdi-chevron-up' : 'mdi-chevron-down' }}</v-icon>
            </button>

            <div v-if="showProfileMenu" class="submenu">
              <button
                class="nav-btn submenu-btn"
                :class="{ active: activeComponent === 'HelloWorld' }"
                @click.stop="activeComponent = 'HelloWorld'"
              >
                <v-icon class="nav-icon">mdi-account-edit</v-icon>
                <span class="nav-text">แก้ไขข้อมูลส่วนตัว</span>
              </button>
              <button
                class="nav-btn submenu-btn"
                :class="{ active: activeComponent === 'newPassword' }"
                @click.stop="activeComponent = 'newPassword'"
              >
                <v-icon class="nav-icon">mdi-shield-lock</v-icon>
                <span class="nav-text">ตั้งค่าความปลอดภัย</span>
              </button>
            </div>
          </div>

          <button
            v-if="userData?.role === 'admin'"
            class="nav-btn"
            :class="{ active: activeComponent === 'ReportUser' }"
            @click="activeComponent = 'ReportUser'"
          >
            <v-icon class="nav-icon">mdi-account-multiple</v-icon>
            <span class="nav-text">รายงานผู้ใช้</span>
          </button>

          <button
            v-if="userData?.role === 'admin'"
            class="nav-btn"
            :class="{ active: activeComponent === 'ManagementPosition' }"
            @click="activeComponent = 'ManagementPosition'"
          >
            <v-icon class="nav-icon">mdi-account-cog</v-icon>
            <span class="nav-text">จัดการตำแหน่ง</span>
          </button>

          <button
            v-if="userData?.role === 'admin'"
            class="nav-btn"
            :class="{ active: activeComponent === 'OrganizeAll' }"
            @click="activeComponent = 'OrganizeAll'"
          >
            <v-icon class="nav-icon">mdi-sitemap</v-icon>
            <span class="nav-text">องค์กร</span>
          </button>

          <button
            v-if="userData?.role === 'personnel'"
            class="nav-btn"
            :class="{ active: activeComponent === 'DicisionTree' }"
            @click="activeComponent = 'DicisionTree'"
          >
            <v-icon class="nav-icon">mdi-sitemap</v-icon>
            <span class="nav-text">แผนผังองค์กร</span>
          </button>
        </div>
      </div>

      <div class="component-container" :class="{ 'full-width': !showMenu }">
        <ReportUser v-if="activeComponent === 'ReportUser'" @reloadData="reloadData" />
        <ManagementPosition v-if="activeComponent === 'ManagementPosition'" @reloadData="reloadData" />
        <ManagementPositionUser v-if="activeComponent === 'ManagementPositionUser'" @reloadData="reloadData" />
        <HelloWorld v-if="activeComponent === 'HelloWorld'" />
        <Welcome v-if="activeComponent === 'Welcome'" />
        <DicisionTree v-if="activeComponent === 'DicisionTree'" />
        <OrganizeAll v-if="activeComponent === 'OrganizeAll'" />
        <newPassword v-if="activeComponent === 'newPassword'" />
        <router-view></router-view>
      </div>
    </main>

    <footer class="footer">
      <p>&copy; 2024 CDG@trainee. All rights reserved.</p>
    </footer>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import { ref, computed, onMounted, watch, onUnmounted } from 'vue'
import { useAuthStore } from '../data/stores/auth';
import { useUserStore } from '../data/stores/user';
import DicisionTree from './dicisionTree.vue';
import ReportUser from './ReportUser.vue';
import HelloWorld from './HelloWorld.vue';
import ManagementPosition from './management/ManagementPosition.vue';
import OrganizeAll from './organize/organizeAll.vue';
import newPassword from './newPassword.vue';
import Welcome from './Welcome.vue'
const activeComponent = ref<string | null>(null);
const authStore = useAuthStore();
const userStore = useUserStore();
const showMenu = ref(true);
const isDarkMode = ref(false);
const showProfileMenu = ref(false);

activeComponent.value = 'Welcome';

function reloadData() {
}

const toggleMenu = () => {
  showMenu.value = !showMenu.value;
}

const toggleProfileMenu = () => {
  showProfileMenu.value = !showProfileMenu.value;
}

const handleOutsideClick = (event: MouseEvent) => {
  const profileMenu = document.querySelector('.profile-menu-container');
  if (profileMenu && !profileMenu.contains(event.target as Node)) {
    showProfileMenu.value = false;
  }
}

const toggleDarkMode = () => {
  isDarkMode.value = !isDarkMode.value;
  localStorage.setItem('darkMode', isDarkMode.value.toString());
}

onMounted(() => {
  userStore.initUser();
  const savedDarkMode = localStorage.getItem('darkMode');
  if (savedDarkMode) {
    isDarkMode.value = savedDarkMode === 'true';
  }
  document.addEventListener('click', handleOutsideClick);
})

onUnmounted(() => {
  document.removeEventListener('click', handleOutsideClick);
})

const router = useRouter()
const userData = computed(() => userStore.users)

watch(userData, (newValue) => {
  if (!newValue) {
    router.push('/login')
  }
}, { immediate: true })

const handleLogout = async () => {
  const storedUser = window.localStorage.getItem('user')
  if (storedUser) {
    const parsedUser = JSON.parse(storedUser)
    const email = parsedUser?.user?.email
    console.log(email);
    await authStore.logout(email)
  }
  router.push('/login')
}


</script>

<style scoped>
.layout-container {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background-color: #f8f9fa;
  overflow: hidden;
  transition: all 0.3s ease;
}

.layout-container.dark-mode {
  background-color: #1a1a1a;
  color: #ffffff;
}

.header {
  background: linear-gradient(135deg, #000000 0%, #2196f3 100%);
  box-shadow: 0 2px 15px rgba(0, 0, 0, 0.2);
  z-index: 100;
  transition: all 0.3s ease;
}

.dark-mode .header {
  background: linear-gradient(135deg, #1a1a1a 0%, #1976d2 100%);
}

.navbar {
  padding: 1rem 2rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  max-width: 1400px;
  margin: 0 auto;
}

.logo h1 {
  font-size: 2rem;
  font-weight: 700;
  color: #ffffff;
  letter-spacing: 2px;
  transition: color 0.3s ease;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.2);
}

.dark-mode .logo h1 {
  color: #ffffff;
}

.user-info {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
}

.user-name,
.user-role {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.user-name h2 {
  font-size: 1.2rem;
  color: #ffffff;
  margin: 0;
  transition: color 0.3s ease;
  font-weight: 600;
}

.dark-mode .user-name h2 {
  color: #ffffff;
}

.user-role h3 {
  font-size: 1rem;
  color: rgba(255, 255, 255, 0.8);
  margin: 0;
  transition: color 0.3s ease;
}

.dark-mode .user-role h3 {
  color: #a0a0a0;
}

.main-layout {
  flex: 1;
  display: flex;
  flex-direction: column;
  max-width: 1400px;
  margin: 0 auto;
  width: 100%;
  padding: 2rem;
  position: relative;
  overflow: hidden;
}

.component-container {
  position: relative;
  z-index: 1;
  flex: 1;
  overflow-y: auto;
  padding-right: 1rem;
  transition: all 0.3s ease;
  animation: fadeIn 0.5s ease forwards;
  margin-top: 1rem;
}

.component-container.full-width {
  width: 100%;
}

.footer {
  background: linear-gradient(135deg, #000000 0%, #2196f3 100%);
  color: #ffffff;
  padding: 1rem;
  text-align: center;
  transition: background-color 0.3s ease;
}

.dark-mode .footer {
  background-color: #1a1a1a;
}

.theme-btn {
  padding: 0.7rem;
  background-color: transparent;
  color: #2c3e50;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  margin-right: 1rem;
  transition: all 0.3s ease;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 50%;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  backdrop-filter: blur(5px);
}

.dark-mode .theme-btn {
  color: #ffffff;
}

.logout-btn {
  padding: 0.7rem 1.5rem;
  background-color: #dc3545;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 1rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: all 0.3s ease;
  background: linear-gradient(135deg, #ff4444 0%, #cc0000 100%);
  border-radius: 12px;
  padding: 0.8rem 1.8rem;
  font-weight: 600;
  box-shadow: 0 2px 8px rgba(220, 53, 69, 0.3);
}

.logout-btn:hover {
  background: linear-gradient(135deg, #cc0000 0%, #aa0000 100%);
  transform: translateY(-2px);
}

.fas {
  font-size: 1.1rem;
}

.nav-btn {
  display: flex;
  align-items: center;
  gap: 0.8rem;
  padding: 1rem 1.5rem;
  background-color: #f8f9fa;
  border: 2px solid #e9ecef;
  border-radius: 8px;
  cursor: pointer;
  font-size: 1rem;
  color: #495057;
  transition: all 0.3s ease;
  width: 20%;
  margin-bottom: 0.8rem;
  background: white;
  border: none;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  border-radius: 12px;
  transition: all 0.3s ease;
  animation: fadeIn 0.5s ease forwards;
  opacity: 0;
  animation-delay: calc(var(--index) * 0.1s);
}

.dark-mode .nav-btn {
  background-color: #2d2d2d;
  border-color: #404040;
  color: #ffffff;
}

.nav-btn:hover {
  background-color: #e9ecef;
  transform: translateY(-2px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transform: translateY(-3px);
  box-shadow: 0 4px 12px rgba(33, 150, 243, 0.2);
  background: linear-gradient(135deg, #ffffff 0%, #f5f5f5 100%);
}

.dark-mode .nav-btn:hover {
  background-color: #404040;
}

.nav-btn.active {
  background-color: #2c3e50;
  color: white;
  border-color: #2c3e50;
  background: linear-gradient(135deg, #000000 0%, #2196f3 100%);
  box-shadow: 0 4px 12px rgba(33, 150, 243, 0.3);
}

.dark-mode .nav-btn.active {
  background-color: #4a90e2;
  border-color: #4a90e2;
}

.nav-icon {
  font-size: 1.5rem;
}

.nav-text {
  font-weight: 500;
}

.button-group {
  position: relative;
  display: flex;
  flex-wrap: nowrap;
  gap: 0.8rem;
  padding: 1rem;
  transition: all 0.3s ease;
}

.button-group.menu-hidden {
  display: none;
}

.toggle-menu-btn {
  position: fixed;
  top: 90px;
  left: 20px;
  padding: 0.8rem;
  background: linear-gradient(135deg, #000000 0%, #2196f3 100%);
  color: white;
  border: none;
  border-radius: 0 8px 8px 0;
  cursor: pointer;
  z-index: 1001;
  transition: all 0.3s ease;
}

.dark-mode .toggle-menu-btn {
  background-color: #4a90e2;
}

.toggle-menu-btn:hover {
  background-color: #1a252f;
}

.dark-mode .toggle-menu-btn:hover {
  background-color: #357abd;
}

/* เพิ่ม animation effects */
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(-10px); }
  to { opacity: 1; transform: translateY(0); }
}

.nav-btn {
  animation: fadeIn 0.5s ease forwards;
  opacity: 0;
  animation-delay: calc(var(--index) * 0.1s);
}

.component-container {
  animation: fadeIn 0.5s ease forwards;
}

.profile-menu-container {
  position: relative;
  display: inline-block;
  z-index: 1000;
}

.submenu {
  position: absolute;
  top: 100%;
  left: 0;
  width: 100%;
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  margin-top: 0.5rem;
  overflow: visible;
  animation: slideDown 0.3s ease-out;
  z-index: 1001;
  min-width: 200px;
}

.dark-mode .submenu {
  background: #2d2d2d;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
}

.submenu-btn {
  width: 100%;
  border-radius: 0;
  margin: 0;
  padding: 0.8rem 1.5rem;
  justify-content: flex-start;
  transition: background-color 0.3s ease;
}

.submenu-btn:hover {
  transform: translateY(0);
  background: rgba(33, 150, 243, 0.1);
}

@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.nav-btn {
  width: auto;
  min-width: 200px;
  justify-content: flex-start;
  gap: 0.8rem;
  position: relative;
}

.nav-btn .v-icon:last-child {
  margin-left: auto;
  transition: transform 0.3s ease;
}

.nav-btn.active {
  background: linear-gradient(135deg, #000000 0%, #2196f3 100%);
  color: white;
}

.dark-mode .nav-btn.active {
  background: linear-gradient(135deg, #1a1a1a 0%, #1976d2 100%);
}

.menu-section {
  position: relative;
  z-index: 1000;
}

.profile-menu-container {
  position: relative;
  
}

.submenu {
  position: absolute;
  top: 100%;
  left: 0;
  width: 100%;
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  margin-top: 0.5rem;
  overflow: visible;
  animation: slideDown 0.3s ease-out;
}

.component-container {
  position: relative;
  z-index: 1;
}

@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.submenu-btn {
  width: 100%;
  border-radius: 0;
  margin: 0;
  padding: 0.8rem 1.5rem;
  justify-content: flex-start;
}

.submenu-btn:hover {
  transform: translateY(0);
  background: rgba(33, 150, 243, 0.1);
}

.dark-mode .submenu {
  background: #2d2d2d;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
}

</style>