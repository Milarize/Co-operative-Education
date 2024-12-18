<template>
  <router-view></router-view>
</template>

<script setup lang="ts">
import { onUnmounted } from 'vue';
import { useRouter } from 'vue-router';

const router = useRouter();
function checkTokenExpiration(token: string) {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    const exp = payload.exp;
    const now = Math.floor(Date.now() / 1000);
    const timeLeft = exp - now;
    
    return {
      isExpired: timeLeft <= 0,
      timeLeft: timeLeft,
      shouldRefresh: timeLeft > 0 && timeLeft <= 600
    };
  } catch {
    return { isExpired: true, timeLeft: 0, shouldRefresh: false };
  }
}
// ตรวจสอบ token ทุกๆ 1 นาที
const tokenCheckInterval = setInterval(() => {
  const token = localStorage.getItem('token');
  if (token) {
    const tokenStatus = checkTokenExpiration(token);
    if (tokenStatus.isExpired) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      router.push('/login');
    }
  }
}, 60000);

onUnmounted(() => {
  clearInterval(tokenCheckInterval);
});
</script>

<style>

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: Arial, sans-serif;
  line-height: 1.6;
  background-color: #f5f5f5;
}

#app {
  min-height: 100vh;
}

a {
  text-decoration: none;
  color: inherit;
}
</style>