<script setup lang="ts">
import { ref, computed } from 'vue'
// import { useUserStore } from '../data/stores/user'
import Swal from 'sweetalert2'

// const userStore = useUserStore()

const formData = ref({
  oldPassword: '',
  newPassword: '',
  confirmPassword: ''
})

const passwordStrength = computed(() => {
  const password = formData.value.newPassword
  if (!password) return { score: 0, color: '', text: '' }

  let score = 0
  if (password.length >= 8) score++
  if (/[A-Z]/.test(password)) score++
  if (/[a-z]/.test(password)) score++
  if (/[0-9]/.test(password)) score++
  if (/[^A-Za-z0-9]/.test(password)) score++

  const strengthMap = {
    0: { color: '#ff0000', text: 'อ่อนมาก' },
    1: { color: '#ff4444', text: 'อ่อน' },
    2: { color: '#ffff00', text: 'ปานกลาง' },
    3: { color: '#00ff00', text: 'แข็งแรง' },
    4: { color: '#00ff00', text: 'แข็งแรงมาก' },
    5: { color: '#00ff00', text: 'แข็งแรงที่สุด' }
  }

  return {
    score,
    ...strengthMap[score as keyof typeof strengthMap]
  }
})

const handleSubmit = async () => {
  if (formData.value.newPassword !== formData.value.confirmPassword) {
    await Swal.fire({
      icon: 'error',
      title: 'รหัสผ่านไม่ตรงกัน',
      text: 'กรุณากรอกรหัสผ่านใหม่ให้ตรงกัน'
    })
    return
  }

  if (passwordStrength.value.score < 3) {
    await Swal.fire({
      icon: 'warning',
      title: 'รหัสผ่านไม่ปลอดภัย',
      text: 'กรุณาตั้งรหัสผ่านที่มีความปลอดภัยมากกว่านี้'
    })
    return
  }

  try {
    // await userStore.changePassword({
    //   email: formData.value.email,
    //   oldPassword: formData.value.oldPassword,
    //   newPassword: formData.value.newPassword
    // })
    
    await Swal.fire({
      icon: 'success',
      title: 'เปลี่ยนรหัสผ่านสำเร็จ',
      showConfirmButton: false,
      timer: 1500
    })
    
    formData.value = {
      oldPassword: '',
      newPassword: '',
      confirmPassword: ''
    }
  } catch (error) {
    await Swal.fire({
      icon: 'error',
      title: 'เกิดข้อผิดพลาด',
      text: 'ไม่สามารถเปลี่ยนรหัสผ่านได้ กรุณาลองใหม่อีกครั้ง'
    })
  }
}
</script>

<template>
  <div class="edit-profile-container">
    <v-container>
      <v-row justify="center">
        <v-col cols="12">
          <v-card class="profile-card" elevation="8">
            <v-row no-gutters>
              <v-col cols="12" class="mobile-banner d-md-none">
                <div class="mobile-banner-content pa-4 text-center">
                  <v-icon size="36" class="banner-icon mb-2">mdi-lock</v-icon>
                  <h2 class="text-h5 font-weight-bold banner-title">
                    ตั้งค่ารหัสผ่าน
                  </h2>
                </div>
              </v-col>

              <v-col cols="12" md="5" class="profile-banner d-none d-md-flex">
                <div class="banner-content pa-6">
                  <h6 class="text-subtitle-1 mb-2 banner-text">ตั้งค่าความปลอดภัย</h6>
                  <v-icon size="48" class="banner-icon mb-4">mdi-lock</v-icon>
                  <h2 class="text-h4 font-weight-bold mb-4 banner-title">
                    ตั้งค่ารหัสผ่าน
                 
                  </h2>
                  <p class="text-subtitle-1 banner-description">กรุณากรอกรหัสผ่านใหม่ของคุณ</p>
                </div>
              </v-col>

              <v-col cols="12" md="7">
                <div class="form-container px-4 px-sm-8 py-6">
                  <form @submit.prevent="handleSubmit" class="form-wrapper">
                    <div class="input-field">
                      <v-text-field
                        v-model="formData.oldPassword"
                        label="รหัสผ่านเดิม"
                        type="password"
                        variant="outlined"
                        rounded="pill"
                        prepend-inner-icon="mdi-lock"
                        class="mb-4"
                        density="comfortable"
                        hide-details="auto"
                      ></v-text-field>
                    </div>

                    <div class="input-field">
                      <v-text-field
                        v-model="formData.newPassword"
                        label="รหัสผ่านใหม่"
                        type="password"
                        variant="outlined"
                        rounded="pill"
                        prepend-inner-icon="mdi-lock"
                        class="mb-4"
                        density="comfortable"
                        hide-details="auto"
                      ></v-text-field>
                    </div>

                    <div class="input-field">
                      <v-text-field
                        v-model="formData.confirmPassword"
                        label="ยืนยันรหัสผ่านใหม่"
                        type="password"
                        variant="outlined"
                        rounded="pill"
                        prepend-inner-icon="mdi-lock"
                        class="mb-6"
                        density="comfortable"
                        hide-details="auto"
                      ></v-text-field>
                    </div>

                    <v-btn
                      block
                      size="large"
                      type="submit"
                      class="save-button"
                      rounded="pill"
                      :style="{
                        background: 'linear-gradient(135deg, #000000 0%, #2196f3 100%)',
                        color: '#fff',
                      }"
                    >
                      <v-icon left class="mr-2">mdi-content-save</v-icon>
                      บันทึกการเปลี่ยนแปลง
                    </v-btn>
                  </form>
                </div>
              </v-col>
            </v-row>
          </v-card>
        </v-col>
      </v-row>
    </v-container>
  </div>
</template>

<style scoped>
.edit-profile-container {
  padding: 2rem 0;
  background: transparent;
}

.profile-card {
  border-radius: 16px;
  overflow: hidden;
  backdrop-filter: blur(10px);
  transition: transform 0.3s ease;
  margin: 0 auto;
  max-width: 1200px;
}

.profile-banner, .mobile-banner {
  background: linear-gradient(135deg, #fefefe 0%, #2196f3 100%);
  color: rgb(0, 0, 0);
}

.profile-banner {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100%;
}

.mobile-banner {
  padding: 1.5rem;
  border-bottom: 1px solid rgba(0, 0, 0, 0.1);
}

.banner-icon {
  color: #2196f3;
  animation: pulse 2s infinite;
}

.profile-icon {
  display: inline-block;
  animation: bounce 2s infinite;
  font-size: 1.2rem;
}

.form-container {
  max-width: 100%;
  margin: 0 auto;
  perspective: 1000px;
}

.form-wrapper {
  backface-visibility: hidden;
  transform-style: preserve-3d;
  animation: formEnter 0.5s ease forwards;
}

.input-field {
  animation: fadeInUp 0.5s ease forwards;
  opacity: 0;
  margin-bottom: 0.5rem;
}

.input-field:nth-child(1) { animation-delay: 0.1s; }
.input-field:nth-child(2) { animation-delay: 0.2s; }
.input-field:nth-child(3) { animation-delay: 0.3s; }

.save-button {
  animation: buttonFadeIn 0.5s ease forwards;
  animation-delay: 0.5s;
  opacity: 0;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
  margin-top: 1rem;
}

.save-button::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(
    120deg,
    transparent,
    rgba(255, 255, 255, 0.2),
    transparent
  );
  transition: 0.5s;
}

.save-button:hover::before {
  left: 100%;
}

@keyframes pulse {
  0% { transform: scale(1); }
  50% { transform: scale(1.1); }
  100% { transform: scale(1); }
}

@keyframes bounce {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-5px); }
}

@keyframes formEnter {
  from {
    opacity: 0;
    transform: translateX(30px) scale(0.95);
  }
  to {
    opacity: 1;
    transform: translateX(0) scale(1);
  }
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes buttonFadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
