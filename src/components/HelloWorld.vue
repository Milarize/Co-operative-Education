<template>
  <div class="edit-profile-container">
    <v-container>
      <v-row justify="center">
        <v-col cols="12">
          <v-card class="profile-card" elevation="8">
            <v-row no-gutters>
              <!-- ส่วนซ้าย - Banner (แสดงบน mobile) -->
              <v-col cols="12" class="d-md-none">
                <div class="mobile-banner pa-4 text-center">
                  <v-icon size="36" class="banner-icon mb-2">mdi-account-edit</v-icon>
                  <h2 class="text-h5 font-weight-bold banner-title">
                    แก้ไขข้อมูลส่วนตัว
              
                  </h2>
                </div>
              </v-col>

              <!-- ส่วนซ้าย - Banner (แสดงบน desktop) -->
              <v-col cols="12" md="5" class="profile-banner d-none d-md-flex">
                <div class="banner-content pa-6">
                  <h6 class="text-subtitle-1 mb-2 banner-text">Profile Settings</h6>
                  <v-icon size="48" class="banner-icon mb-4">mdi-account-edit</v-icon>
                  <h2 class="text-h4 font-weight-bold mb-4 banner-title">
                    แก้ไขข้อมูลส่วนตัว
                  </h2>
                  <p class="text-subtitle-1 banner-description">อัพเดทข้อมูลของคุณให้เป็นปัจจุบัน</p>
                </div>
              </v-col>

              <!-- ส่วนขวา - Form -->
              <v-col cols="12" md="7">
                <div class="form-container px-4 px-sm-8 py-6">
                  <form @submit.prevent="handleSubmit" class="form-wrapper">
                    <div class="input-field">
                      <v-text-field
                        v-model="user.firstName"
                        label="ชื่อ"
                        variant="outlined"
                        rounded="pill"
                        prepend-inner-icon="mdi-account"
                        class="mb-4"
                        density="comfortable"
                        hide-details="auto"
                      ></v-text-field>
                    </div>

                    <div class="input-field">
                      <v-text-field
                        v-model="user.lastName"
                        label="นามสกุล"
                        variant="outlined"
                        rounded="pill"
                        prepend-inner-icon="mdi-account"
                        class="mb-4"
                        density="comfortable"
                        hide-details="auto"
                      ></v-text-field>
                    </div>

                    <div class="input-field">
                      <v-text-field
                        v-model="user.idNumber"
                        label="เลขบัตรประชาชน"
                        variant="outlined"
                        rounded="pill"
                        prepend-inner-icon="mdi-card-account-details"
                        maxlength="13"
                        :error-messages="!isIdNumberValid ? 'หมายเลขบัตรประชาชนต้องเป็นตัวเลข 13 หลัก' : ''"
                        placeholder="กรุณากรอกเลขบัตรประชาชน 13 หลัก"
                        class="mb-6"
                        density="comfortable"
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
                      บันทึกข้อมูล
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

<script setup lang="ts">
import { ref, onMounted, watch, computed } from 'vue'
import { useUserStore } from '../data/stores/user'
import Swal from 'sweetalert2'
const userStore = useUserStore()

const user = ref({
  firstName: '',
  lastName: '', 
  idNumber: '',
})

onMounted(() => {
  const savedUser = localStorage.getItem('user')
  console.log(savedUser)
  if (savedUser) {
    const parsedData = JSON.parse(savedUser)
    user.value = parsedData.user 
  }
})
const isIdNumberValid = computed(() => {
  const id = user.value.idNumber
  return /^[0-9]{13}$/.test(id)
})
watch(user, (newValue) => {
  const dataToSave = {
    user: newValue,
    access_token: JSON.parse(localStorage.getItem('user') || '{}').access_token
  }
  localStorage.setItem('user', JSON.stringify(dataToSave))
}, { deep: true })

const handleSubmit = async () => {
  if (!isIdNumberValid.value) {
    await Swal.fire({
      icon: 'error',
      title: 'ข้อผิดพลาด',
      text: 'หมายเลขบัตรประชาชนต้องเป็นตัวเลข 13 หลัก'
    })
    return
  }
  const result = await Swal.fire({
    title: 'ยืนยันการแก้ไขข้อมูล',
    text: 'คุณต้องการบันทึกการเปลี่ยนแปลงหรือไม่?',
    icon: 'question',
    showCancelButton: true,
    confirmButtonText: 'ยืนยัน',
    cancelButtonText: 'ยกเลิก'
  })

  if (!result.isConfirmed) {
    return
  }
  try {
    const updateData = {
      firstName: user.value.firstName,
      lastName: user.value.lastName, 
      idNumber: user.value.idNumber
    }
    
    const userData = JSON.parse(localStorage.getItem('user') || '{}')
    const userId = userData?.user?.id
    await userStore.updateUser(userId, updateData)
    
    await Swal.fire({
      icon: 'success',
      title: 'สำเร็จ',
      text: 'อัพเดตข้อมูลสำเร็จ',
      timer: 1500,
      showConfirmButton: false
    })
  } catch (error) {
    console.error('เกิดข้อผิดพลาดในการอัพเดตข้อมูล:', error)
    await Swal.fire({
      icon: 'error',
      title: 'ข้อผิดพลาด',
      text: 'เกิดข้อผิดพลาดในการอัพเดตข้อมูล'
    })
  }
}

</script>
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

.banner-text {
  opacity: 0;
  animation: fadeInUp 0.5s ease forwards;
  animation-delay: 0.1s;
}

.banner-icon {
  color: #2196f3;
  animation: fadeInUp 0.5s ease forwards, pulse 2s infinite;
  animation-delay: 0.3s;
  opacity: 0;
}

.banner-title {
  opacity: 0;
  animation: fadeInUp 0.5s ease forwards;
  animation-delay: 0.5s;
}

.banner-description {
  opacity: 0;
  animation: fadeInUp 0.5s ease forwards;
  animation-delay: 0.7s;
}

.profile-icon {
  display: inline-block;
  opacity: 0;
  animation: fadeInUp 0.5s ease forwards, bounce 2s infinite;
  animation-delay: 0.9s;
}

/* Responsive adjustments */
@media (max-width: 959px) {
  .edit-profile-container {
    padding: 1rem 0;
  }
  
  .profile-card {
    margin: 0 1rem;
  }
  
  .banner-content {
    text-align: center;
    padding: 2rem 1rem;
  }
  
  .text-h4 {
    font-size: 1.5rem !important;
  }
  
  .text-subtitle-1 {
    font-size: 0.9rem !important;
  }
}

@media (max-width: 600px) {
  .edit-profile-container {
    padding: 0.5rem 0;
  }
  
  .profile-card {
    margin: 0 0.5rem;
  }
  
  .form-container {
    padding: 1rem 0.5rem;
  }
  
  .save-button {
    margin-top: 0.5rem;
  }
}

/* Touch device optimizations */
@media (hover: none) {
  .save-button::before {
    display: none;
  }
  
  .profile-card:hover {
    transform: none;
  }
}
</style>